# Plan: Complete Stripe + Firebase Integration

## Goal
Complete the purchase flow circle: customer buys → payment tracked → dashboard shows real data → Stripe webhook updates Firebase. The main remaining work is wiring the admin dashboard to real data and ensuring the full flow is tested.

## Current State Analysis

### What's DONE (Verified):
- `/api/checkout` - Creates pending booking in Firebase + Stripe session ✅
- `/api/webhooks/stripe` - Updates booking to paid, increments enrollment, sends email ✅
- `/admin/payments` - Shows real Stripe data (revenue, payments, refunds) ✅
- `/admin/bookings` - Shows real Firebase data ✅
- Email confirmation via Resend ✅
- All environment variables configured ✅

### What's MISSING:
1. **Main admin dashboard** (`/admin`) uses mock data - needs real stats API
2. **No `/api/admin/stats` endpoint** - needs to aggregate Firebase + Stripe data
3. **Webhook not registered in Stripe Dashboard** for production
4. **Production URL** not set (`NEXT_PUBLIC_BASE_URL` defaults to localhost)
5. **End-to-end test** of the full flow

### Key Files:
- `src/app/admin/page.tsx` - Dashboard with mock stats (needs update)
- `src/app/api/checkout/route.ts` - Creates bookings (complete)
- `src/app/api/webhooks/stripe/route.ts` - Updates on payment (complete)
- `src/types/booking.ts` - DashboardStats type exists

## Tasks

### Task 1: Create Dashboard Stats API
Create `/api/admin/stats` endpoint that aggregates real data from Firebase and Stripe.

- [ ] Create `src/app/api/admin/stats/route.ts`
- [ ] Query Firebase `bookings` collection for counts
- [ ] Query Firebase `sessions` collection for upcoming sessions
- [ ] Query Firebase `waitlist` collection for waitlist count
- [ ] Query Stripe for monthly revenue (reuse existing pattern from `/api/admin/stripe/overview`)
- [ ] Return data matching `DashboardStats` type

**Files to create:**
- `src/app/api/admin/stats/route.ts`

### Task 2: Wire Dashboard to Real Data
Update the main admin dashboard to fetch from the new stats API.

- [ ] Replace mock data with `fetch('/api/admin/stats')`
- [ ] Add loading and error states
- [ ] Add recent bookings display (from API)
- [ ] Add refresh capability

**Files to modify:**
- `src/app/admin/page.tsx`

### Task 3: Add Recent Bookings to Stats API
The dashboard needs recent bookings for the "Recent Bookings" card.

- [ ] Add `recentBookings` to stats API response
- [ ] Query last 5 bookings with essential fields
- [ ] Return in `DashboardStats` format

**Files to modify:**
- `src/app/api/admin/stats/route.ts`

### Task 4: Verify Checkout Flow End-to-End
Test the complete flow to ensure everything works together.

- [ ] Start dev server
- [ ] Run Stripe CLI webhook forwarding
- [ ] Make a test purchase
- [ ] Verify booking created in Firebase as "pending"
- [ ] Verify webhook fires and updates to "paid"
- [ ] Verify enrollment count increments
- [ ] Verify email sent (check Resend dashboard or logs)
- [ ] Verify admin dashboard shows updated stats

**Manual verification steps documented below**

## Success Criteria

### Automated Verification:
- [ ] Build passes: `npm run build`
- [ ] Type check passes: `npx tsc --noEmit`
- [ ] Lint passes: `npm run lint`

### Manual Verification:
- [ ] `/admin` dashboard shows real booking count (not hardcoded 47)
- [ ] `/admin` dashboard shows real revenue from Stripe
- [ ] `/admin` dashboard shows upcoming sessions from Firebase
- [ ] `/admin` dashboard shows waitlist count from Firebase
- [ ] `/admin` dashboard shows recent bookings (or "No recent bookings")
- [ ] Test purchase updates all dashboard stats

## Technical Choices

- **Caching**: Use Next.js `unstable_cache` (5 min TTL) for stats API to match existing pattern
- **Data Sources**: Firebase for bookings/sessions/waitlist, Stripe for revenue
- **Type Safety**: Reuse existing `DashboardStats` type from `src/types/booking.ts`
- **Pattern**: Follow existing `/api/admin/stripe/overview` route pattern

## Out of Scope

- Production webhook registration (manual step in Stripe Dashboard)
- Production `NEXT_PUBLIC_BASE_URL` (deploy-time configuration)
- Stripe Customer creation for repeat buyers (enhancement)
- Admin email notifications for new orders (enhancement)

## Implementation Notes

### Stats API Pattern
```typescript
// Follow existing pattern from /api/admin/stripe/overview
import { adminDb } from "@/lib/firebase-admin";
import { stripe } from "@/lib/stripe";
import { unstable_cache } from "next/cache";

const getStats = unstable_cache(
  async () => {
    // Aggregate data...
  },
  ["admin-stats"],
  { revalidate: 300 } // 5 minutes
);
```

### Dashboard Data Flow
```
/admin (page)
  └─> fetch('/api/admin/stats')
      ├─> Firebase: bookings.count()
      ├─> Firebase: sessions.where(date > now)
      ├─> Firebase: waitlist.count()
      └─> Stripe: balanceTransactions (this month)
```
