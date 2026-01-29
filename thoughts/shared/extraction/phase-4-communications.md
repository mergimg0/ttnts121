# Phase 4: Communications & Reporting Extraction

Generated: 2026-01-28
Status: Complete

---

## Document 20: Email Overview FAQ.docx

**Category:** Email/Communications
**Size:** 6.2MB (images removed in txt)

### Key Concepts

| Term | Definition |
|------|------------|
| UTC Time | All scheduled emails send in Universal Time Coordinated |
| Failed Email | Permanent rejection (invalid address, blocked domain) |
| Refused Email | Temporary rejection (blocked sender, full mailbox, server down) |
| Recipient Actions | Tracking who clicked Register Now and completed registration |

### Email Scheduling Time Zones

| Time Zone | UTC Offset (Standard) | UTC Offset (Daylight) |
|-----------|----------------------|----------------------|
| EST | -5 hours | -4 hours |
| CST | -6 hours | -5 hours |
| PST | -8 hours | -7 hours |

**Important:** Reminder emails always send at 12 AM UTC.

### Recipient Filtering Process

```
Email Send Process:
1. Remove unsubscribed emails
2. Remove previously failed emails
3. Remove previously refused emails
4. While delivering: Remove duplicates
   └── Family with 2 kids = 1 email (not 2)
```

### Sent vs Delivered Counts

| Metric | Includes Duplicates | Description |
|--------|---------------------|-------------|
| Sent | Yes | Total emails attempted |
| Delivered | No | Unique addresses successfully reached |

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Email Processing status stuck | Don't use both "Registered For" AND "Not Registered For" in dynamic list |
| Recipients not receiving | Add to SPF record, check blacklist, avoid Yahoo/AOL |
| Yahoo/AOL blocked | These providers block CCM emails - don't use as from address |
| Customer unsubscribed | Contact Support to re-subscribe |
| Multiple emails received | Using multiple recipient lists sends duplicates |
| "From" shows noreply@active.com | Request DKIM key from Support for custom domain |

### DKIM Configuration Steps

1. Contact Support → Request DKIM key
2. IT configures DKIM key
3. Confirm with Support
4. Active validates configuration
5. Change takes effect immediately

---

## Document 21: Email Overview.docx

**Category:** Email/Communications
**Size:** 7.0MB (images removed in txt)

### Email Types

| Type | Description |
|------|-------------|
| Scheduled | Send at later date/time |
| Email Campaigns | Series of emails tracked together |
| Sent | Completed email history |
| Drafts | Work in progress |
| Templates | Reusable email formats |
| Reminder Emails | Auto-send relative to session dates |

### Email Campaigns

**Maximum:** 20 individual blasts per campaign

**Campaign Metrics:**
| Metric | Description |
|--------|-------------|
| Date Range | Spans all email blasts |
| Total Reach | Selected recipients count |
| Sent | After removing duplicates/blocked |
| Opened | Recipients who opened |
| Registered | Completed registration via email |

### Recipient Types

| Type | Source |
|------|--------|
| Dynamic List | Registered participants |
| Imported List | Non-registered contacts |

**Dynamic List Options:**
- Include secondary parents (checkbox)

### Email Design Elements

| Element | Description |
|---------|-------------|
| Page Style | Background color |
| Image | Header/footer, max 2MB, recommended 600px width |
| Button | Hyperlinked custom button |
| Text | Message with merge fields |
| Code | HTML/Inline CSS (no support) |
| Divider | Section separator |
| Social Media | Social URLs |
| Document Links | Attachments as hyperlinks |

### Email Report Metrics

**Delivery:**
| Metric | Description |
|--------|-------------|
| Delivered | Unique valid addresses reached |
| Failed | Permanent rejection |
| Refused | Temporary rejection |

**Recipient Actions:**
| Metric | Description |
|--------|-------------|
| Opened | Estimated opens |
| Registered | Clicked Register Now + completed |
| Clicked | Unique recipients who clicked any link |
| Complained | Marked as junk/spam |

### Text Messaging

**Requirements:**
- Must be enabled by Account Manager
- Uses ACTIVE's default Cell Phone question (not custom)
- Cannot use imported lists

**Limits:**
- 140 characters max
- Cannot cancel once sent

---

## Document 22: Group Assignment User Guide.docx

**Category:** Organization/Groups
**Size:** 6.3MB (images removed in txt)

### Group Types

**Pre-created options:**
- Cabins
- Teams
- Classes
- Custom types

### Group Assignment Settings

| Setting | Options |
|---------|---------|
| Group Control | Online (public) or Internal (admin only) |
| Max Groups | Limit groups participants can create |
| Online Registration | Join existing / Create own / Both |
| Password | Required / Optional / None |

### Group Setup Flow

```
1. Create Group Assignment
   └── Select Group Type
2. Select Participants/Sessions
   └── Which sessions get this assignment
3. Create Group List(s)
   └── Admin-created groups
4. Assign Participants
   └── Manual assignment or self-selection
```

### Group Features

| Feature | Description |
|---------|-------------|
| Captain | Designate group leader |
| Description | Group details |
| Password | Restrict access to group |

### Group Reports

**Default Columns:**
- First Name
- Last Name
- Session Name
- Participant Age as of Today

### Email Group Members

**Path:** Reports > New Custom Report > Group Records > Participant: Group Assignment

**Email Options:**
- Everyone (all groups)
- Specific group
- Individual participants

### TTNTS121 Mapping (Group Assignment Features)

| CCM Feature | TTNTS121 Current | Gap/Action |
|-------------|------------------|------------|
| Group types (cabin/team) | None | GAP: Could add team assignments |
| Self-selection during reg | None | GAP: No group features |
| Group passwords | None | GAP: N/A |
| Captain designation | None | GAP: Could be useful for team leads |
| Group reports | None | GAP: No group tracking |

---

## Document 23: Registration URL Links.docx

**Category:** Registration/Links
**Size:** 6.4MB (images removed in txt)

### URL Link Types

| Type | Purpose | Access |
|------|---------|--------|
| Primary Registration Link | All active seasons | Quick Links on Home |
| Season Direct Link | Specific season | Download Links Excel |
| Location Direct Link | Sessions at location | Download Links Excel |
| Session Direct Link | Specific session | Download Links Excel |
| Session Type Direct Link | Filter by type | Download Links Excel |

### Getting Direct Links

```
1. Home > Copy Registration URL
2. Select season from dropdown
3. Click "Download Links"
4. Open Excel spreadsheet
5. Select tab: Season / Location / Session / Session Type
6. Copy Registration Link column
```

### Private Season/Session Setup

**Private Season:**
1. Contact Support to hide from ACTIVE.com
2. Programs sync Monday (changes not immediate)
3. Share direct season link with preferred participants

**Private Session (Internal Only):**
- Requires at least one public session in same season
- Consider "Donation" session as placeholder
- Use Session direct link (not Season/Location/Type links)

### Registration vs Online Account Links

| Link Type | Purpose | Users |
|-----------|---------|-------|
| Registration Link | Register for sessions | New + existing |
| Online Account Link | View bills, pay, check registrations | Existing only |

**Note:** Users can access registration FROM online account, but cannot access online account FROM registration.

### TTNTS121 Mapping (URL Features)

| CCM Feature | TTNTS121 Current | Gap/Action |
|-------------|------------------|------------|
| Direct session links | Basic program pages | PARTIAL: Have program-specific URLs |
| Private sessions | None | GAP: All public |
| Location-based links | None | LOW: Single location |
| Online account portal | None | GAP: No self-service portal |

---

## Document 24: Camp & Class Manager Season Reports.docx

**Category:** Reporting
**Size:** 6.7MB (images removed in txt)

### Pre-Created Reports

| Report | Description | Filter Options |
|--------|-------------|----------------|
| Cart Abandonment | Incomplete registrations (90 days) | Session, Date Range, Later Registration |
| Daily Attendance | Attendance records | Session, Tuition, Session Date |
| Merchandise Purchase | Current purchases | Merchandise, Session, Date |
| Participant Notes | All registrant notes | Note Type, Creation Date, Edit Date |
| Session Capacity | Registration capacity | Upcoming, Remaining Spots |
| Waitlist Report | Waitlist registrations | Session, Date, Tuition |

### Pre-Created PDF Reports

| Report | Content |
|--------|---------|
| Check-in Report | Participant list with notes, groups, options, waivers |
| Registration Form Report | Completed forms with optional supplements/waivers |
| Waitlist & Registration History | Activity log per participant |

### Custom Report Features

| Feature | Description |
|---------|-------------|
| Edit Columns | Select/remove data columns |
| Add Blank Column | Manual data entry column |
| Column Label | Rename columns |
| Edit Filter Criteria | Apply filters |
| Group Records | Group by field |
| Save Report | Reuse later |

### Common Custom Reports

| Report Type | Purpose |
|-------------|---------|
| Age Report | Participant ages |
| Contact List | Phone, email, address |
| Discount Report | Discount totals per person |
| Balance Report | Season balances |

### Report Functions

| Function | Description |
|----------|-------------|
| Schedule | Automated email delivery |
| Share | Email as attachment or link |
| Email Selected People | Contact recipients in report |

### Browser Export Locations

| Browser | Export Location |
|---------|-----------------|
| Chrome | Bottom left (recommended) |
| Firefox | Popup dialog |
| IE/Edge | Bottom center |
| Safari | Upper right |

### Cross-Season Reporting

- Groups participant info across seasons
- Based on age, gender, registered sessions
- Only reports participant information

### TTNTS121 Mapping (Reporting Features)

| CCM Feature | TTNTS121 Current | Gap/Action |
|-------------|------------------|------------|
| Cart abandonment | None | HIGH: Lost revenue tracking |
| Attendance reports | None | GAP: No attendance tracking |
| Merchandise reports | None | LOW: No merchandise |
| Custom reports | None | MEDIUM: Manual data export |
| Scheduled reports | None | LOW: Small operation |
| Check-in PDF | None | GAP: No check-in lists |
| Cross-season reports | None | LOW: Single-season focus |

---

## Phase 4 Summary

### Documents Processed: 5/5

| Document | Status | Key Extractions |
|----------|--------|-----------------|
| Email Overview FAQ.docx | ✅ | Email delivery troubleshooting |
| Email Overview.docx | ✅ | Email types, campaigns, metrics |
| Group Assignment User Guide.docx | ✅ | Group setup, self-selection |
| Registration URL Links.docx | ✅ | Direct links, private sessions |
| Camp & Class Manager Season Reports.docx | ✅ | Pre-built and custom reports |

### Key Insights for TTNTS121

**High Priority Features:**
1. **Cart abandonment tracking** - Recover lost registrations
2. **Email campaigns** - Multi-touch marketing
3. **Direct session links** - Better marketing targeting

**Medium Priority:**
1. **Group assignments** - Team organization
2. **Custom reports** - Flexible data export

**Low Priority:**
1. **Text messaging** - Email sufficient for now
2. **Cross-season reports** - Single-season operation
3. **Scheduled reports** - Manual export sufficient

---

*Next: Phase 5 - Knowledge Synthesis*
