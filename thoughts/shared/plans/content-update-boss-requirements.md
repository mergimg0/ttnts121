# TTNTS121 Content Update - Boss Requirements

**Created:** 2026-01-28
**Status:** PLANNING
**Total Tasks:** 47

---

## Executive Summary

Comprehensive content and feature update across the entire website based on owner specifications. Changes span pricing, locations, service descriptions, FAQs, and requires one new feature (1:1 enquiry form).

---

## Phase 1: Constants & Configuration (Foundation)

These changes in `src/lib/constants.ts` affect multiple pages automatically.

### 1.1 Site Configuration
- [ ] **1.1.1** Update `SITE_CONFIG.description` - Change age range to "5-16+"
- [ ] **1.1.2** Update `SITE_CONFIG.tagline` if needed for new messaging

### 1.2 Locations Update
- [ ] **1.2.1** Update `LOCATIONS[0]` (Luton) - Change to Lower Sundon School address for after school clubs
- [ ] **1.2.2** Update `LOCATIONS[1]` (Barton) - Change to "Barton Rovers FC, Barton Le Clay"
- [ ] **1.2.3** Update `LOCATIONS[2]` (Silsoe) - Change to "Silsoe Community Centre, Silsoe"

### 1.3 Services Summary Update
- [ ] **1.3.1** Update `SERVICES` 1:1 - priceDisplay to "From £35/hour"
- [ ] **1.3.2** Update `SERVICES` group-sessions - priceDisplay to "£8/session", description update
- [ ] **1.3.3** Update `SERVICES` half-term-camps - update ages "5-12"
- [ ] **1.3.4** Update `SERVICES` after-school-clubs - priceDisplay to "From £5/session"

### 1.4 Pricing Packages Update
- [ ] **1.4.1** Update `ONE_TO_ONE_PACKAGES` - Single session £35
- [ ] **1.4.2** Update `ONE_TO_ONE_PACKAGES` - Block booking £120 for 4 sessions (£30/session)
- [ ] **1.4.3** Remove or update development pack pricing

### 1.5 Party Options Update
- [ ] **1.5.1** Update `PARTY_OPTIONS.inclusions` - 1.5hr football + 0.5hr indoor food
- [ ] **1.5.2** Add medals for all, trophy for birthday child
- [ ] **1.5.3** Remove party bags option (not mentioned)

### 1.6 Age Groups Update (School Year Based)
- [ ] **1.6.1** Replace current `AGE_GROUPS` with school year groups:
  - Reception
  - Year 1 & 2
  - Year 3 & 4
  - Year 5 & 6
  - Year 6 & 7

### 1.7 Session Types Update
- [ ] **1.7.1** Update `SESSION_TYPES` age ranges to match new requirements

---

## Phase 2: Homepage Updates

### 2.1 Hero Section (`src/components/sections/hero.tsx`)
- [ ] **2.1.1** Change headline "Where Kids Become Team Players" → "Take the Next Step, Become a Better Player"
- [ ] **2.1.2** Update ages from "4-11" → "5 to 16+"
- [ ] **2.1.3** Update locations from "Luton, Barton Le Clay & Silsoe" → "Barton Le Clay & Silsoe"

### 2.2 What Makes Us Different Section
- [ ] **2.2.1** Add/update "What Makes Us Different" section with:
  - In depth personalised training
  - FA qualified coaches - UEFA B to UEFA C coaches
  - Care - we turn up to watch our clients play their matches, in depth mentoring and comms with parents
- [ ] **2.2.2** Keep rest of homepage the same

---

## Phase 3: Service Pages Updates

### 3.1 One-to-One Page (`src/app/services/one-to-one/page.tsx`)
- [ ] **3.1.1** Update pricing display - Single session £35/hour
- [ ] **3.1.2** Update pricing display - Block booking £120 for 4
- [ ] **3.1.3** Change "Book" button to redirect to enquiry page instead of booking
- [ ] **3.1.4** Update FAQ - Ages 4 to 16+
- [ ] **3.1.5** Update FAQ - 1:1 sessions always in Barton
- [ ] **3.1.6** Update FAQ - Sessions are weekly
- [ ] **3.1.7** Update FAQ - Weather: secondary location in Silsoe, or cancel if too heavy

### 3.2 Group Sessions Page (`src/app/services/group-sessions/page.tsx`)
- [ ] **3.2.1** Update price - £8 per session
- [ ] **3.2.2** Update ages - 4 to 12
- [ ] **3.2.3** Change payment model - Pay at start of term (not pay as you go)
- [ ] **3.2.4** Change "No Commitment" → "Competitive Edge" - "They do what they would do in a 1 to 1, but against other players"
- [ ] **3.2.5** Update age groups to school year system
- [ ] **3.2.6** Update location - Always in Barton Le Clay
- [ ] **3.2.7** Remove "drop-in flexibility" messaging

### 3.3 Camps Page (`src/app/services/half-term-camps/page.tsx`)
- [ ] **3.3.1** Update ages - 5 to 12
- [ ] **3.3.2** Update location - Silsoe Community Centre, Silsoe
- [ ] **3.3.3** Update pricing - From £20/day, no half-day option
- [ ] **3.3.4** Add sibling discount info - 25%
- [ ] **3.3.5** Add early bird offers mention
- [ ] **3.3.6** Update finish time - 4pm (not 3pm)
- [ ] **3.3.7** Update bad weather FAQ - Contact with options, or indoor activities (quizzes, colouring)
- [ ] **3.3.8** Remove half-day option from pricing section
- [ ] **3.3.9** Update daily schedule to end at 4pm

### 3.4 Birthday Parties Page (`src/app/services/birthday-parties/page.tsx`)
- [ ] **3.4.1** Update format - 1.5 hours football + 0.5 hours indoor food
- [ ] **3.4.2** Update inclusions - Medals for all, Trophy for birthday child
- [ ] **3.4.3** Remove indoor backup mention for football
- [ ] **3.4.4** Update party day rundown - 1.5hr football, 30min food, happy birthday singing, medal & trophy
- [ ] **3.4.5** Update FAQ - Suitability is for anyone
- [ ] **3.4.6** Update FAQ - Rain: have to firm it outside for 1.5 hours or reschedule
- [ ] **3.4.7** Update FAQ - Only Sundays 12-2pm available
- [ ] **3.4.8** Remove "Two Ways to Party" if only one venue option

### 3.5 After School Clubs Page (`src/app/services/after-school-clubs/page.tsx`)
- [ ] **3.5.1** Update price - From £5 (not always £6)
- [ ] **3.5.2** Update times - Don't always start at 3:30pm
- [ ] **3.5.3** Update schools - Ramsey Manor Lower School, Lower Sundon School
- [ ] **3.5.4** Update typical session - Changes depending on schedule, no set plan
- [ ] **3.5.5** Update inclusions - Medal at every session, REMOVE progress tracking
- [ ] **3.5.6** Update FAQ - Booking done for entire term
- [ ] **3.5.7** Update FAQ - If child ill: tough luck (no refund/credit)
- [ ] **3.5.8** Update FAQ - Pick up: no text notification, just collected when told

---

## Phase 4: About Page Updates

### 4.1 About Page (`src/app/about/page.tsx`)
- [ ] **4.1.1** Update origin story - TTNTS started in 2024, remove "own kids" reference
- [ ] **4.1.2** Update headline - Remove "We Started As Parents Too"
- [ ] **4.1.3** Update quote attribution - "The TTNTS 121 team"
- [ ] **4.1.4** Update "Every Child Visible" → "Care for the players in everything we do, including match observations, reports etc"
- [ ] **4.1.5** Update qualifications - All FA qualified (UEFA B to UEFA C)
- [ ] **4.1.6** Update Meet the Coaches section - Expandable with pictures once available

---

## Phase 5: Locations Page Updates

### 5.1 Locations Page (`src/app/locations/page.tsx`)
- [ ] **5.1.1** Update Barton entry - Barton Rovers FC, Barton Le Clay
- [ ] **5.1.2** Update Luton entry - Lower Sundon School (for after school clubs)
- [ ] **5.1.3** Update Silsoe entry - Silsoe Community Centre, Silsoe

---

## Phase 6: Global FAQ Updates

### 6.1 Global FAQ Component (`src/components/sections/faq.tsx`)
- [ ] **6.1.1** Update age range in FAQ answers - 4 to 16+
- [ ] **6.1.2** Update age groups answer with school year system

---

## Phase 7: New Feature - 1:1 Enquiry Form

### 7.1 Enquiry Form Component
- [ ] **7.1.1** Create `src/components/forms/one-to-one-enquiry-form.tsx`
  - Child name field
  - Child age field
  - Available days/times multi-select or text
  - Current level dropdown:
    - No experience in football
    - Grassroots football (conditional: what team?)
    - Pre-academy (conditional: what team?)
    - Academy (conditional: what team?)
    - Non-league level (conditional: what team?)
    - Professional (conditional: what team?)

### 7.2 Enquiry Page
- [ ] **7.2.1** Create `src/app/services/one-to-one/enquire/page.tsx` - Enquiry page
- [ ] **7.2.2** Create `src/app/api/enquiries/one-to-one/route.ts` - API endpoint for form submission

---

## Task Summary

| Phase | Section | Tasks |
|-------|---------|-------|
| 1.1 | Site Config | 2 |
| 1.2 | Locations Config | 3 |
| 1.3 | Services Config | 4 |
| 1.4 | Pricing Config | 3 |
| 1.5 | Party Config | 3 |
| 1.6 | Age Groups Config | 1 |
| 1.7 | Session Types | 1 |
| 2.1 | Hero | 3 |
| 2.2 | What Makes Different | 2 |
| 3.1 | 1:1 Page | 7 |
| 3.2 | Group Sessions | 7 |
| 3.3 | Camps | 9 |
| 3.4 | Birthday Parties | 8 |
| 3.5 | After School | 8 |
| 4.1 | About | 6 |
| 5.1 | Locations | 3 |
| 6.1 | Global FAQ | 2 |
| 7.1 | Enquiry Form | 1 |
| 7.2 | Enquiry Page/API | 2 |
| **TOTAL** | | **75** |

---

## Implementation Notes

### Critical Dependencies
1. Constants changes (Phase 1) should be done first - they affect multiple pages
2. Enquiry form (Phase 7) is a new feature requiring component + page + API

### Files to Modify
1. `src/lib/constants.ts` - Central configuration
2. `src/components/sections/hero.tsx` - Homepage hero
3. `src/app/services/one-to-one/page.tsx` - 1:1 coaching page
4. `src/app/services/group-sessions/page.tsx` - Group sessions page
5. `src/app/services/half-term-camps/page.tsx` - Camps page
6. `src/app/services/birthday-parties/page.tsx` - Birthday parties page
7. `src/app/services/after-school-clubs/page.tsx` - After school clubs page
8. `src/app/about/page.tsx` - About page
9. `src/app/locations/page.tsx` - Locations page
10. `src/components/sections/faq.tsx` - Global FAQ

### Files to Create
1. `src/components/forms/one-to-one-enquiry-form.tsx` - Enquiry form component
2. `src/app/services/one-to-one/enquire/page.tsx` - Enquiry page
3. `src/app/api/enquiries/one-to-one/route.ts` - Enquiry API

---

## Content Reference (Boss Requirements)

### Hero Text
- OLD: "Where kids become team players"
- NEW: "Take the next step, become a better player"

### What Makes Us Different
1. In depth personalised training
2. FA qualified coaches - UEFA B to UEFA C coaches
3. Care - we turn up to watch our clients play their matches, in depth mentoring and comms with parents

### Group Sessions Age Groups (School Year Based)
- Reception group
- Year 1 and Year 2 together
- Year 3 and Year 4 together
- Year 5 and Year 6 together
- Year 6 and Year 7 together

### Birthday Party Format
- 1.5 hours football
- 0.5 hours indoor food
- Happy birthday singing
- Medals for all
- Trophy for birthday child
- Only Sundays 12-2pm

### About Page Quote
- From: "The TTNTS 121 team"

---

**End of Plan**
