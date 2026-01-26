# ACTIVE Camps Session Integration Plan

## Overview
Integrate scraped session data from ACTIVE camps booking system into TTNTS121 website.

## Data Source
URL: https://campscui.active.com/orgs/TakeTheNextStep#/selectSessions/3739833
Scraped: 2026-01-26

## Scraped Data

### Location
- **Name:** Ramsey Manor Lower School
- **Address:** Barton Le Clay, GB
- **Country:** United Kingdom

### Program
- **Name:** After School Football - Ramsey Manor (Spring 2026)
- **Type:** after-school
- **Date Range:** January 5, 2026 - February 13, 2026
- **Location:** barton-le-clay (existing) or ramsey-manor (new)

### Sessions (3 total)

#### Session 1: Reception and KS1 - Football After School Club (Mondays)
| Field | Value |
|-------|-------|
| Name | Reception and KS1 - Football After School Club (Mondays) |
| Description | Football coaching for Reception and KS1 children |
| Day of Week | 1 (Monday) |
| Start Date | 2026-01-05 |
| End Date | 2026-02-09 |
| Start Time | 15:30 |
| End Time | 16:30 |
| Age Min | 4 |
| Age Max | 7 |
| Price | 3000 (pence = £30.00) |
| Capacity | 12 (estimated - currently full) |
| Enrolled | 12 (full - waitlist only) |
| Waitlist Enabled | true |

#### Session 2: KS2 - Football After School Club (Tuesdays)
| Field | Value |
|-------|-------|
| Name | KS2 - Football After School Club - Tuesdays |
| Description | Football coaching for KS2 children |
| Day of Week | 2 (Tuesday) |
| Start Date | 2026-01-06 |
| End Date | 2026-02-10 |
| Start Time | 15:30 |
| End Time | 16:30 |
| Age Min | 7 |
| Age Max | 9 |
| Price | 3000 (pence = £30.00) |
| Capacity | 15 (estimated) |
| Enrolled | 0 |
| Waitlist Enabled | true |

#### Session 3: KS1 & KS2 - Football After School Club (Fridays)
| Field | Value |
|-------|-------|
| Name | KS1 & KS2 - Football After School Club - Fridays |
| Description | Combined football coaching for KS1 and KS2 children |
| Day of Week | 5 (Friday) |
| Start Date | 2026-01-09 |
| End Date | 2026-02-13 |
| Start Time | 14:00 |
| End Time | 15:30 |
| Age Min | 5 |
| Age Max | 9 |
| Price | 4200 (pence = £42.00) |
| Capacity | 15 (estimated - only 2 spots left) |
| Enrolled | 13 |
| Waitlist Enabled | true |

## Implementation Phases

### Phase 1: Constants Update
- Add "ramsey-manor" location to LOCATIONS array in constants.ts
- Include proper address, postcode, and map embed

### Phase 2: Seed Script Creation
- Create scripts/seed-active-sessions.ts
- Include program and session data
- Use Firebase Admin SDK

### Phase 3: Database Population
- Run seed script OR use admin API endpoints
- Create program first, get ID
- Create sessions with program ID reference

### Phase 4: UI Verification
- Start dev server
- Navigate to /sessions
- Verify sessions display in list view
- Verify sessions display in calendar view
- Test filters (location, service type, age)

### Phase 5: Handoff & Documentation
- Create handoff document
- Document any issues found
- Mark tasks complete

## API Endpoints

### Create Program
```
POST /api/admin/programs
{
  "name": "After School Football - Ramsey Manor (Spring 2026)",
  "description": "After school football sessions at Ramsey Manor Lower School",
  "location": "barton-le-clay",
  "serviceType": "after-school",
  "dateRange": {
    "start": "2026-01-05T00:00:00.000Z",
    "end": "2026-02-13T23:59:59.000Z"
  },
  "isActive": true
}
```

### Create Session (repeat for each)
```
POST /api/admin/sessions
{
  "programId": "<program-id>",
  "name": "...",
  "description": "...",
  "dayOfWeek": 1,
  "startTime": "15:30",
  "endTime": "16:30",
  "startDate": "2026-01-05T00:00:00.000Z",
  "endDate": "2026-02-09T23:59:59.000Z",
  "location": "barton-le-clay",
  "ageMin": 4,
  "ageMax": 7,
  "price": 3000,
  "capacity": 12,
  "waitlistEnabled": true,
  "isActive": true
}
```

## Success Criteria
- [ ] Location visible in constants
- [ ] Program created in Firestore
- [ ] 3 sessions created in Firestore
- [ ] Sessions visible on /sessions page
- [ ] Calendar view shows correct days
- [ ] Filters work correctly
- [ ] Waitlist badge shows for full session
- [ ] "Limited spots" shows for nearly-full session
