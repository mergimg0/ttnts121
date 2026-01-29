# Phase 3: Advanced Features Extraction

Generated: 2026-01-28
Status: In Progress

---

## Document 12: ACTIVE Reserve Agency User Guide.pdf

**Category:** Reservations/Facilities
**Pages:** 14
**Size:** 1.0MB

### Key Concepts

| Term | Definition |
|------|------------|
| ACTIVE Reserve | Separate product for private (1-on-1) lesson scheduling |
| Private Lesson | Individual booking with specific instructor and timeslot |
| Complex | Physical location/building where lessons occur |
| Availability Schedule | Date ranges defining open/closed hours for lessons/instructors |
| Instructor | Teacher assigned to lessons with own availability |
| Lesson Mode | Offline (in-person) or Online (virtual) |
| Display Status | Online (public) or Internal Only (hidden) |
| Registration Start Date | When lesson becomes bookable |
| Registration Close Date | Cutoff for bookings |

### Reserve Admin Navigation

| Section | Purpose |
|---------|---------|
| Calendar | View booked lessons |
| Facility | Manage facilities and facility types |
| Lessons | Create/manage lesson offerings |
| Instructors | Manage instructor profiles |
| Finance | View remittances and financial reports |
| Setup | Availability schedules, complexes, discounts, waivers, style |

### Complex Configuration

| Field | Description |
|-------|-------------|
| Complex name | Display name |
| Address (line 1, 2, city, state, zip, country) | Full location |
| Phone number | Contact |
| Fax | Secondary contact |
| Contact person | Name of manager |

**Rule:** Cannot delete complex if assigned to a lesson.

### Availability Schedules

**Schedule Types:**
- **Open hours**: Days/hours when available
- **Closed**: Days/dates when unavailable

**Date Range Logic:**
- If range A contains range B → B takes effect on overlap
- If ranges intersect → Later start date takes effect

**Schedule Components:**
- Schedule name
- Multiple date ranges
- Per-range: Open/Closed, days of week, hours
- Import holidays feature

### Lesson Configuration

| Field | Description |
|-------|-------------|
| Lesson name | Display title |
| Availability schedule | When bookable |
| Instructors | Assigned teachers (optional) |
| Lesson mode | Offline/Online |
| Complex | Location (offline only) |
| Price | Cost per lesson |
| Registration start date | When visible/bookable |
| Registration close date | Booking cutoff |
| Age restrictions | Min/max age |
| Display status | Online/Internal only |
| Description | Details |

**Online Lesson Fields:**
- Online lesson instructions
- Join URL
- Join by phone
- Online lesson ID
- Password

### Instructor Configuration

| Field | Description |
|-------|-------------|
| First name, Last name | Identity |
| Email | Receives booking confirmations |
| Availability schedule | When available (optional = always) |
| Online meeting setup | Per-instructor meeting details |

**Instructor-Lesson Availability Logic:**
- No instructor → Lesson follows its schedule
- With instructors → Intersection of lesson + instructor schedules
- No instructor schedule → Instructor always available

### Multi-Lesson Discounts

| Setting | Options |
|---------|---------|
| Discount name | Label |
| Applicable lessons | Which lessons qualify |
| Application order | Benefit to customer |
| Give discount to | All items when threshold reached |
| Tiers | Up to 9 tiers ($ or % off) |

### Waiver Configuration

| Field | Description |
|-------|-------------|
| Waiver name | Label |
| Applicable lessons | Which lessons require |
| Waiver content | Up to 20,000 characters |

**Rules:**
- Can edit/delete before signed
- Cannot delete after signed

### Financial Reports

| Report | Description |
|--------|-------------|
| ACTIVE Remittances | Payouts from ACTIVE to organization |
| Remittance detail | Breakdown by period |

---

## Document 13: ACTIVE Reserve Consumer Experience.pdf

**Category:** Reservations/Consumer UX
**Pages:** 12
**Size:** 1.1MB

### Consumer Registration Flow

```
1. View Lessons Listing
   ├── See: Name, Location, Date range, Age range, Instructors, Price
   ├── Click location link → View address popup
   ├── Click lesson name → View details modal
   └── Click "View" → Start booking

2. Select Date
   ├── 2-month calendar view
   ├── Unavailable dates (fully booked) disabled
   └── Click available date

3. Select Timeslot
   ├── Weekly date selector navigation
   ├── Filter by instructor dropdown
   ├── View: Time, Instructor, Duration, Price
   ├── Sold-out → Greyed + "Sold" badge
   ├── Reserved by others → "Reserved" badge
   └── Click checkmark to select (max 120 timeslots)

4. Account Information
   ├── Enter email
   ├── Sign in to ACTIVE Passport OR
   └── Guest registration (accept Terms/Privacy)

5. Participant Selection
   ├── "Register a new participant" OR
   ├── Select existing participant from account
   ├── Minor → Confirm legal guardian
   └── Other adult → Enter their phone/email

6. Waivers and Agreements
   ├── ACTIVE waiver (always)
   ├── Custom organization waivers
   └── Guardian signs for minors

7. Checkout
   ├── Order review
   ├── Payment methods: Credit card, eCheck/EUDD
   ├── Multiple saved cards supported
   ├── Billing address
   └── Receipt email address

8. Confirmation
   ├── Order confirmation page
   ├── Confirmation email to consumer
   └── BCC to instructor(s)
```

### Timeslot Reservation Rules

| Rule | Behavior |
|------|----------|
| Selection reservation | 15 minutes of inactivity |
| Active extension | While browsing, reservation continues |
| Security logout | 30 minutes inactivity → auto logout |
| Max timeslots | 120 per order |
| Lesson type restriction | Single lesson type per cart |

### Timeslot Status Indicators

| Status | Display | Behavior |
|--------|---------|----------|
| Available | Checkmark icon | Can select |
| Sold | "Sold" badge, greyed | Cannot select |
| Reserved | "Reserved" badge | Cannot select, may become available |

### Payment Methods

| Method | Description |
|--------|-------------|
| Credit card | Saved cards supported |
| eCheck/EUDD | Bank transfer option |

### Email Notifications

| Email | Recipients | Content |
|-------|------------|---------|
| Order confirmation | Consumer + BCC instructors | Registration summary, lesson details |
| Payment receipt | Consumer | Payment and billing details |

### UI Patterns

| Pattern | Description |
|---------|-------------|
| 2-month calendar | Date selection with unavailable dates disabled |
| Weekly selector | Navigate weeks with arrows |
| Instructor filter | Dropdown to filter by teacher |
| Running total | Shows "TOTAL: $X.XX" with "Book now" button |
| Responsive design | Mobile-friendly layout |

### TTNTS121 Mapping (Reserve Features)

| Reserve Feature | TTNTS121 Current | Gap/Relevance |
|-----------------|------------------|---------------|
| Timeslot booking | Session-based | DIFFERENT: We do sessions, not timeslots |
| Instructor assignment | None | GAP: Could add coach assignment |
| 2-month calendar | Basic date display | PARTIAL: Could enhance |
| Availability schedules | Session dates only | GAP: No complex scheduling |
| Online lessons | None | GAP: No virtual option |
| Multi-lesson discounts | None | GAP: No quantity discounts |
| Reservation hold (15 min) | None | GAP: No cart reservation |
| Guest checkout | Required login | DIFFERENT: We don't require accounts |
| Saved payment cards | None | GAP: One-time payments only |

### Relevance Assessment

**ACTIVE Reserve is a DIFFERENT product** focused on:
- 1-on-1 private lessons with instructors
- Timeslot-based booking (specific times)
- Facility/resource scheduling

**TTNTS121 uses CCM model** focused on:
- Group sessions/classes
- Session-based enrollment (date ranges)
- Program registration

**Transferable Concepts:**
1. Instructor/coach assignment to sessions
2. Age eligibility validation
3. Multi-item discount tiers
4. Waiver per-lesson configuration
5. Calendar-based availability display

---

## Phase 3 Batch 3a Summary

### Documents Processed: 2/8

| Document | Status | Key Extractions |
|----------|--------|-----------------|
| ACTIVE Reserve Agency User Guide.pdf | ✅ | Admin config for lessons, instructors, schedules |
| ACTIVE Reserve Consumer Experience.pdf | ✅ | Consumer booking flow, timeslot UX |

### Key Insight

ACTIVE Reserve is a **separate product** from CCM, designed for:
- Private 1-on-1 lessons
- Facility reservations
- Resource scheduling

For TTNTS121 (children's football coaching), the **CCM model is more appropriate** since we deal with:
- Group sessions with capacity limits
- Weekly recurring programs
- Session-based (not timeslot-based) enrollment

**However**, Reserve patterns could inform future features:
- Coach/instructor assignment
- Availability calendar display
- Multi-lesson package discounts

---

---

## Document 14: Integrating with CCM 3.20.pdf (API Reference)

**Category:** API/Integration
**Pages:** 200+
**Size:** 1.3MB
**Version:** 3.20 (CCM 15.11)

### API Overview

| Property | Value |
|----------|-------|
| Base URL | `https://awapi.active.com/rest/` |
| Format | JSON |
| Auth | Username + Password + Agency name + Security token |
| Content-Type | `application/json` |
| Time zone | All dates/times in UTC |
| Array limit | Max 2000 IDs per request |

### API Categories

| Category | Latest Version | Purpose |
|----------|---------------|---------|
| Season Info | v2 | Season configuration and dates |
| Session Info | v6 | Session details, capacity, restrictions |
| Tuition Info | v3 | Pricing, early-bird tiers |
| Session Options | v2 | Add-on items for sessions |
| Registration Info | v6 | Enrollment data with filters |
| Payment Info | v1 | Payment/refund records |
| Payment Allocation | v1 | Per-line-item payment breakdown |
| Person Info | v2 | Participant/parent details |
| Custom Questions | v3 | Form responses by person |
| Family Info | v3 | Family relationships |
| Group Info | v2 | Group assignments |
| Merchandise | v2 | Product catalog and purchases |
| Financial Reports | v1 | Custom report generation |
| Pickup List | v1 | Authorized pickup persons |

### Key APIs - Season Info (v2)

**Endpoint:** `camps-season-info-v2`

**Input Parameters:**
| Parameter | Type | Required |
|-----------|------|----------|
| seasonIds | array | Optional (max 2000) |
| dateRange.startDate | datetime | Optional |
| dateRange.endDate | datetime | Optional |

**Response Fields:**
| Field | Description |
|-------|-------------|
| seasonId | Unique identifier |
| name | Season name |
| firstDateTime | Season start date |
| lastDateTime | Season end date |
| registrationGoal | Target registrations |
| revenueGoal | Target revenue |
| registrationCount | Actual registrations |
| totalSales | Actual revenue |
| seasonState | Status |
| registrationOpenOn | When reg opens |
| sessionIds[] | Sessions in season |
| lastModifiedDateTime | Change timestamp |

### Key APIs - Session Info (v6)

**Endpoint:** `camps-session-info-v6`

**Input:** Array of sessionIds (max 2000)

**Response Fields:**
| Field | Description |
|-------|-------------|
| id | Session ID |
| name | Display name |
| sessionDescription | Details text |
| startDate | Session start |
| endDate | Session end |
| registrationOpenDate | When bookable |
| registrationCloseDate | Booking cutoff |
| location | Venue details |
| availability | Spots remaining |
| genderRestriction | M/F/Any |
| ageRestrictionDate | Age calculated as-of date |
| minAgeRestriction | Min age |
| maxAgeRestriction | Max age |
| minGradeRestriction | Min school grade |
| maxGradeRestriction | Max school grade |
| earlyBirdPricingDate | Price tier cutoff |
| waitlistEnabled | Boolean |
| tuitionIds[] | Associated pricing |
| sessionOptionIds[] | Add-on items |
| dayOvernight | Day/overnight type |
| daysOfWeek[] | Which days |
| startTimeOfDay | Daily start time |
| endTimeOfDay | Daily end time |
| sessionType | Classification |
| capacity | Max registrations |
| internalID1 | Custom ID field 1 |
| internalID2 | Custom ID field 2 |
| registrationOpenDateTime | Full datetime for reg open |
| registrationCloseDateTime | Full datetime for reg close |

### Key APIs - Tuition Info (v3)

**Endpoint:** `camps-tuition-info-v3`

**Input:** tuitionIds[] + dateRange

**Response Fields:**
| Field | Description |
|-------|-------------|
| tuitionId | Unique ID |
| name | Tuition name |
| regularPrice | Standard price (after early-bird expires) |
| availability | Spots remaining |
| capacity | Max for this tuition |
| description | Details |
| tuitionType | Classification |
| priceTiers[] | Early-bird pricing (up to 4 tiers) |
| lastModifiedDate | Change timestamp |

**Price Tier Structure:**
| Field | Description |
|-------|-------------|
| id | Tier ID |
| tierPrice | Price for this tier |
| expireDate | When tier expires |

### Key APIs - Registration Info (v6)

**Endpoint:** `camps-registration-info-v6`

**Input Parameters:**
| Parameter | Type | Required |
|-----------|------|----------|
| sessionIds[] | array | YES (max 2000) |
| seasonId | string | YES |
| startDate | datetime | Optional |
| merchandiseIds[] | array | Optional |
| merchandiseItemIds[] | array | Optional |
| filter.regUpdateDate | datetime | Optional |
| filter.regUpdateTypes[] | enum | Optional (TRANSFER, EDIT, SALE, CANCELLED) |
| filter.merchandiseUpdateDate | datetime | Optional |
| filter.merchandiseUpdateTypes[] | enum | Optional (SALE, ADD_PURCHASE, CANCELLED) |
| filter.sessionOptionUpdateDate | datetime | Optional |
| filter.sessionOptionUpdateTypes[] | enum | Optional |

**Response Summary:**
| Field | Description |
|-------|-------------|
| sessionId | Session ID |
| registrationCount | Active registrations |
| waitlistCount | Waitlisted count |
| waitlistDetails | Waitlist info |
| totalRevenue | Revenue from session |
| registrationDetails[] | Individual records |

**Registration Detail Fields:**
| Field | Description |
|-------|-------------|
| registrationId | Unique reg ID |
| personId | Participant ID |
| regDate | Registration timestamp |
| tuitionId | Pricing used |
| sessionOptions[] | Add-ons purchased |
| merchandiseItems[] | Merch purchased |
| saleAmount | Total charged |
| balance | Outstanding amount |
| groupIds[] | Assigned groups |
| UpdateType | SALE/EDIT/TRANSFER/CANCELLED |
| UpdateDate | Last change timestamp |

**Update Type Semantics:**
| Scenario | API Response |
|----------|--------------|
| Manual cancel | Original (SALE) + Original (CANCELLED) + New (SALE) |
| Tuition change | Original (SALE) + Original (EDIT) + New (SALE) |
| Transfer | Original (SALE) + Original (TRANSFER) + New (SALE) |

### Key APIs - Payment Info

**Endpoint:** `camps-payment-info`

**Input:** Date range (max 60 days) + optional seasonIds[]

**Response Fields:**
| Field | Description |
|-------|-------------|
| createDate | Payment timestamp |
| orderInfo.orderNumber | Order reference |
| orderInfo.registrationIds[] | Related registrations |
| paymentMethod | Card type/cash/check |
| paymentDetails[] | Per-item breakdown |
| paymentId | Unique payment ID |
| paymentProcessID | Processor reference |

### Key APIs - Payment Allocation

**Endpoint:** `camps-payment-allocation-info`

**Input:** Date range (max 60 days) + optional filters

**Response Fields:**
| Field | Description |
|-------|-------------|
| dateTime | Allocation timestamp |
| paymentType | CREDIT_CARD, CHECK, CASH, EXTERNAL, ECHECK, TRANSFER, ACCOUNT_PAYMENT, ALIPAY, WECHAT |
| paymentId | Payment reference |
| orderId | Order reference |
| seasonId | Season reference |
| sessionId | Session reference |
| lineItemType | TUITION, SESSION_OPTION, MERCHANDISE, MEMBERSHIP |
| lineItemId | Item reference |
| amount | Positive (allocation) or negative (deallocation) |

### Key APIs - Person Info (v2)

**Endpoint:** `camps-person-detail-info-v2`

**Input:** personIds[] + optional lastUpdateDate

**Response Fields:**
| Field | Description |
|-------|-------------|
| personId | Unique ID |
| firstName, middleName, lastName | Name |
| homePhoneNumber, businessPhoneNumber, cellPhoneNumber | Phones |
| dateOfBirth | DOB |
| email | Primary email |
| gender | M/F |
| grade | School grade |
| familyId | Family reference |
| address | Full address object |
| isPrimaryParent | Boolean |
| isSecondaryParent | Boolean |
| lastUpdateDate | Change timestamp |

### Key APIs - Custom Questions (v3)

**Endpoint:** `camps-person-answer-info-v3`

**Input:** personIds[] + optional lastUpdateDate + visible filter

**Response Fields:**
| Field | Description |
|-------|-------------|
| personId | Person reference |
| questionAnswers[] | Answer records |
| label | Question text |
| answer | Response value |
| isDatetime | Boolean |
| isMultiOption | Boolean |
| visible | VISIBLE/INVISIBLE/ALL |
| formQuestionId | Question ID |
| lastUpdateDate | Change timestamp |

### Key APIs - Pickup List

**Endpoint:** `camps-pick-up-list-info`

**Input:** Single personId

**Response Fields:**
| Field | Description |
|-------|-------------|
| firstName | First name |
| lastName | Last name |
| homePhone | Phone number |

### API Versioning Notes

| API | Deprecation Status |
|-----|-------------------|
| camps-tuition-info | Deprecated - use v3 |
| camps-registration-info | Deprecated - use v6 |
| camps-session-info | Legacy - use v6 for internal IDs |
| camps-person-answer-info | Use v3 for question type filtering |

### Multiple Price Tier Handling

**Limitation:** Legacy Session APIs (v1-v5) only support:
- Single early-bird price tier per tuition
- Same early-bird expired dates for all tuitions

**Behavior for multiple tiers:**
- If first tiers have same expiry → Returns that date
- If first tiers have different expiry → Returns "12/31/9999"
- If no tiers → Returns null

**Recommendation:** Use `camps-tuition-info-v3` for full price tier support.

---

## Document 15: OnlineAccountOverviewUpdate.pdf

**Category:** Participant Portal
**Pages:** 12
**Size:** 1.3MB

### Accessing Online Account

| Method | Details |
|--------|---------|
| Confirmation email | Link at bottom of email |
| Organization link | Provided by organization |
| Invite email | For internally-registered new users |
| Password reset | "Forgot your Password?" link |

### Payment Features

#### Three Payment Methods

| Method | Description |
|--------|-------------|
| Pay in Full | Pay total account balance across all orders |
| View Bill Details | Pay multiple orders across seasons |
| Pay Bill Now | Custom payment to specific orders |

#### Custom Payment Allocation

- Select "Custom Amount" on orders with multiple registrations
- Manually allocate amount between programs
- Remaining allocation must equal $0 to proceed

#### Default Payment Allocation Logic

| Priority | Condition |
|----------|-----------|
| 1 | Most expensive line item first |
| 2 | If same cost → Earliest start date |
| 3 | If same cost & date → First listed on order |

#### Payment Plans

| Feature | Capability |
|---------|------------|
| View remaining | Click "View Bill Details" |
| Update card | Click "Manage Automatic Payments" |
| No payment to update | Can update card without paying |

### Credit Balance

| Feature | Details |
|---------|---------|
| Display | Upper left corner of account |
| At checkout | Available as payment option |
| Partial credit | Select "Custom Amount" to enable |

### Order Management

#### Print Order Details

**Path:** View Bill Details → View Order Details → Print

**Includes:**
- Payments, Discounts, Balances
- Session name, Date, Location
- Session Cost
- Contact info

#### Add Purchase (Post-Registration)

| Type | Description |
|------|-------------|
| Merchandise | Equipment, clothing |
| Session Options | Lunch, after-school, etc. |

**Rules:**
- Must be enabled by organization
- Full payment required at purchase time
- If items not listed, contact organization

### Form Management

#### Follow-up Forms

| Property | Details |
|----------|---------|
| Location | Online Account under applicable session |
| Format | Same as registration form |
| Status | "Fill Out Form" greyed if expired |
| Expiration | Set by organization |

#### Supplemental Forms

**Workflow:**
1. Download form
2. Print and fill out
3. Scan or photograph
4. Upload back to system
5. Click Submit

**Limits:**
- Max 20 files per upload
- Max 7MB per file
- Cannot add after Submit clicked

### Photo Upload

| Method | Location |
|--------|----------|
| Method 1 | Click blank profile under Registrants |
| Method 2 | Edit Registration Form → Upload Photo tab |

**Accepted formats:** JPG, GIF, PNG
**Max size:** 2MB

### Family Management

#### Secondary Parent

| Feature | Details |
|---------|---------|
| Add | Only if not added during registration |
| Email | Receives organization communications |
| Remove | Cannot be removed once added |
| Edit | Email, phone, photo can be edited |
| Name change | Contact organization |

#### Authorized Pickup

| Property | Details |
|----------|---------|
| Location | Under "Family Members" |
| Scope | Changes are per-participant |
| Edit | Click authorization status or Edit button |

### Self-Service Features

#### Self-Cancellation

- If enabled by organization
- Contact org for required conditions

#### Self-Transfer

- Transfer between sessions in same season
- If enabled by organization

#### Waitlist Invite

| Action | Description |
|--------|-------------|
| Accept | Click "Complete Registration" |
| Expire | After org-configured time limit |
| Remove | Click "Remove me from waitlist" |

### Passport Wallet

**Portal URL:** https://passport.active.com/page/account/wallet

| Section | Features |
|---------|----------|
| My Wallet | Add/remove credit/debit card or E-Check |
| Contact Info | Update name, phone, DOB, address |
| Update Password | Requires current password |

### QR Codes

| Feature | Details |
|---------|---------|
| Use | Check-in/out via ACTIVE Connect or Captivate |
| Access | Confirmation email OR Online Account |
| Wallet | Add to Apple or Google Wallet |

### Calendar View

- Available during registration when selecting sessions
- Shows sessions in calendar format

### TTNTS121 Mapping (Online Account Features)

| CCM Feature | TTNTS121 Current | Gap/Action |
|-------------|------------------|------------|
| Multi-order payment | Single order | GAP: Could add multi-session payment |
| Payment plans | None | GAP: Only full payment supported |
| Credit balance | None | GAP: No account credits |
| Follow-up forms | None | GAP: No post-reg forms |
| Supplemental forms | None | GAP: No document uploads |
| Photo upload | None | GAP: No profile photos |
| Secondary parent | None | GAP: Single guardian only |
| Authorized pickup | None | GAP: No pickup management |
| Self-cancellation | Admin only | GAP: No self-service cancel |
| Self-transfer | Admin only | GAP: No self-service transfer |
| Waitlist accept | Manual | GAP: No online waitlist flow |
| QR check-in | None | GAP: No digital check-in |
| Calendar view | None | GAP: No calendar display |

### Priority Features for TTNTS121

**High Value (Should Implement):**
1. Self-cancellation with refund rules
2. Self-transfer between sessions
3. Waitlist online acceptance
4. Secondary parent/guardian contact
5. Photo upload for participant ID

**Medium Value (Nice to Have):**
1. Payment plans for expensive programs
2. Follow-up forms for medical/dietary info
3. QR code check-in at sessions

**Low Priority:**
1. Calendar view (we have simple session list)
2. Multi-order payment (most have single orders)
3. Supplemental form uploads (paper-based sufficient)

---

## Phase 3 Batch 3b Summary

### Documents Processed: 4/8

| Document | Status | Key Extractions |
|----------|--------|-----------------|
| ACTIVE Reserve Agency User Guide.pdf | ✅ | Admin config for lessons, instructors, schedules |
| ACTIVE Reserve Consumer Experience.pdf | ✅ | Consumer booking flow, timeslot UX |
| Integrating with CCM 3.20.pdf | ✅ | Complete API reference (30+ endpoints) |
| OnlineAccountOverviewUpdate.pdf | ✅ | Participant portal features |

### Key Insights

#### CCM API Integration Opportunities

The CCM public API provides comprehensive data access:
- **Registration data sync** for external reporting
- **Payment tracking** for financial reconciliation
- **Person data** for CRM integration
- **Group assignments** for coach/team management

For TTNTS121, relevant integration patterns:
1. Export registrations to external CRM
2. Sync payments with accounting software
3. Generate custom reports via API
4. Webhook triggers on registration events (not in API, but common pattern)

#### Online Account Feature Gaps

The CCM Online Account has many self-service features that TTNTS121 currently lacks:
- Self-cancellation/transfer (requires refund policy implementation)
- Secondary parent contacts (requires schema update)
- Photo uploads (requires storage solution)
- QR check-in (requires mobile app or web check-in page)

---

---

## Document 16: ACTIVE Connect for CCM user guide.pdf

**Category:** Mobile App / Attendance
**Pages:** 22
**Size:** 1.6MB
**Date:** June 2023

### ACTIVE Connect Overview

**Purpose:** Mobile tablet app for session check-in/check-out

**Key Features:**
- Check participants in/out of sessions
- Modern, user-friendly interface
- Reduces paper consumption
- Consolidated workflow

### User Roles

| Role | Capability |
|------|------------|
| Account Owner | Full access |
| Administrator | Full access |
| Standard | Check-in/out access |
| Coach/Instructor | Check-in/out access |
| Session-restricted users | Only assigned sessions |

### System Requirements

| Platform | Requirement |
|----------|-------------|
| iPad/iPad mini | iOS 14+ |
| Android tablet | Android 9+ |
| Orientation | Landscape only |

### Sign-in Flow

```
1. Select "Camp & Class Manager"
2. Enter ACTIVE Passport credentials
3. Select organization (if multiple)
4. Select season
   └── Option: "Include past seasons" checkbox
```

### Check-in Methods

#### Method 1: By Session

**Path:** ≡ > Activities > Select session

**Features:**
- Default: Today's session occurrences
- Filter by: Date, Activity name, Location
- Shows participant list with attendance status

**Actions per participant:**
| Button/Link | Action |
|-------------|--------|
| Check-in button | Mark checked in |
| Check-out button | Mark checked out |
| "Mark as absent" link | Mark absent |
| "Mark as checked in" | Correct absent status |

#### Method 2: By Participant

**Path:** ≡ > Activities > Participants > Select participant

**Flow:**
1. Select participant from list
2. Tap "Check in" or "Check out"
3. If multiple sessions today → Select specific session
4. If single session today → Auto check-in/out

#### Method 3: By QR Code

**Path:** ≡ > Activities > QR icon > Check in/out

**Flow:**
1. Tap QR scanner icon
2. Select "Check in" or "Check out"
3. Scan participant's QR code
4. If multiple sessions → Select session
5. If single session → Auto action

### QR Code System

#### Enabling QR Codes
- Contact Account Management team
- Organizational setting

#### QR Code Access Points

| Location | Access |
|----------|--------|
| Registration confirmation email | After QR enabled |
| SSUI portal | Family Members > participant > QR icon |
| Apple/Google Wallet | Add from email or portal |

#### Admin QR Export

**Path:** Home > Seasons > [season] > Sessions > Select sessions > Run reports > Roster reports > QR code report

**Export includes:**
- Participant names
- Email addresses
- Check-in/out QR codes

### Attendance Recording Locations

| Location | Path |
|----------|------|
| Attendance portal | Header icon > Attendance portal |
| Quick Links | Home > Quick Links > Attendance portal |
| Session view | Seasons > [season] > Sessions > Attendance tracking |
| Daily report | Seasons > [season] > Reports > Daily Attendance Report |
| Participant report | Seasons > [season] > Reports > Participant attendance report |

### TTNTS121 Mapping (Connect Features)

| Connect Feature | TTNTS121 Current | Gap/Action |
|-----------------|------------------|------------|
| QR code check-in | None | GAP: No QR-based attendance |
| Mobile app check-in | None | GAP: Admin-only tracking |
| Participant QR codes | None | GAP: No participant codes |
| Multiple check-in methods | None | GAP: No mobile workflow |
| Attendance reports | None | GAP: No attendance tracking |
| Apple/Google Wallet | None | GAP: No wallet integration |
| Session-restricted users | None | GAP: No role-based session access |

### Implementation Considerations for TTNTS121

**High Value:**
1. QR code generation for each booking
2. Simple check-in page (web-based, not app)
3. Attendance tracking dashboard

**Technical Requirements:**
1. QR code generation library
2. Mobile-responsive check-in page
3. Attendance data model (check_ins table)
4. Coach role with session restrictions

---

## Document 17: CCM - Online Registration Basics.pdf

**Status:** NOT CONVERTED TO TXT (skipped in batch conversion)

**Action Required:** Convert PDF to text for extraction

---

## Phase 3 Batch 3c Summary

### Documents Processed: 5/8

| Document | Status | Key Extractions |
|----------|--------|-----------------|
| ACTIVE Reserve Agency User Guide.pdf | ✅ | Admin config for lessons |
| ACTIVE Reserve Consumer Experience.pdf | ✅ | Consumer booking flow |
| Integrating with CCM 3.20.pdf | ✅ | Complete API reference |
| OnlineAccountOverviewUpdate.pdf | ✅ | Participant portal features |
| ACTIVE Connect for CCM user guide.pdf | ✅ | Mobile check-in app |
| CCM - Online Registration Basics.pdf | ⚠️ | Not converted (needs txt) |

### Key Insight: QR-Based Attendance

ACTIVE Connect provides a complete attendance tracking solution:
1. **QR generation** at registration
2. **Multiple check-in methods** (session list, participant search, QR scan)
3. **Wallet integration** for easy consumer access
4. **Role-based access** for staff

For TTNTS121, a simplified web-based check-in system could provide:
- Coach-accessible attendance page per session
- Parent QR codes in booking confirmations
- Basic check-in/out tracking

---

---

## Document 18: ACTIVE Captivate for CCM User Guide.pdf

**Category:** Mobile App / Consumer
**Pages:** 16
**Size:** 2.1MB
**Date:** November 2021

### Captivate Overview

**Purpose:** Agency-branded consumer mobile app

**Key Features:**
- Browse and register for sessions
- View registration schedule
- Geolocation-based self-check-in
- Receive organization notifications

### Captivate Portal (Admin)

#### Portal Access
**Path:** CCM AUI > Captivate icon

#### Admin Features

| Feature | Location | Purpose |
|---------|----------|---------|
| Customize app | Organization name > Edit | Change display name |
| Notifications | Front desk > Notifications | Send push notifications |
| App users | Customer management > Customers | View who's using app |
| Sessions | Activity setup > Activities | View available sessions |
| Self-check-in | General > Self check in/out | Configure geolocation rules |

### Notification System

#### Creating Notifications

| Field | Options |
|-------|---------|
| Subject | Title text |
| Message | Body content |
| Schedule | When to send |
| Recipients | All customers OR Registrants in specific sessions + date range |

#### Notification Workflow

```
Create → Save as draft OR Schedule/Send
         ↓
Drafts tab → Edit and send later
Sent tab → View delivery stats
         → SENT count + OPENED count
         → Download recipient report
```

### Geolocation Self-Check-In

#### Configuration Options

| Setting | Description |
|---------|-------------|
| Within distance | KM or Miles from session location |
| Check-in time | Minutes or Hours before session start |
| For activities | Which sessions enable self-check-in |

#### Self-Check-In Patterns

- Multiple patterns can be configured
- Each pattern = distance + time + session filter
- Requires app location permission

### Consumer Mobile App Features

#### Sign-In
- ACTIVE Passport credentials
- Multi-organization support

#### My Schedule (Home)
- Upcoming session schedule
- Future date navigation
- Session details: Session, Tuition, Season, Date/time, Location, Participant

#### Geolocation Check-In Flow

```
1. App opened within range + time
   └── Auto-display self-check-in page
   └── OR: Home > My schedule > "Check in is open now!"

2. Select tuitions to check in

3. Tap "Check in" button

4. Status updates in CCM:
   └── Attendance portal
   └── Daily Attendance Report
   └── Participant notes report
```

#### Registration
- View available sessions
- Register via same workflow as CCM website

#### Notifications
- Lock screen + unlocked notifications
- Notifications icon to view history
- Mark all as read

### TTNTS121 Mapping (Captivate Features)

| Captivate Feature | TTNTS121 Current | Gap/Action |
|-------------------|------------------|------------|
| Agency-branded app | None | GAP: High investment |
| Push notifications | None | GAP: No direct messaging |
| Geolocation check-in | None | GAP: No location-based features |
| Schedule view | Booking confirmation only | GAP: No schedule dashboard |
| In-app registration | Web only | PARTIAL: Could add mobile-friendly web |

### Implementation Notes

**Not Recommended for TTNTS121:**
- Full native app development is expensive
- Requires ongoing app store maintenance
- Low user base doesn't justify investment

**Alternative Approach:**
- Mobile-responsive web portal
- PWA (Progressive Web App) for "Add to Home Screen"
- Email-based notifications (already have)

---

## Document 19: User Guide_Point of Sale.pdf

**Category:** Point of Sale / Merchandise
**Pages:** 25
**Size:** 3.1MB
**Date:** 2020

### ACTIVE POS Overview

**Purpose:** On-site merchandise sales at sessions

**Key Features:**
- CCM integration
- Session merchandise loading
- Cash and credit card payments
- MagTek card reader support
- Offline mode capability
- Order history sync

### System Requirements

| Platform | Requirement |
|----------|-------------|
| iPad | iOS 11+ |
| Samsung Galaxy S4 | Android 9+ |

### Supported Card Readers

| Platform | Card Reader |
|----------|-------------|
| iPad | MagTek iDynamo (Lightning port) |
| Android | MagTek uDynamo (Headphone jack) |

### Security Features

#### Credit Card Security
- Magnetic stripe data encrypted by reader
- Transmitted to PCI-DSS compliant AMS environment
- Not stored in app or device

#### Administrator Recommendations

| Recommendation | Purpose |
|----------------|---------|
| Secure PIN code | Device protection |
| Auto-lock when idle | Prevent unauthorized access |
| Install OS updates | Security patches |
| No root/jailbreak | Maintain security |
| Trusted Wi-Fi only | WPA/WPA2 protected |
| Disable unused wireless | Reduce attack surface |
| Restrict device access | Authorized personnel only |

#### User Recommendations

| Recommendation | Purpose |
|----------------|---------|
| Don't leave unattended | Physical security |
| Lock when not in use | Prevent access |
| Don't share PIN | Access control |
| Treat cardholder data as confidential | PCI compliance |
| Report lost/compromised device | Incident response |

### Offline Mode

**Trigger:** Network disconnection during sale

**Indicators:**
- Red "OFFLINE MODE" status bar

**Limitations:**
| Allowed | Not Allowed |
|---------|-------------|
| Cash payments | Manual card entry |
| Swiped card payments | Camera card scan |

**Offline Transaction Rules:**
- 72-hour submission window
- Auto-processed on reconnection
- Email receipts sent after processing
- Agency responsible for expired/declined payments
- Don't uninstall app with pending transactions

### Sales Workflow

#### Login and Session Selection

```
1. Tap app icon
2. Enter ACTIVE Passport credentials
3. (Optional) GDPR waivers if required
4. Select organization (if multiple)
5. Select session
   └── Option: Current events / Past events
6. Merchandise loaded for session
```

#### Main Sales Screen

| Section | Content |
|---------|---------|
| Left | Search box + available items |
| Right | Current order |

#### Adding Items

| Method | Action |
|--------|--------|
| Tap item | Add to order |
| Tap again | Add another |
| Item variations | Opens variation screen |
| + Add discount | Ad-hoc discount |

**Variation Categories:**
- Size
- Color
- Multiple tiers

#### Removing Items

| Method | Action |
|--------|--------|
| Swipe left + Remove | Remove single item |
| Tap item + Remove | Remove from detail screen |
| Clear all | Remove all items |

### Payment Processing

#### Credit Card (Online)

```
1. Tap "Pay" → Payment screen
2. Select "Credit card"
3. Provide card info:
   - Manual entry
   - Camera scan
   - Swipe through reader
4. (Optional) Email for receipt
5. Tap "Continue"
6. Customer signature
7. Complete order
```

#### Credit Card (Offline)

```
1. Tap "Pay" → Payment screen
2. Coupon discounts → Ad-hoc discounts
3. Select "Credit card"
4. Swipe card ONLY (no manual entry)
5. Verify: Name + Expiration date
6. (Optional) Email for receipt
7. Customer signature
8. Order saved → Submitted on reconnect
```

#### Cash Payment

```
1. Tap "Pay" → Payment screen
2. Tap "Cash"
3. Enter cash received
4. (Optional) Email for receipt
5. Tap "Continue"
6. Provide change if needed
7. Tap "OK"
```

### Order History

#### Data Sync Rules

| Order Type | Visibility |
|------------|------------|
| Completed orders | All users in session |
| Pending offline orders | Only originating user/device |
| Declined offline orders | All users in session |
| Expired offline orders | All users in session |

#### Order Status Icons

| Icon | Status |
|------|--------|
| ✓ | Successfully completed |
| ⏳ | Pending |
| ✗ | Failed (declined or expired) |

#### Filtering Options
- Date range
- Cashier
- Payment method
- Status (multi-select)

#### Order Details View
- Payment method
- Items purchased
- Captured signature (credit)
- Failure reason (if applicable)

### TTNTS121 Mapping (POS Features)

| POS Feature | TTNTS121 Current | Gap/Relevance |
|-------------|------------------|---------------|
| On-site merchandise | None | LOW: No merchandise sales |
| Card reader integration | Stripe online only | N/A: Different use case |
| Offline mode | N/A | N/A: Online-only system |
| Order history | Booking history | PARTIAL: Similar concept |

### Relevance Assessment

**Not Relevant for TTNTS121:**
- TTNTS121 is online-only registration
- No on-site merchandise sales
- No need for card reader hardware

**Transferable Concepts:**
- Order filtering patterns (date, status)
- Receipt email delivery
- Transaction status indicators

---

## Phase 3 Batch 3d Summary

### Documents Processed: 7/8

| Document | Status | Key Extractions |
|----------|--------|-----------------|
| ACTIVE Reserve Agency User Guide.pdf | ✅ | Admin config for lessons |
| ACTIVE Reserve Consumer Experience.pdf | ✅ | Consumer booking flow |
| Integrating with CCM 3.20.pdf | ✅ | Complete API reference |
| OnlineAccountOverviewUpdate.pdf | ✅ | Participant portal features |
| ACTIVE Connect for CCM user guide.pdf | ✅ | Mobile check-in app |
| ACTIVE Captivate for CCM User Guide.pdf | ✅ | Consumer mobile app |
| User Guide_Point of Sale.pdf | ✅ | On-site merchandise sales |
| CCM - Online Registration Basics.pdf | ⚠️ | Not converted (needs txt) |

### Phase 3 Completed Features Summary

| Product | Primary Use | TTNTS121 Relevance |
|---------|-------------|-------------------|
| CCM API | Data integration | HIGH - Export/sync |
| Online Account | Self-service portal | HIGH - Feature gaps |
| ACTIVE Connect | Staff check-in app | MEDIUM - Attendance tracking |
| ACTIVE Captivate | Consumer app | LOW - Too expensive |
| ACTIVE POS | On-site sales | LOW - Not applicable |
| ACTIVE Reserve | Private lessons | LOW - Different model |

---

*Next: Phase 4 - Large Document Processing (Email, Group Assignment, URLs, Season Reports)*
