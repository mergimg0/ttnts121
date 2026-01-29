# Implementation Plan: Admin Section Mobile-Friendly Redesign
Generated: 2026-01-27

## Goal
Make the entire admin section mobile-friendly with improved responsive design, including:
- Dashboard: 2 cards per row on mobile
- Sessions/Bookings: Compact layout, no horizontal scroll
- Waitlist/Payments: 3 cards per row on mobile
- Global: Compact cards, scroll-to-top on navigation, header redesign, brand navy-purple buttons

## Research Summary
- Existing codebase uses Tailwind CSS with responsive prefixes (sm:, md:, lg:)
- Brand color `--brand-navy: #2E3192` (navy purple) is already defined in CSS variables
- Admin components use a consistent design system with AdminCard, AdminTable, etc.
- Mobile table patterns already exist via `ResponsiveTable` and `MobileCard` components

## Existing Codebase Analysis

### Key Files Structure
```
src/app/admin/
  layout.tsx          # Global admin layout with header
  page.tsx            # Dashboard page
  sessions/page.tsx   # Sessions list
  bookings/page.tsx   # Bookings list
  waitlist/page.tsx   # Waitlist management
  payments/page.tsx   # Payments/Stripe dashboard
  programs/page.tsx   # Programs list

src/components/admin/
  sidebar.tsx         # Navigation sidebar
  header.tsx          # (unused - header is in layout.tsx)
  stats-card.tsx      # Stats display cards
  mobile-table.tsx    # Mobile table patterns
  ui/
    admin-card.tsx    # Card wrapper component
    admin-table.tsx   # Table components
    admin-page-header.tsx  # Page title component
    ...

src/components/ui/
  button.tsx          # Button with admin variants
```

### Current State
- Dashboard stats grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` (1 card on mobile, should be 2)
- Sessions page: Uses AdminTable which has horizontal scroll
- Bookings page: Already has ResponsiveTable with mobile cards
- Waitlist page: Uses full-width table, no mobile optimization, stats grid: `sm:grid-cols-3`
- Payments page: Revenue cards: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- Header: Email hidden on mobile, logout text hidden on sm:
- Button adminPrimary variant: `bg-neutral-900` (black) - needs to be navy

---

## Implementation Phases

### Phase 1: Global - Button Color Change (Black to Navy)
**Priority:** High (affects all pages)

**Files to modify:**
- `/Users/mghome/projects/ttnts121/src/components/ui/button.tsx`

**Steps:**
1. Change `adminPrimary` variant from `bg-neutral-900` to `bg-navy`
2. Change hover from `hover:bg-neutral-800` to `hover:bg-navy-deep`
3. Change focus ring from `focus-visible:ring-neutral-900` to `focus-visible:ring-navy`

**Code change:**
```tsx
// OLD:
adminPrimary:
  "bg-neutral-900 text-white hover:bg-neutral-800 focus-visible:ring-neutral-900 rounded-xl text-sm font-medium normal-case tracking-normal shadow-sm",

// NEW:
adminPrimary:
  "bg-navy text-white hover:bg-navy-deep focus-visible:ring-navy rounded-xl text-sm font-medium normal-case tracking-normal shadow-sm",
```

**Acceptance criteria:**
- [ ] All "New Program" and primary admin buttons are navy purple
- [ ] Hover state transitions to deeper navy
- [ ] Focus ring is navy colored

---

### Phase 2: Global - Scroll to Top on Navigation
**Priority:** High (affects user experience across all pages)

**Files to modify:**
- `/Users/mghome/projects/ttnts121/src/app/admin/layout.tsx`

**Steps:**
1. Add `useEffect` hook that triggers on pathname change
2. Scroll window to top (0, 0) when route changes
3. Use `window.scrollTo({ top: 0, behavior: 'instant' })` for immediate scroll

**Code addition:**
```tsx
// Add import
import { useEffect } from "react";

// Inside AdminLayoutContent, add:
useEffect(() => {
  window.scrollTo({ top: 0, behavior: 'instant' });
}, [pathname]);
```

**Acceptance criteria:**
- [ ] Every admin page loads scrolled to the top
- [ ] Navigation between pages resets scroll position
- [ ] No visual jank during navigation

---

### Phase 3: Global - Header Redesign
**Priority:** High (header is on every page)

**Files to modify:**
- `/Users/mghome/projects/ttnts121/src/app/admin/layout.tsx`

**Current header structure:**
```tsx
<header>
  <div>Logo section</div>
  <div>User email (hidden on mobile) | Logout icon</div>
</header>
```

**New header structure:**
```tsx
<header>
  <div className="flex flex-col">
    <div>Logo: TTNS121 Admin</div>
    <div className="text-xs text-neutral-500">{user.email}</div>  <!-- Email on new line -->
  </div>
  <div>
    <button>
      <LogOut /> Logout  <!-- Always show "Logout" text -->
    </button>
  </div>
</header>
```

**Steps:**
1. Restructure the header flex layout to allow two-line logo section
2. Move email to appear below "TTNS121 Admin" title
3. Show full email (remove truncation)
4. Add "Logout" text next to icon, always visible
5. Keep logout button in current position (right side)

**Code changes:**
```tsx
// Replace header content (lines ~38-58 in layout.tsx)
<header className="fixed top-0 left-0 right-0 z-40 flex h-auto min-h-16 items-center bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
  {/* Logo section with email below */}
  <div className="flex h-full w-64 flex-shrink-0 flex-col justify-center px-4 lg:px-6 py-2">
    <div className="flex items-center gap-2">
      <div className="mr-2 lg:hidden">
        <MobileMenuButton onClick={() => setSidebarOpen(true)} />
      </div>
      <span className="text-lg font-bold tracking-tight">
        TTNS121 <span className="text-sky-500">Admin</span>
      </span>
    </div>
    {/* Email on new line, always visible */}
    <span className="text-[11px] text-neutral-500 truncate max-w-full pl-0 lg:pl-0 mt-0.5">
      {user?.email}
    </span>
  </div>

  {/* Logout - stays on right, always shows text */}
  <div className="flex flex-1 items-center justify-end gap-2 px-4 lg:px-6">
    <button
      onClick={logout}
      className="flex items-center gap-2 text-[13px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors px-3 py-2 rounded-lg hover:bg-neutral-100"
    >
      <LogOut className="h-4 w-4" />
      <span>Logout</span>
    </button>
  </div>
</header>
```

**Acceptance criteria:**
- [ ] Email appears on new line under "TTNS121 Admin"
- [ ] Full email is visible (or truncated gracefully if very long)
- [ ] "Logout" text always visible next to icon
- [ ] Logout button remains in top-right position
- [ ] Layout works on mobile and desktop

---

### Phase 4: Dashboard - 2 Cards Per Row on Mobile
**Priority:** Medium

**Files to modify:**
- `/Users/mghome/projects/ttnts121/src/app/admin/page.tsx`

**Current:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
**Target:** `grid-cols-2 lg:grid-cols-4`

**Steps:**
1. Change stats grid from `grid gap-4 sm:grid-cols-2 lg:grid-cols-4` to `grid gap-3 grid-cols-2 lg:grid-cols-4`
2. Reduce gap on mobile for tighter layout

**Code change:**
```tsx
// OLD (line ~62):
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

// NEW:
<div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
```

**Acceptance criteria:**
- [ ] Dashboard shows 2 stats cards per row on mobile
- [ ] Cards fit nicely without horizontal scroll
- [ ] Desktop layout unchanged (4 cards per row)

---

### Phase 5: Dashboard - Compact Stats Cards for Mobile
**Priority:** Medium

**Files to modify:**
- `/Users/mghome/projects/ttnts121/src/components/admin/stats-card.tsx`

**Steps:**
1. Reduce padding on mobile: `p-6` to `p-4 lg:p-6`
2. Reduce value font size on mobile: `text-[32px]` to `text-xl lg:text-[32px]`
3. Make icon container smaller on mobile: `h-9 w-9` to `h-7 w-7 lg:h-9 lg:w-9`
4. Reduce icon size on mobile

**Code changes:**
```tsx
// Change container padding
className="... p-4 lg:p-6 ..."

// Change value size
<span className="text-xl lg:text-[32px] font-semibold ...">

// Change icon container
<div className="flex h-7 w-7 lg:h-9 lg:w-9 items-center justify-center rounded-lg lg:rounded-xl ...">
  <Icon className="h-4 w-4 lg:h-[18px] lg:w-[18px] ..." />
</div>

// Reduce margin
<div className="flex items-center justify-between mb-2 lg:mb-4">
```

**Acceptance criteria:**
- [ ] Stats cards are more compact on mobile
- [ ] Text is still readable
- [ ] 2 cards fit comfortably per row

---

### Phase 6: Sessions Page - Compact Mobile Layout
**Priority:** High

**Files to modify:**
- `/Users/mghome/projects/ttnts121/src/app/admin/sessions/page.tsx`

**Current issue:** Uses AdminTable with horizontal scroll
**Solution:** Use ResponsiveTable pattern like bookings page

**Steps:**
1. Import ResponsiveTable, MobileCard, MobileCardRow from mobile-table
2. Replace AdminTable with ResponsiveTable
3. Create mobile card view with essential info:
   - Session name + ages
   - Program name
   - Day/time
   - Capacity bar
   - Actions (edit/delete)

**Code structure:**
```tsx
import { ResponsiveTable, MobileCard, MobileCardRow } from "@/components/admin/mobile-table";

// Replace AdminTable with:
<ResponsiveTable
  mobileView={
    sessions.map((session) => (
      <MobileCard key={session.id}>
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium text-neutral-900">{session.name}</p>
            <p className="text-[13px] text-neutral-500">Ages {session.ageMin}-{session.ageMax}</p>
          </div>
          <AdminBadge variant="info">{program?.name}</AdminBadge>
        </div>
        <MobileCardRow label="Schedule">
          {getDayName(session.dayOfWeek)}, {formatTime(session.startTime)}
        </MobileCardRow>
        <MobileCardRow label="Capacity">
          <div className="flex items-center gap-2">
            <span>{session.enrolled}/{session.capacity}</span>
            <div className="w-12 h-1.5 bg-neutral-100 rounded-full">
              <div className="h-full bg-emerald-500 rounded-full" style={{width: `${percent}%`}} />
            </div>
          </div>
        </MobileCardRow>
        <MobileCardRow label="Price">{formatPrice(session.price)}</MobileCardRow>
        <div className="pt-3 border-t border-neutral-100 flex gap-2">
          <Button variant="adminSecondary" size="sm" asChild className="flex-1">
            <Link href={`/admin/sessions/${session.id}`}>Edit</Link>
          </Button>
          <Button variant="adminGhost" size="sm" onClick={() => handleDelete(session.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </MobileCard>
    ))
  }
>
  {/* Keep existing table for desktop */}
</ResponsiveTable>
```

**Acceptance criteria:**
- [ ] Sessions page shows mobile cards on small screens
- [ ] All essential info visible without scrolling
- [ ] Desktop table layout preserved
- [ ] Edit/delete actions work on mobile

---

### Phase 7: Waitlist Page - 3 Cards Per Row + Mobile Layout
**Priority:** Medium

**Files to modify:**
- `/Users/mghome/projects/ttnts121/src/app/admin/waitlist/page.tsx`

**Steps:**
1. Change stats grid from `sm:grid-cols-3` to `grid-cols-3`
2. Make stat cards more compact on mobile
3. Replace table with ResponsiveTable pattern for entries list

**Stats grid change:**
```tsx
// OLD:
<div className="grid gap-4 sm:grid-cols-3">

// NEW:
<div className="grid gap-2 grid-cols-3">
```

**Compact the stat cards:**
```tsx
<AdminCard className="p-3 lg:p-6">
  <p className="text-[10px] lg:text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
    Waiting
  </p>
  <p className="mt-1 text-lg lg:text-2xl font-semibold tabular-nums text-neutral-900">
    {pendingEntries.length}
  </p>
</AdminCard>
```

**Add mobile cards for entries:**
```tsx
<ResponsiveTable
  mobileView={entries.map((entry) => (
    <MobileCard key={entry.id}>
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-neutral-900">
            {entry.childFirstName} {entry.childLastName}
          </p>
          <p className="text-[13px] text-neutral-500">{entry.ageGroup}</p>
        </div>
        <AdminBadge variant={...}>{entry.status}</AdminBadge>
      </div>
      <MobileCardRow label="Parent">{entry.parentEmail}</MobileCardRow>
      <MobileCardRow label="Session">{session?.name}</MobileCardRow>
      <MobileCardRow label="Added">{formatDate(entry.createdAt)}</MobileCardRow>
      <div className="pt-3 border-t border-neutral-100 flex gap-2">
        {/* Notify/Remove buttons */}
      </div>
    </MobileCard>
  ))}
>
  {/* Keep existing table */}
</ResponsiveTable>
```

**Acceptance criteria:**
- [ ] Stats show 3 cards per row on mobile
- [ ] Stats cards are compact but readable
- [ ] Entries show as mobile cards on small screens
- [ ] Notify/remove actions work on mobile

---

### Phase 8: Payments Page - 3 Cards Per Row
**Priority:** Medium

**Files to modify:**
- `/Users/mghome/projects/ttnts121/src/app/admin/payments/page.tsx`
- `/Users/mghome/projects/ttnts121/src/components/admin/stripe/revenue-card.tsx`

**Steps:**
1. Change revenue cards grid to show 3 on mobile (hide 4th or combine)
2. Alternative: Show 2 on mobile for better readability
3. Make revenue cards more compact

**Decision:** Show 2 cards per row on smallest mobile, 3 on tablet, 4 on desktop
This is a better UX since revenue cards have more content than simple stats.

**Revenue cards grid change:**
```tsx
// OLD:
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

// NEW (2 on mobile, 2 on sm, 4 on lg):
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
```

**Compact revenue cards (in revenue-card.tsx):**
```tsx
// Change padding
className="... p-4 lg:p-6 ..."

// Change value size
<span className="text-lg lg:text-[32px] font-semibold ...">

// Change icon container size
<div className="flex h-7 w-7 lg:h-9 lg:w-9 items-center justify-center ...">
```

**Acceptance criteria:**
- [ ] Revenue cards show 2 per row on mobile
- [ ] Cards are compact but readable
- [ ] Desktop shows 4 per row as before

---

### Phase 9: Global - Compact AdminCard Component
**Priority:** Low (optional enhancement)

**Files to modify:**
- `/Users/mghome/projects/ttnts121/src/components/admin/ui/admin-card.tsx`

**Steps:**
1. Add responsive padding: `p-4 lg:p-6` as default
2. Reduce border radius on mobile: `rounded-xl lg:rounded-2xl`

**Code changes:**
```tsx
// Update default padding
padding && "p-4 lg:p-6",

// Update border radius
"rounded-xl lg:rounded-2xl"
```

**Acceptance criteria:**
- [ ] All admin cards are more compact on mobile
- [ ] Content still has appropriate spacing

---

### Phase 10: Global - Compact Mobile Table Cards
**Priority:** Low (enhancement)

**Files to modify:**
- `/Users/mghome/projects/ttnts121/src/components/admin/mobile-table.tsx`

**Steps:**
1. Reduce padding in MobileCard: `p-4` to `p-3`
2. Reduce space-y: `space-y-3` to `space-y-2`

**Code changes:**
```tsx
export function MobileCard({ children, className }: MobileCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl lg:rounded-2xl border border-neutral-200/60 bg-white p-3 space-y-2",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        className
      )}
    >
      {children}
    </div>
  );
}
```

**Acceptance criteria:**
- [ ] Mobile cards are more compact
- [ ] Content still readable and well-spaced

---

## Testing Strategy

### Manual Testing Checklist
1. Test on iPhone SE (smallest common mobile: 375px)
2. Test on iPhone 14 Pro (390px)
3. Test on iPad (768px)
4. Test on desktop (1280px+)
5. Test navigation between all admin pages
6. Verify scroll resets on each navigation
7. Check button colors across all pages
8. Verify header layout on all screen sizes

### Key Viewport Breakpoints
- Mobile: < 640px (Tailwind default breakpoint)
- Tablet: 640px - 1024px
- Desktop: > 1024px

---

## Risks & Considerations

1. **Card Grid Changes**: Changing from 1 to 2 columns on mobile may cause text truncation - need to verify text fits
2. **Header Height**: Adding email line increases header height - need to adjust top padding on main content
3. **Button Color Change**: Navy may have different contrast than black - verify accessibility
4. **Scroll Reset**: Using `behavior: 'instant'` to avoid animation jank, but could test 'smooth' if preferred

---

## Estimated Complexity

| Phase | Complexity | Time Estimate |
|-------|------------|---------------|
| Phase 1: Button Color | Low | 5 min |
| Phase 2: Scroll to Top | Low | 5 min |
| Phase 3: Header Redesign | Medium | 20 min |
| Phase 4: Dashboard Grid | Low | 5 min |
| Phase 5: Dashboard Cards | Medium | 15 min |
| Phase 6: Sessions Mobile | High | 30 min |
| Phase 7: Waitlist Mobile | High | 30 min |
| Phase 8: Payments Cards | Medium | 15 min |
| Phase 9: AdminCard Compact | Low | 5 min |
| Phase 10: MobileCard Compact | Low | 5 min |

**Total Estimated Time:** ~2-3 hours

---

## File Summary

### Files to Modify
1. `/Users/mghome/projects/ttnts121/src/components/ui/button.tsx` - Navy button color
2. `/Users/mghome/projects/ttnts121/src/app/admin/layout.tsx` - Header + scroll reset
3. `/Users/mghome/projects/ttnts121/src/app/admin/page.tsx` - Dashboard grid
4. `/Users/mghome/projects/ttnts121/src/components/admin/stats-card.tsx` - Compact stats
5. `/Users/mghome/projects/ttnts121/src/app/admin/sessions/page.tsx` - Mobile layout
6. `/Users/mghome/projects/ttnts121/src/app/admin/waitlist/page.tsx` - Mobile layout + grid
7. `/Users/mghome/projects/ttnts121/src/app/admin/payments/page.tsx` - Card grid
8. `/Users/mghome/projects/ttnts121/src/components/admin/stripe/revenue-card.tsx` - Compact cards
9. `/Users/mghome/projects/ttnts121/src/components/admin/ui/admin-card.tsx` - Responsive padding
10. `/Users/mghome/projects/ttnts121/src/components/admin/mobile-table.tsx` - Compact cards

### Execution Order
1. Phase 1 (buttons) + Phase 2 (scroll) - Independent, can be done first
2. Phase 3 (header) - Independent, affects all pages
3. Phase 4 + 5 (dashboard) - Together for dashboard
4. Phase 6 (sessions) - Standalone
5. Phase 7 (waitlist) - Standalone
6. Phase 8 (payments) - Standalone
7. Phase 9 + 10 (global components) - Last, affects all mobile views
