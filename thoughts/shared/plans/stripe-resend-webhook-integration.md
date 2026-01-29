# Implementation Plan: Stripe-Resend Webhook Integration

Generated: 2026-01-28

## Goal

Integrate Resend email notifications with Stripe webhook events to automatically send transactional emails when payment events occur (confirmations, failures, refunds).

---

## Current State Analysis

### Stripe Webhook Handler
**File:** `src/app/api/webhooks/stripe/route.ts`

**Currently handles:**
- `checkout.session.completed` - Updates booking status, sends confirmation email (WORKING)
- `payment_intent.succeeded` - Updates payment status only
- `payment_intent.payment_failed` - Updates payment status only (NO EMAIL)

**Missing handlers:**
- `charge.refunded` / `charge.refund.updated` - Refund notifications
- `checkout.session.expired` - Abandoned checkout recovery
- `charge.dispute.created` - Dispute alerts (admin)

### Email Infrastructure
**Files:**
- `src/lib/email.ts` - Resend wrapper with `sendEmail()` function
- `src/lib/email-templates.ts` - HTML email templates
- `src/lib/email-campaign.ts` - Batch sending for campaigns

**Existing templates:**
1. `waitlistConfirmationEmail` - Waitlist signup
2. `waitlistSpotAvailableEmail` - Spot available notification
3. `bookingConfirmationEmail` - Payment success (ALREADY USED)
4. `sessionReminderEmail` - 24hr reminder

**Missing templates:**
1. Payment failure notification
2. Refund confirmation
3. Checkout abandoned reminder
4. Dispute notification (admin)

### Data Flow
1. User checks out -> `POST /api/checkout` creates Stripe session with metadata:
   - `bookingId` - Firestore document ID
   - `bookingRef` - Human-readable reference (TTNTS-YYYYMMDD-XXXX)
   - `sessionIds` - JSON array of booked session IDs
2. Stripe webhook fires -> `POST /api/webhooks/stripe` processes event
3. Handler updates Firestore booking document
4. Confirmation email sent via `sendEmail()`

### Booking Data Available
From `bookingData` in Firestore:
- `parentEmail` - Email recipient
- `parentFirstName` - For personalization
- `childFirstName` - For personalization
- `bookingRef` - Reference number
- `amount` - Total in pence
- `sessionIds` - Array of session IDs
- `stripeSessionId` - Checkout session ID
- `stripePaymentId` - Payment intent ID

---

## Stripe Events to Handle

| Event | Current State | Action Required |
|-------|--------------|-----------------|
| `checkout.session.completed` | Handled + email | None |
| `payment_intent.succeeded` | Handled, no email | Add email (fallback) |
| `payment_intent.payment_failed` | Handled, no email | Add failure email |
| `charge.refunded` | Not handled | Add handler + email |
| `charge.refund.updated` | Not handled | Add handler (status updates) |
| `checkout.session.expired` | Not handled | Add abandoned cart email |
| `charge.dispute.created` | Not handled | Add admin alert |

---

## Implementation Phases

### Phase 1: Add Missing Email Templates
**Files to modify:**
- `src/lib/email-templates.ts`

**New templates to add:**

#### 1. Payment Failure Email
```typescript
export function paymentFailureEmail(data: {
  parentFirstName: string;
  childFirstName: string;
  bookingRef: string;
  sessions: Array<{ name: string; dayOfWeek: string; startTime: string }>;
  totalAmount: string;
  retryUrl: string;
  failureReason?: string;
}): { subject: string; html: string }
```

#### 2. Refund Confirmation Email
```typescript
export function refundConfirmationEmail(data: {
  parentFirstName: string;
  childFirstName: string;
  bookingRef: string;
  refundAmount: string;
  originalAmount: string;
  isPartialRefund: boolean;
  reason?: string;
}): { subject: string; html: string }
```

#### 3. Checkout Abandoned Email
```typescript
export function checkoutAbandonedEmail(data: {
  parentFirstName: string;
  childFirstName: string;
  sessions: Array<{ name: string; dayOfWeek: string }>;
  totalAmount: string;
  checkoutUrl: string;
  expiresInHours: number;
}): { subject: string; html: string }
```

**Steps:**
1. Add the three new template functions
2. Follow existing template style (baseStyles, wrapTemplate)
3. Include SITE_CONFIG branding
4. Add clear CTAs with buttons

**Acceptance criteria:**
- [ ] Templates match existing style
- [ ] All required data fields included
- [ ] Mobile-responsive HTML

---

### Phase 2: Add Refund Webhook Handler
**Files to modify:**
- `src/app/api/webhooks/stripe/route.ts`

**Steps:**
1. Add `charge.refunded` case to switch statement
2. Create `handleRefund()` async function
3. Look up booking by `payment_intent` from refund object
4. Query Firestore bookings where `stripePaymentId` matches
5. Update booking `paymentStatus` to `'refunded'`
6. Fetch booking data for email
7. Send refund confirmation email

**Implementation:**
```typescript
case "charge.refunded": {
  const charge = event.data.object as Stripe.Charge;
  await handleRefund(charge);
  break;
}

async function handleRefund(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;
  if (!paymentIntentId) return;

  // Find booking by payment intent
  const bookingsSnapshot = await adminDb
    .collection("bookings")
    .where("stripePaymentId", "=", paymentIntentId)
    .limit(1)
    .get();

  if (bookingsSnapshot.empty) {
    console.log("No booking found for refund:", paymentIntentId);
    return;
  }

  const bookingDoc = bookingsSnapshot.docs[0];
  const bookingData = bookingDoc.data();

  // Calculate refund details
  const refundAmount = charge.amount_refunded;
  const isPartialRefund = refundAmount < charge.amount;

  // Update booking status
  await bookingDoc.ref.update({
    paymentStatus: isPartialRefund ? "partially_refunded" : "refunded",
    refundedAmount: refundAmount,
    refundedAt: new Date(),
    updatedAt: new Date(),
  });

  // Send refund confirmation email
  await sendRefundConfirmationEmail(bookingData, refundAmount, isPartialRefund);
}
```

**Acceptance criteria:**
- [ ] Refund event triggers handler
- [ ] Booking status updated correctly
- [ ] Partial vs full refund detection works
- [ ] Email sent with correct amounts

---

### Phase 3: Add Payment Failure Handler
**Files to modify:**
- `src/app/api/webhooks/stripe/route.ts`

**Steps:**
1. Enhance existing `handlePaymentFailed()` function
2. Look up booking data for email
3. Generate retry URL (new checkout session or return to cart)
4. Send payment failure email

**Implementation:**
```typescript
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata?.bookingId;
  if (!bookingId) return;

  // Update booking status
  await adminDb.collection("bookings").doc(bookingId).update({
    paymentStatus: "failed",
    failureReason: paymentIntent.last_payment_error?.message || null,
    updatedAt: new Date(),
  });

  // Get booking data for email
  const bookingDoc = await adminDb.collection("bookings").doc(bookingId).get();
  const bookingData = bookingDoc.data();

  if (!bookingData) return;

  // Send failure notification
  await sendPaymentFailureEmail(bookingData, paymentIntent);
}
```

**Acceptance criteria:**
- [ ] Payment failure triggers email
- [ ] Failure reason captured
- [ ] Retry URL provided in email

---

### Phase 4: Add Checkout Expired Handler (Optional Enhancement)
**Files to modify:**
- `src/app/api/webhooks/stripe/route.ts`

**Steps:**
1. Add `checkout.session.expired` case
2. Create `handleCheckoutExpired()` function
3. Look up pending booking by session ID
4. Mark booking as `expired`
5. Optionally send abandoned cart email (24hr window)

**Note:** This is lower priority - only send if checkout was abandoned within a reasonable window. Consider a queue/scheduled job instead of immediate email.

**Acceptance criteria:**
- [ ] Expired checkouts marked in database
- [ ] Abandoned cart email sent (if within window)

---

### Phase 5: Update Booking Type
**Files to modify:**
- `src/types/booking.ts`

**Add new status values:**
```typescript
paymentStatus: "pending" | "paid" | "failed" | "refunded" | "partially_refunded" | "expired";
```

**Add new optional fields:**
```typescript
refundedAmount?: number;
refundedAt?: Date | Timestamp;
failureReason?: string;
```

**Acceptance criteria:**
- [ ] Types updated
- [ ] No TypeScript errors

---

### Phase 6: Add Email Helper Functions
**Files to modify:**
- `src/app/api/webhooks/stripe/route.ts`

**Add helper functions:**
```typescript
async function sendPaymentFailureEmail(
  bookingData: FirebaseFirestore.DocumentData,
  paymentIntent: Stripe.PaymentIntent
) {
  // ... implementation
}

async function sendRefundConfirmationEmail(
  bookingData: FirebaseFirestore.DocumentData,
  refundAmount: number,
  isPartialRefund: boolean
) {
  // ... implementation
}
```

These follow the pattern of existing `sendBookingConfirmationEmail()`.

**Acceptance criteria:**
- [ ] Helper functions work correctly
- [ ] Session details fetched properly
- [ ] Emails formatted correctly

---

## Testing Strategy

### Unit Tests (if test framework exists)
1. Test email template generation with sample data
2. Test price formatting (refund amounts)
3. Test partial refund detection logic

### Integration Tests (Manual)
1. **Payment Success Flow:**
   - Complete checkout
   - Verify confirmation email received
   - Check Firestore booking status = "paid"

2. **Payment Failure Flow:**
   - Use Stripe test card `4000000000000002` (decline)
   - Verify failure email received
   - Check Firestore booking status = "failed"

3. **Refund Flow:**
   - Process refund in Stripe dashboard
   - Verify refund email received
   - Check Firestore booking status = "refunded"

4. **Partial Refund Flow:**
   - Process partial refund (50%)
   - Verify email shows correct amounts
   - Check Firestore status = "partially_refunded"

### Stripe CLI Testing
```bash
# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger payment_intent.payment_failed
stripe trigger charge.refunded
```

### Webhook Signature Verification
- Ensure `STRIPE_WEBHOOK_SECRET` is set
- Test with invalid signature (should return 400)

---

## Risks & Considerations

### 1. Duplicate Emails
**Risk:** Both `checkout.session.completed` and `payment_intent.succeeded` could fire
**Mitigation:** Only send confirmation from `checkout.session.completed` - the `payment_intent.succeeded` handler already doesn't send email

### 2. Refund Lookup by Payment Intent
**Risk:** No index on `stripePaymentId` field
**Mitigation:** Create Firestore composite index or ensure field is populated consistently

### 3. Email Delivery Failures
**Risk:** Resend API could fail silently
**Mitigation:** Log email send results, consider adding retry logic or dead letter queue

### 4. Missing Booking Data
**Risk:** Webhook fires but booking not found
**Mitigation:** Log warnings, don't throw errors that would cause Stripe to retry indefinitely

### 5. Partial Refunds
**Risk:** Multiple partial refunds on same booking
**Mitigation:** Track `refundedAmount` cumulatively, update each time

---

## Estimated Complexity

| Phase | Effort | Risk |
|-------|--------|------|
| Phase 1: Email Templates | 1-2 hours | Low |
| Phase 2: Refund Handler | 2-3 hours | Medium |
| Phase 3: Payment Failure | 1-2 hours | Low |
| Phase 4: Checkout Expired | 1-2 hours | Low |
| Phase 5: Update Types | 30 mins | Low |
| Phase 6: Email Helpers | 1-2 hours | Low |
| Testing | 2-3 hours | Medium |

**Total: ~10-14 hours**

---

## File Summary

| File | Changes |
|------|---------|
| `src/lib/email-templates.ts` | Add 3 new templates |
| `src/app/api/webhooks/stripe/route.ts` | Add handlers + email helpers |
| `src/types/booking.ts` | Add new status values and fields |

---

## Implementation Order

1. Update `src/types/booking.ts` (enables type safety for rest)
2. Add templates to `src/lib/email-templates.ts`
3. Add refund handler (most valuable)
4. Add payment failure email (quick win)
5. Add checkout expired (optional)
6. Test all flows

---

## Post-Implementation Checklist

- [ ] All new webhook events handled
- [ ] All emails tested in production with real Stripe events
- [ ] Stripe webhook endpoint verified in Stripe dashboard
- [ ] Firestore indexes created if needed
- [ ] Error logging sufficient for debugging
- [ ] No duplicate emails sent
- [ ] Email content approved by business owner
