# TTNTS121 Feature Expansion Implementation Plan

**Generated:** 2026-01-28
**Status:** Master Plan
**Based on:** CCM Documentation Extraction (Phases 1-6)

---

## Executive Summary

This plan outlines a comprehensive feature expansion for TTNTS121, prioritized by business value and implementation complexity. The features are derived from gap analysis against ACTIVE Network's Camp & Class Manager (CCM) system.

**Current State:**
- Next.js 14 App Router with TypeScript
- Firebase/Firestore database
- Stripe payment integration (working)
- Resend email integration (working)
- Admin dashboard with Apple-esque design
- Cart-based session booking flow

**Target State:**
- Customer self-service portal with authentication
- Full attendance tracking system
- Multiple payment options (card, cash, payment links)
- Coupon/discount system
- Export and reporting capabilities
- Custom registration forms

---

## Table of Contents

1. [Priority Matrix](#priority-matrix)
2. [Phase 1: Foundation](#phase-1-foundation-weeks-1-4)
3. [Phase 2: Self-Service](#phase-2-self-service-weeks-5-8)
4. [Phase 3: Operations](#phase-3-operations-weeks-9-12)
5. [Phase 4: Financial](#phase-4-financial-weeks-13-16)
6. [Phase 5: Enhanced](#phase-5-enhanced-weeks-17-20)
7. [Phase 6: Advanced](#phase-6-advanced-weeks-21-24)
8. [Database Schema Changes](#database-schema-changes)
9. [API Routes Summary](#api-routes-summary)
10. [Dependencies & Order](#dependencies--order)

---

## Priority Matrix

### Critical (Must Have)

| Feature | Business Impact | Technical Complexity |
|---------|-----------------|---------------------|
| Customer Portal | Reduces admin burden by 60%+ | HIGH |
| User Authentication | Enables all self-service | HIGH |
| Multiple Payment Methods | Cash + payment links | MEDIUM |
| Self-Cancellation | Customer flexibility | MEDIUM |
| Attendance Tracking | Core operational need | MEDIUM |
| Data Export (CSV) | Essential for reporting | LOW |

### High Priority

| Feature | Business Impact | Technical Complexity |
|---------|-----------------|---------------------|
| Self-Transfer | Session flexibility | MEDIUM |
| Coupon Codes | Marketing capability | MEDIUM |
| Cart Abandonment | Revenue recovery | MEDIUM |
| QR Code Check-in | Streamlined attendance | LOW |
| Guardian Checkbox | Legal compliance | LOW |

### Medium Priority

| Feature | Business Impact | Technical Complexity |
|---------|-----------------|---------------------|
| Custom Forms | Data collection | HIGH |
| Deposits | Reduces no-shows | MEDIUM |
| Payment Plans | Accessibility | HIGH |
| Multi-person Discount | Sibling pricing | LOW |
| Secondary Parent | Emergency contacts | LOW |

---

## Phase 1: Foundation (Weeks 1-4)

### 1.1 User Authentication System

**Goal:** Enable customer accounts with email/password authentication

**Database Schema:**
```typescript
// New collection: users
interface User {
  id: string;                    // Firebase Auth UID
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'customer' | 'admin' | 'coach';
  // Children linked to this account
  children: {
    id: string;
    firstName: string;
    lastName: string;
    dob: Timestamp;
    medicalConditions?: string;
  }[];
  // Preferences
  marketingConsent: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Files to Create:**
| File | Purpose |
|------|---------|
| `src/lib/auth.ts` | Firebase Auth wrapper functions |
| `src/contexts/auth-context.tsx` | React context for auth state |
| `src/app/(auth)/login/page.tsx` | Customer login page |
| `src/app/(auth)/register/page.tsx` | Customer registration page |
| `src/app/(auth)/forgot-password/page.tsx` | Password reset request |
| `src/app/(auth)/reset-password/page.tsx` | Password reset form |
| `src/middleware.ts` | Route protection middleware |
| `src/app/api/auth/register/route.ts` | Registration API |
| `src/app/api/auth/verify-email/route.ts` | Email verification |

**API Routes:**
```
POST /api/auth/register
  - Create Firebase Auth user
  - Create Firestore user document
  - Send verification email

POST /api/auth/verify-email
  - Verify email token
  - Update user verified status

POST /api/auth/forgot-password
  - Send password reset email via Firebase

POST /api/auth/reset-password
  - Complete password reset
```

**UI Components:**
| Component | Location |
|-----------|----------|
| `AuthForm` | `src/components/auth/auth-form.tsx` |
| `LoginForm` | `src/components/auth/login-form.tsx` |
| `RegisterForm` | `src/components/auth/register-form.tsx` |
| `PasswordResetForm` | `src/components/auth/password-reset-form.tsx` |

**Acceptance Criteria:**
- [ ] Customers can register with email/password
- [ ] Customers can log in
- [ ] Customers can reset password
- [ ] Email verification flow works
- [ ] Auth state persists across page refresh
- [ ] Protected routes redirect to login

---

### 1.2 Customer Portal MVP

**Goal:** Customers can view their bookings and account details

**Files to Create:**
| File | Purpose |
|------|---------|
| `src/app/account/page.tsx` | Account dashboard |
| `src/app/account/bookings/page.tsx` | Bookings list |
| `src/app/account/bookings/[id]/page.tsx` | Booking detail |
| `src/app/account/profile/page.tsx` | Profile settings |
| `src/app/account/children/page.tsx` | Manage children |
| `src/app/account/layout.tsx` | Account layout with nav |
| `src/components/account/account-nav.tsx` | Account navigation |
| `src/components/account/booking-card.tsx` | Booking summary card |

**API Routes:**
```
GET /api/account/bookings
  - Fetch user's bookings
  - Filter by status (upcoming, past, cancelled)

GET /api/account/bookings/[id]
  - Fetch single booking details

PUT /api/account/profile
  - Update user profile

GET /api/account/children
  - List children on account

POST /api/account/children
  - Add child to account

PUT /api/account/children/[id]
  - Update child details
```

**UI Layout:**
```
/account
├── Dashboard (upcoming sessions, quick actions)
├── /bookings - All bookings with filters
│   └── /[id] - Booking detail with actions
├── /profile - Update email, phone, password
└── /children - Manage registered children
```

**Acceptance Criteria:**
- [ ] Dashboard shows upcoming sessions
- [ ] Users can view booking history
- [ ] Users can view booking details
- [ ] Users can update profile
- [ ] Users can manage children

---

### 1.3 Multiple Payment Methods

**Goal:** Support cash payments and bespoke payment links alongside Stripe

**Database Schema Updates:**
```typescript
// Update Booking interface
interface Booking {
  // ... existing fields
  paymentMethod: 'stripe' | 'cash' | 'payment_link' | 'free';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded' | 'expired' | 'awaiting_payment';
  // For cash payments
  cashPaidAt?: Timestamp;
  cashPaidTo?: string;           // Admin who recorded it
  cashNotes?: string;
  // For payment links
  paymentLinkId?: string;
  paymentLinkUrl?: string;
  paymentLinkExpiresAt?: Timestamp;
}

// New collection: payment_links
interface PaymentLink {
  id: string;
  bookingId: string;
  amount: number;                // in pence
  stripePaymentLinkId: string;
  stripePaymentLinkUrl: string;
  description: string;
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  createdBy: string;             // Admin UID
  createdAt: Timestamp;
  expiresAt?: Timestamp;
  completedAt?: Timestamp;
}
```

**Files to Create:**
| File | Purpose |
|------|---------|
| `src/app/api/admin/bookings/[id]/mark-cash-paid/route.ts` | Mark as cash paid |
| `src/app/api/admin/payment-links/route.ts` | Create payment link |
| `src/app/api/admin/payment-links/[id]/route.ts` | Get/cancel payment link |
| `src/components/admin/payment-method-selector.tsx` | Payment method UI |
| `src/components/admin/cash-payment-modal.tsx` | Cash payment form |
| `src/components/admin/payment-link-modal.tsx` | Payment link generator |

**API Routes:**
```
POST /api/admin/bookings/[id]/mark-cash-paid
  Body: { amount, notes }
  - Update booking paymentStatus to 'paid'
  - Record cash payment details
  - Update session enrolled count

POST /api/admin/payment-links
  Body: { bookingId, amount, description, expiresAt? }
  - Create Stripe Payment Link
  - Store in payment_links collection
  - Send email to customer

GET /api/admin/payment-links/[id]
  - Get payment link details

DELETE /api/admin/payment-links/[id]
  - Cancel/expire payment link

GET /api/admin/bookings/[id]/payment-links
  - List all payment links for a booking
```

**Stripe Dashboard Integration:**
- Use Stripe Payment Links API for custom amounts
- Payment links can be generated with arbitrary amounts
- Links are tracked in Firestore for reconciliation
- Stripe webhook handles completion: `payment_link.completed`

**Admin UI Enhancements:**

Add to `src/app/admin/bookings/[id]/page.tsx`:
```
Payment Actions:
├── [Mark as Cash Paid] - Opens cash payment modal
├── [Create Payment Link] - Opens payment link modal
└── [Resend Payment Link] - If link exists
```

**Email Templates:**
| Template | Trigger |
|----------|---------|
| `paymentLinkEmail` | When payment link created |
| `paymentLinkReminderEmail` | 24h before expiry |
| `cashPaymentReceiptEmail` | When cash payment recorded |

**Acceptance Criteria:**
- [ ] Admin can mark booking as cash paid
- [ ] Admin can generate payment link with custom amount
- [ ] Payment link email sent to customer
- [ ] Stripe webhook handles payment link completion
- [ ] Booking updates when payment link paid
- [ ] Payment links can be cancelled/expired

---

### 1.4 Guardian Declaration Checkbox

**Goal:** Legal compliance for minor registrations

**Files to Modify:**
| File | Change |
|------|--------|
| `src/types/booking.ts` | Add `guardianDeclaration` field |
| `src/app/checkout/page.tsx` | Add checkbox to form |
| `src/components/checkout/checkout-form.tsx` | Render checkbox |
| `src/app/api/checkout/route.ts` | Validate checkbox required |

**Booking Schema Update:**
```typescript
interface Booking {
  // ... existing fields
  guardianDeclaration: boolean;  // Required for all bookings
  guardianDeclarationAt: Timestamp;
}
```

**Checkbox Text:**
```
[] I confirm that I am the parent or legal guardian of the child(ren)
   named above and have the authority to register them for this session.
```

**Acceptance Criteria:**
- [ ] Checkbox appears on checkout
- [ ] Checkbox is required to proceed
- [ ] Declaration timestamp stored
- [ ] Visible in booking details

---

## Phase 2: Self-Service (Weeks 5-8)

### 2.1 Self-Cancellation with Refund Rules

**Goal:** Customers can cancel bookings with configurable refund policy

**Database Schema:**
```typescript
// New collection: refund_policies
interface RefundPolicy {
  id: string;
  name: string;
  rules: {
    daysBeforeSession: number;   // Days before session start
    refundPercent: number;       // 100 = full, 50 = half, 0 = none
  }[];
  isDefault: boolean;
  createdAt: Timestamp;
}

// Example policy
{
  name: "Standard Policy",
  rules: [
    { daysBeforeSession: 14, refundPercent: 100 },  // 14+ days = full refund
    { daysBeforeSession: 7, refundPercent: 50 },    // 7-13 days = 50%
    { daysBeforeSession: 0, refundPercent: 0 }      // <7 days = no refund
  ]
}

// Update Booking
interface Booking {
  // ... existing
  cancelledAt?: Timestamp;
  cancelledBy?: 'customer' | 'admin';
  cancellationReason?: string;
  refundAmount?: number;
  refundPolicyApplied?: string;  // Policy ID
}
```

**Files to Create:**
| File | Purpose |
|------|---------|
| `src/app/account/bookings/[id]/cancel/page.tsx` | Cancel confirmation |
| `src/app/api/account/bookings/[id]/cancel/route.ts` | Process cancellation |
| `src/app/admin/settings/refund-policies/page.tsx` | Manage policies |
| `src/app/api/admin/refund-policies/route.ts` | CRUD for policies |
| `src/lib/refund-calculator.ts` | Calculate refund amount |
| `src/components/account/cancel-booking-modal.tsx` | Confirmation modal |

**API Routes:**
```
POST /api/account/bookings/[id]/cancel
  Body: { reason? }
  - Check cancellation eligibility
  - Calculate refund based on policy
  - Process Stripe refund
  - Update booking status
  - Send confirmation email
  - Update session enrolled count

GET /api/account/bookings/[id]/cancellation-preview
  - Return refund amount without processing
  - Show policy explanation

GET /api/admin/refund-policies
POST /api/admin/refund-policies
PUT /api/admin/refund-policies/[id]
DELETE /api/admin/refund-policies/[id]
```

**Cancellation Flow:**
```
1. Customer clicks "Cancel Booking"
2. System checks:
   - Is session in future?
   - Is booking cancellable?
3. Show cancellation preview:
   - Days until session
   - Applicable policy
   - Refund amount
4. Customer confirms
5. System processes:
   - Stripe refund (if applicable)
   - Update booking status
   - Decrement enrolled count
   - Send email
```

**Email Templates:**
| Template | Content |
|----------|---------|
| `cancellationConfirmationEmail` | Booking cancelled, refund details |
| `cancellationRequestEmail` | Admin notification |

**Acceptance Criteria:**
- [ ] Customer can initiate cancellation
- [ ] Refund amount calculated per policy
- [ ] Stripe refund processed automatically
- [ ] Session availability updates
- [ ] Email confirmations sent
- [ ] Admin can configure policies

---

### 2.2 Self-Transfer Between Sessions

**Goal:** Customers can move to different session in same program

**Files to Create:**
| File | Purpose |
|------|---------|
| `src/app/account/bookings/[id]/transfer/page.tsx` | Transfer wizard |
| `src/app/api/account/bookings/[id]/transfer/route.ts` | Process transfer |
| `src/app/api/account/bookings/[id]/transfer-options/route.ts` | Available sessions |
| `src/components/account/transfer-session-picker.tsx` | Session selector |

**API Routes:**
```
GET /api/account/bookings/[id]/transfer-options
  - Return sessions in same program
  - Filter: has capacity, is active, in future
  - Include price difference

POST /api/account/bookings/[id]/transfer
  Body: { newSessionId }
  - Validate session has capacity
  - Calculate price difference
  - If upgrade: create payment
  - If downgrade: issue credit/refund
  - Update booking
  - Update both session counts
  - Send confirmation
```

**Transfer Rules:**
1. Same program only (e.g., cannot transfer from After School to Half Term)
2. Must have capacity in target session
3. Price difference handled:
   - Upgrade: Payment required (Stripe checkout or payment link)
   - Downgrade: Credit balance or partial refund
   - Same price: Instant transfer
4. One transfer per booking (configurable)

**Acceptance Criteria:**
- [ ] Customer sees available transfer options
- [ ] Price difference clearly shown
- [ ] Upgrade triggers payment flow
- [ ] Downgrade issues refund/credit
- [ ] Both sessions update correctly
- [ ] Email confirmations sent

---

### 2.3 Cart Abandonment Recovery

**Goal:** Recover lost revenue from incomplete checkouts

**Database Schema:**
```typescript
// New collection: abandoned_carts
interface AbandonedCart {
  id: string;
  email: string;
  cartItems: {
    sessionId: string;
    sessionName: string;
    programName: string;
    price: number;
  }[];
  totalAmount: number;
  checkoutStartedAt: Timestamp;
  abandonedAt: Timestamp;
  recoveryEmailSentAt?: Timestamp;
  recoveryEmailCount: number;
  convertedAt?: Timestamp;
  bookingId?: string;  // If converted
}
```

**Files to Create:**
| File | Purpose |
|------|---------|
| `src/app/api/cart/track-abandonment/route.ts` | Track when email entered |
| `src/app/api/cron/cart-abandonment/route.ts` | Process abandoned carts |
| `src/app/admin/reports/cart-abandonment/page.tsx` | Abandonment report |
| `src/lib/email-templates/cart-abandoned.ts` | Recovery email |

**Tracking Flow:**
```
1. Customer enters email in checkout form
2. Frontend calls /api/cart/track-abandonment
3. If checkout not completed in 30 min:
   - Mark cart as abandoned
4. Cron job runs every 30 minutes:
   - Find abandoned carts > 1 hour old
   - Send recovery email (up to 2 per cart)
5. If customer completes checkout:
   - Mark cart as converted
```

**API Routes:**
```
POST /api/cart/track-abandonment
  Body: { email, cartItems, totalAmount }
  - Store cart snapshot
  - Called when email field filled

GET /api/cron/cart-abandonment
  - Vercel cron (every 30 min)
  - Find abandoned carts
  - Send recovery emails
  - Limit: 2 emails per cart

GET /api/admin/reports/cart-abandonment
  - Stats: abandoned count, recovery rate
  - List recent abandoned carts
```

**Recovery Email Content:**
- "Did you forget something?"
- Cart items with images
- Direct "Complete Booking" link
- Urgency: "Spots are filling fast"

**Acceptance Criteria:**
- [ ] Carts tracked when email entered
- [ ] Recovery email sent after 1 hour
- [ ] Max 2 recovery emails per cart
- [ ] Admin can view abandonment report
- [ ] Conversion tracking works

---

### 2.4 QR Code Generation

**Goal:** Generate QR codes for check-in at sessions

**Files to Create:**
| File | Purpose |
|------|---------|
| `src/lib/qr-code.ts` | QR generation using `qrcode` package |
| `src/app/api/bookings/[id]/qr-code/route.ts` | Generate QR image |
| `src/components/account/qr-code-display.tsx` | QR display component |

**QR Code Content:**
```
https://ttnts121.com/checkin?booking={bookingRef}&token={secureToken}

Token: SHA256(bookingRef + secretKey)
```

**API Routes:**
```
GET /api/bookings/[id]/qr-code
  - Generate QR code PNG
  - Secured with booking-specific token
  - Cache for performance

GET /api/checkin
  Query: { booking, token }
  - Validate token
  - Return booking details for check-in
```

**Integration Points:**
- Confirmation email includes QR code
- Customer portal shows QR code
- QR code links to check-in endpoint

**Acceptance Criteria:**
- [ ] QR code generated for each booking
- [ ] QR code in confirmation email
- [ ] QR code visible in customer portal
- [ ] QR code validates on scan

---

## Phase 3: Operations (Weeks 9-12)

### 3.1 Attendance Tracking System

**Goal:** Record check-in/out for sessions with reporting

**Database Schema:**
```typescript
// New collection: attendance
interface AttendanceRecord {
  id: string;
  bookingId: string;
  sessionId: string;
  childId?: string;              // From user.children
  sessionDate: Timestamp;        // Specific occurrence date
  // Check-in
  checkedInAt?: Timestamp;
  checkedInBy?: string;          // Coach UID or 'self'
  checkedInMethod: 'manual' | 'qr' | 'self';
  // Check-out
  checkedOutAt?: Timestamp;
  checkedOutBy?: string;
  // Notes
  notes?: string;
  status: 'absent' | 'present' | 'late' | 'left_early';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// New collection: session_occurrences
// For recurring sessions, track each occurrence
interface SessionOccurrence {
  id: string;
  sessionId: string;
  date: Timestamp;               // Specific date
  status: 'scheduled' | 'cancelled' | 'completed';
  notes?: string;
  weather?: string;
  createdAt: Timestamp;
}
```

**Files to Create:**
| File | Purpose |
|------|---------|
| `src/app/admin/attendance/page.tsx` | Attendance dashboard |
| `src/app/admin/attendance/[sessionId]/page.tsx` | Session attendance |
| `src/app/admin/attendance/[sessionId]/[date]/page.tsx` | Date-specific |
| `src/app/api/admin/attendance/route.ts` | CRUD attendance |
| `src/app/api/admin/attendance/checkin/route.ts` | Check-in endpoint |
| `src/app/api/admin/attendance/checkout/route.ts` | Check-out endpoint |
| `src/app/api/admin/attendance/bulk/route.ts` | Bulk check-in |
| `src/components/admin/attendance/attendance-sheet.tsx` | Main UI |
| `src/components/admin/attendance/checkin-button.tsx` | Toggle check-in |
| `src/components/admin/attendance/qr-scanner.tsx` | QR scanner modal |

**API Routes:**
```
GET /api/admin/attendance
  Query: { sessionId, date }
  - List all bookings for session
  - Include attendance status for date

POST /api/admin/attendance/checkin
  Body: { bookingId, sessionDate, method }
  - Record check-in
  - Create attendance record

POST /api/admin/attendance/checkout
  Body: { attendanceId }
  - Record check-out time

POST /api/admin/attendance/bulk
  Body: { bookingIds[], sessionDate, action: 'checkin' | 'checkout' }
  - Bulk update attendance

GET /api/admin/attendance/qr
  Query: { token }
  - Validate QR and return booking details
  - Used by scanner
```

**Attendance UI:**
```
/admin/attendance
├── Today's Sessions (cards)
├── /[sessionId]
│   ├── Calendar view of occurrences
│   └── /[date]
│       ├── Participant list
│       ├── Check-in toggles
│       ├── QR scanner button
│       └── Mark all present
```

**Reports Integration:**
| Report | Data |
|--------|------|
| Daily Attendance | Who attended today |
| Participant Attendance | History per child |
| Session Attendance | % attendance over time |

**Acceptance Criteria:**
- [ ] Admin can view sessions by date
- [ ] Admin can check-in participants
- [ ] Admin can check-out participants
- [ ] QR code scanning works
- [ ] Bulk check-in available
- [ ] Attendance reports generated

---

### 3.2 Data Export (CSV/Excel)

**Goal:** Export booking and attendance data for external use

**Files to Create:**
| File | Purpose |
|------|---------|
| `src/lib/export.ts` | Export utilities |
| `src/app/api/admin/export/bookings/route.ts` | Export bookings |
| `src/app/api/admin/export/attendance/route.ts` | Export attendance |
| `src/components/admin/export-button.tsx` | Export UI component |

**API Routes:**
```
GET /api/admin/export/bookings
  Query: { format: 'csv' | 'xlsx', sessionId?, programId?, dateRange? }
  - Generate export file
  - Return download URL

GET /api/admin/export/attendance
  Query: { format: 'csv' | 'xlsx', sessionId, dateRange }
  - Generate attendance export
```

**Export Columns (Bookings):**
```
Booking Ref, Session, Program, Child Name, Child DOB,
Parent Name, Parent Email, Parent Phone, Emergency Contact,
Amount, Payment Status, Payment Method, Booked At
```

**Export Columns (Attendance):**
```
Date, Session, Child Name, Parent Name, Check-in Time,
Check-out Time, Status, Notes
```

**Dependencies:**
- `xlsx` package for Excel generation
- `papaparse` for CSV (or native)

**Acceptance Criteria:**
- [ ] Export buttons on relevant pages
- [ ] CSV export works
- [ ] Excel export works
- [ ] Date range filtering
- [ ] Session/program filtering
- [ ] Large exports handled (streaming)

---

### 3.3 Coach Role & Session Access

**Goal:** Coaches can access attendance for assigned sessions only

**Database Schema Updates:**
```typescript
// Update User
interface User {
  // ... existing
  role: 'customer' | 'admin' | 'coach';
  // For coaches only
  assignedSessions?: string[];   // Session IDs they can access
  assignedPrograms?: string[];   // Or entire programs
}

// Update Session
interface Session {
  // ... existing
  coaches?: string[];            // User IDs assigned as coaches
}
```

**Files to Create:**
| File | Purpose |
|------|---------|
| `src/app/coach/page.tsx` | Coach dashboard |
| `src/app/coach/attendance/[id]/page.tsx` | Session attendance |
| `src/app/api/coach/sessions/route.ts` | Coach's sessions |
| `src/app/api/coach/attendance/route.ts` | Attendance API |
| `src/middleware.ts` | Update for coach routes |

**Coach Portal:**
```
/coach
├── Dashboard (today's sessions)
└── /attendance/[sessionId]
    └── Check-in/out UI (read/write)
```

**Admin Features:**
- Assign coaches to sessions
- Manage coach accounts
- View coach activity

**Acceptance Criteria:**
- [ ] Coach can log in
- [ ] Coach sees only assigned sessions
- [ ] Coach can check-in participants
- [ ] Coach cannot access other admin features
- [ ] Admin can assign/remove coaches

---

## Phase 4: Financial (Weeks 13-16)

### 4.1 Coupon/Discount Code System

**Goal:** Marketing promotions with discount codes

**Database Schema:**
```typescript
// New collection: coupons
interface Coupon {
  id: string;
  code: string;                  // Uppercase, unique
  name: string;                  // Internal name
  description?: string;
  // Discount type
  type: 'percentage' | 'fixed_amount';
  value: number;                 // Percent (0-100) or pence
  // Restrictions
  minPurchase?: number;          // Minimum cart total (pence)
  maxDiscount?: number;          // Maximum discount (pence)
  applicableSessions?: string[]; // Specific sessions
  applicablePrograms?: string[]; // Specific programs
  // Limits
  usageLimit?: number;           // Total uses allowed
  usageCount: number;            // Current uses
  usagePerCustomer?: number;     // Per email limit
  // Validity
  validFrom: Timestamp;
  validUntil: Timestamp;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// New collection: coupon_uses
interface CouponUse {
  id: string;
  couponId: string;
  bookingId: string;
  customerEmail: string;
  discountAmount: number;
  usedAt: Timestamp;
}

// Update Booking
interface Booking {
  // ... existing
  couponCode?: string;
  couponId?: string;
  discountAmount?: number;
}
```

**Files to Create:**
| File | Purpose |
|------|---------|
| `src/app/admin/coupons/page.tsx` | Coupon list |
| `src/app/admin/coupons/new/page.tsx` | Create coupon |
| `src/app/admin/coupons/[id]/page.tsx` | Edit coupon |
| `src/app/api/admin/coupons/route.ts` | CRUD coupons |
| `src/app/api/checkout/validate-coupon/route.ts` | Validate coupon |
| `src/components/checkout/coupon-input.tsx` | Coupon field |
| `src/lib/coupon-validator.ts` | Validation logic |

**API Routes:**
```
GET /api/admin/coupons
POST /api/admin/coupons
PUT /api/admin/coupons/[id]
DELETE /api/admin/coupons/[id]

POST /api/checkout/validate-coupon
  Body: { code, cartItems, customerEmail }
  Response: { valid, discount, message }
```

**Validation Rules:**
1. Code exists and is active
2. Within valid date range
3. Usage limit not reached
4. Per-customer limit not reached
5. Min purchase met
6. Applicable to cart items

**Checkout Integration:**
1. Customer enters code
2. Frontend validates via API
3. Discount applied to cart
4. Discount persisted to booking
5. Coupon usage recorded

**Acceptance Criteria:**
- [ ] Admin can create coupons
- [ ] Percentage and fixed discounts work
- [ ] Usage limits enforced
- [ ] Date restrictions work
- [ ] Session/program restrictions work
- [ ] Coupon applies at checkout
- [ ] Usage tracked per booking

---

### 4.2 Multi-Person (Sibling) Discount

**Goal:** Automatic discount for multiple children in same order

**Database Schema:**
```typescript
// New collection: discount_rules
interface DiscountRule {
  id: string;
  name: string;
  type: 'multi_person' | 'multi_session' | 'early_bird';
  // For multi_person
  tiers?: {
    quantity: number;           // e.g., 2 = second child
    discountPercent: number;    // e.g., 10 = 10% off
  }[];
  // Applicability
  applicablePrograms?: string[];
  isActive: boolean;
  createdAt: Timestamp;
}

// Example: Sibling Discount
{
  name: "Sibling Discount",
  type: "multi_person",
  tiers: [
    { quantity: 2, discountPercent: 10 },   // 2nd child: 10% off
    { quantity: 3, discountPercent: 15 },   // 3rd child: 15% off
    { quantity: 4, discountPercent: 20 },   // 4th+: 20% off
  ]
}
```

**Implementation:**
- Discount calculated at checkout based on cart items
- Applied to lower-priced items first
- Stacks with coupon codes (configurable)
- Shown as line item in checkout

**Files to Create:**
| File | Purpose |
|------|---------|
| `src/app/admin/discounts/page.tsx` | Discount rules |
| `src/lib/discount-calculator.ts` | Calculate discounts |
| `src/components/checkout/order-summary.tsx` | Show discounts |

**Acceptance Criteria:**
- [ ] Admin can configure sibling discount tiers
- [ ] Discount auto-applies at checkout
- [ ] Discount shown in order summary
- [ ] Works with multiple sessions per child

---

### 4.3 Deposits & Partial Payments

**Goal:** Allow deposits instead of full payment

**Database Schema:**
```typescript
// Update Session
interface Session {
  // ... existing
  depositEnabled: boolean;
  depositAmount?: number;        // Fixed amount in pence
  depositPercent?: number;       // Or percentage of price
  balanceDueDate?: Timestamp;    // When remaining balance due
}

// Update Booking
interface Booking {
  // ... existing
  depositPaid?: number;
  depositPaidAt?: Timestamp;
  balanceRemaining?: number;
  balanceDueAt?: Timestamp;
  balancePaidAt?: Timestamp;
}
```

**Checkout Flow:**
1. If session has deposit enabled:
   - Show payment option: "Pay Deposit" vs "Pay in Full"
   - Deposit amount shown clearly
2. Customer selects deposit
3. Stripe checkout for deposit amount
4. Balance reminder email before due date
5. Customer pays balance via portal

**Files to Create:**
| File | Purpose |
|------|---------|
| `src/app/account/bookings/[id]/pay-balance/page.tsx` | Pay remaining |
| `src/app/api/cron/balance-reminders/route.ts` | Reminder emails |
| `src/components/checkout/payment-option-selector.tsx` | Deposit vs full |

**API Routes:**
```
POST /api/account/bookings/[id]/pay-balance
  - Create Stripe checkout for remaining balance
  - Update booking on completion

GET /api/cron/balance-reminders
  - Find bookings with balances due soon
  - Send reminder emails
```

**Acceptance Criteria:**
- [ ] Admin can enable deposits per session
- [ ] Customer can choose deposit at checkout
- [ ] Balance tracking works
- [ ] Reminder emails sent
- [ ] Customer can pay balance via portal

---

## Phase 5: Enhanced (Weeks 17-20)

### 5.1 Custom Registration Forms

**Goal:** Configurable questions per session/program

**Database Schema:**
```typescript
// New collection: form_templates
interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  questions: FormQuestion[];
  isDefault: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface FormQuestion {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' |
        'checkbox' | 'radio' | 'date' | 'number' | 'email' | 'phone';
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: string[];            // For select/radio/multiselect
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  order: number;
}

// Update Session
interface Session {
  // ... existing
  formTemplateId?: string;       // Custom form for this session
}

// New collection: form_responses
interface FormResponse {
  id: string;
  bookingId: string;
  formTemplateId: string;
  answers: {
    questionId: string;
    value: string | string[] | boolean | number;
  }[];
  submittedAt: Timestamp;
}
```

**Files to Create:**
| File | Purpose |
|------|---------|
| `src/app/admin/forms/page.tsx` | Form templates list |
| `src/app/admin/forms/new/page.tsx` | Create form |
| `src/app/admin/forms/[id]/page.tsx` | Edit form |
| `src/app/api/admin/forms/route.ts` | CRUD forms |
| `src/components/admin/form-builder/form-builder.tsx` | Drag-drop builder |
| `src/components/admin/form-builder/question-editor.tsx` | Question config |
| `src/components/checkout/custom-form.tsx` | Render form at checkout |
| `src/lib/form-renderer.ts` | Dynamic form rendering |

**Form Builder Features:**
- Drag-and-drop question ordering
- Question type selection
- Required/optional toggle
- Validation rules
- Preview mode

**Checkout Integration:**
1. If session has custom form, show after basic info
2. Validate all required fields
3. Store responses in form_responses
4. Link to booking

**Acceptance Criteria:**
- [ ] Admin can create form templates
- [ ] Multiple question types supported
- [ ] Forms assigned to sessions
- [ ] Forms rendered at checkout
- [ ] Responses stored and viewable
- [ ] Export includes custom fields

---

### 5.2 Electronic Waivers

**Goal:** Digital signature capture for liability waivers

**Database Schema:**
```typescript
// New collection: waiver_templates
interface WaiverTemplate {
  id: string;
  name: string;
  content: string;               // Rich text / HTML
  version: number;
  isActive: boolean;
  createdAt: Timestamp;
}

// New collection: waiver_signatures
interface WaiverSignature {
  id: string;
  waiverId: string;
  waiverVersion: number;
  bookingId: string;
  signedBy: string;              // Parent name
  signedByEmail: string;
  signatureData: string;         // Base64 canvas data
  signedAt: Timestamp;
  ipAddress: string;
}

// Update Session
interface Session {
  // ... existing
  requiresWaiver: boolean;
  waiverId?: string;
}
```

**Files to Create:**
| File | Purpose |
|------|---------|
| `src/app/admin/waivers/page.tsx` | Waiver list |
| `src/app/admin/waivers/new/page.tsx` | Create waiver |
| `src/app/admin/waivers/[id]/page.tsx` | Edit waiver |
| `src/app/api/admin/waivers/route.ts` | CRUD waivers |
| `src/components/checkout/waiver-signature.tsx` | Signature capture |
| `src/components/admin/signature-canvas.tsx` | Canvas component |

**Signature Capture:**
- Canvas-based signature drawing
- Touch support for mobile
- "Clear" and "Accept" buttons
- Stored as base64 PNG

**Checkout Flow:**
1. If session requires waiver:
   - Show waiver content (scrollable)
   - Checkbox: "I have read and agree"
   - Signature canvas
2. Store signature data
3. Generate PDF receipt (optional)

**Acceptance Criteria:**
- [ ] Admin can create waiver templates
- [ ] Waivers assigned to sessions
- [ ] Signature canvas works on desktop/mobile
- [ ] Signatures stored securely
- [ ] Admin can view signed waivers
- [ ] Waiver content versioned

---

### 5.3 Secondary Parent/Guardian

**Goal:** Capture emergency contact as second guardian

**Database Schema Updates:**
```typescript
// Update Booking
interface Booking {
  // ... existing
  secondaryParent?: {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    relationship: string;        // "Father", "Mother", "Guardian", etc.
    receiveEmails: boolean;
  };
}

// Update User.children
interface Child {
  // ... existing
  authorizedPickups?: {
    name: string;
    phone: string;
    relationship: string;
  }[];
}
```

**Files to Modify:**
| File | Change |
|------|--------|
| `src/app/checkout/page.tsx` | Add secondary parent section |
| `src/components/checkout/checkout-form.tsx` | Fields for secondary |
| `src/app/account/children/[id]/page.tsx` | Authorized pickups |
| `src/lib/email-templates.ts` | CC secondary parent option |

**Acceptance Criteria:**
- [ ] Secondary parent captured at checkout
- [ ] Email field optional
- [ ] Authorized pickups manageable in portal
- [ ] Secondary parent can receive emails (opt-in)

---

## Phase 6: Advanced (Weeks 21-24)

### 6.1 Payment Plans / Installments

**Goal:** Split payment over multiple installments

**Database Schema:**
```typescript
// New collection: payment_plans
interface PaymentPlan {
  id: string;
  name: string;
  installments: number;          // 2, 3, 4, etc.
  schedule: 'weekly' | 'biweekly' | 'monthly';
  // First payment
  firstPaymentPercent: number;   // e.g., 50 = 50% upfront
  // Applicability
  minAmount?: number;            // Minimum order total
  applicableSessions?: string[];
  isActive: boolean;
  createdAt: Timestamp;
}

// Update Booking
interface Booking {
  // ... existing
  paymentPlanId?: string;
  installmentSchedule?: {
    installmentNumber: number;
    amount: number;
    dueDate: Timestamp;
    status: 'pending' | 'paid' | 'failed';
    paidAt?: Timestamp;
    stripePaymentId?: string;
  }[];
}
```

**Implementation Options:**

**Option A: Stripe Subscriptions**
- Create subscription for installment schedule
- Stripe handles billing automatically
- Webhook handles payment events

**Option B: Manual Invoicing**
- Create payment links for each installment
- Cron job sends reminders
- Admin can retry failed payments

**Recommended:** Option B for flexibility

**Files to Create:**
| File | Purpose |
|------|---------|
| `src/app/admin/payment-plans/page.tsx` | Plan configuration |
| `src/app/api/admin/payment-plans/route.ts` | CRUD plans |
| `src/app/api/cron/installment-billing/route.ts` | Process installments |
| `src/components/checkout/payment-plan-selector.tsx` | Plan selection |
| `src/components/account/installment-schedule.tsx` | View schedule |

**Acceptance Criteria:**
- [ ] Admin can create payment plans
- [ ] Customer can select plan at checkout
- [ ] Installment schedule displayed
- [ ] Automated billing works
- [ ] Failed payment handling
- [ ] Admin can manually process

---

### 6.2 Session Options (Add-ons)

**Goal:** Optional add-ons purchasable with sessions

**Database Schema:**
```typescript
// New collection: session_options
interface SessionOption {
  id: string;
  name: string;                  // "Lunch", "Extended Hours", etc.
  description?: string;
  price: number;                 // in pence
  type: 'one_time' | 'per_session'; // Charge once or per occurrence
  // Restrictions
  maxQuantity?: number;
  requiresApproval: boolean;
  applicableSessions?: string[];
  isActive: boolean;
  createdAt: Timestamp;
}

// Update Booking
interface Booking {
  // ... existing
  sessionOptions?: {
    optionId: string;
    optionName: string;
    quantity: number;
    price: number;
  }[];
}
```

**Files to Create:**
| File | Purpose |
|------|---------|
| `src/app/admin/session-options/page.tsx` | Options list |
| `src/app/admin/session-options/new/page.tsx` | Create option |
| `src/app/api/admin/session-options/route.ts` | CRUD options |
| `src/components/checkout/session-options.tsx` | Option selector |

**Checkout Integration:**
1. After session selection, show available add-ons
2. Customer selects options + quantity
3. Options added to cart total
4. Options stored in booking

**Acceptance Criteria:**
- [ ] Admin can create add-on options
- [ ] Options shown at checkout
- [ ] Pricing calculated correctly
- [ ] Options stored in booking
- [ ] Options visible in admin

---

### 6.3 Scheduled Reports

**Goal:** Automated report delivery via email

**Database Schema:**
```typescript
// New collection: scheduled_reports
interface ScheduledReport {
  id: string;
  name: string;
  reportType: 'bookings' | 'attendance' | 'financial' | 'cart_abandonment';
  filters: Record<string, unknown>;
  format: 'csv' | 'xlsx';
  // Schedule
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;            // For weekly (0-6)
  dayOfMonth?: number;           // For monthly (1-31)
  time: string;                  // "09:00"
  // Recipients
  recipients: string[];          // Email addresses
  // Status
  isActive: boolean;
  lastRunAt?: Timestamp;
  nextRunAt: Timestamp;
  createdAt: Timestamp;
}
```

**Files to Create:**
| File | Purpose |
|------|---------|
| `src/app/admin/reports/scheduled/page.tsx` | Scheduled reports |
| `src/app/admin/reports/scheduled/new/page.tsx` | Create schedule |
| `src/app/api/admin/reports/scheduled/route.ts` | CRUD schedules |
| `src/app/api/cron/scheduled-reports/route.ts` | Process schedules |

**Acceptance Criteria:**
- [ ] Admin can schedule reports
- [ ] Reports run on schedule
- [ ] Reports emailed to recipients
- [ ] Multiple frequencies supported

---

## Database Schema Changes

### New Collections

| Collection | Phase | Purpose |
|------------|-------|---------|
| `users` | 1 | Customer accounts |
| `payment_links` | 1 | Custom payment links |
| `abandoned_carts` | 2 | Cart abandonment tracking |
| `refund_policies` | 2 | Cancellation policies |
| `attendance` | 3 | Check-in/out records |
| `session_occurrences` | 3 | Recurring session dates |
| `coupons` | 4 | Discount codes |
| `coupon_uses` | 4 | Coupon usage tracking |
| `discount_rules` | 4 | Auto-applied discounts |
| `form_templates` | 5 | Custom registration forms |
| `form_responses` | 5 | Form submission data |
| `waiver_templates` | 5 | Liability waivers |
| `waiver_signatures` | 5 | Signed waivers |
| `payment_plans` | 6 | Installment configurations |
| `session_options` | 6 | Add-on products |
| `scheduled_reports` | 6 | Report automation |

### Modified Collections

| Collection | Changes |
|------------|---------|
| `bookings` | +paymentMethod, +guardianDeclaration, +couponCode, +depositPaid, +installmentSchedule, +sessionOptions, +secondaryParent |
| `sessions` | +coaches, +depositEnabled, +formTemplateId, +requiresWaiver, +waiverId |
| `users` (admin) | +role: coach, +assignedSessions |

---

## API Routes Summary

### Phase 1 Routes
```
POST   /api/auth/register
POST   /api/auth/verify-email
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/account/bookings
GET    /api/account/bookings/[id]
PUT    /api/account/profile
GET    /api/account/children
POST   /api/account/children
PUT    /api/account/children/[id]
POST   /api/admin/bookings/[id]/mark-cash-paid
POST   /api/admin/payment-links
GET    /api/admin/payment-links/[id]
DELETE /api/admin/payment-links/[id]
```

### Phase 2 Routes
```
POST   /api/account/bookings/[id]/cancel
GET    /api/account/bookings/[id]/cancellation-preview
GET    /api/account/bookings/[id]/transfer-options
POST   /api/account/bookings/[id]/transfer
POST   /api/cart/track-abandonment
GET    /api/cron/cart-abandonment
GET    /api/bookings/[id]/qr-code
GET    /api/checkin
GET    /api/admin/refund-policies
POST   /api/admin/refund-policies
PUT    /api/admin/refund-policies/[id]
DELETE /api/admin/refund-policies/[id]
```

### Phase 3 Routes
```
GET    /api/admin/attendance
POST   /api/admin/attendance/checkin
POST   /api/admin/attendance/checkout
POST   /api/admin/attendance/bulk
GET    /api/admin/attendance/qr
GET    /api/admin/export/bookings
GET    /api/admin/export/attendance
GET    /api/coach/sessions
GET    /api/coach/attendance
POST   /api/coach/attendance/checkin
```

### Phase 4 Routes
```
GET    /api/admin/coupons
POST   /api/admin/coupons
PUT    /api/admin/coupons/[id]
DELETE /api/admin/coupons/[id]
POST   /api/checkout/validate-coupon
GET    /api/admin/discounts
POST   /api/admin/discounts
POST   /api/account/bookings/[id]/pay-balance
GET    /api/cron/balance-reminders
```

### Phase 5 Routes
```
GET    /api/admin/forms
POST   /api/admin/forms
PUT    /api/admin/forms/[id]
DELETE /api/admin/forms/[id]
GET    /api/admin/waivers
POST   /api/admin/waivers
PUT    /api/admin/waivers/[id]
DELETE /api/admin/waivers/[id]
```

### Phase 6 Routes
```
GET    /api/admin/payment-plans
POST   /api/admin/payment-plans
PUT    /api/admin/payment-plans/[id]
GET    /api/cron/installment-billing
GET    /api/admin/session-options
POST   /api/admin/session-options
PUT    /api/admin/session-options/[id]
GET    /api/admin/reports/scheduled
POST   /api/admin/reports/scheduled
GET    /api/cron/scheduled-reports
```

---

## Dependencies & Order

### Critical Path

```
Phase 1.1 User Auth
    ↓
Phase 1.2 Customer Portal (depends on auth)
    ↓
Phase 2.1 Self-Cancellation (depends on portal)
Phase 2.2 Self-Transfer (depends on portal)
    ↓
Phase 3.1 Attendance (can start in parallel)
Phase 3.3 Coach Role (depends on auth)
```

### Independent Tracks

These can be built in parallel with the critical path:

**Track A: Financial**
```
Phase 1.3 Multiple Payment Methods
    ↓
Phase 4.1 Coupon Codes
Phase 4.2 Sibling Discounts
    ↓
Phase 4.3 Deposits
    ↓
Phase 6.1 Payment Plans
```

**Track B: Data & Reporting**
```
Phase 3.2 Data Export
    ↓
Phase 6.3 Scheduled Reports
```

**Track C: Forms**
```
Phase 5.1 Custom Forms
    ↓
Phase 5.2 Electronic Waivers
```

### Technology Dependencies

| Feature | New Package | Purpose |
|---------|-------------|---------|
| Authentication | Firebase Auth (existing) | User management |
| QR Codes | `qrcode` | Generate QR images |
| Signatures | `signature_pad` | Canvas signatures |
| Excel Export | `xlsx` | Generate Excel files |
| Rich Text | `@tiptap/react` | Waiver editor |
| PDF Generation | `@react-pdf/renderer` | Waiver receipts |

---

## Risk Mitigation

### High Risk Items

| Risk | Mitigation |
|------|------------|
| Auth complexity | Use Firebase Auth, proven solution |
| Stripe webhook reliability | Idempotent handlers, retry logic |
| Form builder complexity | Start with simple types, iterate |
| Data migration | Backward-compatible schema changes |

### Rollback Strategy

Each phase is designed to be deployable independently:
- Feature flags for new features
- Database schema additions are additive
- No breaking changes to existing APIs

---

## Success Metrics

### Phase 1 Success
- [ ] 50%+ customers create accounts within 30 days
- [ ] Cash payments trackable in admin
- [ ] Payment link conversion rate > 80%

### Phase 2 Success
- [ ] 30%+ cancellations self-service
- [ ] Cart abandonment recovery rate > 10%
- [ ] Transfer requests self-service

### Phase 3 Success
- [ ] Attendance tracked for 90%+ sessions
- [ ] Coach adoption for attendance tracking
- [ ] Export usage by admin

### Phase 4 Success
- [ ] Coupon usage in 10%+ bookings
- [ ] Sibling discount applications
- [ ] Deposit bookings complete payment

---

## Appendix: Email Templates Required

| Phase | Template | Trigger |
|-------|----------|---------|
| 1 | `welcomeEmail` | User registration |
| 1 | `verifyEmailEmail` | Email verification |
| 1 | `passwordResetEmail` | Forgot password |
| 1 | `paymentLinkEmail` | Payment link created |
| 1 | `cashPaymentReceiptEmail` | Cash payment recorded |
| 2 | `cancellationConfirmationEmail` | Booking cancelled |
| 2 | `transferConfirmationEmail` | Booking transferred |
| 2 | `cartAbandonedEmail` | Cart abandoned recovery |
| 3 | `dailyAttendanceSummaryEmail` | Daily attendance (optional) |
| 4 | `balanceReminderEmail` | Balance due reminder |
| 4 | `installmentReminderEmail` | Installment due |
| 4 | `installmentFailedEmail` | Payment failed |
| 5 | `formReminderEmail` | Complete form reminder |

---

**End of Implementation Plan**

*This plan is designed to be executed incrementally. Each phase delivers standalone value while building toward the complete feature set.*
