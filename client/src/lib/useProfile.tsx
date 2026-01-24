import { useEffect, useState } from 'react';
import { useAuth } from './authContext';
import { getSupabase } from './supabase';

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  display_name: string | null;
  role: 'user' | 'admin';
  level: number;
  points: number;
  credits: number;
  streak: number;
  focus: string | null;
  onboarding_completed: boolean;
  created_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
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
              role: 'user',
              level: 1,
              points: 0,
              credits: 50,
              streak: 0,
              focus: null,
              onboarding_completed: false,
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
    }

    fetchProfile();
  }, [user]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'Not authenticated' };
    
    const supabase = getSupabase();
    if (!supabase) return { error: 'Supabase not configured' };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (!error && profile) {
      setProfile({ ...profile, ...updates });
    }

    return { error: error?.message || null };
  };

  const refreshProfile = async () => {
    if (!user) return;
    
    const supabase = getSupabase();
    if (!supabase) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setProfile(data);
    }
  };

  return { profile, loading, error, updateProfile, refreshProfile };
}
