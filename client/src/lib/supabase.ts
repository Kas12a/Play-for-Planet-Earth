import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let configLoaded = false;
let supabaseUrl: string | null = null;
let supabaseAnonKey: string | null = null;

export interface AppConfig {
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
  PILOT_MODE: boolean;
  DEMO_MODE: boolean;
  ENABLE_MARKETPLACE: boolean;
  ENABLE_DONATIONS: boolean;
  ENABLE_WALLET: boolean;
  ENABLE_PARTNERS: boolean;
  ENABLE_LEARN: boolean;
  ENABLE_CREDITS: boolean;
  ENABLE_ACTIONS: boolean;
  ENABLE_QUESTS: boolean;
  ENABLE_LEADERBOARD: boolean;
  ADMIN_EMAIL: string;
  LEADERBOARD_ANONYMIZE: boolean;
}

let appConfig: AppConfig | null = null;

export async function loadConfig(): Promise<AppConfig> {
  if (appConfig) return appConfig;
  
  try {
    const response = await fetch('/api/config');
    if (!response.ok) throw new Error('Failed to load config');
    appConfig = await response.json();
    supabaseUrl = appConfig!.supabaseUrl;
    supabaseAnonKey = appConfig!.supabaseAnonKey;
    configLoaded = true;
    return appConfig!;
  } catch (error) {
    console.error('Failed to load app config:', error);
    return {
      supabaseUrl: null,
      supabaseAnonKey: null,
      PILOT_MODE: true,
      DEMO_MODE: false,
      ENABLE_MARKETPLACE: false,
      ENABLE_DONATIONS: false,
      ENABLE_WALLET: false,
      ENABLE_PARTNERS: false,
      ENABLE_LEARN: true,
      ENABLE_CREDITS: true,
      ENABLE_ACTIONS: true,
      ENABLE_QUESTS: true,
      ENABLE_LEADERBOARD: true,
      ADMIN_EMAIL: '',
      LEADERBOARD_ANONYMIZE: true,
    };
  }
}

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

export function getConfig(): AppConfig | null {
  return appConfig;
}
