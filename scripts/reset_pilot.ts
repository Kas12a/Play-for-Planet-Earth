/**
 * Reset Pilot Script
 * Cleans all data from public tables (preserves schema)
 * Run: npx tsx scripts/reset_pilot.ts
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

async function resetPilot() {
  console.log('🔄 Starting PILOT reset...\n');

  const tables = [
    'feedback',
    'user_lessons',
    'user_badges',
    'quest_participants',
    'credit_transactions',
    'action_logs',
    'lessons',
    'badges',
    'quests',
    'action_types',
    'profiles'
  ];

  for (const table of tables) {
    console.log(`  Truncating ${table}...`);
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
      console.error(`  ❌ Error truncating ${table}: ${error.message}`);
    } else {
      console.log(`  ✅ ${table} cleared`);
    }
  }

  console.log('\n✅ PILOT reset complete!');
  console.log('📝 Note: auth.users must be cleared manually in Supabase dashboard if needed.\n');
}

resetPilot().catch(console.error);
