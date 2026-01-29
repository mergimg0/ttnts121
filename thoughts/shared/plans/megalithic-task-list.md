# TTNTS121 Megalithic Task List

**Generated:** 2026-01-28
**Total Tasks:** 147
**Phases:** 6

---

## Phase 1: Foundation (Weeks 1-4)

### 1.1 User Authentication System (13 tasks)

- [ ] **1.1.1** Create `src/types/user.ts` - User interface with role, children, preferences
- [ ] **1.1.2** Create `src/lib/auth.ts` - Firebase Auth wrapper (signIn, signOut, signUp, resetPassword)
- [ ] **1.1.3** Create `src/contexts/auth-context.tsx` - React context for auth state
- [ ] **1.1.4** Create `src/app/(auth)/layout.tsx` - Auth pages layout
- [ ] **1.1.5** Create `src/app/(auth)/login/page.tsx` - Customer login page
- [ ] **1.1.6** Create `src/app/(auth)/register/page.tsx` - Customer registration page
- [ ] **1.1.7** Create `src/app/(auth)/forgot-password/page.tsx` - Password reset request
- [ ] **1.1.8** Create `src/app/(auth)/reset-password/page.tsx` - Password reset form
- [ ] **1.1.9** Create `src/app/api/auth/register/route.ts` - Registration API endpoint
- [ ] **1.1.10** Create `src/app/api/auth/verify-email/route.ts` - Email verification endpoint
- [ ] **1.1.11** Create `src/middleware.ts` - Route protection middleware
- [ ] **1.1.12** Create `src/components/auth/login-form.tsx` - Login form component
- [ ] **1.1.13** Create `src/components/auth/register-form.tsx` - Register form component

### 1.2 Customer Portal MVP (12 tasks)

- [ ] **1.2.1** Create `src/app/account/layout.tsx` - Account layout with navigation
- [ ] **1.2.2** Create `src/app/account/page.tsx` - Account dashboard
- [ ] **1.2.3** Create `src/app/account/bookings/page.tsx` - Bookings list
- [ ] **1.2.4** Create `src/app/account/bookings/[id]/page.tsx` - Booking detail
- [ ] **1.2.5** Create `src/app/account/profile/page.tsx` - Profile settings
- [ ] **1.2.6** Create `src/app/account/children/page.tsx` - Manage children
- [ ] **1.2.7** Create `src/components/account/account-nav.tsx` - Account navigation
- [ ] **1.2.8** Create `src/components/account/booking-card.tsx` - Booking summary card
- [ ] **1.2.9** Create `src/app/api/account/bookings/route.ts` - Fetch user's bookings API
- [ ] **1.2.10** Create `src/app/api/account/bookings/[id]/route.ts` - Single booking API
- [ ] **1.2.11** Create `src/app/api/account/profile/route.ts` - Profile update API
- [ ] **1.2.12** Create `src/app/api/account/children/route.ts` - Children CRUD API

### 1.3 Multiple Payment Methods (11 tasks)

- [ ] **1.3.1** Update `src/types/booking.ts` - Add paymentMethod, cashPaid, paymentLink fields
- [ ] **1.3.2** Create `src/types/payment-link.ts` - PaymentLink interface
- [ ] **1.3.3** Create `src/app/api/admin/bookings/[id]/mark-cash-paid/route.ts` - Cash paid API
- [ ] **1.3.4** Create `src/app/api/admin/payment-links/route.ts` - Create payment link API
- [ ] **1.3.5** Create `src/app/api/admin/payment-links/[id]/route.ts` - Get/cancel link API
- [ ] **1.3.6** Create `src/components/admin/cash-payment-modal.tsx` - Cash payment form
- [ ] **1.3.7** Create `src/components/admin/payment-link-modal.tsx` - Payment link generator
- [ ] **1.3.8** Update Stripe webhook handler for payment_link.completed event
- [ ] **1.3.9** Create `src/lib/email-templates/payment-link.ts` - Payment link email
- [ ] **1.3.10** Create `src/lib/email-templates/cash-receipt.ts` - Cash receipt email
- [ ] **1.3.11** Update booking detail page with payment action buttons

### 1.4 Guardian Declaration Checkbox (4 tasks)

- [ ] **1.4.1** Update `src/types/booking.ts` - Add guardianDeclaration, guardianDeclarationAt
- [ ] **1.4.2** Update `src/app/checkout/page.tsx` - Add guardian checkbox
- [ ] **1.4.3** Update `src/app/api/checkout/route.ts` - Validate checkbox required
- [ ] **1.4.4** Update booking display to show declaration status

---

## Phase 2: Self-Service (Weeks 5-8)

### 2.1 Self-Cancellation with Refund Rules (14 tasks)

- [ ] **2.1.1** Create `src/types/refund-policy.ts` - RefundPolicy interface
- [ ] **2.1.2** Create `src/lib/refund-calculator.ts` - Calculate refund based on policy
- [ ] **2.1.3** Create `src/app/admin/settings/refund-policies/page.tsx` - Manage policies
- [ ] **2.1.4** Create `src/app/api/admin/refund-policies/route.ts` - Policies CRUD API
- [ ] **2.1.5** Create `src/app/api/admin/refund-policies/[id]/route.ts` - Single policy API
- [ ] **2.1.6** Create `src/app/account/bookings/[id]/cancel/page.tsx` - Cancel confirmation
- [ ] **2.1.7** Create `src/app/api/account/bookings/[id]/cancel/route.ts` - Process cancellation
- [ ] **2.1.8** Create `src/app/api/account/bookings/[id]/cancellation-preview/route.ts` - Preview refund
- [ ] **2.1.9** Create `src/components/account/cancel-booking-modal.tsx` - Confirmation modal
- [ ] **2.1.10** Create `src/lib/email-templates/cancellation-confirmation.ts` - Cancel email
- [ ] **2.1.11** Update booking type with cancellation fields
- [ ] **2.1.12** Integrate Stripe refund processing
- [ ] **2.1.13** Update session enrolled count on cancellation
- [ ] **2.1.14** Add cancel button to booking detail page

### 2.2 Self-Transfer Between Sessions (10 tasks)

- [ ] **2.2.1** Create `src/app/account/bookings/[id]/transfer/page.tsx` - Transfer wizard
- [ ] **2.2.2** Create `src/app/api/account/bookings/[id]/transfer/route.ts` - Process transfer
- [ ] **2.2.3** Create `src/app/api/account/bookings/[id]/transfer-options/route.ts` - Available sessions
- [ ] **2.2.4** Create `src/components/account/transfer-session-picker.tsx` - Session selector
- [ ] **2.2.5** Create `src/lib/email-templates/transfer-confirmation.ts` - Transfer email
- [ ] **2.2.6** Calculate price difference logic (upgrade/downgrade)
- [ ] **2.2.7** Handle upgrade payment flow (Stripe checkout)
- [ ] **2.2.8** Handle downgrade refund/credit
- [ ] **2.2.9** Update both session enrolled counts
- [ ] **2.2.10** Add transfer button to booking detail page

### 2.3 Cart Abandonment Recovery (9 tasks)

- [ ] **2.3.1** Create `src/types/abandoned-cart.ts` - AbandonedCart interface
- [ ] **2.3.2** Create `src/app/api/cart/track-abandonment/route.ts` - Track cart API
- [ ] **2.3.3** Create `src/app/api/cron/cart-abandonment/route.ts` - Process abandoned carts
- [ ] **2.3.4** Create `src/lib/email-templates/cart-abandoned.ts` - Recovery email
- [ ] **2.3.5** Create `src/app/admin/reports/cart-abandonment/page.tsx` - Abandonment report
- [ ] **2.3.6** Update checkout form to call tracking API on email entry
- [ ] **2.3.7** Create vercel.json cron configuration
- [ ] **2.3.8** Track conversion when cart completes
- [ ] **2.3.9** Add abandonment stats to admin dashboard

### 2.4 QR Code Generation (6 tasks)

- [ ] **2.4.1** Install `qrcode` package
- [ ] **2.4.2** Create `src/lib/qr-code.ts` - QR generation utilities
- [ ] **2.4.3** Create `src/app/api/bookings/[id]/qr-code/route.ts` - Generate QR image
- [ ] **2.4.4** Create `src/components/account/qr-code-display.tsx` - QR display component
- [ ] **2.4.5** Update confirmation email to include QR code
- [ ] **2.4.6** Add QR code to customer portal booking detail

---

## Phase 3: Operations (Weeks 9-12)

### 3.1 Attendance Tracking System (16 tasks)

- [ ] **3.1.1** Create `src/types/attendance.ts` - AttendanceRecord, SessionOccurrence interfaces
- [ ] **3.1.2** Create `src/app/admin/attendance/page.tsx` - Attendance dashboard
- [ ] **3.1.3** Create `src/app/admin/attendance/[sessionId]/page.tsx` - Session attendance
- [ ] **3.1.4** Create `src/app/admin/attendance/[sessionId]/[date]/page.tsx` - Date-specific
- [ ] **3.1.5** Create `src/app/api/admin/attendance/route.ts` - List attendance API
- [ ] **3.1.6** Create `src/app/api/admin/attendance/checkin/route.ts` - Check-in endpoint
- [ ] **3.1.7** Create `src/app/api/admin/attendance/checkout/route.ts` - Check-out endpoint
- [ ] **3.1.8** Create `src/app/api/admin/attendance/bulk/route.ts` - Bulk check-in
- [ ] **3.1.9** Create `src/app/api/admin/attendance/qr/route.ts` - QR validation endpoint
- [ ] **3.1.10** Create `src/components/admin/attendance/attendance-sheet.tsx` - Main UI
- [ ] **3.1.11** Create `src/components/admin/attendance/checkin-button.tsx` - Toggle check-in
- [ ] **3.1.12** Create `src/components/admin/attendance/qr-scanner.tsx` - QR scanner modal
- [ ] **3.1.13** Create `src/app/api/checkin/route.ts` - Public check-in validation endpoint
- [ ] **3.1.14** Add attendance link to admin sidebar
- [ ] **3.1.15** Create daily attendance report view
- [ ] **3.1.16** Create participant attendance history view

### 3.2 Data Export (CSV/Excel) (8 tasks)

- [ ] **3.2.1** Install `xlsx` and `papaparse` packages
- [ ] **3.2.2** Create `src/lib/export.ts` - Export utilities (CSV, Excel)
- [ ] **3.2.3** Create `src/app/api/admin/export/bookings/route.ts` - Export bookings API
- [ ] **3.2.4** Create `src/app/api/admin/export/attendance/route.ts` - Export attendance API
- [ ] **3.2.5** Create `src/components/admin/export-button.tsx` - Export UI component
- [ ] **3.2.6** Add export button to bookings page
- [ ] **3.2.7** Add export button to attendance page
- [ ] **3.2.8** Support date range and session filtering

### 3.3 Coach Role & Session Access (9 tasks)

- [ ] **3.3.1** Update User type with coach role and assignedSessions
- [ ] **3.3.2** Update Session type with coaches array
- [ ] **3.3.3** Create `src/app/coach/page.tsx` - Coach dashboard
- [ ] **3.3.4** Create `src/app/coach/attendance/[id]/page.tsx` - Session attendance
- [ ] **3.3.5** Create `src/app/api/coach/sessions/route.ts` - Coach's sessions API
- [ ] **3.3.6** Create `src/app/api/coach/attendance/route.ts` - Coach attendance API
- [ ] **3.3.7** Update middleware for coach route protection
- [ ] **3.3.8** Create admin UI to assign coaches to sessions
- [ ] **3.3.9** Create coach invitation flow

---

## Phase 4: Financial (Weeks 13-16)

### 4.1 Coupon/Discount Code System (12 tasks)

- [ ] **4.1.1** Create `src/types/coupon.ts` - Coupon, CouponUse interfaces
- [ ] **4.1.2** Create `src/lib/coupon-validator.ts` - Validation logic
- [ ] **4.1.3** Create `src/app/admin/coupons/page.tsx` - Coupon list
- [ ] **4.1.4** Create `src/app/admin/coupons/new/page.tsx` - Create coupon
- [ ] **4.1.5** Create `src/app/admin/coupons/[id]/page.tsx` - Edit coupon
- [ ] **4.1.6** Create `src/app/api/admin/coupons/route.ts` - Coupons CRUD API
- [ ] **4.1.7** Create `src/app/api/admin/coupons/[id]/route.ts` - Single coupon API
- [ ] **4.1.8** Create `src/app/api/checkout/validate-coupon/route.ts` - Validate coupon API
- [ ] **4.1.9** Create `src/components/checkout/coupon-input.tsx` - Coupon field
- [ ] **4.1.10** Update booking type with coupon fields
- [ ] **4.1.11** Track coupon usage in coupon_uses collection
- [ ] **4.1.12** Add coupons link to admin sidebar

### 4.2 Multi-Person (Sibling) Discount (6 tasks)

- [ ] **4.2.1** Create `src/types/discount-rule.ts` - DiscountRule interface
- [ ] **4.2.2** Create `src/lib/discount-calculator.ts` - Calculate discounts
- [ ] **4.2.3** Create `src/app/admin/discounts/page.tsx` - Discount rules
- [ ] **4.2.4** Create `src/app/api/admin/discounts/route.ts` - Discounts CRUD API
- [ ] **4.2.5** Update checkout to apply automatic discounts
- [ ] **4.2.6** Show discount breakdown in order summary

### 4.3 Deposits & Partial Payments (8 tasks)

- [ ] **4.3.1** Update Session type with deposit fields
- [ ] **4.3.2** Update Booking type with deposit tracking
- [ ] **4.3.3** Create `src/components/checkout/payment-option-selector.tsx` - Deposit vs full
- [ ] **4.3.4** Create `src/app/account/bookings/[id]/pay-balance/page.tsx` - Pay remaining
- [ ] **4.3.5** Create `src/app/api/account/bookings/[id]/pay-balance/route.ts` - Pay balance API
- [ ] **4.3.6** Create `src/app/api/cron/balance-reminders/route.ts` - Reminder emails
- [ ] **4.3.7** Create `src/lib/email-templates/balance-reminder.ts` - Reminder email
- [ ] **4.3.8** Add deposit configuration to session edit page

---

## Phase 5: Enhanced (Weeks 17-20)

### 5.1 Custom Registration Forms (12 tasks)

- [ ] **5.1.1** Create `src/types/form.ts` - FormTemplate, FormQuestion, FormResponse interfaces
- [ ] **5.1.2** Create `src/app/admin/forms/page.tsx` - Form templates list
- [ ] **5.1.3** Create `src/app/admin/forms/new/page.tsx` - Create form
- [ ] **5.1.4** Create `src/app/admin/forms/[id]/page.tsx` - Edit form
- [ ] **5.1.5** Create `src/app/api/admin/forms/route.ts` - Forms CRUD API
- [ ] **5.1.6** Create `src/app/api/admin/forms/[id]/route.ts` - Single form API
- [ ] **5.1.7** Create `src/components/admin/form-builder/form-builder.tsx` - Drag-drop builder
- [ ] **5.1.8** Create `src/components/admin/form-builder/question-editor.tsx` - Question config
- [ ] **5.1.9** Create `src/components/checkout/custom-form.tsx` - Render form at checkout
- [ ] **5.1.10** Create `src/lib/form-renderer.ts` - Dynamic form rendering
- [ ] **5.1.11** Store form responses in form_responses collection
- [ ] **5.1.12** Add forms link to admin sidebar

### 5.2 Electronic Waivers (10 tasks)

- [ ] **5.2.1** Install `signature_pad` package
- [ ] **5.2.2** Create `src/types/waiver.ts` - WaiverTemplate, WaiverSignature interfaces
- [ ] **5.2.3** Create `src/app/admin/waivers/page.tsx` - Waiver list
- [ ] **5.2.4** Create `src/app/admin/waivers/new/page.tsx` - Create waiver
- [ ] **5.2.5** Create `src/app/admin/waivers/[id]/page.tsx` - Edit waiver
- [ ] **5.2.6** Create `src/app/api/admin/waivers/route.ts` - Waivers CRUD API
- [ ] **5.2.7** Create `src/components/checkout/waiver-signature.tsx` - Signature capture
- [ ] **5.2.8** Create `src/components/admin/signature-canvas.tsx` - Canvas component
- [ ] **5.2.9** Store signatures in waiver_signatures collection
- [ ] **5.2.10** Add waiver requirement to session configuration

### 5.3 Secondary Parent/Guardian (5 tasks)

- [ ] **5.3.1** Update Booking type with secondaryParent field
- [ ] **5.3.2** Update checkout form with secondary parent section
- [ ] **5.3.3** Create `src/app/account/children/[id]/page.tsx` - Authorized pickups
- [ ] **5.3.4** Update email templates to optionally CC secondary parent
- [ ] **5.3.5** Display secondary parent in booking details

---

## Phase 6: Advanced (Weeks 21-24)

### 6.1 Payment Plans / Installments (10 tasks)

- [ ] **6.1.1** Create `src/types/payment-plan.ts` - PaymentPlan interface
- [ ] **6.1.2** Update Booking type with installmentSchedule
- [ ] **6.1.3** Create `src/app/admin/payment-plans/page.tsx` - Plan configuration
- [ ] **6.1.4** Create `src/app/api/admin/payment-plans/route.ts` - Plans CRUD API
- [ ] **6.1.5** Create `src/app/api/cron/installment-billing/route.ts` - Process installments
- [ ] **6.1.6** Create `src/components/checkout/payment-plan-selector.tsx` - Plan selection
- [ ] **6.1.7** Create `src/components/account/installment-schedule.tsx` - View schedule
- [ ] **6.1.8** Create `src/lib/email-templates/installment-reminder.ts` - Reminder email
- [ ] **6.1.9** Create `src/lib/email-templates/installment-failed.ts` - Failed email
- [ ] **6.1.10** Handle failed installment retries

### 6.2 Session Options (Add-ons) (7 tasks)

- [ ] **6.2.1** Create `src/types/session-option.ts` - SessionOption interface
- [ ] **6.2.2** Update Booking type with sessionOptions array
- [ ] **6.2.3** Create `src/app/admin/session-options/page.tsx` - Options list
- [ ] **6.2.4** Create `src/app/admin/session-options/new/page.tsx` - Create option
- [ ] **6.2.5** Create `src/app/api/admin/session-options/route.ts` - Options CRUD API
- [ ] **6.2.6** Create `src/components/checkout/session-options.tsx` - Option selector
- [ ] **6.2.7** Update cart total calculation with options

### 6.3 Scheduled Reports (6 tasks)

- [ ] **6.3.1** Create `src/types/scheduled-report.ts` - ScheduledReport interface
- [ ] **6.3.2** Create `src/app/admin/reports/scheduled/page.tsx` - Scheduled reports
- [ ] **6.3.3** Create `src/app/admin/reports/scheduled/new/page.tsx` - Create schedule
- [ ] **6.3.4** Create `src/app/api/admin/reports/scheduled/route.ts` - Schedules CRUD API
- [ ] **6.3.5** Create `src/app/api/cron/scheduled-reports/route.ts` - Process schedules
- [ ] **6.3.6** Send reports via email with attachments

---

## Task Summary

| Phase | Section | Tasks |
|-------|---------|-------|
| 1.1 | User Authentication | 13 |
| 1.2 | Customer Portal | 12 |
| 1.3 | Multiple Payments | 11 |
| 1.4 | Guardian Checkbox | 4 |
| 2.1 | Self-Cancellation | 14 |
| 2.2 | Self-Transfer | 10 |
| 2.3 | Cart Abandonment | 9 |
| 2.4 | QR Codes | 6 |
| 3.1 | Attendance | 16 |
| 3.2 | Data Export | 8 |
| 3.3 | Coach Role | 9 |
| 4.1 | Coupons | 12 |
| 4.2 | Sibling Discount | 6 |
| 4.3 | Deposits | 8 |
| 5.1 | Custom Forms | 12 |
| 5.2 | Waivers | 10 |
| 5.3 | Secondary Parent | 5 |
| 6.1 | Payment Plans | 10 |
| 6.2 | Session Options | 7 |
| 6.3 | Scheduled Reports | 6 |
| **TOTAL** | | **178** |

---

## Execution Order

### Critical Path (Must execute in order)
1. Phase 1.1 - User Authentication (foundation for all)
2. Phase 1.2 - Customer Portal (depends on auth)
3. Phase 2.1 - Self-Cancellation (depends on portal)
4. Phase 2.2 - Self-Transfer (depends on portal)

### Parallel Track A: Financial
- Phase 1.3 - Multiple Payment Methods
- Phase 4.1 - Coupons
- Phase 4.2 - Sibling Discounts
- Phase 4.3 - Deposits
- Phase 6.1 - Payment Plans

### Parallel Track B: Operations
- Phase 1.4 - Guardian Checkbox
- Phase 2.4 - QR Codes
- Phase 3.1 - Attendance
- Phase 3.2 - Data Export
- Phase 3.3 - Coach Role

### Parallel Track C: Enhanced
- Phase 5.1 - Custom Forms
- Phase 5.2 - Waivers
- Phase 5.3 - Secondary Parent
- Phase 6.2 - Session Options
- Phase 6.3 - Scheduled Reports

### Parallel Track D: Recovery
- Phase 2.3 - Cart Abandonment

---

**End of Task List**
