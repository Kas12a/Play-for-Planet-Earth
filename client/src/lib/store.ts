import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export type UserRole = 'user' | 'admin';
export type AgeBand = 'Under 16' | '16-18' | '19-30' | '31+';
export type TransactionType = 'EARN' | 'REDEEM' | 'DONATE' | 'SPONSOR_TOPUP' | 'PENALTY' | 'REVERSAL';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  ageBand?: AgeBand;
  cohortId?: string;
  level: number;
  points: number;
  credits: number;
  streak: number;
  joinedAt: string;
  parentEmail?: string;
  consentVerified?: boolean;
  walletAddress?: string;
  focus?: string;
  betaAccess?: boolean;
  investorMode?: boolean;
}

export interface ActionType {
  id: string;
  title: string;
  category: 'Waste' | 'Energy' | 'Transport' | 'Food' | 'Nature';
  baseRewardCredits: number;
  impactCO2: number;
  impactWaste: number;
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
  confidence: number;
  creditsEarned: number;
  clientRequestId: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  sourceType: string;
  confidence?: number;
  metadata?: Record<string, any>;
  clientRequestId: string;
  proofHash?: string;
  createdAt: string;
}

export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  creditsCost: number;
  partnerName: string;
  imageUrl?: string;
  category: string;
}

export interface Redemption {
  id: string;
  userId: string;
  itemId: string;
  creditsSpent: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  creditsReward: number;
  xpReward: number;
  category: 'Global' | 'Cohort';
  duration: string;
  participants?: number;
  image?: string;
  evidenceRequired?: boolean;
  requiresVerifiedActivity?: boolean;
  progress?: number;
  joined?: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: string;
  earned?: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  category: string;
  duration: string;
  content: string;
  creditsReward: number;
  completed?: boolean;
}

export interface DonationProject {
  id: string;
  title: string;
  description: string;
  image?: string;
  goal: number;
  raised: number;
}

// Mock Data - 20 Actions across categories
export const ACTION_TYPES: ActionType[] = [
  // Transport (5)
  { id: '1', title: 'Walk Instead of Drive', category: 'Transport', baseRewardCredits: 15, impactCO2: 0.5, impactWaste: 0, description: 'Chose walking over driving for a short trip', icon: 'footprints' },
  { id: '2', title: 'Bike Commute', category: 'Transport', baseRewardCredits: 20, impactCO2: 1.2, impactWaste: 0, description: 'Cycled to work or school', icon: 'bike' },
  { id: '3', title: 'Public Transport', category: 'Transport', baseRewardCredits: 15, impactCO2: 0.8, impactWaste: 0, description: 'Took bus, train, or tram', icon: 'bus' },
  { id: '4', title: 'Carpool', category: 'Transport', baseRewardCredits: 12, impactCO2: 0.6, impactWaste: 0, description: 'Shared a ride with others', icon: 'car' },
  { id: '5', title: 'Work From Home', category: 'Transport', baseRewardCredits: 10, impactCO2: 1.0, impactWaste: 0, description: 'Avoided commute by working remotely', icon: 'home' },
  
  // Energy (5)
  { id: '6', title: 'Unplug Devices', category: 'Energy', baseRewardCredits: 8, impactCO2: 0.1, impactWaste: 0, description: 'Unplugged unused electronics', icon: 'plug' },
  { id: '7', title: 'Cold Wash Laundry', category: 'Energy', baseRewardCredits: 12, impactCO2: 0.3, impactWaste: 0, description: 'Washed clothes at 30°C or less', icon: 'thermometer' },
  { id: '8', title: 'Air Dry Clothes', category: 'Energy', baseRewardCredits: 10, impactCO2: 0.4, impactWaste: 0, description: 'Dried clothes without a dryer', icon: 'wind' },
  { id: '9', title: 'LED Switch', category: 'Energy', baseRewardCredits: 25, impactCO2: 0.2, impactWaste: 0, description: 'Replaced a bulb with LED', icon: 'lightbulb' },
  { id: '10', title: 'Shorter Shower', category: 'Energy', baseRewardCredits: 8, impactCO2: 0.15, impactWaste: 0, description: 'Took a 5-minute shower or less', icon: 'droplet' },
  
  // Food (5)
  { id: '11', title: 'Meat-Free Meal', category: 'Food', baseRewardCredits: 18, impactCO2: 1.5, impactWaste: 0, description: 'Ate a plant-based meal', icon: 'salad' },
  { id: '12', title: 'Local Produce', category: 'Food', baseRewardCredits: 15, impactCO2: 0.4, impactWaste: 0, description: 'Bought locally grown food', icon: 'apple' },
  { id: '13', title: 'No Food Waste', category: 'Food', baseRewardCredits: 12, impactCO2: 0.3, impactWaste: 0.5, description: 'Finished all food, no waste today', icon: 'utensils' },
  { id: '14', title: 'Composted Scraps', category: 'Food', baseRewardCredits: 10, impactCO2: 0.2, impactWaste: 0.3, description: 'Composted food scraps', icon: 'leaf' },
  { id: '15', title: 'Reusable Container', category: 'Food', baseRewardCredits: 8, impactCO2: 0.05, impactWaste: 0.1, description: 'Used reusable container for takeaway', icon: 'package' },
  
  // Waste (5)
  { id: '16', title: 'Refill Water Bottle', category: 'Waste', baseRewardCredits: 10, impactCO2: 0.08, impactWaste: 0.02, description: 'Used refillable bottle', icon: 'droplet' },
  { id: '17', title: 'Recycled Correctly', category: 'Waste', baseRewardCredits: 8, impactCO2: 0.1, impactWaste: 0.5, description: 'Sorted and recycled waste', icon: 'recycle' },
  { id: '18', title: 'Refused Plastic Bag', category: 'Waste', baseRewardCredits: 6, impactCO2: 0.03, impactWaste: 0.01, description: 'Said no to a plastic bag', icon: 'x-circle' },
  { id: '19', title: 'Repaired Item', category: 'Waste', baseRewardCredits: 30, impactCO2: 2.0, impactWaste: 1.0, description: 'Fixed something instead of replacing', icon: 'wrench' },
  { id: '20', title: 'Zero Waste Shopping', category: 'Waste', baseRewardCredits: 25, impactCO2: 0.4, impactWaste: 0.3, description: 'Shopped with reusable bags/containers', icon: 'shopping-bag' },
];

// 6 Quests (evidence requirement removed for pilot)
export const QUESTS: Quest[] = [
  { id: '1', title: 'Plastic Free July', description: 'Avoid single-use plastics for a whole month. Log daily actions to track progress.', category: 'Global', creditsReward: 500, xpReward: 1000, duration: '30 Days', image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=800', evidenceRequired: false, requiresVerifiedActivity: false },
  { id: '2', title: 'Bike to Work Week', description: 'Cycle to work or school for 5 days. Connect Strava to track your rides automatically.', category: 'Global', creditsReward: 300, xpReward: 600, duration: '7 Days', image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800', evidenceRequired: false, requiresVerifiedActivity: true },
  { id: '3', title: 'Local Park Cleanup', description: 'Join your cohort to clean up the local park.', category: 'Cohort', creditsReward: 200, xpReward: 400, duration: '1 Day', image: 'https://images.unsplash.com/photo-1618477461853-5f8dd68aa395?auto=format&fit=crop&q=80&w=800', evidenceRequired: false, requiresVerifiedActivity: false },
  { id: '4', title: 'Active Commuter', description: 'Walk, run or cycle 50km total this month. Tracked via connected fitness apps.', category: 'Global', creditsReward: 400, xpReward: 800, duration: '30 Days', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800', evidenceRequired: false, requiresVerifiedActivity: true },
  { id: '5', title: 'Energy Saver Challenge', description: 'Reduce your home energy use by 20% this month.', category: 'Global', creditsReward: 350, xpReward: 700, duration: '30 Days', image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=800', evidenceRequired: false, requiresVerifiedActivity: false },
  { id: '6', title: 'Move for the Planet', description: 'Complete 10 hours of verified activity this month. Any movement counts!', category: 'Global', creditsReward: 450, xpReward: 900, duration: '30 Days', image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=800', evidenceRequired: false, requiresVerifiedActivity: true },
];

// 8 Marketplace Items
export const MARKETPLACE_ITEMS: MarketplaceItem[] = [
  { id: '1', title: 'Reusable Water Bottle', description: 'Premium stainless steel bottle, 500ml capacity. Keeps drinks cold for 24hrs.', creditsCost: 150, partnerName: 'EcoGear', category: 'Products', imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=400' },
  { id: '2', title: 'Plant a Tree', description: 'We plant a tree in your name through our reforestation partner.', creditsCost: 100, partnerName: 'Trees for Future', category: 'Impact', imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=400' },
  { id: '3', title: 'Coffee Shop Voucher', description: '£5 voucher for any participating eco-certified coffee shop.', creditsCost: 200, partnerName: 'Green Bean Collective', category: 'Vouchers', imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=400' },
  { id: '4', title: 'Organic Cotton Tote', description: 'Durable shopping tote made from 100% organic cotton.', creditsCost: 80, partnerName: 'EcoGear', category: 'Products', imageUrl: 'https://images.unsplash.com/photo-1597633125097-5a9ae3a8a713?auto=format&fit=crop&q=80&w=400' },
  { id: '5', title: 'Bike Tune-Up', description: 'Free bike service at participating repair shops.', creditsCost: 300, partnerName: 'Cycle City', category: 'Services', imageUrl: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&q=80&w=400' },
  { id: '6', title: 'Ocean Cleanup Contribution', description: 'Fund removal of 1kg of ocean plastic.', creditsCost: 50, partnerName: 'Ocean Rescue', category: 'Impact', imageUrl: 'https://images.unsplash.com/photo-1484291470158-b8f8d608850d?auto=format&fit=crop&q=80&w=400' },
  { id: '7', title: 'Bamboo Utensil Set', description: 'Portable bamboo cutlery set with carrying case.', creditsCost: 120, partnerName: 'EcoGear', category: 'Products', imageUrl: 'https://images.unsplash.com/photo-1584346133934-a3afd2a33c4c?auto=format&fit=crop&q=80&w=400' },
  { id: '8', title: 'Farmers Market Voucher', description: '£10 to spend at local farmers markets.', creditsCost: 400, partnerName: 'Local Harvest Network', category: 'Vouchers', imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=80&w=400' },
];

// 5 Lessons
export const LESSONS: Lesson[] = [
  { id: '1', title: 'The Plastic Problem', category: 'Waste', duration: '3 min', creditsReward: 25, content: 'Every piece of plastic ever made still exists. Learn about the impact and alternatives.', completed: true },
  { id: '2', title: 'Carbon Footprint Basics', category: 'Energy', duration: '5 min', creditsReward: 30, content: 'Understand what carbon footprint means and how daily choices affect it.' },
  { id: '3', title: 'Sustainable Eating', category: 'Food', duration: '4 min', creditsReward: 25, content: 'How food choices impact the planet and simple swaps to make a difference.' },
  { id: '4', title: 'Green Transport Guide', category: 'Transport', duration: '4 min', creditsReward: 25, content: 'Compare the environmental impact of different transport modes.' },
  { id: '5', title: 'The Circular Economy', category: 'Waste', duration: '6 min', creditsReward: 35, content: 'Learn about designing out waste and keeping materials in use.' },
];

// Badges
export const BADGES: Badge[] = [
  { id: '1', name: 'Eco Starter', description: 'Logged your first action', icon: 'star', criteria: '1 Action', earned: true },
  { id: '2', name: 'Week Warrior', description: '7 day streak', icon: 'flame', criteria: '7 Day Streak', earned: true },
  { id: '3', name: 'Waste Warrior', description: 'Saved 10kg of waste', icon: 'trash-2', criteria: 'Waste Impact', earned: false },
  { id: '4', name: 'Carbon Cutter', description: 'Saved 50kg CO2', icon: 'cloud', criteria: 'CO2 Impact', earned: true },
  { id: '5', name: 'Quest Master', description: 'Completed 5 quests', icon: 'trophy', criteria: '5 Quests', earned: false },
  { id: '6', name: 'Learner', description: 'Completed all lessons', icon: 'graduation-cap', criteria: 'All Lessons', earned: false },
];

// Donation Projects
export const DONATION_PROJECTS: DonationProject[] = [
  { id: '1', title: 'Amazon Rainforest Protection', description: 'Help protect critical rainforest habitat and support indigenous communities.', goal: 50000, raised: 32400, image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&q=80&w=400' },
  { id: '2', title: 'Ocean Plastic Cleanup', description: 'Fund technology to remove plastic from oceans and waterways.', goal: 30000, raised: 18500, image: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&q=80&w=400' },
  { id: '3', title: 'Renewable Energy for Schools', description: 'Install solar panels on schools in underserved communities.', goal: 25000, raised: 22100, image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=400' },
];

// Helper function to generate UUID
const generateUUID = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

// Calculate credits multiplier based on confidence
const getCreditsMultiplier = (confidence: number): number => {
  if (confidence >= 0.8) return 1.0;
  if (confidence >= 0.4) return 0.6;
  return 0.3;
};

// Store Interface
interface AppState {
  user: User | null;
  actions: ActionLog[];
  transactions: CreditTransaction[];
  redemptions: Redemption[];
  users: User[];
  
  // Actions
  login: (email: string) => void;
  logout: () => void;
  signup: (email: string) => void;
  completeOnboarding: (data: Partial<User>) => void;
  logAction: (actionId: string, note?: string, confidence?: number) => void;
  redeemItem: (item: MarketplaceItem) => { success: boolean; message: string };
  donateCredits: (projectId: string, amount: number) => { success: boolean; message: string };
  toggleInvestorMode: () => void;
  setFocus: (focus: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      actions: [],
      transactions: [],
      redemptions: [],
      users: [],

      login: (email: string) => {
        const role = email.includes('admin') ? 'admin' : 'user';
        
        set({
          user: {
            id: generateUUID(),
            email,
            name: email.split('@')[0],
            role,
            level: 1,
            points: 0,
            credits: 50,
            streak: 0,
            joinedAt: new Date().toISOString(),
            betaAccess: true,
            investorMode: false,
          },
          transactions: [],
          actions: [],
        });
      },

      logout: () => set({ user: null, transactions: [], actions: [], redemptions: [] }),

      signup: (email: string) => {
        set({
          user: {
            id: '1',
            email,
            name: '',
            role: 'user',
            level: 1,
            points: 0,
            credits: 50, // Starting bonus
            streak: 0,
            joinedAt: new Date().toISOString(),
            betaAccess: false,
          },
          transactions: [{
            id: generateUUID(),
            userId: '1',
            type: 'SPONSOR_TOPUP',
            amount: 50,
            sourceType: 'welcome_bonus',
            clientRequestId: generateUUID(),
            createdAt: new Date().toISOString(),
          }]
        });
      },

      completeOnboarding: (data: Partial<User>) => {
        const currentUser = get().user;
        if (!currentUser) return;
        set({ user: { ...currentUser, ...data, betaAccess: true } });
      },

      logAction: (actionId: string, note?: string, confidence: number = 0.85) => {
        const currentUser = get().user;
        const actionType = ACTION_TYPES.find(a => a.id === actionId);
        if (!currentUser || !actionType) return;

        const clientRequestId = generateUUID();
        const multiplier = getCreditsMultiplier(confidence);
        const creditsEarned = Math.round(actionType.baseRewardCredits * multiplier);

        const newLog: ActionLog = {
          id: generateUUID(),
          userId: currentUser.id,
          actionId,
          timestamp: new Date().toISOString(),
          note,
          confidence,
          creditsEarned,
          clientRequestId
        };

        const newTransaction: CreditTransaction = {
          id: generateUUID(),
          userId: currentUser.id,
          type: 'EARN',
          amount: creditsEarned,
          sourceType: 'action_log',
          confidence,
          metadata: { actionId, actionTitle: actionType.title },
          clientRequestId,
          createdAt: new Date().toISOString(),
        };

        set(state => ({
          actions: [newLog, ...state.actions],
          transactions: [newTransaction, ...state.transactions],
          user: {
            ...state.user!,
            points: state.user!.points + creditsEarned,
            credits: state.user!.credits + creditsEarned,
            streak: state.user!.streak + 1
          }
        }));
      },

      redeemItem: (item: MarketplaceItem) => {
        const currentUser = get().user;
        if (!currentUser) return { success: false, message: 'Not logged in' };
        
        if (currentUser.credits < item.creditsCost) {
          return { success: false, message: 'Insufficient credits' };
        }

        const clientRequestId = generateUUID();

        const newRedemption: Redemption = {
          id: generateUUID(),
          userId: currentUser.id,
          itemId: item.id,
          creditsSpent: item.creditsCost,
          status: 'completed',
          createdAt: new Date().toISOString(),
        };

        const newTransaction: CreditTransaction = {
          id: generateUUID(),
          userId: currentUser.id,
          type: 'REDEEM',
          amount: -item.creditsCost,
          sourceType: 'marketplace_redemption',
          metadata: { itemId: item.id, itemTitle: item.title, partnerName: item.partnerName },
          clientRequestId,
          createdAt: new Date().toISOString(),
        };

        set(state => ({
          redemptions: [newRedemption, ...state.redemptions],
          transactions: [newTransaction, ...state.transactions],
          user: {
            ...state.user!,
            credits: state.user!.credits - item.creditsCost,
          }
        }));

        return { success: true, message: 'Redemption successful!' };
      },

      donateCredits: (projectId: string, amount: number) => {
        const currentUser = get().user;
        if (!currentUser) return { success: false, message: 'Not logged in' };
        
        if (currentUser.credits < amount) {
          return { success: false, message: 'Insufficient credits' };
        }

        if (amount <= 0) {
          return { success: false, message: 'Invalid amount' };
        }

        const project = DONATION_PROJECTS.find(p => p.id === projectId);
        const clientRequestId = generateUUID();

        const newTransaction: CreditTransaction = {
          id: generateUUID(),
          userId: currentUser.id,
          type: 'DONATE',
          amount: -amount,
          sourceType: 'donation',
          metadata: { projectId, projectTitle: project?.title },
          clientRequestId,
          createdAt: new Date().toISOString(),
        };

        set(state => ({
          transactions: [newTransaction, ...state.transactions],
          user: {
            ...state.user!,
            credits: state.user!.credits - amount,
          }
        }));

        return { success: true, message: 'Donation successful! Thank you for your contribution.' };
      },

      toggleInvestorMode: () => {
        const currentUser = get().user;
        if (!currentUser) return;
        set({ user: { ...currentUser, investorMode: !currentUser.investorMode } });
      },

      setFocus: (focus: string) => {
        const currentUser = get().user;
        if (!currentUser) return;
        set({ user: { ...currentUser, focus } });
      }
    }),
    {
      name: 'pfpe-storage',
    }
  )
);
