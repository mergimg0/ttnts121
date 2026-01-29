# Email Integration Architecture - TTNTS121

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          RESEND EMAIL SYSTEM                             │
└─────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│                           CORE INFRASTRUCTURE                              │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  src/lib/email.ts                                                          │
│  ┌──────────────────────────────────────────────────────────┐            │
│  │ sendEmail(options)                                        │            │
│  │ - Uses Resend REST API (no npm dependency)               │            │
│  │ - Attachments support (QR codes, PDFs)                   │            │
│  │ - CC support (secondary parents)                         │            │
│  │ - Auto plain-text generation                             │            │
│  │ - Dev mode logging                                       │            │
│  └──────────────────────────────────────────────────────────┘            │
│                           ▲                                                │
│                           │                                                │
│  src/lib/email-templates.ts    src/lib/email-campaign.ts                 │
│  ┌────────────────────────┐    ┌─────────────────────────┐               │
│  │ 22 Email Templates     │    │ sendCampaignEmails()    │               │
│  │ - Booking confirmations│    │ - Batch sending         │               │
│  │ - Payment notifications│    │ - Personalization       │               │
│  │ - Reminders            │    │ - Contact filtering     │               │
│  │ - Campaign emails      │    │ - Marketing consent     │               │
│  └────────────────────────┘    └─────────────────────────┘               │
│                                                                            │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│                        BOOKING FLOW TRIGGERS                               │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────┐        │
│  │              STRIPE WEBHOOK HANDLER                           │        │
│  │        src/app/api/webhooks/stripe/route.ts                   │        │
│  ├──────────────────────────────────────────────────────────────┤        │
│  │                                                               │        │
│  │  checkout.session.completed                                  │        │
│  │    ├─→ Full payment ─→ bookingConfirmationWithQREmail        │        │
│  │    ├─→ Deposit ─→ depositConfirmationEmail                   │        │
│  │    └─→ Balance ─→ balancePaidConfirmationEmail              │        │
│  │                                                               │        │
│  │  payment_intent.payment_failed                               │        │
│  │    └─→ paymentFailureEmail                                   │        │
│  │                                                               │        │
│  │  charge.refunded                                             │        │
│  │    └─→ refundConfirmationEmail                              │        │
│  │                                                               │        │
│  │  checkout.session.expired                                    │        │
│  │    └─→ checkoutAbandonedEmail                               │        │
│  │                                                               │        │
│  │  payment_link.completed                                      │        │
│  │    └─→ bookingConfirmationEmail                             │        │
│  │                                                               │        │
│  └──────────────────────────────────────────────────────────────┘        │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────┐        │
│  │              PORTAL ENDPOINTS                                 │        │
│  ├──────────────────────────────────────────────────────────────┤        │
│  │                                                               │        │
│  │  /api/portal/bookings/[id]/transfer                          │        │
│  │    └─→ transferConfirmationEmail                            │        │
│  │                                                               │        │
│  │  /api/portal/bookings/[id]/cancel                            │        │
│  │    └─→ ❌ cancellationConfirmationEmail (NOT SENT!)         │        │
│  │                                                               │        │
│  └──────────────────────────────────────────────────────────────┘        │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────┐        │
│  │              WAITLIST FLOW                                    │        │
│  ├──────────────────────────────────────────────────────────────┤        │
│  │                                                               │        │
│  │  /api/waitlist                                               │        │
│  │    └─→ waitlistConfirmationEmail                            │        │
│  │                                                               │        │
│  │  /api/admin/waitlist/[id]/notify                             │        │
│  │    └─→ waitlistSpotAvailableEmail                           │        │
│  │                                                               │        │
│  └──────────────────────────────────────────────────────────────┘        │
│                                                                            │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│                      AUTOMATED JOBS (CRON)                                 │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  /api/cron/session-reminders                                              │
│    ├─→ Runs: 24hrs before session                                         │
│    └─→ Sends: sessionReminderEmail                                        │
│                                                                            │
│  /api/cron/balance-reminders                                              │
│    ├─→ Runs: 7d, 3d, 1d before due date                                   │
│    └─→ Sends: balanceReminderEmail                                        │
│                                                                            │
│  lib/cron/cart-abandonment.ts                                             │
│    ├─→ Runs: 24hrs after cart creation                                    │
│    └─→ Sends: cartAbandonmentRecoveryEmail                                │
│                                                                            │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│                         ADMIN FEATURES                                     │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌────────────────────────────────────────────────────────┐              │
│  │         CAMPAIGN SYSTEM                                 │              │
│  ├────────────────────────────────────────────────────────┤              │
│  │                                                         │              │
│  │  Admin UI                 API                          │              │
│  │  ├─ /admin/campaigns     /api/admin/campaigns          │              │
│  │  ├─ /admin/contacts      /api/admin/contacts           │              │
│  │  └─ Create → Send        /api/admin/campaigns/[id]/send│              │
│  │                                                         │              │
│  │  Features:                                              │              │
│  │  • Target by location/all/custom                       │              │
│  │  • Marketing consent filtering                         │              │
│  │  • Personalization: {{firstName}}, {{location}}        │              │
│  │  • Batch sending via Resend                            │              │
│  │                                                         │              │
│  └────────────────────────────────────────────────────────┘              │
│                                                                            │
│  ┌────────────────────────────────────────────────────────┐              │
│  │         ADMIN ACTIONS                                   │              │
│  ├────────────────────────────────────────────────────────┤              │
│  │                                                         │              │
│  │  /api/admin/bookings/[id]/resend-qr                    │              │
│  │    └─→ qrCodeResendEmail                               │              │
│  │                                                         │              │
│  │  /api/admin/payment-links                              │              │
│  │    └─→ paymentLinkEmail                                │              │
│  │                                                         │              │
│  │  /api/admin/abandoned-carts/[id]/send-reminder         │              │
│  │    └─→ cartAbandonmentRecoveryEmail                    │              │
│  │                                                         │              │
│  └────────────────────────────────────────────────────────┘              │
│                                                                            │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│                       AUTHENTICATION FLOW                                  │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  /api/auth/register                                                        │
│    └─→ welcomeEmail                                                        │
│                                                                            │
│  Firebase Auth (built-in)                                                 │
│    └─→ passwordResetEmail (via Firebase)                                  │
│                                                                            │
│  (Unused: emailVerificationReminderEmail)                                 │
│                                                                            │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│                      TEMPLATE USAGE SUMMARY                                │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ✅ ACTIVE (19 templates)                                                  │
│    • Booking confirmations (3 variants)                                   │
│    • Payment notifications (3: failure, deposit, balance)                 │
│    • Reminders (2: session, balance)                                      │
│    • Refund/cancellation (2: refund ✅, cancel ❌)                         │
│    • Waitlist (2: confirmation, notification)                             │
│    • Auth (2: welcome, password reset)                                    │
│    • Admin tools (3: QR, payment link, cart recovery)                     │
│    • Transfer (1: transfer confirmation)                                  │
│    • Abandoned checkout (1)                                               │
│                                                                            │
│  ⚠️ UNUSED (3 templates - planned features)                               │
│    • manualPaymentReceivedEmail (no UI yet)                               │
│    • scheduledReportEmail (no cron yet)                                   │
│    • emailVerificationReminderEmail (no cron yet)                         │
│                                                                            │
│  ❌ BROKEN (1 template)                                                    │
│    • cancellationConfirmationEmail (generated but not sent)               │
│                                                                            │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW                                        │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌────────┐     ┌────────────┐     ┌──────────┐     ┌────────────┐      │
│  │ Trigger│────▶│  Template  │────▶│ sendEmail│────▶│   Resend   │      │
│  │ Event  │     │  Function  │     │   API    │     │    API     │      │
│  └────────┘     └────────────┘     └──────────┘     └────────────┘      │
│      │               │                   │                  │             │
│      │               │                   │                  │             │
│      ▼               ▼                   ▼                  ▼             │
│  Stripe/     Personalized HTML    REST POST          Email Delivery      │
│  Portal/     + Plain Text         with Auth          (SMTP)              │
│  Cron/                             Header                                 │
│  Admin                                                                     │
│                                                                            │
│  Attachments supported:                                                   │
│    • QR codes (base64 embedded)                                           │
│    • CSV reports (future)                                                 │
│                                                                            │
│  CC support:                                                               │
│    • Secondary parents get CC'd on confirmations                          │
│                                                                            │
└───────────────────────────────────────────────────────────────────────────┘
