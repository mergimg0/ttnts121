# Phase 2: Core Features Extraction

Generated: 2026-01-28
Status: In Progress

---

## Document 7: Attendance Tracking User Guide.pdf

**Category:** Operations
**Pages:** 5
**Size:** 544KB

### Key Concepts

| Term | Definition |
|------|------------|
| Attendance Tracker Portal | Separate web portal for check-in/out operations |
| Check-In | Recording participant arrival with optional drop-off person and signature |
| Check-Out | Recording participant departure with authorized pick-up person |
| Authorized Drop-Off Person | Pre-registered person allowed to drop off participant |
| Authorized Pick-Up Person | Pre-registered person allowed to pick up participant |
| Measurement | Optional data capture at check-in (e.g., temperature) with threshold validation |
| Participant Notes | Notes attached to participant visible during check-in/out |

### Attendance Portal Features

| Feature | Description |
|---------|-------------|
| Multi-device access | Browser, mobile phone, tablet |
| Season selector | Switch between seasons in portal |
| Calendar navigation | Select date for attendance |
| Participant search | Find specific participant |
| Mark all | Bulk check-in/out |
| View notes | See/add participant notes |
| Signatures | Digital signature capture |
| Measurements | Optional data with threshold alerts |

### Attendance Configuration

**Season Settings (per-season toggle):**
- Enable attendance tracking
- Tracking mode: Check-in only OR Check-in & Check-out
- Enable authorized drop-off persons
- Require drop-off person signatures
- Enable authorized pick-up persons
- Require pick-up person signatures
- Require check-in measurement

### Check-In Flow

```
1. Access Attendance Portal (via Quick Links URL)
2. Select Season (dropdown)
3. Select Session
4. Select Date (calendar)
5. For each participant:
   ├── View participant details (balance, waivers, forms)
   ├── View/add notes
   ├── Enter measurement (if required)
   ├── Verify threshold (visual indicator)
   ├── Select authorized drop-off person
   ├── Capture signature
   └── Mark as Present
```

### Check-Out Flow

```
1. Navigate to Check Out tab
2. Only shows participants marked "Present"
3. For each participant:
   ├── Select authorized pick-up person
   ├── Capture signature
   └── Mark as Checked Out
```

### Attendance Reports

| Report | Scope | Fields |
|--------|-------|--------|
| Daily Attendance Report | Per session, filter by date | Check-in/out time, user, drop-off/pick-up person, signatures |
| Participant Attendance Report | Per session, date range | DOB, Grade, Attendance mark per day |

### Data Entities

| Entity | Fields | Notes |
|--------|--------|-------|
| AttendanceRecord | participantId, sessionId, date, checkInTime, checkOutTime, checkInUser, checkOutUser | Per-day record |
| DropOffRecord | personName, signature, measurement, timestamp | Attached to check-in |
| PickUpRecord | personName, signature, timestamp | Attached to check-out |
| AuthorizedPerson | name, relationship | Pre-registered on account |
| ParticipantNote | type, content, priority, createdAt | Medical, general, etc. |

### TTNTS121 Mapping

| CCM Feature | TTNTS121 Current | Gap |
|-------------|------------------|-----|
| Attendance Portal | None | GAP: No attendance system |
| Check-in/out | None | GAP: Core feature missing |
| Authorized persons | None | GAP: No guardian verification |
| Digital signatures | None | GAP: No signature capture |
| Measurements (temp) | None | GAP: No measurement tracking |
| Participant notes | None | GAP: No notes system |
| Attendance reports | None | GAP: No attendance reporting |
| Mobile-friendly portal | Admin responsive | PARTIAL: Admin mobile-friendly |

---

## Document 8: Online Account User Guide.pdf

**Category:** Registration/Account
**Pages:** 9
**Size:** 564KB

### Key Concepts

| Term | Definition |
|------|------------|
| Online Account | Customer self-service portal (separate from registration) |
| Active Passport | Centralized ACTIVE Network authentication system |
| Family Members | Multiple participants under one account holder |
| Online Account Link | Organization-specific URL for customer portal |
| Account Holder | Parent/guardian who owns the account |
| Supplemental Forms | Follow-up forms completed after registration |
| Follow Up Forms | Additional data collection post-registration |

### Online Account vs Online Registration

| Aspect | Online Account | Online Registration |
|--------|----------------|-------------------|
| Purpose | Manage existing registrations | Create new registrations |
| Scope | Family-level view | Transaction-level |
| Access | Post-registration | During registration |
| URL Format | `campself.active.com/{org}` | Different URL |

### Account Creation Flow

```
Online Registration:
1. User enters email
2. System checks if email exists
3. IF new email:
   └── Create password at end of registration
4. IF existing email:
   └── Login during registration

Manual Registration (admin-created):
1. Admin creates registration
2. System sends email invitation
3. Customer creates password via link
```

### Online Account Features

| Feature | Description |
|---------|-------------|
| View Registrations | All past/current registrations |
| Edit Registration Form | Modify answers to questions |
| View Balance | Outstanding payment amount |
| Pay Bill | Make payment online |
| Fill Out Forms | Complete follow-up/supplemental forms |
| Upload Forms | Submit documents (e.g., medical forms) |
| Sign Waivers | Digital signature on pending waivers |
| Upload Photo | Add participant photo |
| View Family Members | See all participants under account |
| Contact Info | Organization contact details |
| Social Media Links | Organization social links |
| Register for More | Link to registration site |

### Account Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│ SEASON NAME                          │ CONTACT INFO    │
├───────────────────────────────────────┼─────────────────┤
│ BALANCE: $X.XX   [PAY BILL NOW]      │ Phone/Email     │
│ View Bill Details                     │ [REGISTER MORE] │
├───────────────────────────────────────┼─────────────────┤
│ REGISTRANTS                           │ REMAINING       │
│ ┌─────────────────────────────────┐   │ BALANCE: $X.XX  │
│ │ Participant Name                │   │ [PAY NOW]       │
│ │ Session • Dates • Location      │   │                 │
│ │ [Edit Registration Form]        │   │ COMMON          │
│ │ [ADD PURCHASE]                  │   │ QUESTIONS       │
│ │                                 │   │                 │
│ │ SESSION OPTIONS:                │   │                 │
│ │ Required Option x1              │   │                 │
│ │                                 │   │                 │
│ │ Test Form        [FILL OUT]     │   │                 │
│ │ Supplemental     [UPLOAD]       │   │                 │
│ │ Waiver           [SIGN NOW]     │   │                 │
│ │ Photo            [UPLOAD PHOTO] │   │                 │
│ └─────────────────────────────────┘   │                 │
└───────────────────────────────────────┴─────────────────┘
```

### Common Customer Actions

| Action | Steps |
|--------|-------|
| Fill Out Follow Up Form | Find form → Click FILL OUT FORM |
| Upload Supplemental Form | Find form → Click UPLOAD FORM |
| Make Payment | Click PAY BILL NOW or PAY NOW |
| Sign Waiver | Find Pending Waiver → Sign Now → Check boxes → Digital signature |

### Account Status Types

| Status | Meaning |
|--------|---------|
| Active | Account created and accessible |
| Invited | Invitation sent but not accepted |
| Not associated | No online account exists |

### Troubleshooting Login Issues

1. Verify customer using Online Account link (not registration link)
2. Confirm email address matches account
3. Check account status (Active vs Invited)
4. Resend invitation if needed
5. Use Forgot Password for Active accounts

### Online Account Link

- Location: Home tab → Quick Links → "Copy online account URL"
- Format: `https://campself.active.com/{organizationname}`
- Best practice: Post on organization website

### TTNTS121 Mapping

| CCM Feature | TTNTS121 Current | Gap |
|-------------|------------------|-----|
| Online Account Portal | None | GAP: Major feature missing |
| Customer login | None | GAP: No authentication |
| View registrations | None | GAP: No self-service |
| Edit form answers | None | GAP: No post-registration edit |
| Pay balance online | Stripe checkout | PARTIAL: One-time only |
| Follow-up forms | None | GAP: No supplemental forms |
| Digital waiver signing | None | GAP: No waiver system |
| Upload documents | None | GAP: No file uploads |
| Family members view | None | GAP: No family accounts |
| Forgot password | None | GAP: No account system |

---

## Phase 2 Batch 2a Summary

### Documents Processed: 2/5

| Document | Status | Key Extractions |
|----------|--------|-----------------|
| Attendance Tracking User Guide.pdf | ✅ Complete | Check-in/out flow, portal features, reports |
| Online Account User Guide.pdf | ✅ Complete | Self-service portal, customer actions |

### Critical Gaps Identified

**Attendance System (HIGH PRIORITY for camps/classes):**
- No attendance tracking whatsoever
- No check-in/out recording
- No authorized person verification
- No signature capture
- No attendance reporting

**Customer Self-Service (HIGH PRIORITY for reducing admin burden):**
- No customer portal
- No way for customers to view their bookings
- No post-registration form editing
- No document upload capability
- No family account structure

---

## Document 9: CCM - Reg Adjustments 2.0 pdf.pdf

**Category:** Financial/Operations
**Pages:** 9
**Size:** 612KB

### Key Concepts

| Term | Definition |
|------|------------|
| Registration Adjustments | Post-registration modifications (also called Order Actions) |
| Edit Purchases | Modify tuition price or session options on existing order |
| Transfer | Move participant from one session to another (same season only) |
| Coupon | Code-based discount applied by customer or admin |
| Discount | Admin-applied price reduction (internal) |
| Cancel | Withdraw registration with optional cancellation fee and refund |
| Credit Balance | Funds held on account for future use |

### Order Actions Menu

| Action | Description |
|--------|-------------|
| View | See order details |
| Edit purchases | Modify tuition, session options, quantities |
| Transfer | Move to different session |
| Add other discount | Apply internal discount |
| Remove coupon | Remove applied coupon |
| Cancel | Cancel registration |

### Edit Purchases Flow

```
1. People tab → Search customer
2. Select customer → Select Order number
3. Actions → Edit purchases
4. Edit options:
   ├── Tuition price:
   │   ├── Manually adjust price (any lower price)
   │   ├── Use standard price
   │   └── Use early bird price
   ├── Session options:
   │   ├── Adjust quantity
   │   ├── Add/remove options
   │   └── Edit option price
   └── Continue → Review → Submit
```

**Rule:** Cannot edit price to be MORE expensive than tuition allows.

### Transfer Flow

```
1. Search participant → Select Order
2. Actions → Transfer
3. Select new session (same season only)
4. Select tuition and options for new session
5. Continue → Review → Submit
```

**Rule:** Cannot transfer between seasons.

### Waitlist Actions

| Action | Description |
|--------|-------------|
| Register from waitlist | Convert to confirmed registration |
| Transfer to another session | Move to different session |
| Remove from waitlist | Delete waitlist entry |
| View order | See order details |
| Resend confirmation email | Re-send email |

### Coupon Operations

| Operation | Steps |
|-----------|-------|
| Add coupon | Order → Apply discount → Apply a coupon → Enter code → Apply |
| Remove coupon | Order → Actions → Remove Coupon → Submit |

### Discount Operations

| Operation | Steps |
|-----------|-------|
| Add discount | Order → Actions → Add other discount → Select discount → Enter amount → Apply |

Discount modal fields:
- Discount (dropdown)
- Amount
- Apply to registration (Automatic/specific)
- Reason (internal note)

### Payment Recording

**Supported payment methods:**
- Credit card
- Paper check
- Cash

**Not supported via admin:**
- eCheck (must be customer-initiated)

**Flow:**
```
1. People → Search account
2. Make payment
3. Select order (if multiple)
4. Choose: Pay in Full OR Custom Amount
5. Select payment method
6. Enter details → Submit payment
```

### Cancel Registration Flow

```
1. People → Search account → Select order
2. Actions → Cancel
3. Enter cancellation fee (optional, only if payment exists)
4. Continue
5. Review Order summary and Credit to be refunded
6. Choose refund destination:
   ├── Refund to original payment method
   └── OR Reallocate to family credit balance
7. Submit
```

### TTNTS121 Mapping

| CCM Feature | TTNTS121 Current | Gap |
|-------------|------------------|-----|
| Edit purchases | None | GAP: Cannot modify bookings |
| Adjust tuition price | None | GAP: No price editing |
| Add/remove session options | None | GAP: No session options |
| Transfer between sessions | None | GAP: No transfer feature |
| Add coupon to order | None | GAP: No coupon system |
| Apply internal discount | None | GAP: No discount system |
| Cancel registration | Admin can delete | PARTIAL: Delete only, no refund flow |
| Cancellation fee | None | GAP: No fee retention |
| Refund to credit balance | None | GAP: No credit balance |
| Multiple payment methods | Stripe card only | PARTIAL: Card only |
| Waitlist → Register | None | GAP: No waitlist promotion |

---

## Document 10: Season Setup User Guide.pdf

**Category:** Season/Program Management
**Pages:** 9
**Size:** 728KB

### Key Concepts

| Term | Definition |
|------|------------|
| Season | Top-level container for programs (e.g., "Summer 2024") |
| Session | Individual bookable program within a season |
| Session Group | Bundle of sessions sold together |
| Tuition | Base pricing for a session |
| Session Option | Add-on products/services for a session |
| Global Session Option | Reusable add-on across all seasons |
| Merchandise | Physical goods associated with sessions |
| Session Type | Category filter for sessions (e.g., "Sports", "Arts") |
| Sub-Session Type | Subcategory (e.g., "Basketball" under "Sports") |

### Season Setup 9-Step Process

| Step | Name | Purpose |
|------|------|---------|
| 1 | Season | Name, categories, contact, settings |
| 2 | Sessions | Create individual sessions with tuition |
| 3 | Session Groups | Bundle sessions together |
| 4 | Deposits and Payment Plans | Configure payment options |
| 5 | Discounts | Set up automatic and manual discounts |
| 6 | Look and Feel | Brand the registration form |
| 7 | Registration Forms | Questions, waivers, supplemental forms |
| 8 | Confirmation Email | Customize post-registration email |
| 9 | Activation | Test, verify payments, schedule opening |

### Step 1: Season Settings

| Setting | Description |
|---------|-------------|
| Season Name | Display name |
| Categories | Activity types for discovery |
| Contact | Season contact person |
| Attendance Tracking | Enable check-in/out |
| Promotion Tag Visibility | Show discount/payment plan tags |
| Terminology | Customize "Merchandise", "Participant", "Session Type" |
| Display Remaining Capacity | Show "X spots left" when capacity reaches threshold |

### Step 2: Sessions

| Setting | Description |
|---------|-------------|
| Basic settings | Dates, location, participant eligibility |
| Base tuition | Pricing tiers (can have multiple) |
| Session options | Add-ons for this session |
| Associated merchandise | Physical goods |
| Display Status | Online or Internal Only |
| Session Type | Category for filtering |
| GL code / Internal ID | Reporting fields |

### Step 3: Session Groups

- Bundle multiple sessions for single purchase
- Optional feature (requires enablement)

### Step 4: Deposits and Payment Plans

**Deposit Options:**
| Option | Description |
|--------|-------------|
| Pay in full | Full payment required |
| Fixed deposit | Specific $ amount |
| Percentage deposit | % of tuition |
| No payment | Checkout without payment |
| Per-session deposits | Different amounts per session |

**Payment Plan Settings:**
- Number of installments
- Due dates for each installment
- Auto-billing: Required or Optional
- Session applicability: All or Selected

### Step 5: Discounts

| Type | Application |
|------|-------------|
| Multi-Person | Same account, multiple registrants |
| Multi-Session | Multiple sessions in one order |
| Custom (internal) | Admin-applied manually |
| Membership | Based on membership status |
| Conditional | Based on form answers |

### Step 6: Look and Feel

| Element | Customization |
|---------|---------------|
| Background Image | Upload custom image |
| Header | Custom header text/logo |
| Colors | Primary, secondary, button text, cart colors |

### Step 7: Registration Forms

**Online Registration:**
- Participant questions (about attendee)
- Parent questions (about registrant)
- Electronic waivers (digital signature)

**Post-Registration:**
- Participant Photos (upload in online account)
- Supplemental Forms (document upload)
- Follow-Up Forms (online form)
- Questionnaire (pre-attendance check)

**Automatic Reminders:**
- Up to 4 reminder dates
- Customizable email content

### Step 8: Confirmation Email

| Email Type | Trigger |
|------------|---------|
| Confirmation Email | Sent on registration completion |
| Reminder Email | 24 hours after cart abandonment |

Admin can receive copy of every confirmation (up to 5 addresses).

### Step 9: Activation

| Task | Description |
|------|-------------|
| Test Registration | Preview form, audit settings |
| Verify Payments | Confirm payment info |
| Schedule Opening | Immediate or future date |

### Season Creation Options

| Option | Use Case |
|--------|----------|
| Create from scratch | New season, blank slate |
| Copy existing (same program) | Repeat annual program, dates +1 year |
| Copy existing (template) | Use as base for different program |

### TTNTS121 Mapping

| CCM Feature | TTNTS121 Current | Gap |
|-------------|------------------|-----|
| Season container | Program | ✓ Similar concept |
| Session creation | Session CRUD | ✓ Implemented |
| Multiple tuition tiers | Single price | GAP: No tiered pricing |
| Session options | None | GAP: No add-ons |
| Session groups/bundles | None | GAP: No bundling |
| Deposits | None | GAP: Full payment only |
| Payment plans | None | GAP: No installments |
| Multi-person discount | None | GAP: No quantity discounts |
| Multi-session discount | None | GAP: No bundle discounts |
| Membership discounts | None | GAP: No membership system |
| Form branding | None | GAP: No customization |
| Participant questions | Minimal | GAP: No custom forms |
| Electronic waivers | None | GAP: No waivers |
| Supplemental forms | None | GAP: No follow-up forms |
| Cart abandonment email | None | GAP: No abandonment recovery |
| Scheduled activation | Manual | GAP: No scheduled opening |
| Preview/test mode | None | GAP: No preview |
| Copy season | None | GAP: No duplication |

---

## Phase 2 Batch 2b Summary

### Documents Processed: 4/5

| Document | Status | Key Extractions |
|----------|--------|-----------------|
| Attendance Tracking User Guide.pdf | ✅ | Check-in/out portal |
| Online Account User Guide.pdf | ✅ | Customer self-service |
| CCM - Reg Adjustments 2.0 pdf.pdf | ✅ | Order actions, transfers, cancellations |
| Season Setup User Guide.pdf | ✅ | 9-step setup, deposits, payment plans |

### Critical Gaps Identified (Batch 2b)

**Order Management:**
- No post-registration editing
- No session transfers
- No coupon/discount system
- No cancellation fee handling
- No refund-to-credit option

**Season/Pricing:**
- No multi-tier pricing
- No deposits option
- No payment plans
- No scheduled activation
- No season copy/template feature

---

## Document 11: OnlineAccountFAQ.pdf

**Category:** Registration/Account
**Pages:** 6
**Size:** 772KB

### Key Concepts

This document provides customer-facing FAQ for the online account self-service portal.

| Term | Definition |
|------|------------|
| Account Balance | Total amount owed across all orders |
| Credit Balance | Pre-paid funds available on account |
| Season Balance | Amount owed for a specific season |
| Pay in Full | Pay entire account balance (all unpaid orders) |
| Pay Bill Now | Make payment toward specific order |
| Minimum Payment | Deposit amount for internal orders or failed payment plan installment |
| Custom Amount | Partial payment with allocation control |
| Manage Automatic Payments | Update card on file for payment plans |
| Add Purchase | Buy additional items after registration |
| Follow-up Form | Online form completed post-registration |
| Supplemental Form | Document upload (print/scan/upload) |
| Authorized Pickup | Person approved to pick up participant |
| Family Members | Multiple participants under one account |

### Customer Self-Service Actions

| Action | Flow |
|--------|------|
| Pay in Full | Click Pay in Full → Enter card → Submit |
| Pay Specific Order | Pay Bill Now → Select amount type → Enter card → Submit |
| Update Payment Card | Manage Automatic Payments → Add a new Credit Card → Enter details → Submit |
| Purchase Add-ons | Add Purchase → Check items → Checkout → Enter card → Submit |
| Complete Follow-up Form | Fill out Form → Enter info → Save |
| Upload Supplemental Form | Download Form → Print → Complete → Scan → Upload Form → Select File → Submit |
| Add Authorized Pickup | Family Members → Manage Authorized Pickup → +Add Pickup → Enter name/phone → Save |
| Get Financial Statement | Contact organization OR View Bill Details → View Order Details → Print |

### Payment Options

| Option | Description |
|--------|-------------|
| Pay in Full | Pays all unpaid orders across all seasons |
| Remaining Balance | Pays full balance on specific order |
| Minimum Payment | Deposit or failed installment minimum |
| Custom Amount | Partial payment with allocation (for multi-registration orders) |

### Document Upload Specifications

- **Max files:** 20 per upload
- **Max size:** 7MB per file
- **Accepted:** Photos of completed paper forms

### Authorized Pickup Management

| Field | Description |
|-------|-------------|
| Authorization status | Authorized / Unauthorized |
| Person name | First and last name |
| Phone number | Contact number |
| Per-participant | Managed separately for each participant |

### Account Balance Display

```
┌─────────────────────────────────────────────────┐
│ ACCOUNT BALANCE                [PAY IN FULL]   │
│ Credit Balance: $15.00   Balance Due: $15.00    │
│                          [View Bill Details]    │
├─────────────────────────────────────────────────┤
│ [Current & Upcoming]  [Past]                    │
├─────────────────────────────────────────────────┤
│ SEASON NAME                                     │
│ BALANCE DUE: $XX.XX           [PAY BILL NOW]   │
│ Balance Due: $XX.XX                             │
│              [View Bill Details]                │
└─────────────────────────────────────────────────┘
```

### Order Details View

| Section | Fields |
|---------|--------|
| Header | Order ID, Order Date, Balance, Print button |
| Sessions | Session name, dates, days, times |
| Totals | Total per session |
| Payments | Payment history |
| Discounts | Applied discounts |

### TTNTS121 Mapping

| CCM Feature | TTNTS121 Current | Gap |
|-------------|------------------|-----|
| Online account portal | None | GAP: No customer portal |
| Pay in Full (all orders) | None | GAP: No account-wide payment |
| Pay specific order | Stripe checkout | PARTIAL: One-time only |
| Custom partial payment | None | GAP: No partial payments |
| Update payment card | None | GAP: No saved cards |
| Add purchases post-reg | None | GAP: No post-purchase add-ons |
| Follow-up forms | None | GAP: No online forms |
| Supplemental form upload | None | GAP: No document upload |
| Authorized pickup mgmt | None | GAP: No pickup persons |
| Financial statement | None | GAP: No self-service statements |
| Print order details | None | GAP: No print functionality |
| Credit balance display | None | GAP: No credit system |

---

## Phase 2 Complete Summary

### Documents Processed: 5/5 ✅

| Document | Status | Category | Key Extractions |
|----------|--------|----------|-----------------|
| Attendance Tracking User Guide.pdf | ✅ | Operations | Check-in/out portal, measurements, signatures |
| Online Account User Guide.pdf | ✅ | Account | Self-service portal, family accounts |
| CCM - Reg Adjustments 2.0 pdf.pdf | ✅ | Financial | Transfers, cancellations, discounts |
| Season Setup User Guide.pdf | ✅ | Season | 9-step setup, payment plans, deposits |
| OnlineAccountFAQ.pdf | ✅ | Account | Customer actions, payments, authorized pickups |

### Phase 2 Cumulative Gap Analysis

**Critical Gaps - Core Missing Features:**

| Gap | Impact | Notes |
|-----|--------|-------|
| Customer Portal | HIGH | No self-service for customers |
| Attendance System | HIGH | Critical for camps/classes |
| Payment Plans | HIGH | Common customer expectation |
| Deposits | HIGH | Reduces no-shows |
| Session Transfers | MEDIUM | Flexibility for customers |
| Authorized Persons | MEDIUM | Safety for children's programs |

**Financial Gaps:**

| Gap | Current State | CCM Capability |
|-----|---------------|----------------|
| Partial payments | Not supported | ✓ Custom amounts |
| Balance tracking | Per-booking only | ✓ Account-wide |
| Credit balance | None | ✓ Persistent credits |
| Saved payment cards | None | ✓ Card on file |
| Payment allocation | N/A | ✓ Multi-registration split |

**Forms & Documents:**

| Gap | Current State | CCM Capability |
|-----|---------------|----------------|
| Follow-up forms | None | ✓ Post-reg online forms |
| Document upload | None | ✓ 20 files, 7MB each |
| Form reminders | None | ✓ Automated emails |

### Glossary Update (Phase 2)

| CCM Term | Definition | TTNTS121 Equivalent |
|----------|------------|---------------------|
| Tuition | Base session price | Session.price |
| Session Option | Add-on for session | (Not implemented) |
| Follow-up Form | Post-reg online form | (Not implemented) |
| Supplemental Form | Document upload | (Not implemented) |
| Authorized Pickup | Approved person | (Not implemented) |
| Credit Balance | Account credit | (Not implemented) |
| Payment Plan | Installment schedule | (Not implemented) |
| Deposit | Partial initial payment | (Not implemented) |

---

**Phase 2 Complete. Output saved to:** `phase-2-core-features.md`

*Next: Phase 3 Batch 3a - Reserve Agency + Consumer Experience*
