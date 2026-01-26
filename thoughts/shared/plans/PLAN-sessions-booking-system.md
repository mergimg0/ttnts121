# Plan: Sessions & Booking System with Online Payments

## Goal
Build a comprehensive session booking system to replace Active.com, featuring:
- Program/Session hierarchy with filters and calendar view
- Shopping cart for multi-session bookings
- Stripe payment integration
- Firebase backend (Firestore + Auth)
- Admin dashboard for session management
- Waitlist with email notifications
- Integration with Services pages + dedicated /sessions page

**Prerequisite:** This plan should be implemented AFTER `PLAN-services-dropdown.md`

## Discovery Interview Summary

| Requirement | Decision |
|-------------|----------|
| Feature scope | Full parity with Active.com |
| Payment provider | Stripe |
| Database | Firebase (Firestore) |
| Authentication | Firebase Auth |
| Session management | Admin dashboard |
| Waitlist | Yes, with email notifications |
| Cart | Multi-session shopping cart |
| Structure | Programs → Sessions hierarchy |
| Navigation | Both: Services show sessions + master /sessions page |

## Active.com Feature Analysis (from browser exploration)

### Features to Replicate:
1. **Programs List** - Landing page showing all programs with dates
2. **Session Selection** - Filter by Location, Dates, Age, Times
3. **View Modes** - Session List + Calendar view
4. **Session Cards** - Title, dates, time, location, age, price, availability
5. **Session Details Modal** - Full description, requirements, add to cart
6. **Shopping Cart** - Sidebar cart, multiple sessions, continue button
7. **Availability Indicators** - "Only X spots left!", "WAITLIST ONLY"
8. **Online Checkout** - Secure payment processing

### Data Model (from observed patterns):
```
Program {
  id, name, location, dateRange, description
}

Session {
  programId, name, description,
  startDate, endDate, dayOfWeek, startTime, endTime,
  location, ageMin, ageMax,
  price, capacity, enrolled, waitlistEnabled
}

Booking {
  sessionId, participantInfo, paymentStatus,
  createdAt, stripePaymentId
}
```

## Technical Architecture

### Stack:
- **Frontend**: Next.js 16 (existing)
- **Database**: Firebase Firestore
- **Auth**: Firebase Auth (admin only)
- **Payments**: Stripe Checkout
- **Email**: Resend (existing)
- **State**: React Context for cart

### Firebase Collections:
```
/programs/{programId}
/sessions/{sessionId}
/bookings/{bookingId}
/waitlist/{waitlistId}
/admins/{adminId}
```

### Key Dependencies to Add:
```json
{
  "firebase": "^10.x",
  "firebase-admin": "^12.x",
  "stripe": "^14.x",
  "@stripe/stripe-js": "^2.x"
}
```

## Tasks

### Phase 1: Foundation

#### Task 1.1: Firebase Setup
Set up Firebase project and integrate with Next.js.

- [ ] Create Firebase project in console
- [ ] Enable Firestore database
- [ ] Enable Firebase Authentication
- [ ] Create service account for server-side access
- [ ] Add firebase and firebase-admin packages
- [ ] Create `src/lib/firebase.ts` - client SDK init
- [ ] Create `src/lib/firebase-admin.ts` - server SDK init
- [ ] Add environment variables to `.env.local`
- [ ] Create Firestore security rules

**Files to create:**
- `src/lib/firebase.ts`
- `src/lib/firebase-admin.ts`
- `firestore.rules`

**Environment variables:**
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_ADMIN_CLIENT_EMAIL=
```

---

#### Task 1.2: Stripe Setup
Integrate Stripe for payment processing.

- [ ] Create Stripe account (if not exists)
- [ ] Get API keys (test mode first)
- [ ] Add stripe packages
- [ ] Create `src/lib/stripe.ts` - Stripe client init
- [ ] Create webhook endpoint for payment events
- [ ] Add environment variables

**Files to create:**
- `src/lib/stripe.ts`
- `src/app/api/webhooks/stripe/route.ts`

**Environment variables:**
```
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

#### Task 1.3: Data Types & Constants
Define TypeScript types and update constants.

- [ ] Create `src/types/booking.ts` with Program, Session, Booking, CartItem types
- [ ] Update `src/lib/constants.ts` with booking-related constants
- [ ] Create `src/lib/booking-utils.ts` for helper functions

**Files to create:**
- `src/types/booking.ts`
- `src/lib/booking-utils.ts`

---

### Phase 2: Admin Dashboard

#### Task 2.1: Admin Authentication
Implement admin login functionality.

- [ ] Create `src/app/admin/login/page.tsx` - login page
- [ ] Create `src/components/admin/auth-provider.tsx` - auth context
- [ ] Create `src/middleware.ts` - protect /admin routes
- [ ] Create admin user in Firebase Auth
- [ ] Store admin UIDs in Firestore /admins collection

**Files to create:**
- `src/app/admin/login/page.tsx`
- `src/app/admin/layout.tsx`
- `src/components/admin/auth-provider.tsx`
- `src/middleware.ts`

---

#### Task 2.2: Admin Dashboard Layout
Create the admin dashboard shell.

- [ ] Create `src/app/admin/page.tsx` - dashboard home
- [ ] Create `src/components/admin/sidebar.tsx` - navigation
- [ ] Create `src/components/admin/header.tsx` - top bar with logout
- [ ] Add stats cards (total bookings, revenue, upcoming sessions)

**Files to create:**
- `src/app/admin/page.tsx`
- `src/components/admin/sidebar.tsx`
- `src/components/admin/header.tsx`
- `src/components/admin/stats-card.tsx`

---

#### Task 2.3: Program Management
CRUD operations for programs.

- [ ] Create `src/app/admin/programs/page.tsx` - list programs
- [ ] Create `src/app/admin/programs/new/page.tsx` - create program
- [ ] Create `src/app/admin/programs/[id]/page.tsx` - edit program
- [ ] Create `src/app/api/admin/programs/route.ts` - API endpoints
- [ ] Add delete confirmation modal

**Files to create:**
- `src/app/admin/programs/page.tsx`
- `src/app/admin/programs/new/page.tsx`
- `src/app/admin/programs/[id]/page.tsx`
- `src/app/api/admin/programs/route.ts`
- `src/app/api/admin/programs/[id]/route.ts`

---

#### Task 2.4: Session Management
CRUD operations for sessions within programs.

- [ ] Create `src/app/admin/sessions/page.tsx` - list all sessions
- [ ] Create `src/app/admin/programs/[id]/sessions/new/page.tsx` - create session
- [ ] Create `src/app/admin/sessions/[id]/page.tsx` - edit session
- [ ] Create `src/app/api/admin/sessions/route.ts` - API endpoints
- [ ] Show enrolled count, capacity, waitlist status

**Files to create:**
- `src/app/admin/sessions/page.tsx`
- `src/app/admin/programs/[id]/sessions/new/page.tsx`
- `src/app/admin/sessions/[id]/page.tsx`
- `src/app/api/admin/sessions/route.ts`
- `src/app/api/admin/sessions/[id]/route.ts`

---

#### Task 2.5: Booking Management
View and manage bookings.

- [ ] Create `src/app/admin/bookings/page.tsx` - list bookings
- [ ] Create `src/app/admin/bookings/[id]/page.tsx` - booking details
- [ ] Add filters (date range, session, payment status)
- [ ] Add export to CSV functionality
- [ ] Show payment status from Stripe

**Files to create:**
- `src/app/admin/bookings/page.tsx`
- `src/app/admin/bookings/[id]/page.tsx`
- `src/app/api/admin/bookings/route.ts`

---

### Phase 3: Public Sessions Page

#### Task 3.1: Sessions API
Create public API endpoints for fetching sessions.

- [ ] Create `src/app/api/programs/route.ts` - list programs
- [ ] Create `src/app/api/sessions/route.ts` - list sessions with filters
- [ ] Create `src/app/api/sessions/[id]/route.ts` - session details
- [ ] Implement filtering (location, date, age, time)
- [ ] Add availability calculation

**Files to create:**
- `src/app/api/programs/route.ts`
- `src/app/api/sessions/route.ts`
- `src/app/api/sessions/[id]/route.ts`

---

#### Task 3.2: Sessions Page - List View
Create the main sessions page with list view.

- [ ] Create `src/app/sessions/page.tsx` - main page
- [ ] Create `src/components/sessions/program-list.tsx` - program cards
- [ ] Create `src/components/sessions/session-list.tsx` - session cards
- [ ] Create `src/components/sessions/session-card.tsx` - individual card
- [ ] Create `src/components/sessions/filters-sidebar.tsx` - filter panel
- [ ] Add "View more details" modal
- [ ] Show availability badges ("Only X spots left!", "Waitlist Only")

**Files to create:**
- `src/app/sessions/page.tsx`
- `src/components/sessions/program-list.tsx`
- `src/components/sessions/session-list.tsx`
- `src/components/sessions/session-card.tsx`
- `src/components/sessions/session-modal.tsx`
- `src/components/sessions/filters-sidebar.tsx`

---

#### Task 3.3: Sessions Page - Calendar View
Add calendar view toggle.

- [ ] Create `src/components/sessions/calendar-view.tsx` - month calendar
- [ ] Create `src/components/sessions/calendar-day.tsx` - day cell with sessions
- [ ] Add month navigation
- [ ] Add day view option
- [ ] Click date to filter sessions

**Files to create:**
- `src/components/sessions/calendar-view.tsx`
- `src/components/sessions/calendar-day.tsx`

---

#### Task 3.4: Shopping Cart
Implement cart functionality.

- [ ] Create `src/context/cart-context.tsx` - cart state management
- [ ] Create `src/components/sessions/cart-sidebar.tsx` - cart display
- [ ] Create `src/components/sessions/cart-item.tsx` - item in cart
- [ ] Add to cart functionality
- [ ] Remove from cart
- [ ] Persist cart to localStorage
- [ ] Calculate totals

**Files to create:**
- `src/context/cart-context.tsx`
- `src/components/sessions/cart-sidebar.tsx`
- `src/components/sessions/cart-item.tsx`
- `src/components/ui/cart-icon.tsx`

---

### Phase 4: Checkout & Payment

#### Task 4.1: Checkout Page
Create the checkout flow.

- [ ] Create `src/app/checkout/page.tsx` - checkout page
- [ ] Create `src/components/checkout/cart-summary.tsx` - order summary
- [ ] Create `src/components/checkout/participant-form.tsx` - child details
- [ ] Create `src/components/checkout/parent-form.tsx` - parent details
- [ ] Validate all required fields
- [ ] Support multiple children for multi-session bookings

**Files to create:**
- `src/app/checkout/page.tsx`
- `src/components/checkout/cart-summary.tsx`
- `src/components/checkout/participant-form.tsx`
- `src/components/checkout/parent-form.tsx`
- `src/components/checkout/checkout-steps.tsx`

---

#### Task 4.2: Stripe Checkout Integration
Implement payment processing.

- [ ] Create `src/app/api/checkout/create-session/route.ts` - create Stripe session
- [ ] Redirect to Stripe Checkout
- [ ] Create `src/app/checkout/success/page.tsx` - success page
- [ ] Create `src/app/checkout/cancel/page.tsx` - cancel page
- [ ] Handle Stripe webhook for payment confirmation
- [ ] Create booking records in Firestore on success

**Files to create:**
- `src/app/api/checkout/create-session/route.ts`
- `src/app/checkout/success/page.tsx`
- `src/app/checkout/cancel/page.tsx`

---

#### Task 4.3: Booking Confirmation Emails
Send confirmation emails after successful booking.

- [ ] Create email template for booking confirmation
- [ ] Send to parent email
- [ ] Send notification to business owner
- [ ] Include booking reference, session details, what to bring
- [ ] Use existing Resend integration

**Files to modify:**
- `src/app/api/webhooks/stripe/route.ts` (trigger emails)

**Files to create:**
- `src/emails/booking-confirmation.tsx`

---

### Phase 5: Waitlist System

#### Task 5.1: Waitlist Functionality
Implement waitlist for full sessions.

- [ ] Create `src/app/api/waitlist/route.ts` - join waitlist
- [ ] Create `src/components/sessions/waitlist-button.tsx` - join button
- [ ] Store waitlist entries in Firestore
- [ ] Show waitlist position to user
- [ ] Admin view of waitlist in dashboard

**Files to create:**
- `src/app/api/waitlist/route.ts`
- `src/components/sessions/waitlist-button.tsx`
- `src/app/admin/waitlist/page.tsx`

---

#### Task 5.2: Waitlist Notifications
Notify users when spots open.

- [ ] Create function to check waitlist when booking cancelled
- [ ] Send email to next person on waitlist
- [ ] Include link to book with reserved spot
- [ ] Time-limited reservation (24 hours)
- [ ] If not claimed, notify next person

**Files to create:**
- `src/lib/waitlist-notifications.ts`
- `src/emails/waitlist-available.tsx`

---

### Phase 6: Services Integration

#### Task 6.1: Service Page Session Display
Show relevant sessions on each service page.

- [ ] Update each service page to fetch and display sessions
- [ ] Filter sessions by service type
- [ ] Mini session list component for service pages
- [ ] "View all sessions" link to main /sessions page

**Files to modify:**
- `src/app/services/after-school-clubs/page.tsx`
- `src/app/services/group-sessions/page.tsx`
- `src/app/services/half-term-camps/page.tsx`

**Files to create:**
- `src/components/sessions/mini-session-list.tsx`

---

### Phase 7: Polish & Testing

#### Task 7.1: Mobile Responsiveness
Ensure all new pages work on mobile.

- [ ] Test sessions page filters on mobile (slide-out drawer)
- [ ] Test calendar view on mobile
- [ ] Test cart on mobile (full-screen overlay)
- [ ] Test checkout flow on mobile
- [ ] Test admin dashboard on tablet+

---

#### Task 7.2: Error Handling & Edge Cases
Handle errors gracefully.

- [ ] Payment failure handling
- [ ] Session sold out during checkout
- [ ] Network error states
- [ ] Loading states throughout
- [ ] Empty states (no sessions match filters)

---

#### Task 7.3: Testing
Create test data and verify flows.

- [ ] Create sample programs and sessions in Firebase
- [ ] Test complete booking flow (test mode Stripe)
- [ ] Test waitlist flow
- [ ] Test admin CRUD operations
- [ ] Test email delivery

---

## Success Criteria

### Automated Verification:
- [ ] `npm run build` completes without errors
- [ ] `npm run lint` passes
- [ ] Stripe webhook signature verified
- [ ] Firebase security rules deployed

### Manual Verification:
- [ ] Can create program and sessions in admin
- [ ] Sessions display with correct filters
- [ ] Calendar view shows sessions on correct dates
- [ ] Can add multiple sessions to cart
- [ ] Checkout with Stripe works (test mode)
- [ ] Booking confirmation email received
- [ ] Waitlist join and notification works
- [ ] Services pages show relevant sessions

## Risks (Pre-Mortem)

### Tigers:
- **Stripe webhook reliability** (HIGH)
  - Mitigation: Implement idempotency, retry logic, manual reconciliation in admin

- **Firebase costs if traffic spikes** (MEDIUM)
  - Mitigation: Implement caching, monitor usage, set budget alerts

### Elephants:
- **Complexity of full feature parity** (HIGH)
  - Note: This is a significant build. Consider phased rollout.

- **Migration from Active.com** (MEDIUM)
  - Note: Need to coordinate cutover, potentially run both systems briefly

## Out of Scope (for this phase)
- Recurring/subscription payments
- Discount codes / promo codes
- Multiple currencies
- Refund processing (manual via Stripe dashboard)
- Native mobile app
- SMS notifications

## Implementation Order

**Phase 1** (Foundation): Tasks 1.1 → 1.2 → 1.3
**Phase 2** (Admin): Tasks 2.1 → 2.2 → 2.3 → 2.4 → 2.5
**Phase 3** (Public): Tasks 3.1 → 3.2 → 3.3 → 3.4
**Phase 4** (Checkout): Tasks 4.1 → 4.2 → 4.3
**Phase 5** (Waitlist): Tasks 5.1 → 5.2
**Phase 6** (Integration): Task 6.1
**Phase 7** (Polish): Tasks 7.1 → 7.2 → 7.3

## Estimated Effort
- Phase 1: Foundation setup
- Phase 2: Admin dashboard (largest phase)
- Phase 3: Public sessions page
- Phase 4: Checkout flow
- Phase 5: Waitlist system
- Phase 6: Services integration
- Phase 7: Polish and testing

---

## Dependencies

This plan depends on:
1. `PLAN-services-dropdown.md` being completed first
2. Firebase project created and configured
3. Stripe account created and configured
4. Domain verified for Stripe (for live payments)
