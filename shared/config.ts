export const config = {
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
  
  ADMIN_EMAIL: 'info@playearth.co.uk',
  
  LEADERBOARD_ANONYMIZE: true,
} as const;

export type AppConfig = typeof config;
