# PfPE V1.1 Pilot Readiness Report

**Generated:** January 2026  
**Version:** 1.1.0-pilot  
**Status:** Ready for Pilot Testing

---

## 1. What Was Changed

### Database & Backend
- Created comprehensive Supabase schema (`scripts/supabase_schema.sql`)
- Configured Row Level Security (RLS) policies for all tables
- Added auto-profile creation on user signup
- Credit transaction triggers for automatic balance updates
- Feedback collection system with Supabase storage

### Feature Flags (shared/config.ts)
| Flag | Status | Description |
|------|--------|-------------|
| PILOT_MODE | `true` | Enables pilot-specific features |
| DEMO_MODE | `false` | Disabled for real data |
| ENABLE_MARKETPLACE | `false` | "Coming Soon" placeholder |
| ENABLE_DONATIONS | `false` | "Coming Soon" placeholder |
| ENABLE_WALLET | `false` | Hidden completely |
| ENABLE_LEARN | `true` | Lessons available |
| ENABLE_CREDITS | `true` | Credit balance/history visible |
| ENABLE_ACTIONS | `true` | Action logging enabled |
| ENABLE_QUESTS | `true` | Quest joining enabled |
| ENABLE_LEADERBOARD | `true` | Anonymized leaderboard |

### UI Improvements
- Added "Pilot Mode" badge in header (blue)
- Added persistent Feedback button (bottom-right)
- Removed all fake/demo numbers from dashboard
- Real-time computed values (CO2 saved, actions this week)
- Fixed mobile bottom navigation
- Improved quest joining UX with loading states
- Added "Coming Soon" pages for disabled features

### Data Removed
- Fake participant counts on quests (was: "1240 joined")
- Hardcoded progress percentages
- Mock chart data (now computed from transactions)
- Demo user accounts (leaderboard uses real profiles)

---

## 2. Pilot Content Summary

### Actions (30 total)
- **Transport:** 6 actions (Walk, Bike, Public Transport, Carpool, WFH, E-Scooter)
- **Energy:** 6 actions (Unplug, Cold Wash, Air Dry, LED, Shower, Thermostat)
- **Food:** 6 actions (Meat-Free, Local, No Waste, Compost, Container, Batch Cook)
- **Waste:** 6 actions (Refill, Recycle, Refuse Bag, Repair, Zero Waste, Donate)
- **Community:** 6 actions (Litter, Share, Volunteer, Event, Plant, Local Business)

### Quests (6 total)
1. Green Commute Week (7 days, 300 credits)
2. Plastic-Free Challenge (7 days, 400 credits)
3. Energy Saver Sprint (7 days, 250 credits)
4. Meatless Week (7 days, 350 credits)
5. Local Park Cleanup (1 day, 200 credits, evidence required)
6. Zero Waste Weekend (3 days, 300 credits)

### Lessons (5 total)
- Understanding Carbon Footprints
- The Plastic Problem
- Sustainable Food Choices
- Green Transport Options
- The Circular Economy

### Badges (6 total)
- Eco Starter, Week Warrior, Carbon Cutter, Waste Warrior, Quest Champion, Learner

---

## 3. Setup Scripts

Run these in order to set up a fresh pilot:

```bash
# 1. Apply schema to Supabase (run in SQL Editor)
# Copy contents of: scripts/supabase_schema.sql

# 2. Reset any existing data (optional)
npx tsx scripts/reset_pilot.ts

# 3. Seed pilot content
npx tsx scripts/seed_pilot.ts

# 4. Verify setup
npx tsx scripts/verify_pilot.ts
```

---

## 4. Environment Variables

Required secrets (set in Replit Secrets):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Public anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Server-only service role key

---

## 5. Admin Access

Admin email: `info@playearth.co.uk`

To grant admin access:
1. User signs up normally
2. Update their profile in Supabase:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'info@playearth.co.uk';
   ```

---

## 6. Known Limitations

1. **Supabase Auth Required:** Frontend currently uses Zustand mock auth. Full Supabase Auth integration is the next step.
2. **Email Notifications:** Feedback is stored in DB but email notifications not yet configured.
3. **Photo Upload:** Action photo evidence is UI-only; Supabase Storage not connected.

---

## 7. Test Plan (15 Scenarios)

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| 1 | User Signup | Enter email/password, submit | Profile created, redirected to onboarding |
| 2 | User Login | Enter credentials, submit | Dashboard loads with user data |
| 3 | Log Action | Select action, set confidence, confirm | Credits increase, toast shown, transaction recorded |
| 4 | Join Quest | Click "Join Quest" on any quest | Loading state, success toast, button changes to "Joined" |
| 5 | View Credits | Navigate to Credits page | Balance displayed, transaction history shows |
| 6 | View Leaderboard | Navigate to Leaderboard | Users listed with pseudonymous names, no emails |
| 7 | Submit Feedback | Click Feedback button, fill form, submit | Toast shown, feedback stored in DB |
| 8 | View Redeem Page | Navigate to Redeem | "Coming Soon" page displayed |
| 9 | View Donate Page | Navigate to Donate | "Coming Soon" page displayed |
| 10 | Mobile Navigation | Use bottom nav on mobile | Correct pages load, no errors |
| 11 | Pilot Mode Badge | View header on desktop/mobile | Blue "Pilot" badge visible |
| 12 | No Fake Numbers | Check all pages | No hardcoded "1240 joined" or "65%" values |
| 13 | Health Check | Call /api/health | JSON response with supabase status |
| 14 | Logout | Click logout button | Redirected to auth page, state cleared |
| 15 | Error Handling | Trigger error (e.g., offline) | Graceful error message, no blank screens |

---

## 8. Deployment Checklist

- [ ] Supabase project created
- [ ] Schema applied (scripts/supabase_schema.sql)
- [ ] Environment secrets configured
- [ ] Pilot content seeded
- [ ] Admin account created
- [ ] Email verification enabled in Supabase Auth
- [ ] RLS policies verified
- [ ] App tested on mobile
- [ ] Feedback system verified

---

## 9. Next Steps (Post-Pilot)

1. Integrate Supabase Auth to replace Zustand mock auth
2. Add real-time leaderboard updates
3. Implement photo upload with Supabase Storage
4. Enable Marketplace with real partners
5. Add email notifications for feedback
6. Implement quest progress tracking
