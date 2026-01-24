import { supabaseAdmin } from './supabase';

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const STRAVA_REDIRECT_URI = process.env.STRAVA_REDIRECT_URI || 'https://play4earth.co/api/strava/callback';

interface StravaTokenResponse {
  token_type: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
  athlete: {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
  };
}

interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date: string;
  elapsed_time: number;
  moving_time: number;
  distance: number;
  total_elevation_gain: number;
  calories?: number;
}

export function getStravaAuthUrl(state: string): string {
  if (!STRAVA_CLIENT_ID) {
    throw new Error('STRAVA_CLIENT_ID not configured');
  }
  
  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    redirect_uri: STRAVA_REDIRECT_URI,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'read,activity:read',
    state,
  });
  
  return `https://www.strava.com/oauth/authorize?${params.toString()}`;
}

export async function exchangeStravaCode(code: string): Promise<StravaTokenResponse> {
  if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
    throw new Error('Strava credentials not configured');
  }
  
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Strava token exchange failed: ${error}`);
  }
  
  return response.json();
}

export async function refreshStravaToken(refreshToken: string): Promise<StravaTokenResponse> {
  if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
    throw new Error('Strava credentials not configured');
  }
  
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Strava token refresh failed: ${error}`);
  }
  
  return response.json();
}

export async function getValidAccessToken(userId: string): Promise<string | null> {
  const { data: source, error } = await supabaseAdmin
    .from('activity_sources')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'strava')
    .single();
  
  if (error || !source) {
    return null;
  }
  
  const now = new Date();
  const expiresAt = new Date(source.expires_at);
  
  // Token still valid (with 5 min buffer)
  if (expiresAt.getTime() - 5 * 60 * 1000 > now.getTime()) {
    return source.access_token;
  }
  
  // Need to refresh
  try {
    const tokens = await refreshStravaToken(source.refresh_token);
    
    await supabaseAdmin
      .from('activity_sources')
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(tokens.expires_at * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', source.id);
    
    return tokens.access_token;
  } catch (err) {
    console.error('Failed to refresh Strava token:', err);
    return null;
  }
}

export async function fetchStravaActivities(accessToken: string, after?: number): Promise<StravaActivity[]> {
  const params = new URLSearchParams({
    per_page: '30',
  });
  
  if (after) {
    params.set('after', String(after));
  }
  
  const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch Strava activities: ${error}`);
  }
  
  return response.json();
}

export async function syncStravaActivities(userId: string): Promise<{ synced: number; points: number }> {
  const accessToken = await getValidAccessToken(userId);
  
  if (!accessToken) {
    throw new Error('No valid Strava connection');
  }
  
  // Fetch activities from the last 30 days
  const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
  const activities = await fetchStravaActivities(accessToken, thirtyDaysAgo);
  
  let synced = 0;
  let totalPoints = 0;
  
  for (const activity of activities) {
    // Check if already exists
    const { data: existing } = await supabaseAdmin
      .from('activity_events')
      .select('id, points_awarded')
      .eq('provider', 'strava')
      .eq('provider_event_id', String(activity.id))
      .single();
    
    if (existing) {
      continue; // Already synced
    }
    
    // Calculate points: 1 point per 5 minutes, capped at 50 per activity
    const durationMinutes = Math.floor(activity.moving_time / 60);
    let points = Math.floor(durationMinutes / 5);
    
    // Bonus for certain activity types
    const bonusTypes = ['Ride', 'Swim', 'Run', 'Walk', 'Hike'];
    if (bonusTypes.includes(activity.type)) {
      points = Math.floor(points * 1.2);
    }
    
    // Cap at 50 points per activity
    points = Math.min(points, 50);
    
    // Insert activity event
    const { data: eventData, error: eventError } = await supabaseAdmin
      .from('activity_events')
      .insert({
        user_id: userId,
        provider: 'strava',
        provider_event_id: String(activity.id),
        activity_type: activity.type,
        name: activity.name,
        start_time: activity.start_date,
        duration_sec: activity.elapsed_time,
        moving_time_sec: activity.moving_time,
        distance_m: activity.distance,
        elevation_m: activity.total_elevation_gain,
        calories: activity.calories || null,
        points_awarded: points,
        raw_json: activity as any,
      })
      .select()
      .single();
    
    if (eventError) {
      console.error('Failed to insert activity:', eventError);
      continue;
    }
    
    // Award points in ledger (only if points > 0)
    if (points > 0) {
      const { error: ledgerError } = await supabaseAdmin
        .from('points_ledger')
        .insert({
          user_id: userId,
          points,
          reason: `Strava ${activity.type}: ${activity.name}`,
          source: 'verified_strava',
          event_id: eventData.id,
          metadata: {
            activity_type: activity.type,
            duration_minutes: durationMinutes,
            distance_m: activity.distance,
          },
        });
      
      if (ledgerError) {
        console.error('Failed to award points:', ledgerError);
      } else {
        totalPoints += points;
      }
    }
    
    synced++;
  }
  
  return { synced, points: totalPoints };
}

export async function storeStravaConnection(
  userId: string,
  tokens: StravaTokenResponse
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('activity_sources')
    .upsert({
      user_id: userId,
      provider: 'strava',
      provider_user_id: String(tokens.athlete.id),
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(tokens.expires_at * 1000).toISOString(),
      scopes: 'read,activity:read',
      athlete_data: tokens.athlete,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,provider',
    });
  
  if (error) {
    throw new Error(`Failed to store Strava connection: ${error.message}`);
  }
}

export async function disconnectStrava(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('activity_sources')
    .delete()
    .eq('user_id', userId)
    .eq('provider', 'strava');
  
  if (error) {
    throw new Error(`Failed to disconnect Strava: ${error.message}`);
  }
}

export async function getStravaConnection(userId: string): Promise<{
  connected: boolean;
  athlete?: { firstname: string; lastname: string };
  lastSync?: string;
}> {
  const { data, error } = await supabaseAdmin
    .from('activity_sources')
    .select('athlete_data, updated_at')
    .eq('user_id', userId)
    .eq('provider', 'strava')
    .single();
  
  if (error || !data) {
    return { connected: false };
  }
  
  return {
    connected: true,
    athlete: data.athlete_data as { firstname: string; lastname: string },
    lastSync: data.updated_at,
  };
}
