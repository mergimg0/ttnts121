# Plan: Services Dropdown Navigation + Service Pages

## Goal
Replace the existing "Sessions" nav link with a "Services" dropdown containing 5 service pages:
1. 1:1 Coaching (priority)
2. Group Sessions (drop-in)
3. Half Term Camps
4. Birthday Parties
5. After School Clubs

Also extend the booking form to handle 1:1 coaching and birthday parties.

## Discovery Interview Summary

| Service | Description | Pricing | Booking |
|---------|-------------|---------|---------|
| **1:1 Coaching** | Private individual coaching | £35-45/hour, single or packages | Extended booking form |
| **Group Sessions** | Drop-in open sessions | £6/session | Standard booking |
| **Half Term Camps** | Camp sessions during half term | From £20/day | Standard booking |
| **Birthday Parties** | Venue or mobile, premium package | Call to discuss | Extended booking form |
| **After School Clubs** | Weekly term-time sessions | £6/session | Standard booking |

## Technical Choices

- **Dropdown implementation**: CSS hover dropdown with motion animation (matches existing header style)
- **Page structure**: Individual pages under `/services/[slug]` for SEO + direct linking
- **Booking form extension**: Add new session types to `SESSION_TYPES` constant + conditional fields
- **Existing /sessions page**: Keep as redirect to `/services` overview or remove entirely

## Current State Analysis

### Key Files to Modify:
- `src/lib/constants.ts` - Add new service types, update SESSION_TYPES
- `src/components/layout/header.tsx` - Replace Sessions link with Services dropdown
- `src/app/book/page.tsx` - Extend form for 1:1 and parties
- `src/app/api/book/route.ts` - Handle new booking types

### Key Files to Create:
- `src/app/services/page.tsx` - Services overview/landing
- `src/app/services/one-to-one/page.tsx` - 1:1 Coaching page
- `src/app/services/group-sessions/page.tsx` - Group Sessions page
- `src/app/services/half-term-camps/page.tsx` - Half Term Camps page
- `src/app/services/birthday-parties/page.tsx` - Birthday Parties page
- `src/app/services/after-school-clubs/page.tsx` - After School Clubs page

### Patterns to Follow:
- Page structure matches existing `/about`, `/sessions` pages (Hero → Content sections → CTA)
- Nike-style design: black hero, uppercase headings, grid layouts
- Motion animations using existing `FadeInUp`, `StaggerChildren` components
- Button variants from existing system

## Tasks

### Task 1: Update Constants with New Service Types
Add comprehensive service definitions to constants.

- [ ] Add `SERVICES` constant with all 5 services (id, name, slug, description, priceDisplay, features)
- [ ] Add `ONE_TO_ONE_PACKAGES` constant (single session + package options)
- [ ] Add `PARTY_PACKAGES` constant (venue vs mobile, inclusions)
- [ ] Update `SESSION_TYPES` to include 1:1 and party options for booking form
- [ ] Update `NAV_LINKS` to remove "Sessions" and prepare for dropdown

**Files to modify:**
- `src/lib/constants.ts`

---

### Task 2: Implement Services Dropdown in Header
Replace the "Sessions" nav link with a hover dropdown.

- [ ] Create dropdown component with hover state
- [ ] Add motion animation for dropdown appearance (match existing mobile menu style)
- [ ] List all 5 services with links to `/services/[slug]`
- [ ] Ensure mobile menu also shows services as expandable section
- [ ] Handle keyboard accessibility (focus states, escape to close)

**Files to modify:**
- `src/components/layout/header.tsx`

---

### Task 3: Create Services Overview Page
Landing page for `/services` showing all offerings.

- [ ] Black hero section with "Our Services" heading
- [ ] Grid of 5 service cards (icon, title, brief description, price hint, CTA)
- [ ] Each card links to individual service page
- [ ] Bottom CTA section

**Files to create:**
- `src/app/services/page.tsx`

---

### Task 4: Create 1:1 Coaching Page (Priority)
Dedicated page for private coaching.

- [ ] Hero with compelling headline about personalized development
- [ ] Benefits section (personalized attention, faster progress, flexible scheduling)
- [ ] Pricing section showing single session + package options
- [ ] "How it works" process section
- [ ] FAQ specific to 1:1 coaching
- [ ] CTA to book

**Files to create:**
- `src/app/services/one-to-one/page.tsx`

---

### Task 5: Create Group Sessions Page
Drop-in session page.

- [ ] Hero emphasizing flexibility and community
- [ ] Schedule/availability section
- [ ] Pricing (£6/session)
- [ ] Age groups section
- [ ] CTA to book

**Files to create:**
- `src/app/services/group-sessions/page.tsx`

---

### Task 6: Create Half Term Camps Page
Migrate content from existing sessions page section.

- [ ] Hero for camps
- [ ] What's included section
- [ ] Schedule/dates section
- [ ] Pricing section
- [ ] FAQ for camps
- [ ] CTA to book

**Files to create:**
- `src/app/services/half-term-camps/page.tsx`

---

### Task 7: Create Birthday Parties Page
Premium party offering.

- [ ] Hero with party energy
- [ ] Package inclusions (activities, medals, party bags, food coordination)
- [ ] Venue vs mobile options comparison
- [ ] "Call to discuss" pricing approach
- [ ] Gallery placeholder section
- [ ] Testimonials specific to parties (if available)
- [ ] CTA to contact/book

**Files to create:**
- `src/app/services/birthday-parties/page.tsx`

---

### Task 8: Create After School Clubs Page
Migrate content from existing sessions page section.

- [ ] Hero for after school
- [ ] Benefits for parents (childcare, energy release, fits work schedule)
- [ ] Schedule section
- [ ] Pricing (£6/session)
- [ ] CTA to book

**Files to create:**
- `src/app/services/after-school-clubs/page.tsx`

---

### Task 9: Extend Booking Form for New Service Types
Update booking wizard to handle 1:1 and parties.

- [ ] Add "1:1 Coaching" and "Birthday Party" to session type selection
- [ ] Add conditional fields for 1:1 (preferred times, goals, package selection)
- [ ] Add conditional fields for parties (date, venue/mobile preference, number of children, age range)
- [ ] Update confirmation step to show service-specific summary
- [ ] Update email templates in API route

**Files to modify:**
- `src/app/book/page.tsx`
- `src/app/api/book/route.ts`

---

### Task 10: Update Homepage Sections
Update references to point to new service pages.

- [ ] Update SessionsOverview component links to point to new service pages
- [ ] Ensure CTA buttons link correctly
- [ ] Optional: Add "Services" quick links to homepage

**Files to modify:**
- `src/components/sections/sessions-overview.tsx`

---

### Task 11: Handle Legacy /sessions Route
Decide on redirect or removal.

- [ ] Option A: Redirect `/sessions` to `/services`
- [ ] Option B: Keep `/sessions` as alternate route to services overview
- [ ] Update any internal links

**Files to modify:**
- `src/app/sessions/page.tsx` (redirect or delete)

---

## Success Criteria

### Automated Verification:
- [ ] `npm run build` completes without errors
- [ ] `npm run lint` passes
- [ ] All new pages are statically generated

### Manual Verification:
- [ ] Services dropdown appears on hover in desktop nav
- [ ] Services expand in mobile menu
- [ ] All 5 service pages load correctly
- [ ] Booking form shows appropriate fields for each service type
- [ ] Links from homepage to service pages work
- [ ] SEO metadata is set for each page

## Risks (Pre-Mortem)

### Tigers:
- **Booking form complexity** (MEDIUM)
  - Mitigation: Keep conditional fields simple, test each service type flow

### Elephants:
- **Content for new pages** (MEDIUM)
  - Note: Some pages (parties, 1:1) need compelling copy - may need user input

## Out of Scope
- Payment integration (still contact/manual process)
- Actual party date availability calendar
- 1:1 coach assignment/scheduling
- Holiday camps (summer, Easter) - only half-term for now
- Removing /sessions page content entirely (can be done later)

## Implementation Order
1. Task 1: Constants (foundation)
2. Task 2: Header dropdown (navigation)
3. Task 3: Services overview (landing)
4. Task 4: 1:1 Coaching (priority page)
5. Task 9: Booking form extension (enable 1:1 bookings)
6. Tasks 5-8: Remaining service pages
7. Tasks 10-11: Cleanup and redirects
