# Implementation Plan: Apple-esque Admin Dashboard Redesign

**Generated:** 2026-01-27
**Project:** TTNTS121 Kids Football Coaching
**Scope:** Complete admin dashboard UI overhaul

---

## Executive Summary

Transform the entire admin dashboard from Nike-inspired hard edges to a refined Apple-esque design language. The recently implemented Payments page (`/admin/payments`) serves as the design reference with its soft corners, subtle shadows, gradient hover effects, and refined typography.

**Key Changes:**
- Replace `rounded-none` / square edges with `rounded-2xl`
- Update shadows from flat borders to subtle elevation: `shadow-[0_1px_3px_rgba(0,0,0,0.04)]`
- Add hover elevation: `shadow-[0_4px_12px_rgba(0,0,0,0.06)]`
- Soften borders: `border-neutral-200/60` (60% opacity)
- Refine typography: `text-[13px]`, `text-[11px]` for labels
- Add gradient hover overlays for interactive cards
- Use `tabular-nums` for numeric data
- Implement smooth transitions: `transition-all duration-300 ease-out`

---

## Design System Specifications

### Colors

| Token | Current | Apple-esque |
|-------|---------|-------------|
| Card background | `bg-white` | `bg-white` (no change) |
| Page background | `bg-neutral-50` | `bg-neutral-50` (no change) |
| Primary border | `border-neutral-200` | `border-neutral-200/60` |
| Secondary border | `border-neutral-100` | `border-neutral-100` (no change) |
| Accent (hover) | `bg-black` | `bg-sky-50`, `text-sky-600` |
| Success | `bg-green-100 text-green-700` | `bg-emerald-50 text-emerald-700 ring-emerald-600/20` |
| Warning | `bg-yellow-100 text-yellow-700` | `bg-amber-50 text-amber-700 ring-amber-600/20` |
| Error | `bg-red-100 text-red-700` | `bg-red-50 text-red-700 ring-red-600/20` |

### Spacing

| Element | Current | Apple-esque |
|---------|---------|-------------|
| Card padding | `p-6` | `p-6` (no change) |
| Section gap | `space-y-6` | `space-y-8` |
| Grid gap | `gap-6` | `gap-4` to `gap-6` |

### Shadows

```css
/* Default card shadow */
shadow-[0_1px_3px_rgba(0,0,0,0.04)]

/* Hover card shadow */
shadow-[0_4px_12px_rgba(0,0,0,0.06)]
```

### Border Radius

| Element | Current | Apple-esque |
|---------|---------|-------------|
| Cards | `rounded-none` | `rounded-2xl` |
| Buttons | `rounded-none` / `rounded-lg` | `rounded-xl` |
| Inputs | `rounded-none` / `rounded-lg` | `rounded-xl` |
| Badges | None | `rounded-full` |
| Icon containers | `border` (square) | `rounded-xl` |

### Typography

| Element | Current | Apple-esque |
|---------|---------|-------------|
| Page title | `text-2xl font-black uppercase` | `text-2xl font-bold tracking-tight` (no uppercase) |
| Section title | `font-bold uppercase` | `text-[15px] font-semibold` |
| Labels | `text-xs font-bold uppercase` | `text-[11px] font-semibold uppercase tracking-wider` |
| Body text | `text-sm` | `text-sm` or `text-[13px]` |
| Table headers | `text-xs font-bold uppercase` | `text-[11px] font-semibold uppercase tracking-wider` |
| Numeric data | Default | `tabular-nums` |

### Transitions

```css
/* Standard transition */
transition-all duration-300 ease-out

/* Colors only */
transition-colors
```

### Hover Effects

```jsx
// Card hover gradient overlay
<div className="absolute inset-0 bg-gradient-to-br from-sky-50/0 to-sky-50/0 group-hover:from-sky-50/30 group-hover:to-transparent transition-all duration-500" />

// Icon container color transition
<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-50 group-hover:bg-sky-50 transition-colors">
  <Icon className="h-[18px] w-[18px] text-neutral-400 group-hover:text-sky-500 transition-colors" />
</div>
```

---

## Component Inventory

### Existing Components to Modify

| Component | File Path | Changes Needed |
|-----------|-----------|----------------|
| StatsCard | `src/components/admin/stats-card.tsx` | Major - convert to RevenueCard style |
| AdminSidebar | `src/components/admin/sidebar.tsx` | Medium - soften styling |
| AdminHeader | `src/components/admin/header.tsx` | Minor - already minimal |
| MobileTable | `src/components/admin/mobile-table.tsx` | Medium - update card styling |
| TableSkeleton | `src/components/ui/skeleton.tsx` | Medium - update to rounded-2xl |
| Button | `src/components/ui/button.tsx` | Medium - add admin variant |
| Input | `src/components/ui/input.tsx` | Medium - update border radius, focus states |
| Textarea | `src/components/ui/textarea.tsx` | Medium - update border radius, focus states |

### New Components to Create

| Component | Purpose | Location |
|-----------|---------|----------|
| AdminCard | Reusable rounded-2xl card with hover effects | `src/components/admin/ui/admin-card.tsx` |
| AdminTable | Apple-styled table wrapper | `src/components/admin/ui/admin-table.tsx` |
| AdminBadge | Status badges with ring styling | `src/components/admin/ui/admin-badge.tsx` |
| AdminInput | Admin-specific input with Apple styling | `src/components/admin/ui/admin-input.tsx` |
| AdminSelect | Apple-styled select dropdown | `src/components/admin/ui/admin-select.tsx` |
| AdminPageHeader | Consistent page header with title/subtitle | `src/components/admin/ui/admin-page-header.tsx` |
| AdminEmptyState | Centered empty state with icon | `src/components/admin/ui/admin-empty-state.tsx` |
| AdminQuickAction | Action card with arrow for dashboard | `src/components/admin/ui/admin-quick-action.tsx` |

### Components Already Apple-styled (Reference)

| Component | File Path | Notes |
|-----------|-----------|-------|
| RevenueCard | `src/components/admin/stripe/revenue-card.tsx` | Use as reference |
| PaymentTable | `src/components/admin/stripe/payment-table.tsx` | Table styling reference |
| PaymentStatusBadge | `src/components/admin/stripe/payment-status-badge.tsx` | Badge styling reference |
| RefundTable | `src/components/admin/stripe/refund-table.tsx` | List item reference |
| Payments Page | `src/app/admin/payments/page.tsx` | Full page reference |

---

## Implementation Phases

### Phase 1: Shared Admin UI Components

**Priority:** Highest - must complete first
**Files to create:**

#### 1.1 AdminCard Component
**File:** `src/components/admin/ui/admin-card.tsx`

```tsx
// Reusable card with Apple styling
// Props: className, children, hover (boolean)
// Base: rounded-2xl, border-neutral-200/60, shadow-[0_1px_3px_rgba(0,0,0,0.04)]
// Hover: shadow-[0_4px_12px_rgba(0,0,0,0.06)], gradient overlay
```

**Acceptance criteria:**
- [ ] Card renders with correct shadows and borders
- [ ] Hover state elevates card with smooth transition
- [ ] Optional gradient overlay on hover
- [ ] Works with any children content

#### 1.2 AdminBadge Component
**File:** `src/components/admin/ui/admin-badge.tsx`

```tsx
// Status badge based on PaymentStatusBadge
// Props: variant (success|warning|error|neutral|info), children
// Styling: rounded-full, ring-1 ring-inset, text-[11px] font-semibold
```

**Acceptance criteria:**
- [ ] All 5 variants render correctly
- [ ] Ring styling matches payment badges
- [ ] Compact size (px-2.5 py-0.5)

#### 1.3 AdminTable Component
**File:** `src/components/admin/ui/admin-table.tsx`

```tsx
// Table wrapper with Apple styling
// Includes: AdminTable (wrapper), AdminTableHead, AdminTableBody, AdminTableRow
// Header styling: text-[11px] font-semibold uppercase tracking-wider text-neutral-400
// Row styling: hover:bg-neutral-50/50 transition-colors
```

**Acceptance criteria:**
- [ ] Table has rounded-2xl wrapper
- [ ] Headers match payment table styling
- [ ] Rows have subtle hover state
- [ ] Dividers use divide-neutral-50

#### 1.4 AdminInput Component
**File:** `src/components/admin/ui/admin-input.tsx`

```tsx
// Apple-styled input for admin forms
// Changes from current: rounded-xl, focus:ring-sky-500/20, border-neutral-200
```

**Acceptance criteria:**
- [ ] Rounded corners (rounded-xl)
- [ ] Sky-colored focus ring
- [ ] Error state with red ring
- [ ] Label styling matches design system

#### 1.5 AdminSelect Component
**File:** `src/components/admin/ui/admin-select.tsx`

```tsx
// Styled select dropdown
// Currently: raw <select> with inline classes
// New: rounded-xl, consistent focus states, custom arrow
```

**Acceptance criteria:**
- [ ] Matches AdminInput styling
- [ ] Custom dropdown arrow
- [ ] Smooth focus transitions

#### 1.6 AdminPageHeader Component
**File:** `src/components/admin/ui/admin-page-header.tsx`

```tsx
// Consistent header for all admin pages
// Props: title, subtitle, actions (ReactNode)
// Title: text-2xl font-bold tracking-tight (not uppercase)
// Subtitle: text-neutral-500 text-sm
```

**Acceptance criteria:**
- [ ] Title renders without uppercase
- [ ] Actions slot for buttons
- [ ] Responsive (stacks on mobile)

#### 1.7 AdminEmptyState Component
**File:** `src/components/admin/ui/admin-empty-state.tsx`

```tsx
// Empty state with centered icon and text
// Props: icon, title, description, action (button)
// Icon container: h-14 w-14 rounded-full bg-neutral-50
```

**Acceptance criteria:**
- [ ] Icon in rounded container
- [ ] Centered layout
- [ ] Optional CTA button

#### 1.8 AdminQuickAction Component
**File:** `src/components/admin/ui/admin-quick-action.tsx`

```tsx
// Quick action link card for dashboard
// Current: border hover:border-black
// New: AdminCard with icon container and arrow
```

**Acceptance criteria:**
- [ ] Uses AdminCard as base
- [ ] Icon in rounded-xl container
- [ ] Arrow animates on hover

**Estimated complexity:** Medium (2-3 hours)

---

### Phase 2: Update Existing Shared Components

**Priority:** High - enables page updates

#### 2.1 StatsCard -> AdminStatsCard
**File:** `src/components/admin/stats-card.tsx`

**Current state:**
- Square borders (no rounded)
- Flat styling
- Icon in square bordered container

**Changes:**
```diff
- className="border border-neutral-200 bg-white p-6"
+ className="group relative overflow-hidden rounded-2xl bg-white p-6 border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-300 ease-out"

// Add gradient overlay
+ <div className="absolute inset-0 bg-gradient-to-br from-sky-50/0 to-sky-50/0 group-hover:from-sky-50/30 group-hover:to-transparent transition-all duration-500" />

// Icon container
- className="flex h-12 w-12 items-center justify-center border border-neutral-200"
+ className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-50 group-hover:bg-sky-50 transition-colors"

// Icon
- className="h-6 w-6 text-neutral-400"
+ className="h-[18px] w-[18px] text-neutral-400 group-hover:text-sky-500 transition-colors"

// Value text
- className="mt-2 text-3xl font-black text-black"
+ className="text-[32px] font-semibold tracking-tight text-neutral-900 tabular-nums"

// Title
- className="text-xs font-bold uppercase tracking-wider text-neutral-500"
+ className="text-[13px] font-medium text-neutral-500 tracking-wide"
```

**Acceptance criteria:**
- [ ] Matches RevenueCard styling exactly
- [ ] Hover gradient works
- [ ] Icon color transitions
- [ ] Numeric values use tabular-nums

#### 2.2 MobileTable Components
**File:** `src/components/admin/mobile-table.tsx`

**Changes:**
```diff
// MobileCard
- className="border border-neutral-200 bg-white p-4 space-y-3"
+ className="rounded-2xl border border-neutral-200/60 bg-white p-4 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"

// MobileCardRow label
- className="text-xs font-bold uppercase tracking-wider text-neutral-500"
+ className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400"

// ResponsiveTable desktop wrapper
- className="hidden lg:block border border-neutral-200 bg-white"
+ className="hidden lg:block rounded-2xl border border-neutral-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden"
```

**Acceptance criteria:**
- [ ] Mobile cards have rounded corners
- [ ] Desktop table wrapper has rounded corners
- [ ] Overflow hidden to clip table corners

#### 2.3 Skeleton Components
**File:** `src/components/ui/skeleton.tsx`

**Changes:**
```diff
// Base Skeleton
- className="animate-pulse bg-neutral-200"
+ className="animate-pulse bg-neutral-100 rounded-lg"

// SessionCardSkeleton
- className="border border-neutral-200 bg-white p-6"
+ className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"

// TableSkeleton wrapper
- className="border border-neutral-200 bg-white overflow-hidden"
+ className="rounded-2xl border border-neutral-200/60 bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]"

// StatsCardSkeleton (if exists)
// Apply same rounded-2xl treatment
```

**Acceptance criteria:**
- [ ] All skeletons match redesigned components
- [ ] Smooth pulse animation
- [ ] Consistent rounded corners

#### 2.4 Input Component
**File:** `src/components/ui/input.tsx`

**Changes:**
```diff
// Input element
- className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base text-gray-900"
- "focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
+ className="flex h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900"
+ "focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
+ "transition-all duration-200"

// Label
- className="block text-sm font-medium text-gray-700"
+ className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-2"
```

**Acceptance criteria:**
- [ ] Rounded-xl corners
- [ ] Sky focus color
- [ ] Label matches admin design system

#### 2.5 Textarea Component
**File:** `src/components/ui/textarea.tsx`

**Changes:** Same as Input

**Acceptance criteria:**
- [ ] Matches Input styling
- [ ] Sky focus ring

#### 2.6 Button Component (Admin variants)
**File:** `src/components/ui/button.tsx`

**Add new admin variants:**
```tsx
// Add to variants
adminPrimary: "bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl text-sm font-medium transition-colors",
adminSecondary: "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 rounded-xl text-sm font-medium transition-colors",
adminGhost: "text-neutral-500 hover:text-sky-600 text-[13px] font-medium transition-colors",
```

**Acceptance criteria:**
- [ ] Admin primary button (dark)
- [ ] Admin secondary button (light border)
- [ ] Admin ghost (text only)
- [ ] All use rounded-xl

**Estimated complexity:** Medium (2-3 hours)

---

### Phase 3: Admin Layout Updates

**Priority:** High - affects all pages

#### 3.1 Admin Layout
**File:** `src/app/admin/layout.tsx`

**Changes:**
- Header styling (subtle bottom shadow instead of border)
- Logo styling update
- Background remains neutral-50

```diff
// Header
- className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center border-b border-neutral-200 bg-white"
+ className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]"

// Logo
- className="text-lg font-black uppercase tracking-wider"
+ className="text-lg font-bold tracking-tight"
```

**Acceptance criteria:**
- [ ] Header has subtle shadow, no hard border
- [ ] Logo styling refined

#### 3.2 AdminSidebar
**File:** `src/components/admin/sidebar.tsx`

**Changes:**
```diff
// Nav items
- className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium"
+ className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium"

// Active state
- "bg-black text-white"
+ "bg-neutral-900 text-white"

// Hover state
- "text-neutral-600 hover:bg-neutral-100 hover:text-black"
+ "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"

// Desktop sidebar
- className="hidden lg:block fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64 border-r border-neutral-200 bg-white"
+ className="hidden lg:block fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64 bg-white shadow-[1px_0_0_rgba(0,0,0,0.04)]"

// Mobile sidebar
- className="lg:hidden fixed left-0 top-0 z-50 h-screen w-64 border-r border-neutral-200 bg-white"
+ className="lg:hidden fixed left-0 top-0 z-50 h-screen w-64 bg-white shadow-[4px_0_12px_rgba(0,0,0,0.06)]"
```

**Acceptance criteria:**
- [ ] Nav items have rounded-xl
- [ ] Subtle sidebar shadow
- [ ] Softer hover states

**Estimated complexity:** Low (1 hour)

---

### Phase 4: Dashboard Page

**File:** `src/app/admin/page.tsx`

#### Changes:

1. **Header section**
```diff
- <h1 className="text-2xl font-black uppercase tracking-wide text-black">Dashboard</h1>
+ <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Dashboard</h1>
```

2. **Stats Grid** - Use updated StatsCard component

3. **Recent Bookings card**
```diff
- <div className="border border-neutral-200 bg-white p-6">
+ <AdminCard className="p-6">

// Section title
- <h2 className="font-bold uppercase tracking-wide text-black">Recent Bookings</h2>
+ <h2 className="text-[15px] font-semibold text-neutral-900">Recent Bookings</h2>

// View all link
- className="text-sm font-medium text-neutral-500 hover:text-black"
+ className="text-[13px] font-medium text-neutral-500 hover:text-sky-600 transition-colors"

// Status badges - use AdminBadge
- className="px-2 py-1 text-xs font-bold uppercase bg-green-100 text-green-700"
+ <AdminBadge variant="success">Paid</AdminBadge>
```

4. **Quick Actions card**
```diff
// Use AdminQuickAction component
- <Link className="flex items-center justify-between border border-neutral-200 p-4 hover:border-black">
+ <AdminQuickAction href="/admin/programs/new" icon={Plus} label="Create New Program" />
```

**Acceptance criteria:**
- [ ] Page title not uppercase
- [ ] Stats cards use updated StatsCard
- [ ] Cards use AdminCard wrapper
- [ ] Quick actions use AdminQuickAction
- [ ] Badges use AdminBadge
- [ ] Links have sky hover color

**Estimated complexity:** Medium (1-2 hours)

---

### Phase 5: Programs Pages

#### 5.1 Programs List
**File:** `src/app/admin/programs/page.tsx`

**Changes:**
- Use AdminPageHeader
- Use AdminTable for desktop
- Use updated MobileCard for mobile
- Use AdminBadge for status
- Use AdminEmptyState for empty

```diff
// Header
- <h1 className="text-2xl font-black uppercase tracking-wide text-black">Programs</h1>
+ <AdminPageHeader title="Programs" subtitle="Manage your coaching programs">
+   <Button variant="adminPrimary" asChild>...</Button>
+ </AdminPageHeader>

// Empty state
- <div className="border border-neutral-200 bg-white p-12 text-center">
+ <AdminEmptyState icon={Calendar} title="No programs yet" description="..." action={...} />

// Table wrapper
- <table className="w-full">
+ <AdminTable>

// Table headers
- className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500"
+ className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400"

// Status badge
- className="px-2 py-1 text-xs font-bold uppercase bg-green-100 text-green-700"
+ <AdminBadge variant="success">Active</AdminBadge>
```

**Acceptance criteria:**
- [ ] Uses shared admin components
- [ ] Table has rounded wrapper
- [ ] Badges styled correctly
- [ ] Empty state styled correctly

#### 5.2 New Program Form
**File:** `src/app/admin/programs/new/page.tsx`

**Changes:**
- Use AdminPageHeader with back button
- Update form card wrapper
- Use AdminInput/AdminSelect components
- Update button styling

```diff
// Back button
- className="flex h-10 w-10 items-center justify-center border border-neutral-200 hover:bg-neutral-50"
+ className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200/60 hover:bg-neutral-50 transition-colors"

// Form wrapper
- <div className="border border-neutral-200 bg-white p-6 space-y-6">
+ <AdminCard className="p-6 space-y-6">

// Labels
- className="block text-xs font-bold uppercase tracking-wider text-neutral-500"
+ className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-2"

// Inputs
- className="mt-2 rounded-none"
+ use AdminInput component

// Select
- className="mt-2 w-full rounded-none border border-neutral-300 px-3 py-2"
+ use AdminSelect component

// Error message
- className="border border-red-200 bg-red-50 p-4 text-sm text-red-700"
+ className="rounded-xl border border-red-200/60 bg-red-50 p-4 text-sm text-red-700"
```

**Acceptance criteria:**
- [ ] Form card rounded
- [ ] All inputs use AdminInput
- [ ] All selects use AdminSelect
- [ ] Error messages rounded
- [ ] Back button rounded

#### 5.3 Edit Program Page
**File:** `src/app/admin/programs/[id]/page.tsx`

**Changes:** Same as New Program + sessions list section

**Acceptance criteria:**
- [ ] Same as new program form
- [ ] Sessions list if any uses AdminTable

**Estimated complexity:** Medium (2-3 hours)

---

### Phase 6: Sessions Pages

#### 6.1 Sessions List
**File:** `src/app/admin/sessions/page.tsx`

**Changes:**
- Use AdminPageHeader
- Use AdminTable
- Style capacity progress bar
- Use AdminEmptyState

```diff
// Capacity progress bar
- <div className="w-16 h-2 bg-neutral-200 rounded-full overflow-hidden">
+ <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">

// Progress fill colors remain semantic (red/yellow/green)
```

**Acceptance criteria:**
- [ ] Uses shared components
- [ ] Progress bars thinner and softer
- [ ] Table rows have hover state

#### 6.2 Edit Session Page
**File:** `src/app/admin/sessions/[id]/page.tsx`

**Changes:** Same form updates as programs

**Acceptance criteria:**
- [ ] Consistent with program forms

#### 6.3 New Session Page
**File:** `src/app/admin/programs/[id]/sessions/new/page.tsx`

**Changes:** Same form updates

**Estimated complexity:** Medium (1-2 hours)

---

### Phase 7: Bookings Pages

#### 7.1 Bookings List
**File:** `src/app/admin/bookings/page.tsx`

**Changes:**
- Use AdminPageHeader
- Style filter buttons
- Use AdminTable
- Use AdminBadge for status

```diff
// Filter buttons
- className="px-3 sm:px-4 py-2 text-sm font-medium bg-black text-white"
+ className="px-4 py-2 text-[13px] font-medium rounded-lg bg-neutral-900 text-white"

// Inactive filter
- className="bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
+ className="rounded-lg border border-neutral-200/60 bg-white text-neutral-600 hover:bg-neutral-50 transition-colors"
```

**Acceptance criteria:**
- [ ] Filter buttons rounded
- [ ] Uses shared components
- [ ] Export button styled

#### 7.2 Booking Detail Page
**File:** `src/app/admin/bookings/[id]/page.tsx`

**Changes:**
- Use AdminCard for info sections
- Update section headers
- Style status badge

```diff
// Info cards
- <div className="border border-neutral-200 bg-white p-6">
+ <AdminCard className="p-6">

// Section header
- <h2 className="flex items-center gap-2 font-bold uppercase tracking-wide text-black mb-4">
+ <h2 className="flex items-center gap-2 text-[15px] font-semibold text-neutral-900 mb-4">

// Labels in card
- <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
+ <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">

// Status badge
- className="px-3 py-1 text-sm font-bold uppercase bg-green-100 text-green-700"
+ <AdminBadge variant="success" size="lg">Paid</AdminBadge>
```

**Acceptance criteria:**
- [ ] All info cards use AdminCard
- [ ] Labels consistent
- [ ] Status badge prominent

**Estimated complexity:** Medium (2 hours)

---

### Phase 8: Waitlist Page

**File:** `src/app/admin/waitlist/page.tsx`

**Changes:**
- Use AdminPageHeader
- Update stats mini-cards
- Use AdminTable
- Use AdminBadge for status

```diff
// Stats cards (mini version)
- <div className="border border-neutral-200 bg-white p-4">
+ <div className="rounded-2xl border border-neutral-200/60 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">

// Stats label
- <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
+ <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">

// Stats value
- <p className="mt-1 text-2xl font-bold text-black">
+ <p className="mt-1 text-2xl font-semibold text-neutral-900 tabular-nums">
```

**Acceptance criteria:**
- [ ] Stats cards rounded
- [ ] Table styled
- [ ] Action buttons styled

**Estimated complexity:** Low-Medium (1-2 hours)

---

## File Path Summary

### New Files to Create
```
src/components/admin/ui/
  admin-card.tsx
  admin-table.tsx
  admin-badge.tsx
  admin-input.tsx
  admin-select.tsx
  admin-page-header.tsx
  admin-empty-state.tsx
  admin-quick-action.tsx
  index.ts (barrel export)
```

### Files to Modify
```
src/components/admin/
  stats-card.tsx
  sidebar.tsx
  header.tsx (minor)
  mobile-table.tsx

src/components/ui/
  skeleton.tsx
  button.tsx
  input.tsx
  textarea.tsx

src/app/admin/
  layout.tsx
  page.tsx
  programs/page.tsx
  programs/new/page.tsx
  programs/[id]/page.tsx
  programs/[id]/sessions/new/page.tsx
  sessions/page.tsx
  sessions/[id]/page.tsx
  bookings/page.tsx
  bookings/[id]/page.tsx
  waitlist/page.tsx
```

---

## Complexity Summary

| Phase | Description | Estimated Time |
|-------|-------------|----------------|
| 1 | Shared Admin UI Components | 2-3 hours |
| 2 | Update Existing Shared Components | 2-3 hours |
| 3 | Admin Layout Updates | 1 hour |
| 4 | Dashboard Page | 1-2 hours |
| 5 | Programs Pages (3 pages) | 2-3 hours |
| 6 | Sessions Pages (2 pages) | 1-2 hours |
| 7 | Bookings Pages (2 pages) | 2 hours |
| 8 | Waitlist Page | 1-2 hours |

**Total Estimated Time:** 12-18 hours

---

## Implementation Order

**Recommended sequence:**

1. **Phase 1** - Create shared components first (enables all other phases)
2. **Phase 2** - Update existing shared components
3. **Phase 3** - Admin layout (immediate visual impact)
4. **Phase 4** - Dashboard (high visibility)
5. **Phases 5-8** - Individual pages (can be parallelized or done in any order)

---

## Testing Checklist

- [ ] All admin pages load without errors
- [ ] Responsive design works on mobile
- [ ] Hover states animate smoothly
- [ ] Form validation still works
- [ ] Empty states display correctly
- [ ] Loading skeletons match new design
- [ ] No visual regression on Payments page (reference)
- [ ] Dark mode not required (admin is light only)

---

## Notes

1. **Payments page unchanged** - Already implements the target design
2. **Login page** - Consider updating separately (different context)
3. **Motion animations** - Keep existing where they exist, add subtle hover transitions
4. **Icons** - Keep Lucide, just update container styling
5. **Colors** - Stay within neutral/sky/emerald/amber/red palette
