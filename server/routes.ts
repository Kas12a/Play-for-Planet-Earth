import type { Express } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";
import { config } from "@shared/config";
import { supabaseAdmin } from "./supabase";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { sendFeedbackEmail } from "./feedback-email";
import { insertFeedback, markEmailFailed, getRecentFeedback } from "./feedback-db";
import {
  getStravaAuthUrl,
  exchangeStravaCode,
  storeStravaConnection,
  syncStravaActivities,
  getStravaConnection,
  disconnectStrava,
  verifySignedState,
} from "./strava";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    const supabaseConfigured = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      supabase: supabaseConfigured ? "connected" : "not configured",
      pilotMode: config.PILOT_MODE,
    });
  });

  // Client config endpoint (public, safe values only)
  app.get("/api/config", (_req, res) => {
    res.json({
      supabaseUrl: process.env.SUPABASE_URL || null,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || null,
      ...config,
    });
  });

  // Rate limiting for feedback
  const feedbackRateLimit = new Map<string, { count: number; resetAt: number }>();
  const FEEDBACK_RATE_WINDOW = 10 * 60 * 1000; // 10 minutes
  const FEEDBACK_RATE_MAX = 10;

  function checkRateLimit(key: string): boolean {
    const now = Date.now();
    const entry = feedbackRateLimit.get(key);
    if (!entry || now > entry.resetAt) {
      feedbackRateLimit.set(key, { count: 1, resetAt: now + FEEDBACK_RATE_WINDOW });
      return true;
    }
    if (entry.count >= FEEDBACK_RATE_MAX) return false;
    entry.count++;
    return true;
  }

  const ALLOWED_TYPES = ['praise', 'idea', 'bug', 'confusing', 'other'];
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  app.post("/api/feedback", async (req, res) => {
    try {
      const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
      const ipHash = crypto.createHash('sha256').update(ip + (process.env.SESSION_SECRET || 'salt')).digest('hex').substring(0, 16);

      if (!checkRateLimit(`ip:${ipHash}`)) {
        return res.status(429).json({ error: 'Too many feedback submissions. Please try again later.' });
      }

      const {
        type, message, screen_path, url, user_agent, app_version,
        viewport, referrer, user_id, session_id,
        can_contact, email,
        severity, steps_to_reproduce, expected_result, actual_result,
        user_intent, expectation,
        problem_solved, target_user, value_rating,
        screenshot_url,
      } = req.body;

      if (!type || !ALLOWED_TYPES.includes(type)) {
        return res.status(400).json({ error: 'Invalid feedback type.' });
      }

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required.' });
      }

      const minLength = type === 'praise' ? 10 : 20;
      if (message.trim().length < minLength) {
        return res.status(400).json({ error: `Message must be at least ${minLength} characters.` });
      }

      if (message.length > 5000) {
        return res.status(400).json({ error: 'Message is too long (max 5000 characters).' });
      }

      if (can_contact && email && !EMAIL_REGEX.test(email)) {
        return res.status(400).json({ error: 'Invalid email address format.' });
      }

      const textFields = [steps_to_reproduce, expected_result, actual_result, user_intent, expectation, problem_solved, target_user];
      for (const field of textFields) {
        if (field && typeof field === 'string' && field.length > 3000) {
          return res.status(400).json({ error: 'Field content too long (max 3000 characters).' });
        }
      }

      if (user_id && !checkRateLimit(`user:${user_id}`)) {
        return res.status(429).json({ error: 'Too many feedback submissions. Please try again later.' });
      }

      const feedbackRow = {
        type,
        message: message.trim(),
        screen_path: screen_path || null,
        url: url || null,
        user_agent: user_agent || null,
        app_version: app_version || '1.5.0-pilot',
        viewport: viewport || null,
        referrer: referrer || null,
        user_id: user_id || null,
        session_id: session_id || null,
        can_contact: can_contact || false,
        email: can_contact && email ? email : null,
        severity: type === 'bug' ? (severity || null) : null,
        steps_to_reproduce: type === 'bug' ? (steps_to_reproduce || null) : null,
        expected_result: type === 'bug' ? (expected_result || null) : null,
        actual_result: type === 'bug' ? (actual_result || null) : null,
        user_intent: type === 'confusing' ? (user_intent || null) : null,
        expectation: type === 'confusing' ? (expectation || null) : null,
        problem_solved: type === 'idea' ? (problem_solved || null) : null,
        target_user: type === 'idea' ? (target_user || null) : null,
        value_rating: type === 'idea' ? (value_rating || null) : null,
        screenshot_url: screenshot_url || null,
        ip_hash: ipHash,
      };

      const feedbackId = await insertFeedback(feedbackRow);

      let emailSent = false;
      try {
        emailSent = await sendFeedbackEmail({
          id: feedbackId || 'unknown',
          created_at: new Date().toISOString(),
          ...feedbackRow,
        });
      } catch (emailErr) {
        console.error('Feedback email send failed:', emailErr);
      }

      if (!emailSent && feedbackId) {
        await markEmailFailed(feedbackId);
      }

      console.log('Feedback received:', { id: feedbackId, type });

      res.json({ ok: true, id: feedbackId });
    } catch (error) {
      console.error('Feedback error:', error);
      res.status(500).json({ error: 'Failed to submit feedback' });
    }
  });

  app.get("/api/admin/feedback", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token || !supabaseAdmin) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const adminEmail = config.ADMIN_EMAIL;
      if (user.email !== adminEmail) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const items = await getRecentFeedback(50);
      res.json({ items });
    } catch (error) {
      console.error('Admin feedback error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // ============================================
  // STRAVA OAUTH ENDPOINTS
  // ============================================

  // Initiate Strava OAuth flow
  app.get("/api/strava/connect", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      // Generate HMAC-signed state to prevent CSRF attacks
      const authUrl = getStravaAuthUrl(user.id);

      res.json({ authUrl });
    } catch (error) {
      console.error('Strava connect error:', error);
      res.status(500).json({ error: 'Failed to initiate Strava connection' });
    }
  });

  // Strava OAuth callback
  app.get("/api/strava/callback", async (req, res) => {
    try {
      const { code, state, error: stravaError } = req.query;

      if (stravaError) {
        return res.redirect('/?strava=error&message=' + encodeURIComponent(String(stravaError)));
      }

      if (!code || !state) {
        return res.redirect('/?strava=error&message=missing_params');
      }

      // Verify HMAC-signed state to prevent CSRF attacks
      const { userId, valid } = verifySignedState(String(state));
      if (!valid || !userId) {
        console.error('Invalid or expired OAuth state');
        return res.redirect('/?strava=error&message=invalid_state');
      }

      // Exchange code for tokens
      const tokens = await exchangeStravaCode(String(code));

      // Store connection
      await storeStravaConnection(userId, tokens);

      // Redirect back to app with success
      res.redirect('/settings?strava=connected');
    } catch (error) {
      console.error('Strava callback error:', error);
      res.redirect('/?strava=error&message=exchange_failed');
    }
  });

  // Get Strava connection status
  app.get("/api/strava/status", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      const status = await getStravaConnection(user.id);
      res.json(status);
    } catch (error) {
      console.error('Strava status error:', error);
      res.status(500).json({ error: 'Failed to get Strava status' });
    }
  });

  // Sync Strava activities
  app.post("/api/strava/sync", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      const result = await syncStravaActivities(user.id);
      res.json({
        success: true,
        ...result,
        message: `Synced ${result.synced} activities, earned ${result.points} points`,
      });
    } catch (error: any) {
      console.error('Strava sync error:', error);
      res.status(500).json({ error: error.message || 'Failed to sync activities' });
    }
  });

  // Disconnect Strava
  app.post("/api/strava/disconnect", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      await disconnectStrava(user.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Strava disconnect error:', error);
      res.status(500).json({ error: 'Failed to disconnect Strava' });
    }
  });

  // ============================================
  // POINTS & ACTIVITIES ENDPOINTS
  // ============================================

  // Get user's points summary
  app.get("/api/points/summary", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      // Get total points
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('points, credits')
        .eq('id', user.id)
        .single();

      // Get points breakdown by source
      const { data: breakdown } = await supabaseAdmin
        .from('points_ledger')
        .select('source, points')
        .eq('user_id', user.id);

      const sourceBreakdown: Record<string, number> = {};
      for (const entry of breakdown || []) {
        sourceBreakdown[entry.source] = (sourceBreakdown[entry.source] || 0) + entry.points;
      }

      // Get self-declare limits for today
      const { data: limits } = await supabaseAdmin
        .from('self_declare_limits')
        .select('daily_points_used, daily_actions_count')
        .eq('user_id', user.id)
        .eq('date', new Date().toISOString().split('T')[0])
        .single();

      res.json({
        totalPoints: profile?.points || 0,
        totalCredits: profile?.credits || 0,
        breakdown: sourceBreakdown,
        selfDeclare: {
          dailyPointsUsed: limits?.daily_points_used || 0,
          dailyActionsCount: limits?.daily_actions_count || 0,
          dailyPointsRemaining: 10 - (limits?.daily_points_used || 0),
          dailyActionsRemaining: 5 - (limits?.daily_actions_count || 0),
        },
      });
    } catch (error) {
      console.error('Points summary error:', error);
      res.status(500).json({ error: 'Failed to get points summary' });
    }
  });

  // Get user's activity events
  app.get("/api/activities", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      const { data: activities } = await supabaseAdmin
        .from('activity_events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .limit(50);

      res.json(activities || []);
    } catch (error) {
      console.error('Activities error:', error);
      res.status(500).json({ error: 'Failed to get activities' });
    }
  });

  // ============================================
  // QUEST ENDPOINTS (Supabase-backed)
  // ============================================

  // Join a quest
  app.post("/api/quests/:questId/join", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      const { questId } = req.params;

      // Check if already joined
      const { data: existing } = await supabaseAdmin
        .from('quest_participants')
        .select('id')
        .eq('user_id', user.id)
        .eq('quest_id', questId)
        .single();

      if (existing) {
        return res.status(400).json({ error: 'Already joined this quest' });
      }

      // Join the quest
      const { error: joinError } = await supabaseAdmin
        .from('quest_participants')
        .insert({
          user_id: user.id,
          quest_id: questId,
        });

      if (joinError) {
        console.error('Quest join error:', joinError);
        return res.status(500).json({ error: 'Failed to join quest' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Quest join error:', error);
      res.status(500).json({ error: 'Failed to join quest' });
    }
  });

  // Submit video for video verification quest
  app.post("/api/quests/:questId/submit-video", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      const { questId } = req.params;
      const { videoPath, notes } = req.body;

      if (!videoPath) {
        return res.status(400).json({ error: 'Video path is required' });
      }

      // Check if user has joined this quest
      const { data: participation } = await supabaseAdmin
        .from('quest_participants')
        .select('id')
        .eq('user_id', user.id)
        .eq('quest_id', questId)
        .single();

      if (!participation) {
        return res.status(400).json({ error: 'You must join the quest first' });
      }

      // Check for existing submission
      const { data: existingSubmission } = await supabaseAdmin
        .from('video_submissions')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('quest_id', questId)
        .single();

      if (existingSubmission) {
        if (existingSubmission.status === 'approved') {
          return res.status(400).json({ error: 'Quest already completed' });
        }
        // Update existing pending/rejected submission
        const { error: updateError } = await supabaseAdmin
          .from('video_submissions')
          .update({
            video_path: videoPath,
            notes: notes || null,
            status: 'pending',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSubmission.id);

        if (updateError) {
          console.error('Video submission update error:', updateError);
          return res.status(500).json({ error: 'Failed to update submission' });
        }

        return res.json({ success: true, message: 'Submission updated' });
      }

      // Create new submission
      const { error: insertError } = await supabaseAdmin
        .from('video_submissions')
        .insert({
          user_id: user.id,
          quest_id: questId,
          video_path: videoPath,
          notes: notes || null,
          status: 'pending',
        });

      if (insertError) {
        console.error('Video submission error:', insertError);
        return res.status(500).json({ error: 'Failed to submit video' });
      }

      res.json({ success: true, message: 'Video submitted for review' });
    } catch (error) {
      console.error('Video submission error:', error);
      res.status(500).json({ error: 'Failed to submit video' });
    }
  });

  // Submit proof (photo/video/screenshot) for a quest
  app.post("/api/quests/:questId/submit-proof", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      const { questId } = req.params;
      const { proofPath, proofType, notes } = req.body;

      if (!proofPath) {
        return res.status(400).json({ error: 'Proof file is required' });
      }

      // Check if user has joined this quest
      const { data: participation } = await supabaseAdmin
        .from('quest_participants')
        .select('id')
        .eq('user_id', user.id)
        .eq('quest_id', questId)
        .single();

      if (!participation) {
        return res.status(400).json({ error: 'You must join the quest first' });
      }

      // Insert proof submission
      const { error: insertError } = await supabaseAdmin
        .from('proof_submissions')
        .insert({
          user_id: user.id,
          quest_id: questId,
          proof_path: proofPath,
          proof_type: proofType,
          notes: notes || null,
          status: 'pending',
        });

      if (insertError) {
        console.error('Proof submission error:', insertError);
        return res.status(500).json({ error: 'Failed to submit proof' });
      }

      res.json({ success: true, message: 'Proof submitted for review' });
    } catch (error) {
      console.error('Proof submission error:', error);
      res.status(500).json({ error: 'Failed to submit proof' });
    }
  });

  // Submit GPS session for a quest
  app.post("/api/quests/:questId/gps-session", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      const { questId } = req.params;
      const { duration_sec, distance_m, start_time, end_time } = req.body;

      // Minimum duration validation based on quest
      const minDurations: Record<string, number> = {
        'pilot_walk_instead': 720, // 12 min
        'pilot_green_time': 900, // 15 min
        'pilot_cycle_session': 1200, // 20 min
      };
      const minDuration = minDurations[questId] || 600; // default 10 min

      if (duration_sec < minDuration) {
        return res.status(400).json({ 
          error: `Minimum duration not met. Required: ${Math.floor(minDuration / 60)} minutes` 
        });
      }

      // Check if user has joined this quest
      const { data: participation } = await supabaseAdmin
        .from('quest_participants')
        .select('id, completed')
        .eq('user_id', user.id)
        .eq('quest_id', questId)
        .single();

      if (!participation) {
        return res.status(400).json({ error: 'You must join the quest first' });
      }

      // Insert GPS session record
      const { error: insertError } = await supabaseAdmin
        .from('gps_sessions')
        .insert({
          user_id: user.id,
          quest_id: questId,
          duration_sec,
          distance_m: distance_m || 0,
          start_time,
          end_time,
          status: 'approved', // GPS sessions auto-approved
        });

      if (insertError) {
        console.error('GPS session error:', insertError);
        return res.status(500).json({ error: 'Failed to save session' });
      }

      // Get quest points
      const questPoints: Record<string, number> = {
        'pilot_walk_instead': 60,
        'pilot_green_time': 25,
        'pilot_cycle_session': 140,
      };
      const points = questPoints[questId] || 50;

      // Award points
      await supabaseAdmin
        .from('points_ledger')
        .insert({
          user_id: user.id,
          source: 'gps_session',
          source_id: questId,
          points_earned: points,
        });

      // Update user's total points
      await supabaseAdmin.rpc('increment_user_points', { 
        user_id_param: user.id, 
        points_param: points 
      });

      // Mark quest as completed
      await supabaseAdmin
        .from('quest_participants')
        .update({ completed: true, progress: 100 })
        .eq('id', participation.id);

      res.json({ success: true, points_earned: points });
    } catch (error) {
      console.error('GPS session error:', error);
      res.status(500).json({ error: 'Failed to save session' });
    }
  });

  // Complete quiz for a quest
  app.post("/api/quests/:questId/complete-quiz", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      const { questId } = req.params;
      const { score, total } = req.body;

      // Check if user has joined this quest
      const { data: participation } = await supabaseAdmin
        .from('quest_participants')
        .select('id, completed')
        .eq('user_id', user.id)
        .eq('quest_id', questId)
        .single();

      if (!participation) {
        return res.status(400).json({ error: 'You must join the quest first' });
      }

      if (participation.completed) {
        return res.status(400).json({ error: 'Quiz already completed today' });
      }

      // Insert quiz completion record
      const { error: insertError } = await supabaseAdmin
        .from('quiz_completions')
        .insert({
          user_id: user.id,
          quest_id: questId,
          score,
          total_questions: total,
        });

      if (insertError) {
        console.error('Quiz completion error:', insertError);
        return res.status(500).json({ error: 'Failed to save quiz completion' });
      }

      // Get quest points
      const questPoints: Record<string, number> = {
        'pilot_quiz_spark': 20,
        'pilot_buddy_challenge': 200,
      };
      const points = questPoints[questId] || 20;

      // Award points
      await supabaseAdmin
        .from('points_ledger')
        .insert({
          user_id: user.id,
          source: 'quiz',
          source_id: questId,
          points_earned: points,
        });

      // Update user's total points
      await supabaseAdmin.rpc('increment_user_points', { 
        user_id_param: user.id, 
        points_param: points 
      });

      // Mark quest as completed
      await supabaseAdmin
        .from('quest_participants')
        .update({ completed: true, progress: 100 })
        .eq('id', participation.id);

      res.json({ success: true, points_earned: points });
    } catch (error) {
      console.error('Quiz completion error:', error);
      res.status(500).json({ error: 'Failed to save quiz completion' });
    }
  });

  // Get Today's Code (server-side for consistency)
  app.get("/api/todays-code", (req, res) => {
    const now = new Date();
    const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    
    const CODE_WORDS = [
      'MOSS', 'LEAF', 'TREE', 'WAVE', 'GAIA', 'BLOOM', 'SEED', 'RAIN',
      'WIND', 'FERN', 'PINE', 'OCEAN', 'CORAL', 'EARTH', 'GREEN', 'SOLAR',
      'LUNA', 'STAR', 'CLOUD', 'RIVER', 'FOREST', 'MEADOW', 'VALLEY', 'PEAK',
      'GLACIER', 'REEF', 'OASIS', 'PRAIRIE', 'DELTA', 'ARCTIC', 'TROPIC'
    ];
    
    const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 0));
    const diff = utcDate.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    const wordIndex = (dayOfYear + now.getUTCFullYear()) % CODE_WORDS.length;
    const word = CODE_WORDS[wordIndex];
    const numberSeed = (dayOfYear * 7 + now.getUTCFullYear() * 3) % 90 + 10;
    
    res.json({ 
      code: `${word}-${numberSeed}`,
      expires_at: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)).toISOString()
    });
  });

  // Get user's quest participations
  app.get("/api/quests/my", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      const { data: participations } = await supabaseAdmin
        .from('quest_participants')
        .select('quest_id, progress, completed, joined_at')
        .eq('user_id', user.id);

      res.json(participations || []);
    } catch (error) {
      console.error('My quests error:', error);
      res.status(500).json({ error: 'Failed to get quest participations' });
    }
  });

  // ============================================
  // ACTION LOG ENDPOINTS (Supabase-backed with caps)
  // ============================================

  // Log a self-declared action (with caps)
  app.post("/api/actions/log", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      const { actionTypeId, note, confidence, clientRequestId } = req.body;

      if (!actionTypeId || !clientRequestId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check duplicate by client_request_id
      const { data: existingLog } = await supabaseAdmin
        .from('action_logs')
        .select('id')
        .eq('client_request_id', clientRequestId)
        .single();

      if (existingLog) {
        return res.status(400).json({ error: 'Duplicate action log' });
      }

      // Check daily limits
      const today = new Date().toISOString().split('T')[0];
      const { data: limits } = await supabaseAdmin
        .from('self_declare_limits')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      const dailyPointsUsed = limits?.daily_points_used || 0;
      const dailyActionsCount = limits?.daily_actions_count || 0;

      if (dailyActionsCount >= 5) {
        return res.status(400).json({ error: 'Daily self-declared action limit reached (5 per day)' });
      }

      if (dailyPointsUsed >= 10) {
        return res.status(400).json({ error: 'Daily self-declared points limit reached (10 per day)' });
      }

      // Get action type to calculate credits
      const { data: actionType } = await supabaseAdmin
        .from('action_types')
        .select('base_reward_credits, title')
        .eq('id', actionTypeId)
        .single();

      if (!actionType) {
        return res.status(404).json({ error: 'Action type not found' });
      }

      // Calculate credits with confidence multiplier (capped for self-declared)
      const conf = confidence || 0.85;
      let multiplier = 1.0;
      if (conf >= 0.8) multiplier = 1.0;
      else if (conf >= 0.4) multiplier = 0.6;
      else multiplier = 0.3;

      // Self-declared actions get reduced points (max 3 per action)
      const basePoints = Math.min(Math.round(actionType.base_reward_credits * multiplier * 0.3), 3);
      const pointsToAward = Math.min(basePoints, 10 - dailyPointsUsed);

      // Insert action log
      const { data: logData, error: logError } = await supabaseAdmin
        .from('action_logs')
        .insert({
          user_id: user.id,
          action_type_id: actionTypeId,
          note: note || null,
          confidence: conf,
          credits_earned: pointsToAward,
          client_request_id: clientRequestId,
          source: 'self_declared',
        })
        .select()
        .single();

      if (logError) {
        console.error('Action log error:', logError);
        return res.status(500).json({ error: 'Failed to log action' });
      }

      // Award points in ledger
      if (pointsToAward > 0) {
        await supabaseAdmin
          .from('points_ledger')
          .insert({
            user_id: user.id,
            points: pointsToAward,
            reason: `Self-declared: ${actionType.title}`,
            source: 'self_declared',
            action_log_id: logData.id,
            client_request_id: clientRequestId,
          });
      }

      // Update daily limits
      await supabaseAdmin
        .from('self_declare_limits')
        .upsert({
          user_id: user.id,
          date: today,
          daily_points_used: dailyPointsUsed + pointsToAward,
          daily_actions_count: dailyActionsCount + 1,
        }, {
          onConflict: 'user_id,date',
        });

      res.json({
        success: true,
        pointsEarned: pointsToAward,
        dailyPointsRemaining: 10 - (dailyPointsUsed + pointsToAward),
        dailyActionsRemaining: 5 - (dailyActionsCount + 1),
      });
    } catch (error) {
      console.error('Action log error:', error);
      res.status(500).json({ error: 'Failed to log action' });
    }
  });

  // Get user's action logs
  app.get("/api/actions/my", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      const { data: logs } = await supabaseAdmin
        .from('action_logs')
        .select('*, action_types(title, category, icon)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      res.json(logs || []);
    } catch (error) {
      console.error('My actions error:', error);
      res.status(500).json({ error: 'Failed to get action logs' });
    }
  });

  // ============================================
  // LEADERBOARD (from Supabase)
  // ============================================

  app.get("/api/leaderboard", async (_req, res) => {
    try {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, display_name, points, level')
        .order('points', { ascending: false })
        .limit(20);

      // Anonymize display names
      const anonymized = (profiles || []).map((p, idx) => ({
        rank: idx + 1,
        displayName: p.display_name || `EcoHero${String(idx + 1).padStart(3, '0')}`,
        points: p.points,
        level: p.level,
      }));

      res.json(anonymized);
    } catch (error) {
      console.error('Leaderboard error:', error);
      res.status(500).json({ error: 'Failed to get leaderboard' });
    }
  });

  // ============================================
  // WORKOUT PLANNER ENDPOINTS
  // ============================================

  // Get all workout plans for a user
  app.get("/api/workouts/plans", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      const { data: plans } = await supabaseAdmin
        .from('workout_plans')
        .select('*, workout_exercises(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      res.json(plans || []);
    } catch (error) {
      console.error('Get workout plans error:', error);
      res.status(500).json({ error: 'Failed to get workout plans' });
    }
  });

  // Create a new workout plan
  app.post("/api/workouts/plans", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      const { name, description, difficulty, targetDaysPerWeek, exercises } = req.body;

      if (!name || !difficulty) {
        return res.status(400).json({ error: 'Name and difficulty are required' });
      }

      // Create the plan
      const { data: plan, error: planError } = await supabaseAdmin
        .from('workout_plans')
        .insert({
          user_id: user.id,
          name,
          description: description || null,
          difficulty,
          target_days_per_week: targetDaysPerWeek || 3,
        })
        .select()
        .single();

      if (planError) {
        console.error('Create plan error:', planError);
        return res.status(500).json({ error: 'Failed to create workout plan' });
      }

      // Add exercises if provided
      if (exercises && exercises.length > 0) {
        const exerciseRecords = exercises.map((ex: any, idx: number) => ({
          plan_id: plan.id,
          name: ex.name,
          exercise_type: ex.exerciseType || 'strength',
          sets: ex.sets || 3,
          reps: ex.reps || null,
          duration_minutes: ex.durationMinutes || null,
          rest_seconds: ex.restSeconds || 60,
          notes: ex.notes || null,
          sort_order: idx,
        }));

        await supabaseAdmin
          .from('workout_exercises')
          .insert(exerciseRecords);
      }

      // Fetch the complete plan with exercises
      const { data: completePlan } = await supabaseAdmin
        .from('workout_plans')
        .select('*, workout_exercises(*)')
        .eq('id', plan.id)
        .single();

      res.json(completePlan);
    } catch (error) {
      console.error('Create workout plan error:', error);
      res.status(500).json({ error: 'Failed to create workout plan' });
    }
  });

  // Update a workout plan
  app.put("/api/workouts/plans/:planId", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      const { planId } = req.params;
      const { name, description, difficulty, targetDaysPerWeek, isActive } = req.body;

      const { data: plan, error: updateError } = await supabaseAdmin
        .from('workout_plans')
        .update({
          name,
          description,
          difficulty,
          target_days_per_week: targetDaysPerWeek,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', planId)
        .eq('user_id', user.id)
        .select('*, workout_exercises(*)')
        .single();

      if (updateError) {
        console.error('Update plan error:', updateError);
        return res.status(500).json({ error: 'Failed to update workout plan' });
      }

      res.json(plan);
    } catch (error) {
      console.error('Update workout plan error:', error);
      res.status(500).json({ error: 'Failed to update workout plan' });
    }
  });

  // Delete a workout plan
  app.delete("/api/workouts/plans/:planId", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      const { planId } = req.params;

      const { error: deleteError } = await supabaseAdmin
        .from('workout_plans')
        .delete()
        .eq('id', planId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Delete plan error:', deleteError);
        return res.status(500).json({ error: 'Failed to delete workout plan' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Delete workout plan error:', error);
      res.status(500).json({ error: 'Failed to delete workout plan' });
    }
  });

  // Log a workout session
  app.post("/api/workouts/sessions", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      const { planId, name, durationMinutes, caloriesBurned, notes, exerciseLogs } = req.body;

      if (!name || !durationMinutes) {
        return res.status(400).json({ error: 'Name and duration are required' });
      }

      // Create the session
      const { data: session, error: sessionError } = await supabaseAdmin
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          plan_id: planId || null,
          name,
          duration_minutes: durationMinutes,
          calories_burned: caloriesBurned || null,
          notes: notes || null,
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Create session error:', sessionError);
        return res.status(500).json({ error: 'Failed to log workout session' });
      }

      // Add exercise logs if provided
      if (exerciseLogs && exerciseLogs.length > 0) {
        const logRecords = exerciseLogs.map((log: any) => ({
          session_id: session.id,
          exercise_name: log.exerciseName,
          sets_completed: log.setsCompleted || null,
          reps_completed: log.repsCompleted || null,
          weight_kg: log.weightKg || null,
          duration_minutes: log.durationMinutes || null,
          notes: log.notes || null,
        }));

        await supabaseAdmin
          .from('exercise_logs')
          .insert(logRecords);
      }

      // Award points for completing a workout (5 points per workout)
      await supabaseAdmin
        .from('points_ledger')
        .insert({
          user_id: user.id,
          points: 5,
          reason: `Workout completed: ${name}`,
          source: 'workout',
          client_request_id: `workout_${session.id}`,
        });

      res.json({ success: true, session, pointsEarned: 5 });
    } catch (error) {
      console.error('Log workout session error:', error);
      res.status(500).json({ error: 'Failed to log workout session' });
    }
  });

  // Get workout sessions
  app.get("/api/workouts/sessions", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      const { data: sessions } = await supabaseAdmin
        .from('workout_sessions')
        .select('*, exercise_logs(*)')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(50);

      res.json(sessions || []);
    } catch (error) {
      console.error('Get workout sessions error:', error);
      res.status(500).json({ error: 'Failed to get workout sessions' });
    }
  });

  // Get workout stats
  app.get("/api/workouts/stats", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      // Get total sessions and time
      const { data: sessions } = await supabaseAdmin
        .from('workout_sessions')
        .select('duration_minutes, calories_burned, completed_at')
        .eq('user_id', user.id);

      const totalSessions = sessions?.length || 0;
      const totalMinutes = sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;
      const totalCalories = sessions?.reduce((sum, s) => sum + (s.calories_burned || 0), 0) || 0;

      // Get sessions this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const sessionsThisWeek = sessions?.filter(s => new Date(s.completed_at) >= weekAgo).length || 0;

      // Get active plans count
      const { count: activePlans } = await supabaseAdmin
        .from('workout_plans')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_active', true);

      res.json({
        totalSessions,
        totalMinutes,
        totalCalories,
        sessionsThisWeek,
        activePlans: activePlans || 0,
      });
    } catch (error) {
      console.error('Get workout stats error:', error);
      res.status(500).json({ error: 'Failed to get workout stats' });
    }
  });

  // Register object storage routes for file uploads
  registerObjectStorageRoutes(app);

  // Update profile picture
  app.post("/api/profile/picture", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const token = authHeader.split(' ')[1];
      
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const { objectPath } = req.body;
      if (!objectPath) {
        return res.status(400).json({ error: 'Object path required' });
      }

      // Update profile with the new picture URL
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ profile_picture_url: objectPath })
        .eq('id', user.id);

      if (updateError) {
        console.error('Profile picture update error:', updateError);
        return res.status(500).json({ error: 'Failed to update profile picture' });
      }

      res.json({ success: true, profilePictureUrl: objectPath });
    } catch (error) {
      console.error('Profile picture error:', error);
      res.status(500).json({ error: 'Failed to update profile picture' });
    }
  });

  return httpServer;
}
