# Phase 1: Foundation Extraction

Generated: 2026-01-28
Status: In Progress

---

## Document 1: CCM Online Registration User Guide.pdf

**Category:** Registration
**Pages:** 3
**Size:** 192KB

### Key Concepts

| Term | Definition |
|------|------------|
| Session Selection | Landing page where participants browse and select sessions to register for |
| Session List | Filterable list of available sessions with location, dates, times, pricing |
| Shopping Cart | Right-side panel showing selected sessions with quantity selector |
| ACTIVE Account | Centralized user account for authentication across ACTIVE products |
| Participant | The person attending the session (child for junior registrations) |
| Parent/Guardian | Adult registering on behalf of a minor; must check declaration checkbox |
| Registration Forms | Custom data collection fields configured by organization |
| Waivers | Legal documents requiring signature during registration |
| Payment Plan | Installment option allowing split payments over time |
| Credit Balance | Pre-paid funds on account usable for future registrations |
| Coupon Code | Discount code entered at checkout |
| Multi-person Discount | Price reduction when multiple registrants in same order |

### Registration Flow (9 Steps)

```
1. Session Selection Page
   ├── Browse SESSION LIST (filterable by Location, Dates)
   ├── View session details (dates, times, venue, price)
   └── Click ADD TO CART

2. Cart Review
   ├── Review items in YOUR SHOPPING CART
   ├── Adjust Quantity per session
   └── Click CONTINUE

3. Authentication
   ├── Enter email + password for ACTIVE account
   └── OR consent to create account at end

4. Participant Information
   ├── Enter: First Name, Last Name, DOB, Gender
   ├── For minors: Check "parent or legal guardian" box
   └── System shows "Who is attending?" prompt

5. Cart Modification (Optional)
   ├── Add sessions
   └── Remove sessions

6. Registration Forms
   ├── Fill required fields (marked with red asterisk)
   └── Sign Waivers

7. Checkout Review
   ├── Review order details
   ├── Enter coupon code (optional)
   └── Click "+ Add Another Registration" to add more

8. Payment
   ├── Choose: Pay in Full OR Payment Plan
   ├── Enter credit card details
   └── OR use Credit Balance if available

9. Complete
   └── Submit registration
```

### Post-Registration

- **Confirmation Email**: Sent automatically with camp dates and information
- **Order Receipt**: Separate email with payment details
- **Online Account Access**: Link in confirmation email to view registration

### Data Entities

| Entity | Fields | Notes |
|--------|--------|-------|
| Session | name, dates, times, venue, price, capacity | Displayed in session list |
| Cart Item | session, quantity | Supports multi-person per session |
| Participant | firstName, lastName, dob, gender | The attendee |
| Guardian | (implied from account) | Must declare relationship for minors |
| Registration | participant, session, forms, waivers | Created on completion |
| Payment | amount, method, planType | Full or installments |

### Business Rules

1. **Multi-person discount**: All registrants must be in same order
2. **Minor registration**: Parent/guardian checkbox required for under-18
3. **Required fields**: Marked with red asterisk, block submission if empty
4. **Account creation**: Can defer to end of registration flow
5. **Cart persistence**: Can add/remove sessions before checkout
6. **Credit balance priority**: Shown as payment option when available

### UI Patterns

| Pattern | Description |
|---------|-------------|
| Side Cart | Persistent cart panel on right side of session selection |
| Quantity Dropdown | Per-session quantity selector in cart |
| Progressive Disclosure | Multi-step wizard flow |
| Required Field Indicator | Red asterisk (*) for mandatory fields |
| Add Another | Button to loop back for additional registrations |

### TTNTS121 Mapping

| CCM Feature | TTNTS121 Current | Gap |
|-------------|------------------|-----|
| Session Selection | `/sessions` page | ✓ Similar |
| Shopping Cart | `CartProvider` + `CartSidebar` | ✓ Implemented |
| Quantity per session | Cart supports quantity | ✓ Implemented |
| ACTIVE Account login | No user accounts | GAP: No login system |
| Participant info | Booking fields | ✓ Partial (name, DOB) |
| Guardian checkbox | None | GAP: Missing declaration |
| Registration Forms | Minimal fields | GAP: No custom forms |
| Waivers | None | GAP: No waiver system |
| Payment Plans | None | GAP: Full payment only |
| Credit Balance | None | GAP: No account credits |
| Coupon Codes | None | GAP: No discount codes |
| Multi-person discount | None | GAP: No quantity discounts |
| Confirmation Email | `email-templates.ts` | ✓ Implemented |
| Online Account Portal | None | GAP: No self-service portal |

---

## Document 2: Refund Limit FAQ.pdf

**Category:** Financial
**Pages:** 2
**Size:** 240KB

### Key Concepts

| Term | Definition |
|------|------------|
| Merchant of Record | ACTIVE Network processes payments on behalf of organization |
| Refund Limit | Cap on card refunds equal to unpaid remittance balance |
| Remittance | Scheduled payout of collected funds to organization |
| Remittance Schedule | Frequency of payouts (2x/month, 4x/month) |
| Unpaid Remittance Balance | Funds collected but not yet paid out to organization |
| ACTIVE Account Statement | Report showing balance for date range |

### Refund Business Rules

1. **Refund Cap**: Organization can only refund up to their unpaid remittance balance
2. **Negative Balance Block**: If balance is negative, no card refunds allowed
3. **Balance Deduction**: Successful refunds reduce unpaid remittance balance
4. **Wire Funding**: Organizations can wire funds to ACTIVE to enable more refunds
5. **Verification**: Use ACTIVE Account Statement to check available refund capacity

### Refund Scenarios

| Scenario | Balance | Refund Request | Result |
|----------|---------|----------------|--------|
| Partial Funds | $1,200 | $3,500 | ERROR: Can only refund $1,200 |
| Negative Balance | -$687 | $100 | ERROR: Cannot process any refunds |
| Sufficient Funds | $9,700 | $3,500 | SUCCESS: Balance becomes $6,200 |

### Data Entities

| Entity | Fields | Relationships |
|--------|--------|---------------|
| Organization | remittanceSchedule, balance | Has many Registrations |
| Remittance | amount, scheduleStart, scheduleEnd, status | Belongs to Organization |
| Refund | amount, status, errorMessage | Belongs to Registration |
| Account Statement | dateRange, balance | Report for Organization |

### Workflows

**Refund Processing**
```
1. Admin initiates refund
2. System checks unpaid remittance balance
3. IF balance >= refund amount:
   ├── Process refund to card
   └── Deduct from balance
4. ELSE:
   └── Show error: "Refunds cannot go through"
```

**Wire Funding (to enable more refunds)**
```
1. Organization wires funds to ACTIVE
2. Balance increases
3. Refunds become available up to new balance
```

### TTNTS121 Mapping

| CCM Feature | TTNTS121 Current | Gap |
|-------------|------------------|-----|
| Refund processing | Stripe refunds via admin | ✓ Implemented |
| Refund limits | No limits (Stripe direct) | Different: No MoR constraint |
| Remittance schedule | Stripe handles directly | Different: Direct to org |
| Balance tracking | Stripe dashboard | Different: External system |
| Wire funding | N/A | N/A (no MoR model) |

### Key Insight for TTNTS121

TTNTS121 uses **Stripe Direct** model (not Merchant of Record), so:
- No remittance/balance constraints on refunds
- Refunds limited only by original payment amount
- Organization bears direct responsibility for refunds

However, consider implementing:
- **Refund policy configuration**: Max refund window (e.g., 14 days before session)
- **Partial refund tracking**: Log refund amounts against original payment
- **Refund reason codes**: For reporting and policy compliance

---

## Phase 1 Batch 1a Summary

### Documents Processed: 2/6

| Document | Status | Key Extractions |
|----------|--------|-----------------|
| CCM Online Registration User Guide.pdf | ✅ Complete | 9-step flow, 12 concepts, 14 gaps |
| Refund Limit FAQ.pdf | ✅ Complete | Refund limits, MoR model, 3 scenarios |

### Cumulative Gap Analysis

**High Priority Gaps (Core Functionality)**
1. User accounts / login system
2. Custom registration forms
3. Waiver/signature system
4. Payment plans (installments)

**Medium Priority Gaps (Enhanced Features)**
5. Coupon/discount codes
6. Credit balance system
7. Multi-person discounts
8. Guardian declaration checkbox
9. Self-service account portal

**Low Priority / Different Model**
10. Refund limits (N/A - Stripe Direct model)
11. Remittance tracking (N/A - Stripe Direct model)

---

## Document 3: Financial Overview User Guide.pdf

**Category:** Financial/Reporting
**Pages:** 10
**Size:** 424KB

### Key Concepts

| Term | Definition |
|------|------------|
| Cash-Based Accounting | CCM recognizes transactions at time they occur (not accrual) |
| Custom Financial Report | Saveable report with max 95-day range |
| Accounts Receivable | Outstanding payments categorized by days past due (Current, 31-60, 61-90, 91+) |
| Active Account Statement | Master financial statement showing all card/eCheck activity |
| Payment Activity | Credit card/eCheck payments and refunds processed by ACTIVE |
| Registration Activity | All registrations including fees, with transfer tracking |
| Additional Purchases Activity | Session options and merchandise purchases |
| Session Summary Report | Financial activity per session |
| Session Type Summary Report | Financial activity grouped by session type |
| Allocation Report | Where payments were allocated |
| Credit Balance | Non-expiring, non-transferable account credit |
| Deferred Revenue | Customers on payment plans with future scheduled payments |
| Failed Installment Payment | Failed auto-charges on payment plans |
| Financial Activity | Summary (Net Revenue, Net Payments, Change in Balance) + Revenue breakdown |
| Net Revenue | Sales - Cancellations - Discounts +/- Transfers |
| Net Payments | Total payments received per season |
| Chargeback | Customer disputes payment with their bank |
| Carryover Balance | Balance owed to ACTIVE when refunds/fees exceed payments |
| eCheck | Bank transfer payment (2-5 business days to process) |

### Financial Reports Catalog

| Report | Purpose | Key Data |
|--------|---------|----------|
| Custom Financial Report | Flexible, saveable queries | Max 95 days, custom columns |
| Accounts Receivable | Aging of unpaid balances | Current, 31-60, 61-90, 91+ days |
| Active Account Statement | Reconciliation with payouts | Card payments, fees, remittance |
| Session Summary | Per-session financials | Revenue, discounts, cancellations |
| Session Type Summary | Grouped by session type | Aggregate session type data |
| Allocation Report | Payment distribution | Where money went |
| Credit Balance Report | Accounts with credits | Non-expiring credits |
| Customer Payments/Refunds | All payment methods | Cash, check, card, eCheck |
| Deferred Revenue | Payment plan balances | Future scheduled payments |
| Failed Installment Payment | Failed auto-charges | Reason for failure |
| Financial Activity | Revenue vs payments | Net revenue, net payments, delta |
| Internal Discount Report | Custom discounts applied | Admin-applied discounts |
| Payment Plan Report | All orders by plan status | Auto-billing, balance details |
| Transaction Report | Individual transactions | Sales, cancellations, discounts, transfers |
| Scheduled Reports | Automated email delivery | Configurable recipients |

### Payment Types

| Type | Processing Time | In Account Statement | Notes |
|------|----------------|---------------------|-------|
| Credit Card | Immediate | Yes | Processing fees apply |
| eCheck | 2-5 business days | After processed | Can span pay periods |
| Cash | N/A | No | Manual tracking |
| Check | N/A | No | Manual tracking |
| Credit Balance | Immediate | No (internal) | Non-transferable |

### Fee Models

| Model | Where Fees Appear | Description |
|-------|-------------------|-------------|
| Registration Fee | Registration Activity tab | Per-registration fee |
| Flat Fee | Registration Activity + Additional Purchases | Fixed percentage |
| Processing Fee | Payment Activity tab | Per-transaction card fee |

### Accounts Receivable Aging

```
Current Column:
├── Non-payment-plan orders with balance
└── Payment plan orders not yet due

31-60 Days Column:
└── Payment plan 31-60 days past due date

61-90 Days Column:
└── Payment plan 61-90 days past due date

91+ Days Column:
└── Payment plan 91+ days past due date
```

### Financial Formulas

```
Net Revenue = Sales - Cancellations - Discounts +/- Transfers
Net Payments = Total payments received (all methods)
Change in Balance = Net Revenue - Net Payments
  - Positive: More sold than collected
  - Negative: Collected more than sold (credits, prepayments)
```

### Business Rules

1. **Active fees are non-refundable** - If registration cancelled, fee balance remains
2. **Credit balances never expire** - Stay on account indefinitely
3. **Credit balances are non-transferable** - Cannot move between accounts
4. **eCheck orders locked during processing** - Cannot edit until processed
5. **Chargebacks auto-deducted** - Funds removed until dispute resolved
6. **Carryover balances persist** - Roll to next period if not covered
7. **No failed payment notifications** - Must run report manually

### Scheduled Reports Feature

- Auto-send financial and season reports to selected users
- Excluded: Merchandise Fulfillment, Participant Notes, Season Setup Auditing

### TTNTS121 Mapping

| CCM Feature | TTNTS121 Current | Gap |
|-------------|------------------|-----|
| Custom Financial Reports | None | GAP: No report builder |
| Accounts Receivable aging | None | GAP: No aging tracking |
| Session Summary | Basic stats | PARTIAL: Dashboard stats only |
| Credit Balance system | None | GAP: No account credits |
| Payment Plans | None | GAP: Full payment only |
| Failed payment tracking | None | GAP: No installment system |
| Multiple payment methods | Stripe only | DIFFERENT: Card-only |
| Deferred Revenue | None | GAP: No payment plans |
| Scheduled Reports | None | GAP: No automated reports |
| Net Revenue calculation | None | GAP: No formula-based reporting |
| Chargeback handling | Stripe webhook | PARTIAL: Via Stripe |
| Export to Excel/HTML | None | GAP: No export |

---

## Document 4: CCM - Custom Reports.pdf

**Category:** Reporting
**Pages:** 7
**Size:** 428KB

### Key Concepts

| Term | Definition |
|------|------------|
| Custom Report | User-defined report pulling registration data for a season |
| Season Registration | Base dataset for custom reports (all registrations in season) |
| Session Filters | Narrow report to specific sessions |
| Filter Criteria | Conditions to filter registrants |
| Available Columns | All possible data fields |
| Selected Columns | Fields included in report output |

### Custom Report Creation Flow

```
1. Load Season Registration
   └── Select season → All registrations become base dataset

2. Select Session Filters (Optional)
   └── Narrow to specific sessions within season

3. Set Filter Criteria (Optional)
   ├── Registration Date Range
   ├── Session Option selected
   ├── Tuition selected
   ├── Registration Question answer
   ├── Registration Balance (has/doesn't have)
   └── Registration Status (waitlist/confirmed)

4. Select Columns
   ├── Registration Form answers
   ├── Waiver statuses
   ├── Session name
   ├── Session options
   ├── Participant info
   └── Financial data

5. Run Report
   └── Each registration = one row

6. Export or Save
   ├── Export to Excel
   ├── Export to HTML
   └── Save for reuse
```

### Available Column Categories

| Category | Example Fields |
|----------|----------------|
| Participant | Name, Age as of today, Gender |
| Guardian | Primary P/G Name |
| Session | Session name, GL code, Location, Start/End date, Type |
| Financial | Balance, Tuition, Sold |
| Selections | Session options selected |
| Waivers | Waiver status |
| Registration Forms | All custom question answers |

### Filter Criteria Options

| Filter | Use Case |
|--------|----------|
| Registration Date (UTC) | Registrations within date range |
| Session Option | Specific add-on selected |
| Tuition | Specific price tier |
| Registration Question | Custom form field value |
| Registration Balance | Has balance / No balance |
| Registration Status | Confirmed / Waitlist |

### Report Features

| Feature | Description |
|---------|-------------|
| Save Report | Persist column/filter config for reuse |
| Export to Excel | Download as spreadsheet |
| Export to HTML | Download as web page |
| Export without Loading | Skip preview, direct export (faster) |
| Share | Send report to other users |
| Email Selected People | Direct email from report results |

### Report Limitations

1. **Max 95 days per report** (for Custom Financial Report)
2. **Session filters not saved** - Must re-select on each run
3. **Season-specific** - Each report belongs to one season

### UI Patterns

| Pattern | Description |
|---------|-------------|
| Two-column picker | Available columns ↔ Selected columns |
| Checkbox multi-select | Session filter selection |
| Modal dialogs | Filter criteria, column selection |
| Direct export | From report list without opening |

### TTNTS121 Mapping

| CCM Feature | TTNTS121 Current | Gap |
|-------------|------------------|-----|
| Custom Report Builder | None | GAP: Major feature missing |
| Column picker | None | GAP: No dynamic columns |
| Filter criteria | Basic search | PARTIAL: Only text search |
| Export to Excel | None | GAP: No export |
| Saved reports | None | GAP: No persistence |
| Email from report | None | GAP: No bulk email from results |
| Registration form answers | Minimal fields | GAP: No custom forms |
| Waiver status column | None | GAP: No waivers |

---

## Phase 1 Batch 1b Summary

### Documents Processed: 4/6

| Document | Status | Key Extractions |
|----------|--------|-----------------|
| CCM Online Registration User Guide.pdf | ✅ Complete | 9-step flow, 12 concepts |
| Refund Limit FAQ.pdf | ✅ Complete | Refund limits, MoR model |
| Financial Overview User Guide.pdf | ✅ Complete | 14 reports, fee models, aging |
| CCM - Custom Reports.pdf | ✅ Complete | Report builder, filters, exports |

### Cumulative Gap Analysis Update

**Critical Reporting Gaps Identified:**
1. **Custom Report Builder** - Major missing feature
2. **Export functionality** - No Excel/HTML/CSV export
3. **Accounts Receivable aging** - No payment tracking by days overdue
4. **Scheduled/automated reports** - No email delivery
5. **Financial Activity dashboard** - No Net Revenue/Payments formulas

**Critical Financial Gaps Identified:**
1. **Payment Plans** - No installment support
2. **Credit Balance system** - No account credits
3. **Multiple payment methods** - Card only (no cash/check tracking)
4. **Failed payment tracking** - No installment failure monitoring
5. **Deferred Revenue tracking** - No future payment visibility

---

## Document 5: Report Concierge User Guide.pdf

**Category:** Reporting/Automation
**Pages:** 4
**Size:** 448KB

### Key Concepts

| Term | Definition |
|------|------------|
| Report Concierge | Scheduled report automation - reports auto-generate on user-defined cadence |
| Report Process Automation | Business process integration via scheduled reports |
| Scheduled Report | Report configured to run automatically at intervals |
| Concierge Request | The scheduled report configuration |
| Dynamic Date Range | Relative date ranges (yesterday, last 7 days, last month, last 3 months) |
| Report URL | Static link to generated report (4-year shelf life) |

### Use Cases

1. **Weekly Waitlist Reports** - Send to Program Directors during registration peak
2. **Failed Payments Report** - Monday morning delivery to finance team
3. **Daily Attendance Report** - Previous day's attendance for archiving

### Schedulable Reports

**Finance Reports:**
- Accounts Receivable
- Credit Balance
- Customer Payments / Refunds
- Failed Installment Payment
- Financial Activity
- Internal Discount
- Payment Plan
- Transaction Report
- Custom Financial Report

**Operations/Season Reports:**
- Cart Abandonment
- Daily Attendance
- Merchandise Purchase
- Participant Attendance
- Session Capacity
- Waitlist Report
- Check-in Report (PDF)
- Waitlist and Session Registration (PDF)
- Custom Report

### Scheduling Configuration

| Setting | Options |
|---------|---------|
| Report Name | Custom naming |
| Date Range | Yesterday, Last 7 days, Last month, Last 3 months |
| Frequency | User-defined cadence |
| Expiration Date | Finance: 365 days default; Operations: 31 days after season end |
| Recipients | Agency users only |
| Email Subject | Customizable (except Custom Financial Report) |
| Email Body | Customizable message |

### Report Limits & Rules

| Rule | Value |
|------|-------|
| Max scheduled reports | 100 per agency |
| Paused/expired reports | Don't count toward limit |
| Max reactivation | 1 year from current day |
| Email delivery time | 00:00 UTC |
| URL shelf life | 4 years |
| Recipients | Agency users only (no external) |

### Date Range Semantics by Report

| Report | Date Range Meaning |
|--------|-------------------|
| Cart Abandonment | Abandonment Date |
| Daily Attendance | Session Date |
| Merchandise Purchase | Date of Purchase |
| Participant Attendance | Attendance Date |
| Waitlist Report | Registration Date |
| Financial Reports | Transaction/Order Date |
| Session Capacity | N/A (no date range) |
| Check-In Report | N/A (no date range) |
| Credit Balance | N/A (no date range) |

### Concierge Actions

| Action | Description |
|--------|-------------|
| Create | Via "Schedule" button on report screen |
| Edit | Modify scheduling instructions |
| Rename | Change report name |
| Pause | Temporarily stop delivery |
| Delete | Remove scheduled report |
| Reactivate | Extend expired report |

### Business Rules

1. **Report parameters immutable** - Cannot change filters after scheduling; must create new
2. **Static URLs** - Changes to report definition don't update scheduled versions
3. **No data restrictions** - Recipient's role restrictions don't apply to received reports
4. **Deleted users persist** - Must manually remove from recipient list
5. **Filters retained** - Season report filters now saved (improvement)

### TTNTS121 Mapping

| CCM Feature | TTNTS121 Current | Gap |
|-------------|------------------|-----|
| Scheduled reports | None | GAP: Major automation missing |
| Email delivery | Resend available | PARTIAL: Manual only |
| Cart abandonment report | None | GAP: No abandonment tracking |
| Dynamic date ranges | None | GAP: No relative dates |
| Report URLs | None | GAP: No shareable reports |
| Multi-recipient | None | GAP: No bulk delivery |

---

## Document 6: Thriva Migration to CCM User Guide.docx

**Category:** Integration/Migration
**Pages:** ~5 (extracted text)
**Size:** 508KB

### Key Concepts

This document maps Thriva (legacy system) concepts to CCM equivalents - useful for understanding CCM's architecture.

| Thriva Concept | CCM Equivalent | Location |
|----------------|----------------|----------|
| Programs | Sessions within Season | Season Setup Step 2 |
| Financial Options | Tuition, Session Options, Global Options, Merchandise | Various |
| Form Builder | Registration Forms | Season Setup Step 7 |
| Data Center | People tab (Family Accounts) | Home > People |
| Report Center | Season Reports + Finance Reports | Separate locations |
| Communication Center | Email tab | Home > Email |

### CCM Architecture Hierarchy

```
Organization
└── Season
    └── Program/Session
        ├── Tuition (pricing)
        ├── Session Options (add-ons, session-specific)
        ├── Global Session Options (reusable across seasons)
        └── Merchandise (physical goods)
```

### Financial Options Types

| Type | Scope | Description |
|------|-------|-------------|
| Tuition | Per session | Base pricing for session |
| Session Option | Single program | Add-on tied to specific program |
| Global Session Option | Cross-season | Reusable add-on across all seasons |
| Merchandise | Cross-season | Physical goods, inventory tracked |

### Registration Form Features

| Feature | Description |
|---------|-------------|
| Registration Form Questions | Custom data collection |
| Electronic Waivers | Digital signature capture |
| Participant Photo | Upload via online account or admin |
| Supplemental/Follow-up Forms | Post-registration data collection |
| Automatic Email Reminders | Nudge to complete supplemental forms |

### Form Customization Options

| Option | Location |
|--------|----------|
| Logo/Image | Season Setup Step 6 or Account Settings |
| Color customization | Season Setup Step 6 |
| Form Header | Season Setup Step 6 |
| Background Image | Season Setup Step 6 |
| Preview | "See a Preview" button |

### Family Account Features (People Tab)

| Feature | Description |
|---------|-------------|
| Manage registration | View/edit registrations |
| Order/Transaction History | Payment history |
| View/Edit Registration Answers | Form data |
| Edit Purchase | Modify add-ons |
| Transfer participant | Move between sessions |
| Add Discount or Coupon Code | Apply discounts |
| Partial refund | Refund portion |
| Cancel registration | Full cancellation |
| Update contact info | Edit details |
| Complete internal registration | Admin-side booking |
| Download Financial Statement | Per-account statement |
| Add notes | Internal comments |
| Send Email | Direct communication |
| View Email History | Sent messages |
| Make a payment | Process payment |
| Link accounts | Connect related accounts (no merge) |

### Report Types

| Type | Scope | Data |
|------|-------|------|
| Seasonal Reports | Within season | Participant/registration data |
| Finance Reports | Cross-season | Financial data |
| Segment Reports | Cross-season | Demographics only |
| Cross-Season Reports | Cross-season | Custom report export |
| Fulfillment Report | Cross-season | Merchandise delivery status |
| Session Option Purchase Report | Cross-season | Add-on sales |

### Communication Features

| Method | Use Case |
|--------|----------|
| Mass Email (Email tab) | Bulk to all or filtered participants |
| Email from Family Account | Direct to individual |
| Email from Reports | Bulk to report results |

### Season Setup Steps (9 total)

1. Season basics
2. **Sessions** - Programs, tuition, session options
3. (Not specified in doc)
4. (Not specified in doc)
5. (Not specified in doc)
6. **Look and Feel** - Form branding
7. **Registration Forms** - Questions, waivers
8. **Confirmation Emails** - Post-registration messages
9. (Not specified in doc)

### TTNTS121 Mapping

| CCM Feature | TTNTS121 Current | Gap |
|-------------|------------------|-----|
| Season hierarchy | Program → Session | ✓ Similar structure |
| Tuition options | Session.price | ✓ Implemented |
| Session Options | None | GAP: No add-ons |
| Global Session Options | None | GAP: No reusable add-ons |
| Merchandise | None | GAP: No product sales |
| Registration Forms | Minimal fields | GAP: No custom forms |
| Electronic Waivers | None | GAP: No waivers |
| Supplemental Forms | None | GAP: No follow-up forms |
| Form branding | None | GAP: No customization |
| Family Accounts (People) | Bookings list | PARTIAL: No unified account |
| Transfer participant | None | GAP: No transfers |
| Account linking | None | GAP: No account relationships |
| Segment Reports | None | GAP: No demographics |
| Cross-Season Reports | None | GAP: No cross-season |
| Mass Email | Campaigns | ✓ Recently implemented |
| Email from account | None | GAP: No per-booking email |

---

## Phase 1 Complete Summary

### Documents Processed: 6/6 ✅

| Document | Status | Category | Key Extractions |
|----------|--------|----------|-----------------|
| CCM Online Registration User Guide.pdf | ✅ | Registration | 9-step flow, 12 concepts |
| Refund Limit FAQ.pdf | ✅ | Financial | Refund limits, MoR model |
| Financial Overview User Guide.pdf | ✅ | Financial | 14 reports, fee models |
| CCM - Custom Reports.pdf | ✅ | Reporting | Report builder, filters |
| Report Concierge User Guide.pdf | ✅ | Automation | Scheduled reports, 18 report types |
| Thriva Migration to CCM User Guide.docx | ✅ | Integration | System architecture, feature mapping |

### Phase 1 Gap Analysis Summary

#### Critical Gaps (Core Functionality Missing)

| Gap | Priority | Complexity | Notes |
|-----|----------|------------|-------|
| User accounts / login | HIGH | HIGH | Enables all other features |
| Custom registration forms | HIGH | MEDIUM | Data collection flexibility |
| Payment plans / installments | HIGH | HIGH | Common customer request |
| Waiver/signature system | HIGH | MEDIUM | Legal requirement |
| Report builder | MEDIUM | HIGH | Complex but valuable |
| Export to Excel/CSV | MEDIUM | LOW | Quick win |

#### Medium Gaps (Enhanced Features)

| Gap | Priority | Complexity | Notes |
|-----|----------|------------|-------|
| Coupon/discount codes | MEDIUM | MEDIUM | Marketing tool |
| Credit balance system | MEDIUM | MEDIUM | Retention feature |
| Multi-person discounts | MEDIUM | LOW | Sibling discount |
| Session options (add-ons) | MEDIUM | MEDIUM | Upsell opportunity |
| Merchandise sales | LOW | HIGH | Physical goods |
| Scheduled reports | MEDIUM | MEDIUM | Automation |
| Cart abandonment tracking | MEDIUM | LOW | Recovery emails |
| Transfer between sessions | MEDIUM | MEDIUM | Flexibility |

#### TTNTS121 Strengths (Already Implemented)

| Feature | CCM Equivalent | Status |
|---------|----------------|--------|
| Session selection | Session List | ✓ Complete |
| Shopping cart | Shopping Cart | ✓ Complete |
| Stripe payments | Credit Card | ✓ Complete |
| Confirmation email | Confirmation Email | ✓ Complete |
| Waitlist | Waitlist | ✓ Complete |
| Mass email campaigns | Email tab | ✓ Recently added |
| Basic admin dashboard | Dashboard | ✓ Complete |

### Glossary: CCM → TTNTS121 Term Mapping

| CCM Term | TTNTS121 Term | Notes |
|----------|---------------|-------|
| Season | Program | Container for sessions |
| Session | Session | Individual bookable unit |
| Participant | Child | The attendee |
| Parent/Guardian | Parent | The account holder |
| Registration | Booking | The transaction |
| Tuition | Price | Session cost |
| Order | (Booking) | Single transaction |
| Family Account | (No equivalent) | Unified customer record |
| Active Account | (No equivalent) | Customer login |

---

**Phase 1 Complete. Output saved to:** `phase-1-foundation.md`

*Next: Phase 2 Batch 2a - Attendance Tracking + Online Account*
