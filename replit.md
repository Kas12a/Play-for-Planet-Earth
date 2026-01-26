# Play for Planet Earth (PfPE) V1.2

## Overview
A gamified eco-action tracking platform that rewards sustainable behaviors with verified activity points. Users connect fitness apps (Strava) to earn verified points, join quests, and track environmental impact. Currently in **Verified Pilot Mode**.

**Version:** 1.2.0-verified-pilot  
**Stack:** React + TypeScript + Vite (frontend), Express (backend), Supabase (database + auth)

## Current State
- Verified Pilot Mode with Strava integration
- Server-side points ledger (anti-cheat)
- Self-declared actions limited: 10 pts/day, 5 actions/day
- Quests and action logs stored in Supabase (not localStorage)
- Leaderboard reads from database with anonymized names
- Terms and Privacy pages added
- OAuth security: HMAC-SHA256 signed state with 10-min expiry
- Password reset flow: Complete with recovery mode detection
- Multi-step onboarding flow: Welcome, Profile, Mode, Interests, Permissions
- Email verification: Non-blocking modal (can use app before verifying)
- New users start with 0 credits and 0 points

## Verification Status (January 2026)
- Gate 1: Database schema deployed (activity_sources, activity_events, points_ledger, RLS)
- Gate 2: Server-side points awarding confirmed (SELECT-only RLS on points_ledger)
- Gate 3: Strava OAuth tested successfully (CSRF-safe signed state)
- Gate 4: Activity sync working (fetches from Strava, awards points)

## Key Files

### Configuration
- `shared/config.ts` - Feature flags (PILOT_MODE, ENABLE_MARKETPLACE, etc.)
- `client/src/lib/configContext.tsx` - Client-side config provider
- `server/supabase.ts` - Server-side Supabase client with service role

### Strava Integration
- `server/strava.ts` - OAuth flow, token refresh, activity sync, scoring
- `server/routes.ts` - API endpoints for Strava connect/callback/sync/disconnect

### Database
- `scripts/supabase_schema.sql` - Base schema with RLS policies
- `scripts/verified_pilot_schema.sql` - V1.2 additions: activity_sources, activity_events, points_ledger
- `scripts/seed_pilot.ts` - Seed actions, quests, lessons, badges
- `scripts/reset_pilot.ts` - Wipe all user data (keeps content)

### Onboarding
- `client/src/pages/onboarding.tsx` - Multi-step onboarding flow
- `client/src/lib/useProfile.tsx` - Profile hook with onboarding fields
- `client/src/components/email-verification-modal.tsx` - Non-blocking email verification
- `scripts/onboarding_migration.sql` - Profile schema updates for onboarding

### Core Pages
- `client/src/pages/dashboard.tsx` - Main dashboard with impact stats
- `client/src/pages/actions.tsx` - Log self-declared eco-actions (capped)
- `client/src/pages/quests.tsx` - Join challenges (Supabase-backed)
- `client/src/pages/settings.tsx` - Connect Strava, sync activities
- `client/src/pages/leaderboard.tsx` - Rankings from Supabase
- `client/src/pages/terms.tsx` - Terms of Service
- `client/src/pages/privacy.tsx` - Privacy Policy

## Architecture

### Frontend
- React 18 with TypeScript
- Vite for bundling
- TailwindCSS + shadcn/ui for styling
- Wouter for routing
- Zustand for local state
- Supabase Auth for authentication

### Backend
- Express.js API server
- Supabase for database and auth
- Row Level Security for data isolation
- Server-only points awarding (anti-cheat)

### Data Flow
1. User connects Strava via OAuth
2. Server fetches activities and stores in activity_events
3. Server calculates points and inserts into points_ledger
4. Trigger updates user's total points in profiles
5. Leaderboard queries profiles ordered by points
6. Self-declared actions limited by server enforcement

## Verified Points System

| Source | Points | Limits |
|--------|--------|--------|
| Strava activity | 1 per 5 min | 50 per activity |
| Cycling/Running bonus | +20% | - |
| Self-declared action | Up to 3 | 10 pts/day, 5 actions/day |
| Quest completion | Varies | - |

## Feature Flags

| Flag | Default | Purpose |
|------|---------|---------|
| PILOT_MODE | true | Shows pilot badge, enables feedback |
| DEMO_MODE | false | Disabled |
| ENABLE_MARKETPLACE | false | Redeem shows "Coming Soon" |
| ENABLE_DONATIONS | false | Donate shows "Coming Soon" |
| ENABLE_CREDITS | true | Shows credit balance/history |
| ENABLE_QUESTS | true | Quest joining enabled |
| LEADERBOARD_ANONYMIZE | true | Uses pseudonyms on leaderboard |

## Running Locally

```bash
npm install
npm run dev
```

Server runs on port 5000.

## Database Setup

1. Run base schema in Supabase SQL Editor:
```sql
-- Run scripts/supabase_schema.sql
```

2. Run V1.2 additions:
```sql
-- Run scripts/verified_pilot_schema.sql
```

3. Seed content:
```bash
npx tsx scripts/seed_pilot.ts
```

## Environment Variables

Required secrets:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `STRAVA_REDIRECT_URI` (set to https://play4earth.co/api/strava/callback)

## API Endpoints

### Strava
- `GET /api/strava/connect` - Initiate OAuth (requires auth)
- `GET /api/strava/callback` - OAuth callback
- `GET /api/strava/status` - Connection status
- `POST /api/strava/sync` - Sync activities
- `POST /api/strava/disconnect` - Remove connection

### Points & Activities
- `GET /api/points/summary` - User's points breakdown
- `GET /api/activities` - User's activity events
- `GET /api/leaderboard` - Global rankings

### Quests & Actions
- `POST /api/quests/:id/join` - Join a quest
- `GET /api/quests/my` - User's quest participations
- `POST /api/actions/log` - Log self-declared action
- `GET /api/actions/my` - User's action logs

## User Preferences
- Use functional components with hooks
- Prefer TailwindCSS classes over inline styles
- Add data-testid attributes to interactive elements
- Keep components in single files when under 200 lines

## Onboarding Flow

### Steps (in order):
1. **Welcome** - Marketing intro + Continue button
2. **Profile** - Avatar selection, display name (required), age range (required)
3. **Mode** - Play as Individual or Join a Group
4. **Interests** - Select up to 3 interests (required)
5. **Permissions** - Location and notification toggles (optional)
6. **Enter app** - Onboarding complete

### Age Range Options:
- 12 - 15
- 16 - 20
- 21 - 28
- 29 - 35
- 36 or older

### Interest Options:
- Nature & Outdoors
- Energy Saver
- Movement & Transport
- Waste & Recycling
- Community & Action
- Mindful Living

### Email Verification:
- Non-blocking: Users can explore app before verifying
- Modal appears on dashboard/profile if unverified
- Remind again after 24 hours if dismissed

## Recent Changes (January 2026)
- V1.2: Implemented Verified Pilot Mode
- Integrated Strava OAuth for activity verification
- Created server-side points ledger
- Added self-declared action caps
- Replaced localStorage with Supabase for quests/actions
- Updated leaderboard to read from database
- Added Terms and Privacy pages
- Added Settings page with Strava connection UI
- V1.3: Implemented multi-step onboarding flow
- Email verification now non-blocking (modal, not gate)
- New users start with 0 credits/points
- Admin access restricted to database role only
