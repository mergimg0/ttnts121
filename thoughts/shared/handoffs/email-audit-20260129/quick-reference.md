# Email Integration Quick Reference

## File Locations

### Core Files
```
src/lib/email.ts                  # sendEmail() wrapper
src/lib/email-templates.ts        # 22 email templates
src/lib/email-campaign.ts         # Campaign batch sending
```

### API Routes Using Email (10 files)
```
src/app/api/webhooks/stripe/route.ts                     # 6 email types
src/app/api/waitlist/route.ts                            # Waitlist confirmation
src/app/api/auth/register/route.ts                       # Welcome email
src/app/api/admin/waitlist/[id]/notify/route.ts          # Spot available
src/app/api/admin/bookings/[id]/resend-qr/route.ts       # QR resend
src/app/api/admin/payment-links/route.ts                 # Payment link
src/app/api/admin/abandoned-carts/[id]/send-reminder/route.ts  # Cart recovery
src/app/api/admin/campaigns/[id]/send/route.ts           # Campaign send
src/app/api/portal/bookings/[id]/transfer/route.ts       # Transfer confirmation
src/app/api/cron/session-reminders/route.ts              # Session reminder
src/app/api/cron/balance-reminders/route.ts              # Balance reminder
```

### Cron Jobs
```
src/lib/cron/cart-abandonment.ts  # Automated cart recovery
```

---

## All Email Templates (22)

| # | Template Name | Status | Trigger |
|---|--------------|--------|---------|
| 1 | `waitlistConfirmationEmail` | ✅ | User joins waitlist |
| 2 | `waitlistSpotAvailableEmail` | ✅ | Admin notifies spot available |
| 3 | `bookingConfirmationEmail` | ✅ | Payment link completed |
| 4 | `bookingConfirmationWithQREmail` | ✅ | Full payment completed |
| 5 | `depositConfirmationEmail` | ✅ | Deposit payment completed |
| 6 | `balancePaidConfirmationEmail` | ✅ | Balance payment completed |
| 7 | `balanceReminderEmail` | ✅ | Cron: 7d/3d/1d before due |
| 8 | `sessionReminderEmail` | ✅ | Cron: 24hr before session |
| 9 | `paymentFailureEmail` | ✅ | Stripe: payment_intent.payment_failed |
| 10 | `refundConfirmationEmail` | ✅ | Stripe: charge.refunded |
| 11 | `cancellationConfirmationEmail` | ❌ | Portal cancel (NOT SENT) |
| 12 | `checkoutAbandonedEmail` | ✅ | Stripe: checkout.session.expired |
| 13 | `cartAbandonmentRecoveryEmail` | ✅ | Cron: 24hr after cart creation |
| 14 | `transferConfirmationEmail` | ✅ | Portal transfer |
| 15 | `qrCodeResendEmail` | ✅ | Admin resend QR |
| 16 | `paymentLinkEmail` | ✅ | Admin creates payment link |
| 17 | `welcomeEmail` | ✅ | User registration |
| 18 | `passwordResetEmail` | ✅ | Firebase Auth |
| 19 | `emailVerificationReminderEmail` | ⚠️ | (Unused) |
| 20 | `manualPaymentReceivedEmail` | ⚠️ | (Unused) |
| 21 | `scheduledReportEmail` | ⚠️ | (Unused) |

---

## Stripe Webhook Events

| Event | Handler Function | Email Sent |
|-------|-----------------|------------|
| `checkout.session.completed` | `handleCheckoutCompleted` | Confirmation + QR or Deposit confirmation |
| `payment_intent.succeeded` | `handlePaymentSucceeded` | (None - fallback only) |
| `payment_intent.payment_failed` | `handlePaymentFailed` | Payment failure |
| `charge.refunded` | `handleRefund` | Refund confirmation |
| `checkout.session.expired` | `handleCheckoutExpired` | Abandoned checkout |
| Payment link completed | `handlePaymentLinkCompleted` | Booking confirmation |

---

## sendEmail() Function Signature

```typescript
interface EmailOptions {
  to: string;
  cc?: string | string[];        // CC for secondary parents
  subject: string;
  html: string;
  text?: string;                 // Auto-generated if not provided
  attachments?: EmailAttachment[];
}

interface EmailAttachment {
  filename: string;
  content: Buffer | string;      // Base64 for Resend API
  contentType?: string;
}

await sendEmail(options): Promise<EmailResult>
```

---

## Environment Variables

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx    # Required for production
EMAIL_FROM="TTNTS <noreply@ttnts.com>"  # Optional (defaults to resend.dev test domain)
```

---

## Campaign System Features

### Targeting Options
- **All contacts** - All with marketing consent
- **By location** - Filter by location tags
- **Custom list** - Select specific contacts

### Personalization Variables
- `{{firstName}}` - Contact first name
- `{{childFirstName}}` - Child first name
- `{{location}}` - Contact location

### Marketing Consent
All campaigns automatically filter to only contacts with `marketingConsent: true`.

---

## Common Patterns

### Booking Confirmation with QR Code
```typescript
const qrData: QRCodeData = {
  bookingId,
  bookingRef,
  childFirstName,
  sessionName,
  sessionDate,
};

const qrCodeDataUrl = await generateBookingQRCode(qrData);

const { subject, html } = bookingConfirmationWithQREmail({
  parentFirstName,
  childFirstName,
  bookingRef,
  sessions: [...],
  totalAmount: formatPrice(amount),
  qrCodeDataUrl,
});

await sendEmail({
  to: parentEmail,
  subject,
  html,
});
```

### Sending with CC (Secondary Parent)
```typescript
await sendEmail({
  to: primaryParentEmail,
  cc: secondaryParentEmail,  // Can also be array: [email1, email2]
  subject,
  html,
});
```

### Campaign Sending
```typescript
await sendCampaignEmails({
  subject: "Summer Camp Registration Open!",
  bodyHtml: "<p>Hello {{firstName}}...</p>",
  contacts: contactList,  // Array of Contact objects
});
```

---

## Critical Bug Fix Required

**File:** `src/app/api/portal/bookings/[id]/cancel/route.ts`

**Current code:**
```typescript
const emailHtml = cancellationConfirmationEmail({
  parentName,
  childNames,
  sessionName,
  sessionDate,
  refundAmount,
  refundPercentage,
  refundExplanation,
});

// ❌ Email is generated but NEVER sent!
```

**Fix needed:**
```typescript
const emailHtml = cancellationConfirmationEmail({
  parentName,
  childNames,
  sessionName,
  sessionDate,
  refundAmount,
  refundPercentage,
  refundExplanation,
});

// ✅ Add this:
await sendEmail({
  to: bookingData.parentEmail,
  subject: "Booking Cancellation Confirmation",
  html: emailHtml,
});
```

---

## Testing Checklist

### Production Readiness
- [ ] `RESEND_API_KEY` set in environment
- [ ] `EMAIL_FROM` configured with verified domain
- [ ] Stripe webhook endpoint verified in Stripe dashboard
- [ ] Cron jobs configured (Vercel Cron or similar)

### Email Flows to Test
1. Full booking flow (deposit → balance → QR code)
2. Payment failure → retry
3. Waitlist → notification → booking
4. Transfer with price difference
5. Cancellation (AFTER FIX)
6. Refund (partial and full)
7. Cart abandonment
8. Campaign sending
9. Session reminders (24hr before)
10. Balance reminders (7d/3d/1d before)

### Stripe CLI Testing
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Test events
stripe trigger checkout.session.completed
stripe trigger payment_intent.payment_failed
stripe trigger charge.refunded
```

---

## Admin Dashboard Access

### Campaign Management
- **List campaigns:** `/admin/campaigns`
- **Create campaign:** `/admin/campaigns/new`
- **View/send campaign:** `/admin/campaigns/[id]`

### Contact Management
- **List contacts:** `/admin/contacts`
- **Add contact:** `/admin/contacts/new`
- **Edit contact:** `/admin/contacts/[id]`

### Email Actions
- **Resend QR code:** Booking details page → "Resend QR Code" button
- **Send payment link:** Finance page → "Create Payment Link"
- **Cart recovery:** Abandoned carts page → "Send Reminder"

---

## Performance Notes

### No NPM Dependencies
The email system uses Resend's REST API directly - no `resend` npm package required. This keeps bundle size small.

### Batch Sending
Campaign emails use Resend's batch endpoint for efficient bulk sending (up to 100 emails per request).

### Dev Mode
When `RESEND_API_KEY` is not set, emails are logged to console instead of sent. Useful for local development.

---

## Future Enhancements (Optional)

1. **Manual Payment Recording** - Admin UI to record cash/bank transfers using `manualPaymentReceivedEmail`
2. **Scheduled Reports** - Cron job for automated report emails using `scheduledReportEmail`
3. **Email Verification Reminders** - Cron job using `emailVerificationReminderEmail`
4. **Email Delivery Tracking** - Resend webhooks to track opens/clicks
5. **Email Analytics Dashboard** - Track campaign performance, delivery rates
