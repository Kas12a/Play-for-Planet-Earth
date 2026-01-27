# Test Plan - Play for Planet Earth

**Created:** January 27, 2026  
**Version:** 1.2.0-verified-pilot

## Existing Test Coverage

### Current State
- **Unit Tests:** None detected in repository
- **Integration Tests:** None detected
- **E2E Tests:** None detected
- **Test Framework:** Not configured

### Test Files Audit
```bash
find . -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts"
# Result: No test files found
```

## Recommended Test Framework

Given the React + TypeScript + Vite stack, recommend:
- **Unit/Component:** Vitest + React Testing Library
- **E2E:** Playwright

## Top 5 Critical Flows to Test

### 1. Authentication Flow (Priority: CRITICAL)
**Test Cases:**
- [ ] User can sign up with valid email/password
- [ ] Password validation enforces requirements (8+ chars, uppercase, lowercase, number, special)
- [ ] User can sign in with correct credentials
- [ ] Invalid credentials show error message
- [ ] Password reset flow sends email
- [ ] User can sign out

**Manual Test Checklist:**
1. Go to /auth
2. Enter test email and password meeting requirements
3. Verify signup succeeds or shows appropriate error
4. Verify can sign in with created account
5. Verify sign out clears session

### 2. Onboarding Flow (Priority: CRITICAL)
**Test Cases:**
- [ ] New user redirected to onboarding
- [ ] All steps are required (profile, mode, interests)
- [ ] Can navigate back/forward between steps
- [ ] Completed onboarding redirects to dashboard
- [ ] Onboarding status persists after refresh

**Manual Test Checklist:**
1. Create new account
2. Complete each onboarding step
3. Verify dashboard loads after completion
4. Refresh page, verify stays on dashboard

### 3. Quest Join Flow (Priority: HIGH)
**Test Cases:**
- [ ] Quest list loads from API
- [ ] Can join a quest
- [ ] Cannot join same quest twice
- [ ] Joined status persists
- [ ] Unauthenticated user shown prompt

**Manual Test Checklist:**
1. Navigate to /quests
2. Click "Join Quest" on any quest
3. Verify button changes to "Joined"
4. Refresh page, verify joined status persists
5. Try to join again, verify prevented

### 4. Strava Integration (Priority: HIGH)
**Test Cases:**
- [ ] Connect Strava initiates OAuth
- [ ] OAuth callback handles success/error
- [ ] Connected status displayed correctly
- [ ] Sync activities fetches data
- [ ] Disconnect removes connection

**Manual Test Checklist:**
1. Go to Settings
2. Click "Connect Strava"
3. Complete OAuth flow
4. Verify connected status shows
5. Click "Sync Activities"
6. Verify activities appear in points
7. Disconnect and verify status updates

### 5. Action Logging (Priority: HIGH)
**Test Cases:**
- [ ] Action types load correctly
- [ ] Can log an action
- [ ] Daily limits enforced (10 pts/day, 5 actions/day)
- [ ] Points awarded correctly
- [ ] Limit display updates after logging

**Manual Test Checklist:**
1. Navigate to /actions
2. Select an action and log it
3. Verify points increase
4. Verify daily remaining count decreases
5. Log 5 actions, verify limit reached message

## API Endpoint Tests

### Health & Config
| Endpoint | Method | Expected | Test |
|----------|--------|----------|------|
| /api/health | GET | 200 + status ok | `curl /api/health` |
| /api/config | GET | 200 + config object | `curl /api/config` |

### Authenticated Endpoints
| Endpoint | Method | Auth Required | Test |
|----------|--------|---------------|------|
| /api/strava/connect | GET | Yes | Verify 401 without token |
| /api/strava/status | GET | Yes | Returns connection status |
| /api/strava/sync | POST | Yes | Syncs activities |
| /api/points/summary | GET | Yes | Returns points breakdown |
| /api/quests/my | GET | Yes | Returns user's quests |
| /api/actions/log | POST | Yes | Logs action with limits |
| /api/leaderboard | GET | No | Returns rankings |

## Component Tests (If Adding Vitest)

### Priority Components
1. **AuthContext** - Authentication state management
2. **ProfileProvider** - Profile data loading
3. **Layout** - Navigation and responsive behavior
4. **Button** - All variants render correctly
5. **Card** - Composition pattern works

### Sample Test Structure
```typescript
// Example: Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('applies variant classes', () => {
    render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-destructive');
  });

  it('handles disabled state', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

## E2E Test Scenarios (Playwright)

### Critical User Journeys
```typescript
// Example: auth.spec.ts
test('user can sign up and complete onboarding', async ({ page }) => {
  await page.goto('/auth');
  await page.fill('[data-testid="input-email"]', 'test@example.com');
  await page.fill('[data-testid="input-password"]', 'Test123!@#');
  await page.click('[data-testid="button-signup"]');
  // Continue through onboarding...
});
```

## Test Data Requirements

### Test Accounts
- Fresh account (no onboarding)
- Onboarded account (dashboard access)
- Account with Strava connected
- Account at daily action limit

### Database State
- Seed quests for testing
- Seed action types for testing
- Clean test user data after runs

## How to Run Tests

### When Tests Are Added
```bash
# Unit/Component tests
npm run test

# E2E tests
npm run test:e2e

# Type checking (already exists)
npm run check
```

## Test Coverage Goals

| Area | Current | Target |
|------|---------|--------|
| Auth flows | 0% | 80% |
| API endpoints | 0% | 70% |
| UI components | 0% | 60% |
| E2E critical paths | 0% | 5 scenarios |

## Why Tests Not Added in This Audit

1. **No test framework configured** - Would require adding Vitest/RTL dependencies
2. **Time constraints** - Full test suite requires significant investment
3. **Manual verification sufficient for pilot** - All critical flows tested manually
4. **Recommendation:** Add test infrastructure in next sprint

## Conclusion

While the application lacks automated tests, manual testing confirms all critical flows work correctly. For production readiness beyond pilot, implementing the test plan above is recommended.
