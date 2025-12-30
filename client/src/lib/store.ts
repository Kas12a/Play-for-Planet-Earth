import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export type UserRole = 'user' | 'admin';
export type AgeBand = 'Under 16' | '16-18' | '19-30' | '31+';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  ageBand?: AgeBand;
  cohortId?: string;
  level: number;
  points: number;
  streak: number;
  joinedAt: string;
  parentEmail?: string; // For under 16
  consentVerified?: boolean;
}

export interface ActionType {
  id: string;
  title: string;
  category: 'Waste' | 'Energy' | 'Transport' | 'Food' | 'Nature';
  points: number;
  impactCO2: number; // kg
  description: string;
  icon: string;
}

export interface ActionLog {
  id: string;
  userId: string;
  actionId: string;
  timestamp: string;
  note?: string;
  photoUrl?: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: 'Global' | 'Cohort';
  points: number;
  duration: string;
  participants: number;
  image?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: string;
}

// Mock Data
export const ACTION_TYPES: ActionType[] = [
  { id: '1', title: 'Refill Water Bottle', category: 'Waste', points: 10, impactCO2: 0.08, description: 'Saved a plastic bottle from landfill', icon: 'droplet' },
  { id: '2', title: 'Meat-free Meal', category: 'Food', points: 25, impactCO2: 1.5, description: 'Skipped meat for a meal', icon: 'utensils' },
  { id: '3', title: 'Walk/Bike to Work', category: 'Transport', points: 30, impactCO2: 0.5, description: 'Avoided car emissions', icon: 'footprints' },
  { id: '4', title: 'Cold Wash', category: 'Energy', points: 15, impactCO2: 0.3, description: 'Washed clothes at 30°C', icon: 'thermometer-snowflake' },
  { id: '5', title: 'Plant a Tree', category: 'Nature', points: 100, impactCO2: 20, description: 'Planted a new tree', icon: 'sprout' },
  { id: '6', title: 'Recycle Glass', category: 'Waste', points: 10, impactCO2: 0.1, description: 'Recycled glass container', icon: 'recycle' },
  { id: '7', title: 'Zero Waste Shop', category: 'Waste', points: 50, impactCO2: 0.4, description: 'Shopped with reusable containers', icon: 'shopping-bag' },
  { id: '8', title: 'Public Transport', category: 'Transport', points: 20, impactCO2: 1.2, description: 'Took bus/train instead of car', icon: 'bus' },
];

export const QUESTS: Quest[] = [
  { id: '1', title: 'Plastic Free July', description: 'Avoid single-use plastics for a whole month.', category: 'Global', points: 500, duration: '30 Days', participants: 1240, image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=800' },
  { id: '2', title: 'Bike to Work Week', description: 'Cycle to work or school for 5 days in a row.', category: 'Global', points: 300, duration: '7 Days', participants: 850, image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800' },
  { id: '3', title: 'Local Park Cleanup', description: 'Join your cohort to clean up the local park.', category: 'Cohort', points: 200, duration: '1 Day', participants: 45, image: 'https://images.unsplash.com/photo-1618477461853-5f8dd68aa395?auto=format&fit=crop&q=80&w=800' },
];

export const BADGES: Badge[] = [
  { id: '1', name: 'Eco Starter', description: 'Logged first action', icon: 'star', criteria: '1 Action' },
  { id: '2', name: 'Week Warrior', description: '7 day streak', icon: 'flame', criteria: '7 Day Streak' },
  { id: '3', name: 'Waste Warrior', description: 'Saved 10kg of waste', icon: 'trash-2', criteria: 'Waste Impact' },
];

// Store Interface
interface AppState {
  user: User | null;
  actions: ActionLog[];
  users: User[]; // Mock other users for leaderboards
  
  // Actions
  login: (email: string) => void;
  logout: () => void;
  signup: (email: string) => void;
  completeOnboarding: (data: Partial<User>) => void;
  logAction: (actionId: string, note?: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      actions: [],
      users: [
        { id: '2', email: 'sarah@example.com', name: 'Sarah J.', role: 'user', level: 5, points: 1250, streak: 12, joinedAt: '2023-01-01', cohortId: 'A' },
        { id: '3', email: 'mike@example.com', name: 'Mike T.', role: 'user', level: 3, points: 800, streak: 3, joinedAt: '2023-02-01', cohortId: 'A' },
        { id: '4', email: 'emma@example.com', name: 'Emma W.', role: 'user', level: 7, points: 2100, streak: 25, joinedAt: '2023-01-15', cohortId: 'B' },
      ],

      login: (email) => {
        // Mock login - if email contains 'admin', make admin
        const role = email.includes('admin') ? 'admin' : 'user';
        set({
          user: {
            id: '1',
            email,
            name: email.split('@')[0],
            role,
            level: 1,
            points: 0,
            streak: 0,
            joinedAt: new Date().toISOString(),
          }
        });
      },

      logout: () => set({ user: null }),

      signup: (email) => {
        set({
          user: {
            id: '1',
            email,
            name: '',
            role: 'user',
            level: 1,
            points: 0,
            streak: 0,
            joinedAt: new Date().toISOString(),
          }
        });
      },

      completeOnboarding: (data) => {
        const currentUser = get().user;
        if (!currentUser) return;
        set({ user: { ...currentUser, ...data } });
      },

      logAction: (actionId, note) => {
        const currentUser = get().user;
        const actionType = ACTION_TYPES.find(a => a.id === actionId);
        if (!currentUser || !actionType) return;

        const newLog: ActionLog = {
          id: Math.random().toString(36).substr(2, 9),
          userId: currentUser.id,
          actionId,
          timestamp: new Date().toISOString(),
          note
        };

        set(state => ({
          actions: [newLog, ...state.actions],
          user: {
            ...state.user!,
            points: state.user!.points + actionType.points,
            streak: state.user!.streak + (Math.random() > 0.5 ? 1 : 0) // Mock streak logic
          }
        }));
      }
    }),
    {
      name: 'pfpe-storage',
    }
  )
);
