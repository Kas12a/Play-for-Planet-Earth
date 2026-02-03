import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './authContext';
import { getSupabase } from './supabase';

export type AgeRange = '12 - 15' | '16 - 20' | '21 - 28' | '29 - 35' | '36 or older';
export type StartMode = 'individual' | 'group';
export type OnboardingStep = 'welcome' | 'auth' | 'profile' | 'mode' | 'interests' | 'permissions' | 'complete';
export type HealthDataSource = 'apple' | 'google' | 'samsung' | 'none';

export const INTEREST_OPTIONS = [
  'Nature & Outdoors',
  'Energy Saver',
  'Movement & Transport',
  'Waste & Recycling',
  'Community & Action',
  'Mindful Living',
] as const;

export type Interest = typeof INTEREST_OPTIONS[number];

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  display_name: string | null;
  avatar_key: string | null;
  profile_picture_url: string | null;
  role: 'user' | 'admin';
  age_range: AgeRange | null;
  start_mode: StartMode | null;
  interests: Interest[] | null;
  allow_location: boolean;
  enable_notifications: boolean;
  onboarding_step: OnboardingStep;
  onboarding_complete: boolean;
  level: number;
  points: number;
  credits: number;
  streak: number;
  focus: string | null;
  email_verified: boolean;
  email_verified_at: string | null;
  email_verify_dismissed_at: string | null;
  health_data_source: HealthDataSource | null;
  created_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setProfile({
            id: user.id,
            email: user.email || '',
            name: user.email?.split('@')[0] || 'User',
            display_name: null,
            avatar_key: null,
            profile_picture_url: null,
            role: 'user',
            age_range: null,
            start_mode: null,
            interests: null,
            allow_location: false,
            enable_notifications: false,
            onboarding_step: 'welcome',
            onboarding_complete: false,
            level: 1,
            points: 0,
            credits: 0,
            streak: 0,
            focus: null,
            email_verified: false,
            email_verified_at: null,
            email_verify_dismissed_at: null,
            health_data_source: null,
            created_at: new Date().toISOString(),
          });
        } else {
          setError(error.message);
        }
      } else {
        setProfile(data);
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'Not authenticated' };
    
    const supabase = getSupabase();
    if (!supabase) return { error: 'Supabase not configured' };

    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (!error && profile) {
      setProfile({ ...profile, ...updates });
    }

    return { error: error?.message || null };
  };

  const refreshProfile = async () => {
    setLoading(true);
    await fetchProfile();
  };

  return { profile, loading, error, updateProfile, refreshProfile };
}
