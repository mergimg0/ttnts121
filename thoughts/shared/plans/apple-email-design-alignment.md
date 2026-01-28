# Implementation Plan: Apple-esque Email Section Design Alignment

Generated: 2025-01-28

## Goal

Align the email section (Campaigns and Contacts) in the admin dashboard with the established Apple-esque design system used throughout the rest of the admin interface. The email section already uses many correct components but has inconsistencies that need to be addressed for visual and UX cohesion.

## Research Summary

### Existing Apple Design System Components (VERIFIED)

| Component | File | Key Patterns |
|-----------|------|--------------|
| `AdminCard` | `src/components/admin/ui/admin-card.tsx` | `rounded-xl lg:rounded-2xl`, subtle shadow `shadow-[0_1px_3px_rgba(0,0,0,0.04)]`, hover gradient overlay, `border-neutral-200/60` |
| `AdminTable` | `src/components/admin/ui/admin-table.tsx` | `rounded-2xl`, header text `text-[11px] font-semibold uppercase tracking-wider text-neutral-400`, row hover `hover:bg-neutral-50/50` |
| `AdminPageHeader` | `src/components/admin/ui/admin-page-header.tsx` | `text-2xl font-bold text-neutral-900 tracking-tight`, subtitle `text-neutral-500 text-sm`, actions in flex container |
| `AdminInput` | `src/components/admin/ui/admin-input.tsx` | `h-11 rounded-xl`, labels `text-[11px] font-semibold uppercase tracking-wider text-neutral-500`, focus ring `ring-sky-500/20` |
| `AdminSelect` | `src/components/admin/ui/admin-select.tsx` | Same styling as input, chevron icon positioned right |
| `AdminBadge` | `src/components/admin/ui/admin-badge.tsx` | `rounded-full px-2.5 py-0.5`, `text-[11px] font-semibold`, ring border styling |
| `AdminEmptyState` | `src/components/admin/ui/admin-empty-state.tsx` | Centered layout, `h-14 w-14` icon container with `bg-neutral-50` |
| `MobileCard` | `src/components/admin/mobile-table.tsx` | `rounded-xl`, `shadow-[0_1px_3px_rgba(0,0,0,0.04)]`, responsive show/hide |
| `StatsCard` | `src/components/admin/stats-card.tsx` | Same card styling, icon container `rounded-xl bg-neutral-50`, hover transitions |
| Button Variants | `src/components/ui/button.tsx` | `adminPrimary` (navy, rounded-xl), `adminSecondary` (border, rounded-xl), `adminGhost`, `adminDanger` |

### Design Tokens (VERIFIED)

**Typography:**
- Page title: `text-2xl font-bold text-neutral-900 tracking-tight`
- Section title: `text-xl font-semibold text-neutral-900`
- Card section title: `text-[15px] font-semibold text-neutral-900`
- Labels: `text-[11px] font-semibold uppercase tracking-wider text-neutral-400`
- Body text: `text-sm text-neutral-600`
- Secondary text: `text-[13px] text-neutral-500`

**Spacing:**
- Page sections: `space-y-8` (well-styled pages like sessions/programs)
- Card internal: `p-4 lg:p-6`
- Form fields: `space-y-6`
- Stats grid: `gap-4`

**Colors:**
- Primary: navy (`bg-navy text-white`)
- Accent: sky-500 for focus states
- Success: emerald
- Warning: amber
- Error: red
- Neutral: neutral-50/100/200/400/500/600/900

**Shadows:**
- Default: `shadow-[0_1px_3px_rgba(0,0,0,0.04)]`
- Hover: `shadow-[0_4px_12px_rgba(0,0,0,0.06)]`

**Border Radius:**
- Cards/containers: `rounded-xl lg:rounded-2xl`
- Inputs/buttons: `rounded-xl`
- Badges: `rounded-full`

## Current Email Section Analysis

### Files to Update

1. **`src/app/admin/campaigns/page.tsx`** - Main campaigns list
2. **`src/app/admin/campaigns/new/page.tsx`** - New campaign form
3. **`src/app/admin/campaigns/[id]/page.tsx`** - Campaign detail/edit
4. **`src/app/admin/contacts/page.tsx`** - Main contacts list
5. **`src/app/admin/contacts/new/page.tsx`** - New contact form
6. **`src/app/admin/contacts/[id]/page.tsx`** - Contact detail/edit

### Issues Identified (VERIFIED by reading files)

| File | Issue | Fix Required |
|------|-------|--------------|
| campaigns/page.tsx | Uses custom header instead of `AdminPageHeader` | Replace with component |
| campaigns/page.tsx | Page spacing is `space-y-6` instead of `space-y-8` | Update spacing |
| campaigns/page.tsx | Table uses raw `<table>` instead of `AdminTable` components | Migrate to AdminTable |
| campaigns/page.tsx | Missing `ResponsiveTable` + `MobileCard` for mobile | Add mobile view |
| campaigns/page.tsx | Header title is `text-xl` instead of `text-2xl` | Use AdminPageHeader |
| contacts/page.tsx | Same header pattern issue | Replace with AdminPageHeader |
| contacts/page.tsx | Same page spacing issue | Update to space-y-8 |
| contacts/page.tsx | Table uses raw `<table>` | Migrate to AdminTable |
| contacts/page.tsx | Missing mobile responsive cards | Add MobileCard view |
| contacts/page.tsx | Uses generic `Input` instead of `AdminInput` in filter | Update import |
| campaigns/new/page.tsx | Uses generic `Input` instead of `AdminInput` | Update to AdminInput |
| campaigns/new/page.tsx | Uses manual labels instead of component labels | Use AdminInput label prop |
| campaigns/new/page.tsx | Textarea has manual styling | Create/use AdminTextarea |
| contacts/new/page.tsx | Same Input/label issues | Update to AdminInput |
| campaigns/[id]/page.tsx | Same pattern issues as new page | Apply same fixes |
| contacts/[id]/page.tsx | Same pattern issues | Apply same fixes |

---

## Implementation Phases

### Phase 1: Campaigns List Page
**Priority: High | Effort: Medium**

**File:** `src/app/admin/campaigns/page.tsx`

**Changes:**
1. Replace custom header with `AdminPageHeader`:
   ```tsx
   // Before (lines 114-128)
   <div className="flex flex-col sm:flex-row ...">
     <h1 className="text-xl font-semibold">Campaigns</h1>
     ...
   </div>

   // After
   <AdminPageHeader
     title="Campaigns"
     subtitle="Create and send email campaigns to your contacts"
   >
     <Button variant="adminPrimary" asChild>
       <Link href="/admin/campaigns/new">
         <Plus className="mr-2 h-4 w-4" />
         New Campaign
       </Link>
     </Button>
   </AdminPageHeader>
   ```

2. Update page spacing: `space-y-6` -> `space-y-8`

3. Migrate table to `AdminTable` components (lines 214-296):
   - Replace `<table>` with `<AdminTable>`
   - Replace `<thead>` with `<AdminTableHead>`
   - Replace `<th>` with `<AdminTableHeader>`
   - Replace `<tbody>` with `<AdminTableBody>`
   - Replace `<tr>` with `<AdminTableRow>`
   - Replace `<td>` with `<AdminTableCell>`

4. Add `ResponsiveTable` wrapper with `MobileCard` view:
   - Wrap table in `<ResponsiveTable mobileView={...}>`
   - Create mobile cards for each campaign

5. Update empty state to use `AdminEmptyState` component (lines 200-212)

**Acceptance Criteria:**
- [ ] Uses AdminPageHeader component
- [ ] Page uses space-y-8 spacing
- [ ] Table uses AdminTable components
- [ ] Mobile view shows cards instead of table
- [ ] Empty state uses AdminEmptyState component

---

### Phase 2: Contacts List Page
**Priority: High | Effort: Medium**

**File:** `src/app/admin/contacts/page.tsx`

**Changes:**
1. Replace custom header with `AdminPageHeader`:
   ```tsx
   <AdminPageHeader
     title="Contacts"
     subtitle="Manage your email subscribers and marketing contacts"
   >
     <Button variant="adminPrimary" asChild>
       <Link href="/admin/contacts/new">
         <Plus className="mr-2 h-4 w-4" />
         Add Contact
       </Link>
     </Button>
   </AdminPageHeader>
   ```

2. Update page spacing: `space-y-6` -> `space-y-8`

3. Replace generic `Input` with `AdminInput` in filter section (line 152-157):
   ```tsx
   // Before
   <Input placeholder="Search by name or email..." ... />

   // After
   <AdminInput
     placeholder="Search by name or email..."
     leftIcon={<Search className="h-4 w-4" />}
     ...
   />
   ```

4. Migrate table to `AdminTable` components (lines 204-end)

5. Add `ResponsiveTable` wrapper with `MobileCard` view

6. Update empty state styling to match `AdminEmptyState` pattern

**Acceptance Criteria:**
- [ ] Uses AdminPageHeader component
- [ ] Page uses space-y-8 spacing
- [ ] Filter uses AdminInput with leftIcon
- [ ] Table uses AdminTable components
- [ ] Mobile view shows cards
- [ ] Empty state follows design system

---

### Phase 3: New Campaign Form
**Priority: High | Effort: Low**

**File:** `src/app/admin/campaigns/new/page.tsx`

**Changes:**
1. Replace `Input` imports with `AdminInput`:
   ```tsx
   // Update imports
   import { AdminInput, AdminTextarea } from "@/components/admin/ui";
   ```

2. Replace all `<Input>` with `<AdminInput label="...">` (lines 154-178):
   ```tsx
   // Before
   <label className="block text-[11px] ...">Campaign Name *</label>
   <Input value={formData.name} ... />

   // After
   <AdminInput
     label="Campaign Name *"
     value={formData.name}
     placeholder="e.g., Spring 2024 Newsletter"
     hint="Internal name, not shown to recipients"
     ...
   />
   ```

3. Replace raw `<textarea>` with `AdminTextarea` (lines 185-197):
   ```tsx
   <AdminTextarea
     label="Email Body *"
     value={formData.body}
     rows={10}
     placeholder="Write your email content here. HTML is supported."
     hint="You can use HTML for formatting"
   />
   ```

4. Update location toggle buttons to match filter pattern from bookings page:
   - Use consistent `rounded-xl` and transition classes

**Acceptance Criteria:**
- [ ] All inputs use AdminInput component
- [ ] Textarea uses AdminTextarea component
- [ ] Labels integrated into components
- [ ] Hints display correctly
- [ ] Location toggles have consistent styling

---

### Phase 4: New Contact Form
**Priority: High | Effort: Low**

**File:** `src/app/admin/contacts/new/page.tsx`

**Changes:**
1. Replace `Input` imports with `AdminInput`:
   ```tsx
   import { AdminInput } from "@/components/admin/ui";
   ```

2. Update all form fields to use `AdminInput` with integrated labels:
   ```tsx
   // Before (lines 86-98)
   <label className="block text-[11px] ...">Email Address *</label>
   <Input type="email" ... />

   // After
   <AdminInput
     label="Email Address *"
     type="email"
     value={formData.email}
     placeholder="email@example.com"
     required
   />
   ```

3. Style the checkbox to be consistent:
   ```tsx
   // Current (lines 166-179) - styling is good, just verify consistency
   <input
     type="checkbox"
     className="h-4 w-4 rounded border-neutral-300 text-sky-600 focus:ring-sky-500"
   />
   ```

**Acceptance Criteria:**
- [ ] All inputs use AdminInput component
- [ ] Labels integrated into components
- [ ] Checkbox has consistent focus styling
- [ ] Form layout matches other admin forms

---

### Phase 5: Campaign Detail Page
**Priority: Medium | Effort: Medium**

**File:** `src/app/admin/campaigns/[id]/page.tsx`

**Changes:**
1. Update form fields to use `AdminInput` and `AdminTextarea`
2. Ensure loading state uses consistent spinner pattern
3. Verify not-found state matches `AdminEmptyState` styling
4. Update action buttons section to be consistent with other detail pages

**Acceptance Criteria:**
- [ ] Form fields use admin components
- [ ] Loading/empty states consistent
- [ ] Action buttons follow pattern

---

### Phase 6: Contact Detail Page
**Priority: Medium | Effort: Low**

**File:** `src/app/admin/contacts/[id]/page.tsx`

**Changes:**
1. Update form fields to use `AdminInput`
2. Verify consent log section uses `AdminCard` properly
3. Ensure action buttons consistent

**Acceptance Criteria:**
- [ ] Form fields use admin components
- [ ] Consent log display follows design system
- [ ] Action buttons consistent

---

## Testing Strategy

1. **Visual Comparison:**
   - Compare campaigns/contacts pages side-by-side with programs/bookings pages
   - Verify identical spacing, typography, colors, shadows

2. **Responsive Testing:**
   - Test mobile view at 375px width
   - Verify mobile cards display correctly
   - Check filter inputs work on mobile

3. **Interaction Testing:**
   - Verify focus states match (sky-500 ring)
   - Test hover transitions on cards and buttons
   - Confirm form validation error states

4. **Accessibility:**
   - Verify label associations (htmlFor/id)
   - Check color contrast ratios
   - Test keyboard navigation

---

## Risks & Considerations

1. **Input Component Duplication:**
   - Some pages use generic `Input`, others use `AdminInput`
   - Solution: Consistently use `AdminInput` in admin section

2. **Mobile Responsiveness:**
   - Email pages lack mobile card views
   - Risk: Additional development time for mobile layouts
   - Mitigation: Follow exact pattern from sessions/programs pages

3. **Form Layout Changes:**
   - Moving labels into components may affect layout
   - Solution: Test each form after migration

4. **Breaking Changes:**
   - None expected - all changes are styling/component swaps

---

## Estimated Complexity

| Phase | Files | Estimated Time | Complexity |
|-------|-------|----------------|------------|
| Phase 1 | 1 | 45 min | Medium |
| Phase 2 | 1 | 45 min | Medium |
| Phase 3 | 1 | 20 min | Low |
| Phase 4 | 1 | 15 min | Low |
| Phase 5 | 1 | 30 min | Medium |
| Phase 6 | 1 | 20 min | Low |
| **Total** | **6** | **~3 hours** | **Medium** |

---

## Summary Checklist

### Global Updates
- [ ] Standardize page spacing to `space-y-8`
- [ ] Use `AdminPageHeader` for all list pages
- [ ] Use `AdminTable` components for all tables
- [ ] Add `ResponsiveTable` with `MobileCard` for mobile views
- [ ] Use `AdminInput`/`AdminTextarea` for all form fields
- [ ] Use `AdminEmptyState` for empty states
- [ ] Verify all buttons use `adminPrimary`/`adminSecondary` variants

### Component Usage
- [ ] `AdminCard` for all card containers
- [ ] `AdminBadge` for status indicators
- [ ] `AdminSelect` for dropdowns
- [ ] `Button` with admin variants for actions

### Design Tokens
- [ ] Typography matches design system
- [ ] Colors consistent (navy, sky, neutral)
- [ ] Shadows consistent
- [ ] Border radius consistent (`rounded-xl`, `rounded-2xl`)
- [ ] Transitions consistent (`duration-200`, `duration-300`)
