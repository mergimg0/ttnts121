# TTNTS121 Feature Guide

## Complete System Documentation

**Version:** 1.0
**Last Updated:** January 2026

This guide provides comprehensive documentation for all features implemented in the TTNTS121 booking and management system. Follow the sections sequentially to understand each feature and how to use it.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [User Authentication](#2-user-authentication)
3. [Customer Portal](#3-customer-portal)
4. [Payment System](#4-payment-system)
5. [Booking Management](#5-booking-management)
6. [QR Codes & Check-in](#6-qr-codes--check-in)
7. [Attendance Tracking](#7-attendance-tracking)
8. [Coach System](#8-coach-system)
9. [Discount & Coupon System](#9-discount--coupon-system)
10. [Custom Forms & Waivers](#10-custom-forms--waivers)
11. [Cart Recovery](#11-cart-recovery)
12. [Data Export](#12-data-export)
13. [Scheduled Reports](#13-scheduled-reports)
14. [Admin Sidebar Navigation](#14-admin-sidebar-navigation)

---

## 1. System Overview

### Architecture

TTNTS121 is built with:
- **Next.js 14** (App Router) - Frontend and API routes
- **Firebase/Firestore** - Database and authentication
- **Stripe** - Payment processing
- **Resend** - Email delivery

### User Roles

| Role | Description | Access |
|------|-------------|--------|
| **Customer** | Parents/guardians booking sessions | Customer portal, booking, profile |
| **Coach** | Session instructors | Coach dashboard, attendance for assigned sessions |
| **Admin** | System administrators | Full admin panel access |

### Key URLs

| Page | URL |
|------|-----|
| Homepage | `/` |
| Customer Login | `/login` |
| Customer Register | `/register` |
| Customer Portal | `/portal` |
| Coach Login | `/coach/login` |
| Coach Dashboard | `/coach` |
| Admin Dashboard | `/admin` |

---

## 2. User Authentication

### Overview

The authentication system allows customers to create accounts, log in, and manage their profiles. It uses Firebase Authentication with email/password.

### For Customers

#### Registration (`/register`)

1. Navigate to `/register`
2. Fill in the required fields:
   - First Name
   - Last Name
   - Email Address
   - Phone Number (optional)
   - Password (minimum 8 characters)
   - Confirm Password
3. Check "I agree to receive marketing emails" if desired
4. Click "Create Account"
5. Check your email for a verification link
6. Click the link to verify your email

#### Login (`/login`)

1. Navigate to `/login`
2. Enter your email and password
3. Click "Sign In"
4. You'll be redirected to the customer portal

#### Password Reset (`/forgot-password`)

1. Click "Forgot password?" on the login page
2. Enter your email address
3. Click "Send Reset Link"
4. Check your email for the reset link
5. Click the link and enter your new password

### Technical Details

**Files:**
- `src/app/(auth)/login/page.tsx` - Login page
- `src/app/(auth)/register/page.tsx` - Registration page
- `src/app/(auth)/forgot-password/page.tsx` - Password reset request
- `src/app/(auth)/reset-password/page.tsx` - Password reset form
- `src/lib/auth.ts` - Authentication functions
- `src/contexts/auth-context.tsx` - React context for auth state

**Firestore Collection:** `users`

```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'customer' | 'admin' | 'coach';
  children: UserChild[];
  emailVerified: boolean;
  marketingConsent: boolean;
  createdAt: Date;
}
```

---

## 3. Customer Portal

### Overview

The customer portal (`/portal`) allows registered users to view their bookings, manage their profile, and access QR codes for check-in.

### Accessing the Portal

1. Log in at `/login`
2. You'll be automatically redirected to `/portal`
3. Or navigate directly to `/portal` when logged in

### Portal Sections

#### Dashboard (`/portal`)

The main dashboard shows:
- Upcoming bookings summary
- Quick actions (view all bookings, update profile)
- Recent activity

#### My Bookings (`/portal/bookings`)

View all your bookings:
- **Upcoming** - Future sessions
- **Past** - Completed sessions
- **Cancelled** - Cancelled bookings

Each booking card shows:
- Session name and date
- Child's name
- Payment status
- QR code access button

#### Booking Detail (`/portal/bookings/[id]`)

Click on any booking to see:
- Full session details (date, time, location)
- Child information
- Payment status and history
- QR code for check-in (downloadable)
- Actions: Transfer, Cancel (if applicable)

#### Profile Settings (`/portal/settings`)

Update your account information:
- Personal details (name, phone)
- Email preferences
- Marketing consent
- Password change

#### Child Management (`/portal/children/[id]`)

Manage information for each registered child:
- Basic information (name, date of birth)
- Medical conditions
- Authorized contacts (secondary parents, pickup persons)

### Booking Actions

#### Transfer Booking (`/portal/bookings/[id]/transfer`)

Transfer a booking to a different session:

1. From the booking detail page, click "Transfer"
2. Select a new session from available options
3. Review any price difference:
   - **Upgrade** (new session costs more): Pay the difference
   - **Downgrade** (new session costs less): Receive a refund
   - **Same price**: Direct transfer
4. Confirm the transfer
5. Receive confirmation email with new details

#### Cancel Booking

Cancel a booking and receive a refund (subject to refund policy):

1. From the booking detail page, click "Cancel"
2. Review the refund amount based on the cancellation policy
3. Enter an optional reason
4. Confirm cancellation
5. Refund is processed automatically via Stripe

#### Pay Outstanding Balance (`/portal/bookings/[id]/pay-balance`)

If you paid a deposit, pay the remaining balance:

1. From the booking detail page, click "Pay Balance"
2. Review the outstanding amount
3. Click "Pay Now"
4. Complete payment via Stripe
5. Receive confirmation email

---

## 4. Payment System

### Overview

The system supports multiple payment methods to accommodate different customer needs.

### Payment Methods

#### 1. Online Card Payment (Stripe)

The primary payment method during checkout:
- Credit/debit cards
- Apple Pay, Google Pay
- Secure 3D authentication

#### 2. Cash Payment

For in-person payments:
- Admin marks booking as "Cash Paid"
- Customer receives receipt email
- Booking is confirmed immediately

#### 3. Payment Links

For remote payments without online checkout:
- Admin generates a secure payment link
- Link is emailed to customer
- Customer clicks link and pays via Stripe
- Booking is confirmed automatically

### Payment Options at Checkout

#### Full Payment

Pay the entire amount upfront.

#### Deposit Payment

Pay a portion now, balance due later:
- Deposit amount configured per session
- Balance reminder emails sent automatically
- Pay balance through customer portal

### Admin Payment Management

#### Recording Cash Payment

1. Go to Admin > Bookings > [Booking ID]
2. Click "Record Payment"
3. Select "Cash" as payment method
4. Enter amount received
5. Add optional notes
6. Click "Record Payment"
7. Customer receives receipt email

#### Creating Payment Links

1. Go to Admin > Payment Links
2. Click "New Payment Link"
3. Select the booking
4. Enter the amount
5. Set expiry date (optional)
6. Click "Create Link"
7. Copy link or click "Email to Customer"

#### Viewing Payment History

Each booking detail page shows:
- All payments received
- Payment method and date
- Transaction IDs
- Outstanding balance (if any)

### Technical Details

**Files:**
- `src/lib/stripe.ts` - Stripe integration
- `src/app/api/checkout/route.ts` - Checkout API
- `src/app/api/webhooks/stripe/route.ts` - Stripe webhooks
- `src/app/api/admin/payments/record/route.ts` - Record manual payments
- `src/app/api/admin/payment-links/route.ts` - Payment link management

**Firestore Collections:**
- `bookings` - Contains payment status and history
- `payment_links` - Stores generated payment links

---

## 5. Booking Management

### Overview

Comprehensive booking management for both customers and administrators.

### Customer Booking Flow

1. **Browse Sessions** - View available sessions on the website
2. **Select Session** - Choose date, time, and location
3. **Add Children** - Enter child details for each spot
4. **Guardian Declaration** - Confirm parental responsibility
5. **Custom Forms** - Complete any required registration forms
6. **Waivers** - Sign electronic waivers if required
7. **Payment** - Choose full payment or deposit
8. **Confirmation** - Receive email with QR codes

### Guardian Declaration

Required checkbox at checkout:

> "I confirm that I am the parent/legal guardian of the child(ren) being registered and I accept responsibility for their participation in this session."

The system records:
- Digital signature (typed name)
- Timestamp
- IP address (for audit purposes)

### Secondary Parent/Guardian

Add an additional contact during checkout:
- Name and phone (required)
- Email (optional)
- Relationship (Father, Mother, Grandparent, etc.)
- "Can pick up child" checkbox
- "Receive email notifications" checkbox

Secondary parents with email notifications enabled will be CC'd on booking confirmations.

### Admin Booking Management

#### Viewing Bookings (`/admin/bookings`)

The bookings page shows:
- All bookings with filtering options
- Search by customer name, email, or booking ID
- Filter by status, date range, session
- Export to CSV/Excel

#### Booking Detail (`/admin/bookings/[id]`)

Full booking information:
- Customer and child details
- Session information
- Payment status and history
- Guardian declaration status
- QR codes (view/regenerate)
- Actions (cancel, refund, resend emails)

#### Resending QR Codes

1. Open booking detail page
2. Click "Resend QR Codes"
3. Customer receives email with QR codes attached

---

## 6. QR Codes & Check-in

### Overview

Every booking generates unique QR codes for each child, used for attendance check-in.

### QR Code Contents

Each QR code contains:
```json
{
  "bookingId": "abc123",
  "sessionId": "session456",
  "childName": "John Smith",
  "validDate": "2026-02-15"
}
```

### For Customers

#### Accessing QR Codes

1. **Email** - QR codes are attached to confirmation emails
2. **Portal** - Download from `/portal/bookings/[id]`
3. **Direct Link** - `/api/bookings/[id]/qr-code?childIndex=0`

#### Using QR Codes

1. Show QR code on phone or printed
2. Staff scans with admin QR scanner
3. Check-in is recorded automatically
4. Confirmation appears on screen

### For Staff/Admin

#### Scanning QR Codes

1. Go to Admin > Attendance > [Session] > [Date]
2. Click "Scan QR"
3. Allow camera access
4. Point camera at customer's QR code
5. System validates and checks in automatically

#### Manual QR Entry

If camera scanning fails:
1. Click "Manual Entry"
2. Type or paste the QR code data
3. Click "Validate"
4. System processes check-in

### Technical Details

**Files:**
- `src/lib/qr-code.ts` - QR generation utilities
- `src/app/api/bookings/[id]/qr-code/route.ts` - QR code API
- `src/components/booking/qr-code-display.tsx` - Display component
- `src/components/admin/attendance/qr-scanner.tsx` - Scanner component

---

## 7. Attendance Tracking

### Overview

Complete attendance management system for tracking session participation.

### Accessing Attendance (`/admin/attendance`)

The attendance dashboard shows:
- Today's sessions with check-in counts
- Quick access to any session's attendance
- Date picker for historical data

### Taking Attendance

#### For a Specific Session

1. Go to Admin > Attendance
2. Select a session from the list
3. Click on the specific date
4. View the attendance sheet

#### Attendance Sheet Features

- **Participant List** - All enrolled children
- **Check-in Status** - Present, absent, or not yet arrived
- **Time Stamps** - When each check-in/out occurred
- **Notes** - Add notes for individual attendees

#### Marking Attendance

**Check In:**
1. Find the participant in the list
2. Click the "Check In" button
3. Status changes to "Present" with timestamp

**Check Out:**
1. Click "Check Out" for a checked-in participant
2. System records departure time

**QR Scanning:**
1. Click "Scan QR" button
2. Scan participant's QR code
3. Automatic check-in with validation

### Attendance Statistics

Each session date shows:
- **Enrolled** - Total booked participants
- **Present** - Checked-in count
- **Absent** - Not checked in
- **Attendance Rate** - Percentage present

### Technical Details

**Files:**
- `src/app/admin/attendance/page.tsx` - Attendance dashboard
- `src/app/admin/attendance/[sessionId]/page.tsx` - Session dates
- `src/app/admin/attendance/[sessionId]/[date]/page.tsx` - Date attendance
- `src/app/api/admin/attendance/route.ts` - Attendance API
- `src/app/api/admin/attendance/checkin/route.ts` - Check-in API
- `src/components/admin/attendance/attendance-sheet.tsx` - UI component

**Firestore Collection:** `attendance`

```typescript
interface AttendanceRecord {
  id: string;
  bookingId: string;
  sessionId: string;
  childName: string;
  date: string; // YYYY-MM-DD
  checkedInAt?: Date;
  checkedOutAt?: Date;
  checkedInBy?: string;
  method: 'manual' | 'qr';
  notes?: string;
}
```

---

## 8. Coach System

### Overview

Coaches can access their assigned sessions and manage attendance without full admin access.

### Coach Login (`/coach/login`)

1. Navigate to `/coach/login`
2. Enter email and password
3. Click "Sign In"
4. Redirected to coach dashboard

### Coach Dashboard (`/coach`)

The dashboard shows:
- Today's assigned sessions
- Upcoming sessions this week
- Quick access to attendance

### Coach Features

#### View Assigned Sessions (`/coach/sessions`)

List of all sessions assigned to this coach:
- Session name and schedule
- Location details
- Enrolled participant count

#### Session Detail (`/coach/sessions/[id]`)

Detailed view of a session:
- Full schedule information
- Participant list with contact details
- Medical conditions (important for safety)
- Access to attendance for this session

#### Take Attendance (`/coach/attendance/[id]`)

Coaches can take attendance for their sessions:
- Same interface as admin attendance
- QR code scanning
- Manual check-in/out
- Add notes

### Assigning Coaches to Sessions

**Admin action:**

1. Go to Admin > Sessions > [Session ID]
2. Scroll to "Coaches" section
3. Click "Add Coach"
4. Search for coach by name/email
5. Select coach from results
6. Click "Assign"

**Or create from user:**

1. Go to Admin > Users
2. Find or create user
3. Set role to "Coach"
4. Assign sessions from user detail page

### Technical Details

**Files:**
- `src/app/coach/page.tsx` - Coach dashboard
- `src/app/coach/sessions/page.tsx` - Session list
- `src/app/coach/attendance/[id]/page.tsx` - Attendance
- `src/app/api/coach/sessions/route.ts` - Coach sessions API
- `src/middleware.ts` - Route protection

**User Role:**
```typescript
{
  role: 'coach',
  assignedSessions: ['session1', 'session2']
}
```

---

## 9. Discount & Coupon System

### Overview

Two types of discounts are available:
1. **Coupon Codes** - Customer-entered promotional codes
2. **Automatic Discounts** - Applied automatically based on rules

### Coupon Codes

#### Creating Coupons (`/admin/coupons/new`)

1. Go to Admin > Coupons
2. Click "New Coupon"
3. Configure the coupon:
   - **Code** - Unique code customers will enter (e.g., SUMMER20)
   - **Description** - Internal note about the coupon
   - **Discount Type** - Percentage or fixed amount
   - **Discount Value** - The discount (e.g., 20 for 20% or 20 for £20)
   - **Minimum Purchase** - Minimum cart value required
   - **Maximum Uses** - Total times this coupon can be used
   - **Valid From/Until** - Date range for validity
   - **Applicable Sessions** - Limit to specific sessions (empty = all)
   - **Active** - Enable/disable the coupon
4. Click "Create Coupon"

#### Managing Coupons (`/admin/coupons`)

View all coupons with:
- Code and description
- Discount amount
- Usage count (used / max)
- Status (Active/Inactive/Expired)
- Actions (Edit, Deactivate, Delete)

#### Customer Coupon Usage

1. During checkout, find the "Coupon Code" field
2. Enter the code and click "Apply"
3. If valid, discount appears in order summary
4. If invalid, error message explains why

### Automatic Discount Rules

#### Creating Discount Rules (`/admin/discounts/new`)

1. Go to Admin > Discounts
2. Click "New Discount Rule"
3. Configure the rule:

**Discount Types:**

- **Sibling Discount** - Discount when booking for multiple children
  - Condition: Minimum children (e.g., 2)
  - Applies to: All children or additional only

- **Bulk Discount** - Discount for booking multiple sessions
  - Condition: Minimum quantity (e.g., 3 sessions)

- **Early Bird** - Discount for booking in advance
  - Condition: Days before session (e.g., 14 days)

**Configuration:**
- **Name** - Display name for the discount
- **Discount Type** - Percentage or fixed amount
- **Discount Value** - The discount amount
- **Applies To** - All items or additional items only
- **Priority** - Higher priority rules apply first
- **Active** - Enable/disable

4. Click "Create Rule"

#### Example: Sibling Discount

```
Name: Second Child 10% Off
Type: Sibling
Minimum Children: 2
Discount: 10% percentage
Applies To: Additional only
```

Result: First child pays full price, second child gets 10% off.

### Technical Details

**Files:**
- `src/app/admin/coupons/page.tsx` - Coupon management
- `src/app/admin/discounts/page.tsx` - Discount rules
- `src/lib/coupon-validator.ts` - Coupon validation logic
- `src/lib/discount-calculator.ts` - Automatic discount calculation
- `src/app/api/checkout/validate-coupon/route.ts` - Coupon API

**Firestore Collections:**
- `coupons` - Coupon codes
- `coupon_uses` - Usage tracking
- `discount_rules` - Automatic discount rules

---

## 10. Custom Forms & Waivers

### Custom Registration Forms

#### Overview

Create custom forms to collect additional information during checkout (medical info, dietary requirements, emergency contacts, etc.).

#### Creating Forms (`/admin/forms/new`)

1. Go to Admin > Forms
2. Click "New Form"
3. Enter form name and description
4. Add questions using the form builder:

**Question Types:**
- **Text** - Short text input
- **Textarea** - Long text input
- **Select** - Dropdown selection
- **Radio** - Single choice
- **Checkbox** - Multiple choice
- **Date** - Date picker
- **Number** - Numeric input

**For each question, configure:**
- Label (the question text)
- Placeholder text
- Required (yes/no)
- Options (for select/radio/checkbox)
- Validation rules (min/max length, min/max value)

5. Set applicable sessions (empty = all sessions)
6. Enable/disable the form
7. Click "Create Form"

#### Managing Forms (`/admin/forms`)

View all forms with:
- Form name and question count
- Response count
- Status (Active/Inactive)
- Actions (Edit, Deactivate, Delete)

#### Customer Experience

During checkout, if a session has associated forms:
1. Forms appear after child details
2. Required questions must be answered
3. Responses are saved with the booking

#### Viewing Responses

1. Go to Admin > Bookings > [Booking ID]
2. Scroll to "Form Responses" section
3. View all submitted answers

### Electronic Waivers

#### Overview

Require customers to sign liability waivers electronically before completing bookings.

#### Creating Waivers (`/admin/waivers/new`)

1. Go to Admin > Waivers
2. Click "New Waiver"
3. Configure the waiver:
   - **Name** - Internal name
   - **Content** - The waiver text (supports basic HTML)
   - **Applicable Sessions** - Which sessions require this waiver
   - **Required** - Must be signed to complete booking
   - **Active** - Enable/disable
4. Click "Create Waiver"

#### Customer Signing Experience

During checkout, if waivers are required:
1. Waiver content is displayed
2. Customer reads the terms
3. Customer draws signature on pad (or types name)
4. Checks "I agree to the terms"
5. Signature is captured and stored

#### Viewing Signatures

1. Go to Admin > Bookings > [Booking ID]
2. Scroll to "Waivers" section
3. View signed waivers with:
   - Waiver name and content
   - Signature image
   - Signed by (name)
   - Signed at (date/time)

### Technical Details

**Files:**
- `src/app/admin/forms/page.tsx` - Form management
- `src/app/admin/waivers/page.tsx` - Waiver management
- `src/components/admin/form-builder/form-builder.tsx` - Form builder UI
- `src/components/checkout/waiver-signature.tsx` - Signature component
- `src/components/admin/signature-canvas.tsx` - Signature pad

**Firestore Collections:**
- `forms` - Form templates
- `form_responses` - Submitted responses
- `waivers` - Waiver templates
- `waiver_signatures` - Captured signatures

---

## 11. Cart Recovery

### Overview

Automatically recover abandoned carts by sending reminder emails to customers who started checkout but didn't complete.

### How It Works

1. **Tracking** - When a customer enters their email during checkout, the cart is tracked
2. **Abandonment Detection** - If checkout isn't completed within 1 hour, cart is marked as abandoned
3. **Reminder Email** - Automated email sent with a recovery link
4. **Recovery** - Customer clicks link, cart is restored, checkout can be completed

### Cart Recovery Flow

1. Customer adds items to cart
2. Customer enters email at checkout
3. Customer leaves without completing payment
4. After 1 hour, cart marked as abandoned
5. System sends recovery email:
   - Subject: "You left something behind..."
   - Contains: Cart summary, recovery link
6. Customer clicks link → `/recover-cart/[token]`
7. Cart is restored with original items and prices
8. Customer completes checkout

### Admin Management (`/admin/abandoned-carts`)

View abandoned carts:
- Customer email and cart contents
- Cart value
- Abandoned timestamp
- Recovery status (Pending, Email Sent, Recovered, Expired)

**Actions:**
- **Send Reminder** - Manually send recovery email
- **View Cart** - See cart contents
- **Mark Recovered** - If recovered offline

### Recovery Metrics

The dashboard shows:
- Total abandoned carts (period)
- Recovery rate (%)
- Revenue recovered
- Average cart value

### Configuration

Cart abandonment settings:
- **Abandonment Threshold** - Time before cart is considered abandoned (default: 1 hour)
- **Recovery Email Delay** - Time after abandonment to send email (default: 1 hour)
- **Link Expiry** - How long recovery links are valid (default: 7 days)

### Technical Details

**Files:**
- `src/app/admin/abandoned-carts/page.tsx` - Admin view
- `src/app/recover-cart/[token]/page.tsx` - Recovery page
- `src/lib/cart-tracking.ts` - Cart tracking logic
- `src/app/api/cron/abandoned-carts/route.ts` - Cron job
- `src/app/api/carts/track/route.ts` - Tracking API

**Firestore Collection:** `abandoned_carts`

```typescript
interface AbandonedCart {
  id: string;
  email: string;
  items: CartItem[];
  totalAmount: number;
  abandonedAt: Date;
  recoveryToken: string;
  recoveryEmailSent: boolean;
  recoveredAt?: Date;
  status: 'pending' | 'email_sent' | 'recovered' | 'expired';
}
```

---

## 12. Data Export

### Overview

Export bookings and attendance data to CSV or Excel format for reporting and record-keeping.

### Exporting Bookings

1. Go to Admin > Bookings
2. Click the "Export" button
3. Select format (CSV or Excel)
4. Optionally set date range filter
5. Click "Download"

**Exported Fields:**
- Booking ID
- Customer name and email
- Child name and details
- Session name and date
- Payment status and amount
- Booking date

### Exporting Attendance

1. Go to Admin > Attendance
2. Navigate to the session and date
3. Click "Export"
4. Select format (CSV or Excel)
5. Click "Download"

**Exported Fields:**
- Child name
- Parent/guardian details
- Session information
- Check-in/out times
- Attendance status
- Medical conditions (if any)
- Emergency contacts

### Export API

Programmatic access:

```
GET /api/admin/export/bookings?format=csv&dateFrom=2026-01-01&dateTo=2026-01-31

GET /api/admin/export/attendance?format=xlsx&sessionId=abc123&date=2026-01-15
```

### Technical Details

**Files:**
- `src/lib/export.ts` - Export utilities
- `src/app/api/admin/export/bookings/route.ts` - Bookings export
- `src/app/api/admin/export/attendance/route.ts` - Attendance export
- `src/components/admin/export-button.tsx` - Export UI component

**Packages:**
- `xlsx` - Excel file generation
- `papaparse` - CSV parsing/generation

---

## 13. Scheduled Reports

### Overview

Automatically generate and email reports on a scheduled basis.

### Creating Scheduled Reports (`/admin/reports/scheduled/new`)

1. Go to Admin > Reports > Scheduled
2. Click "New Scheduled Report"
3. Configure the report:

**Report Settings:**
- **Name** - Descriptive name for the report
- **Report Type** - Bookings, Attendance, Revenue, or Sessions
- **Frequency** - Daily, Weekly, or Monthly
- **Day/Time** - When to run:
  - Daily: Time of day
  - Weekly: Day of week + time
  - Monthly: Day of month + time
- **Recipients** - Email addresses to receive the report
- **Format** - CSV or Excel
- **Filters** - Date range, session filters

4. Click "Create Schedule"

### Report Types

#### Bookings Report
- All bookings within date range
- Customer and child details
- Payment information
- Session details

#### Attendance Report
- Attendance records
- Check-in/out times
- Attendance rates

#### Revenue Report
- Payment totals
- Breakdown by payment method
- Refunds and adjustments

#### Sessions Report
- Session statistics
- Enrollment numbers
- Capacity utilization

### Managing Scheduled Reports (`/admin/reports/scheduled`)

View all scheduled reports:
- Report name and type
- Frequency and next run time
- Last run status
- Recipient count

**Actions:**
- Edit schedule and settings
- Run immediately (test)
- Enable/disable
- Delete

### How It Works

1. Cron job runs every hour
2. Checks for reports due to run
3. Generates report based on configuration
4. Sends email with report attached
5. Updates last run timestamp

### Technical Details

**Files:**
- `src/app/admin/reports/scheduled/page.tsx` - Report management
- `src/lib/report-generator.ts` - Report generation logic
- `src/app/api/cron/scheduled-reports/route.ts` - Cron job
- `src/app/api/admin/reports/scheduled/route.ts` - CRUD API

**Firestore Collection:** `scheduled_reports`

```typescript
interface ScheduledReport {
  id: string;
  name: string;
  reportType: 'bookings' | 'attendance' | 'revenue' | 'sessions';
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string; // HH:mm
  recipients: string[];
  format: 'csv' | 'xlsx';
  filters?: ReportFilters;
  isActive: boolean;
  lastRunAt?: Date;
}
```

---

## 14. Admin Sidebar Navigation

### Navigation Structure

The admin sidebar provides access to all features:

```
Dashboard
├── Overview
│
Bookings
├── All Bookings
├── Abandoned Carts
│
Sessions
├── All Sessions
├── Session Options (Add-ons)
│
Attendance
├── Today's Attendance
├── By Session
│
Finance
├── Payments
├── Payment Links
├── Payment Plans
├── Coupons
├── Discounts
│
Forms & Waivers
├── Registration Forms
├── Waivers
│
Reports
├── Scheduled Reports
├── Export Data
│
Settings
├── Email Campaigns
├── Contacts
├── System Settings
```

### Quick Actions

Top-right of each page typically shows:
- Primary action (e.g., "New Booking", "New Coupon")
- Export button (where applicable)
- Refresh/filter options

---

## Appendix A: Environment Variables

Required environment variables for the system:

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Resend (Email)
RESEND_API_KEY=
EMAIL_FROM=

# Application
NEXT_PUBLIC_APP_URL=
```

---

## Appendix B: Cron Jobs

The system uses Vercel Cron for scheduled tasks:

| Job | Schedule | Purpose |
|-----|----------|---------|
| Cart Abandonment | Every hour | Process abandoned carts, send recovery emails |
| Balance Reminders | Daily 9am | Send payment reminders for outstanding balances |
| Scheduled Reports | Every hour | Generate and send scheduled reports |
| Installment Billing | Daily 6am | Process due installment payments |

Configure in `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/abandoned-carts", "schedule": "0 * * * *" },
    { "path": "/api/cron/balance-reminders", "schedule": "0 9 * * *" },
    { "path": "/api/cron/scheduled-reports", "schedule": "0 * * * *" }
  ]
}
```

---

## Appendix C: Firestore Collections

| Collection | Purpose |
|------------|---------|
| `users` | User accounts (customers, coaches, admins) |
| `sessions` | Session definitions |
| `bookings` | Customer bookings |
| `attendance` | Attendance records |
| `coupons` | Coupon codes |
| `coupon_uses` | Coupon usage tracking |
| `discount_rules` | Automatic discount rules |
| `forms` | Custom form templates |
| `form_responses` | Submitted form data |
| `waivers` | Waiver templates |
| `waiver_signatures` | Captured signatures |
| `abandoned_carts` | Tracked abandoned carts |
| `payment_links` | Generated payment links |
| `payment_plans` | Payment plan configurations |
| `scheduled_reports` | Report schedules |
| `session_options` | Session add-ons |

---

## Appendix D: Email Templates

The system sends the following automated emails:

| Email | Trigger | Content |
|-------|---------|---------|
| Booking Confirmation | Successful payment | Session details, QR codes, calendar invite |
| Deposit Confirmation | Deposit paid | Amount paid, balance due, due date |
| Balance Reminder | Approaching due date | Outstanding amount, pay now link |
| Balance Paid | Balance completed | Full payment confirmation |
| Cart Abandonment | 1 hour after abandonment | Cart summary, recovery link |
| Cancellation Confirmation | Booking cancelled | Refund amount, refund timeline |
| Transfer Confirmation | Booking transferred | New session details, updated QR |
| Payment Link | Admin creates link | Payment link, amount, expiry |
| Cash Receipt | Cash payment recorded | Payment confirmation |

---

## Support

For technical issues or questions about this system, consult:
1. This documentation
2. Code comments in the source files
3. The development team

---

**End of Feature Guide**
