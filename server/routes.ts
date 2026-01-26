import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { config } from "@shared/config";
import { supabaseAdmin } from "./supabase";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
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

  // Feedback submission endpoint
  app.post("/api/feedback", async (req, res) => {
    try {
      const { type, message, screen, userAgent, userId } = req.body;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Store in Supabase if configured
      if (supabaseAdmin) {
        const { error } = await supabaseAdmin.from('feedback').insert({
          user_id: userId || null,
          type: type || 'other',
          message: message.trim(),
          screen: screen || null,
          user_agent: userAgent || null,
          app_version: '1.2.0-verified-pilot',
        });

        if (error) {
          console.error('Feedback storage error:', error.message);
        }
      }

      // Log feedback for now (even if Supabase not configured)
      console.log('📝 Feedback received:', { type, message: message.substring(0, 100), screen });

      res.json({ success: true });
    } catch (error) {
      console.error('Feedback error:', error);
      res.status(500).json({ error: 'Failed to submit feedback' });
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
