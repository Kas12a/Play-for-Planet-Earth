/**
 * Seed Pilot Script
 * Populates database with curated pilot content
 * Run: npx tsx scripts/seed_pilot.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// 30 Actions across 5 categories
const ACTION_TYPES = [
  // Transport (6)
  { title: 'Walk Instead of Drive', category: 'Transport', base_reward_credits: 15, impact_co2: 0.5, impact_waste: 0, description: 'Chose walking over driving for a short trip', icon: 'footprints' },
  { title: 'Bike Commute', category: 'Transport', base_reward_credits: 20, impact_co2: 1.2, impact_waste: 0, description: 'Cycled to work or school', icon: 'bike' },
  { title: 'Public Transport', category: 'Transport', base_reward_credits: 15, impact_co2: 0.8, impact_waste: 0, description: 'Took bus, train, or tram instead of driving', icon: 'bus' },
  { title: 'Carpool', category: 'Transport', base_reward_credits: 12, impact_co2: 0.6, impact_waste: 0, description: 'Shared a ride with others', icon: 'car' },
  { title: 'Work From Home', category: 'Transport', base_reward_credits: 10, impact_co2: 1.0, impact_waste: 0, description: 'Avoided commute by working remotely', icon: 'home' },
  { title: 'E-Scooter or E-Bike', category: 'Transport', base_reward_credits: 12, impact_co2: 0.4, impact_waste: 0, description: 'Used electric micro-mobility', icon: 'zap' },
  
  // Energy (6)
  { title: 'Unplug Devices', category: 'Energy', base_reward_credits: 8, impact_co2: 0.1, impact_waste: 0, description: 'Unplugged unused electronics', icon: 'plug' },
  { title: 'Cold Wash Laundry', category: 'Energy', base_reward_credits: 12, impact_co2: 0.3, impact_waste: 0, description: 'Washed clothes at 30°C or less', icon: 'thermometer' },
  { title: 'Air Dry Clothes', category: 'Energy', base_reward_credits: 10, impact_co2: 0.4, impact_waste: 0, description: 'Dried clothes without a tumble dryer', icon: 'wind' },
  { title: 'LED Switch', category: 'Energy', base_reward_credits: 25, impact_co2: 0.2, impact_waste: 0, description: 'Replaced a bulb with energy-efficient LED', icon: 'lightbulb' },
  { title: 'Shorter Shower', category: 'Energy', base_reward_credits: 8, impact_co2: 0.15, impact_waste: 0, description: 'Took a 5-minute shower or less', icon: 'droplet' },
  { title: 'Thermostat Adjustment', category: 'Energy', base_reward_credits: 10, impact_co2: 0.5, impact_waste: 0, description: 'Lowered heating by 1°C', icon: 'thermometer' },
  
  // Food (6)
  { title: 'Meat-Free Meal', category: 'Food', base_reward_credits: 18, impact_co2: 1.5, impact_waste: 0, description: 'Ate a plant-based meal', icon: 'salad' },
  { title: 'Local Produce', category: 'Food', base_reward_credits: 15, impact_co2: 0.4, impact_waste: 0, description: 'Bought locally grown food', icon: 'apple' },
  { title: 'No Food Waste', category: 'Food', base_reward_credits: 12, impact_co2: 0.3, impact_waste: 0.5, description: 'Finished all food with no waste today', icon: 'utensils' },
  { title: 'Composted Scraps', category: 'Food', base_reward_credits: 10, impact_co2: 0.2, impact_waste: 0.3, description: 'Composted food scraps', icon: 'leaf' },
  { title: 'Reusable Container', category: 'Food', base_reward_credits: 8, impact_co2: 0.05, impact_waste: 0.1, description: 'Used reusable container for takeaway', icon: 'package' },
  { title: 'Batch Cooking', category: 'Food', base_reward_credits: 15, impact_co2: 0.3, impact_waste: 0.2, description: 'Cooked multiple meals at once to save energy', icon: 'utensils' },
  
  // Waste (6)
  { title: 'Refill Water Bottle', category: 'Waste', base_reward_credits: 10, impact_co2: 0.08, impact_waste: 0.02, description: 'Used refillable water bottle', icon: 'droplet' },
  { title: 'Recycled Correctly', category: 'Waste', base_reward_credits: 8, impact_co2: 0.1, impact_waste: 0.5, description: 'Sorted and recycled waste properly', icon: 'recycle' },
  { title: 'Refused Plastic Bag', category: 'Waste', base_reward_credits: 6, impact_co2: 0.03, impact_waste: 0.01, description: 'Said no to a single-use plastic bag', icon: 'x-circle' },
  { title: 'Repaired Item', category: 'Waste', base_reward_credits: 30, impact_co2: 2.0, impact_waste: 1.0, description: 'Fixed something instead of replacing it', icon: 'wrench' },
  { title: 'Zero Waste Shopping', category: 'Waste', base_reward_credits: 25, impact_co2: 0.4, impact_waste: 0.3, description: 'Shopped with reusable bags and containers', icon: 'shopping-bag' },
  { title: 'Donated Items', category: 'Waste', base_reward_credits: 20, impact_co2: 0.5, impact_waste: 0.8, description: 'Donated unwanted items instead of throwing away', icon: 'heart' },
  
  // Community (6)
  { title: 'Litter Pickup', category: 'Community', base_reward_credits: 20, impact_co2: 0.1, impact_waste: 0.5, description: 'Picked up litter in your neighbourhood', icon: 'trash' },
  { title: 'Shared Knowledge', category: 'Community', base_reward_credits: 15, impact_co2: 0, impact_waste: 0, description: 'Taught someone about sustainability', icon: 'users' },
  { title: 'Volunteered', category: 'Community', base_reward_credits: 35, impact_co2: 0.5, impact_waste: 0.5, description: 'Volunteered for an environmental cause', icon: 'heart' },
  { title: 'Attended Eco Event', category: 'Community', base_reward_credits: 25, impact_co2: 0.2, impact_waste: 0.1, description: 'Attended a sustainability event or workshop', icon: 'calendar' },
  { title: 'Planted Something', category: 'Community', base_reward_credits: 30, impact_co2: 1.0, impact_waste: 0, description: 'Planted a tree, flower, or vegetable', icon: 'leaf' },
  { title: 'Supported Local Business', category: 'Community', base_reward_credits: 12, impact_co2: 0.2, impact_waste: 0.1, description: 'Chose a local business over a chain', icon: 'store' },
];

// 6 Quests
const QUESTS = [
  {
    title: 'Green Commute Week',
    description: 'Take sustainable transport to work or school for 5 days straight. Log your walks, bike rides, or public transport journeys.',
    credits_reward: 300,
    xp_reward: 600,
    category: 'Global',
    duration: '7 Days',
    evidence_required: false,
  },
  {
    title: 'Plastic-Free Challenge',
    description: 'Avoid single-use plastics for one week. Bring your own bags, bottles, and containers.',
    credits_reward: 400,
    xp_reward: 800,
    category: 'Global',
    duration: '7 Days',
    evidence_required: false,
  },
  {
    title: 'Energy Saver Sprint',
    description: 'Reduce your home energy consumption. Unplug devices, take shorter showers, and switch off lights.',
    credits_reward: 250,
    xp_reward: 500,
    category: 'Global',
    duration: '7 Days',
    evidence_required: false,
  },
  {
    title: 'Meatless Week',
    description: 'Go meat-free for 7 days. Discover delicious plant-based meals and reduce your carbon footprint.',
    credits_reward: 350,
    xp_reward: 700,
    category: 'Global',
    duration: '7 Days',
    evidence_required: false,
  },
  {
    title: 'Local Park Cleanup',
    description: 'Join your community for a park cleanup session. Submit photo evidence of your contribution.',
    credits_reward: 200,
    xp_reward: 400,
    category: 'Cohort',
    duration: '1 Day',
    evidence_required: true,
  },
  {
    title: 'Zero Waste Weekend',
    description: 'Produce zero waste for an entire weekend. Plan meals, shop consciously, and avoid disposables.',
    credits_reward: 300,
    xp_reward: 600,
    category: 'Global',
    duration: '3 Days',
    evidence_required: false,
  },
];

// 5 Lessons
const LESSONS = [
  { title: 'Understanding Carbon Footprints', category: 'Energy', duration: '5 min', content: 'Learn what carbon footprint means and how your daily choices impact climate change. Discover simple ways to measure and reduce your personal emissions.', credits_reward: 30 },
  { title: 'The Plastic Problem', category: 'Waste', duration: '4 min', content: 'Every piece of plastic ever made still exists. Understand the scale of plastic pollution and practical alternatives you can use today.', credits_reward: 25 },
  { title: 'Sustainable Food Choices', category: 'Food', duration: '5 min', content: 'Food production accounts for 26% of global emissions. Learn which foods have the biggest impact and how to make sustainable choices.', credits_reward: 30 },
  { title: 'Green Transport Options', category: 'Transport', duration: '4 min', content: 'Transport is responsible for 16% of global emissions. Compare different transport modes and their environmental impact.', credits_reward: 25 },
  { title: 'The Circular Economy', category: 'Waste', duration: '6 min', content: 'Move beyond reduce-reuse-recycle. Understand how circular economy principles can eliminate waste and keep materials in use.', credits_reward: 35 },
];

// 6 Badges
const BADGES = [
  { name: 'Eco Starter', description: 'Logged your first action', icon: 'star', criteria: 'Log 1 action' },
  { name: 'Week Warrior', description: 'Maintained a 7-day streak', icon: 'flame', criteria: '7-day streak' },
  { name: 'Carbon Cutter', description: 'Saved 10kg of CO2', icon: 'cloud', criteria: 'Save 10kg CO2' },
  { name: 'Waste Warrior', description: 'Avoided 5kg of waste', icon: 'trash', criteria: 'Avoid 5kg waste' },
  { name: 'Quest Champion', description: 'Completed your first quest', icon: 'trophy', criteria: 'Complete 1 quest' },
  { name: 'Learner', description: 'Completed all lessons', icon: 'graduation-cap', criteria: 'Complete all lessons' },
];

async function seedPilot() {
  console.log('🌱 Starting PILOT seed...\n');

  // Seed action types
  console.log('  Seeding action types...');
  const { error: actionError } = await supabase.from('action_types').insert(ACTION_TYPES);
  if (actionError) {
    console.error(`  ❌ Error seeding action_types: ${actionError.message}`);
  } else {
    console.log(`  ✅ ${ACTION_TYPES.length} action types seeded`);
  }

  // Seed quests
  console.log('  Seeding quests...');
  const { error: questError } = await supabase.from('quests').insert(QUESTS);
  if (questError) {
    console.error(`  ❌ Error seeding quests: ${questError.message}`);
  } else {
    console.log(`  ✅ ${QUESTS.length} quests seeded`);
  }

  // Seed lessons
  console.log('  Seeding lessons...');
  const { error: lessonError } = await supabase.from('lessons').insert(LESSONS);
  if (lessonError) {
    console.error(`  ❌ Error seeding lessons: ${lessonError.message}`);
  } else {
    console.log(`  ✅ ${LESSONS.length} lessons seeded`);
  }

  // Seed badges
  console.log('  Seeding badges...');
  const { error: badgeError } = await supabase.from('badges').insert(BADGES);
  if (badgeError) {
    console.error(`  ❌ Error seeding badges: ${badgeError.message}`);
  } else {
    console.log(`  ✅ ${BADGES.length} badges seeded`);
  }

  console.log('\n✅ PILOT seed complete!');
}

seedPilot().catch(console.error);
