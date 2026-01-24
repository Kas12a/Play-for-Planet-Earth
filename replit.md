# Play for Planet Earth (PfPE) V1.1

## Overview
A gamified eco-action tracking platform that rewards sustainable behaviors with credits. Users log actions, join quests, complete lessons, and earn badges while tracking their environmental impact. Currently in **Pilot Mode**.

**Version:** 1.1.0-pilot  
**Stack:** React + TypeScript + Vite (frontend), Express (backend), Supabase (database)

## Current State
- Pilot mode enabled with real Supabase backend
- Marketplace and Donations show "Coming Soon"
- Feedback collection active
- Authentication uses Zustand mock (Supabase Auth integration pending)

## Key Files

### Configuration
- `shared/config.ts` - Feature flags (PILOT_MODE, ENABLE_MARKETPLACE, etc.)
- `client/src/lib/configContext.tsx` - Client-side config provider
- `server/supabase.ts` - Server-side Supabase client

### Database
- `scripts/supabase_schema.sql` - Complete schema with RLS policies
- `scripts/seed_pilot.ts` - Seed actions, quests, lessons, badges
- `scripts/reset_pilot.ts` - Wipe all user data (keeps content)
- `scripts/verify_pilot.ts` - Check database integrity

### Core Features
- `client/src/pages/dashboard.tsx` - Main dashboard with impact stats
- `client/src/pages/actions.tsx` - Log eco-actions
- `client/src/pages/quests.tsx` - Join challenges
- `client/src/pages/credits.tsx` - View balance and history
- `client/src/pages/learn.tsx` - Educational content
- `client/src/components/feedback-button.tsx` - Pilot feedback collection

## Architecture

### Frontend
- React 18 with TypeScript
- Vite for bundling
- TailwindCSS + shadcn/ui for styling
- Wouter for routing
- Zustand for state management
- Recharts for data visualization

### Backend
- Express.js API server
- Supabase for database and auth (partial)
- Row Level Security for data isolation

### Data Flow
1. User actions trigger Zustand store updates
2. Store syncs with Supabase (when implemented)
3. Credit transactions auto-update balances via triggers
4. Leaderboard queries aggregated data

## Feature Flags

| Flag | Default | Purpose |
|------|---------|---------|
| PILOT_MODE | true | Shows pilot badge, enables feedback |
| DEMO_MODE | false | Would show demo data (disabled) |
| ENABLE_MARKETPLACE | false | Redeem page shows "Coming Soon" |
| ENABLE_DONATIONS | false | Donate page shows "Coming Soon" |
| ENABLE_CREDITS | true | Shows credit balance/history |
| ENABLE_QUESTS | true | Quest joining enabled |
| LEADERBOARD_ANONYMIZE | true | Uses pseudonyms on leaderboard |

## Running Locally

```bash
npm install
npm run dev
```

Server runs on port 5000.

## Scripts

```bash
# Database management
npx tsx scripts/seed_pilot.ts    # Seed content
npx tsx scripts/reset_pilot.ts   # Reset user data
npx tsx scripts/verify_pilot.ts  # Verify integrity
```

## Environment Variables

Required secrets:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## User Preferences
- Use functional components with hooks
- Prefer TailwindCSS classes over inline styles
- Add data-testid attributes to interactive elements
- Keep components in single files when under 200 lines

## Recent Changes (January 2026)
- Migrated to Supabase backend
- Added pilot mode with feature flags
- Removed all hardcoded demo data
- Added feedback collection system
- Fixed mobile navigation issues
- Created pilot management scripts
