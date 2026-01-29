# Implementation Plan: Fix Mobile Menu Scrolling

Generated: 2026-01-27

## Goal

Fix the mobile hamburger menu scrolling behavior so that:
1. The menu content itself scrolls when it overflows (e.g., when accordions are expanded)
2. The page behind the menu does NOT scroll while the menu is open
3. Users can access all menu items regardless of viewport height

## Problem Analysis

### Current Behavior (Verified)

**File:** `/Users/mghome/projects/ttnts121/src/components/layout/header.tsx`

The mobile menu structure (lines 249-425):

```tsx
<AnimatePresence>
  {isMenuOpen && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}  // <-- Issue 1: height: auto
      exit={{ opacity: 0, height: 0 }}
      className="lg:hidden overflow-hidden"      // <-- Issue 2: overflow-hidden
    >
      <nav className="flex flex-col border-t border-neutral-200 bg-white px-4 py-6">
        {/* Menu items with expandable accordions */}
      </nav>
    </motion.div>
  )}
</AnimatePresence>
```

### Root Causes

1. **`height: "auto"`** - The menu grows unbounded when accordions expand, pushing content below viewport
2. **`overflow-hidden`** on motion.div - This prevents scroll but still allows height growth
3. **No body scroll lock** - When touching the menu area, scroll events bubble to the page behind
4. **No max-height constraint** - Menu can exceed viewport height

### Menu Content Count (Verified)

- Home link: 1 item
- Services accordion: 1 button + 5 service items + "View All" = 7 items when expanded
- About accordion: 1 button + 4 items = 5 items when expanded
- Other NAV_LINKS: 1 item (Contact)
- Bottom CTA section: Phone + Book Now button

**Total when fully expanded:** ~15+ items - easily exceeds mobile viewport

## Implementation Phases

### Phase 1: Add Scroll Container with Max Height

**File to modify:** `/Users/mghome/projects/ttnts121/src/components/layout/header.tsx`

**Changes:**

1. Change the motion.div wrapper to use fixed/max height instead of `height: "auto"`:

```tsx
// Lines 252-257 - Change from:
<motion.div
  initial={{ opacity: 0, height: 0 }}
  animate={{ opacity: 1, height: "auto" }}
  exit={{ opacity: 0, height: 0 }}
  transition={{ duration: 0.2 }}
  className="lg:hidden overflow-hidden"
>

// To:
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.2 }}
  className="lg:hidden fixed inset-x-0 top-20 bottom-0 z-40 bg-white overflow-y-auto"
>
```

**Why this works:**
- `fixed inset-x-0 top-20 bottom-0` - Creates a fixed overlay below the header (header height is `h-20`)
- `overflow-y-auto` - Allows vertical scrolling within the menu
- Removes `height: "auto"` animation that causes unbounded growth

### Phase 2: Add Body Scroll Lock

**File to modify:** `/Users/mghome/projects/ttnts121/src/components/layout/header.tsx`

**Changes:**

Add a useEffect to lock body scroll when menu is open (around line 56, after existing useEffects):

```tsx
// Lock body scroll when mobile menu is open
useEffect(() => {
  if (isMenuOpen) {
    // Save current scroll position
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
  } else {
    // Restore scroll position
    const scrollY = document.body.style.top;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.overflow = '';
    if (scrollY) {
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
  }

  return () => {
    // Cleanup on unmount
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.overflow = '';
  };
}, [isMenuOpen]);
```

**Why this works:**
- Prevents background scrolling by fixing body position
- Preserves scroll position so page doesn't jump when menu closes
- Cleanup ensures no style leaks

### Phase 3: Update Nav Container Styling

**File to modify:** `/Users/mghome/projects/ttnts121/src/components/layout/header.tsx`

**Changes:**

Update the `<nav>` element styling (line 259):

```tsx
// Change from:
<nav className="flex flex-col border-t border-neutral-200 bg-white px-4 py-6">

// To:
<nav className="flex flex-col border-t border-neutral-200 bg-white px-4 py-6 pb-24">
```

**Why:**
- `pb-24` adds bottom padding so the last items aren't hidden behind the "Book Now" button or phone safe area

### Phase 4: Add Touch Scroll Optimization (Optional Enhancement)

**File to modify:** `/Users/mghome/projects/ttnts121/src/components/layout/header.tsx`

Add `-webkit-overflow-scrolling: touch` for smooth momentum scrolling on iOS:

```tsx
className="lg:hidden fixed inset-x-0 top-20 bottom-0 z-40 bg-white overflow-y-auto [-webkit-overflow-scrolling:touch]"
```

## Testing Strategy

### Manual Testing Checklist

- [ ] Open mobile menu on iPhone/Android
- [ ] Expand Services accordion
- [ ] Expand About accordion
- [ ] Verify menu scrolls when content overflows viewport
- [ ] Verify page behind does NOT scroll when touching menu
- [ ] Verify scroll position preserved when menu closes
- [ ] Test on small viewport (iPhone SE - 375x667)
- [ ] Test on tall viewport (iPhone 14 Pro Max - 430x932)
- [ ] Test landscape orientation

### Browser/Device Matrix

| Device | Browser | Priority |
|--------|---------|----------|
| iPhone 12+ | Safari | P0 |
| iPhone SE | Safari | P0 |
| Android | Chrome | P0 |
| iPad | Safari | P1 |

## Risks & Considerations

### Risk 1: Animation Smoothness
- **Issue:** Removing height animation may feel abrupt
- **Mitigation:** Keep opacity animation, consider adding slide-down with transform

### Risk 2: Safe Area on iOS
- **Issue:** Menu might extend under notch or home indicator
- **Mitigation:** Add `safe-area-inset-bottom` padding if needed

### Risk 3: Scroll Position Jump
- **Issue:** Body scroll lock can cause layout shift
- **Mitigation:** The implementation saves and restores scroll position

## Estimated Complexity

- **Lines of code:** ~30-40 new/modified lines
- **Files affected:** 1 (header.tsx)
- **Time estimate:** 15-30 minutes
- **Risk level:** Low (isolated to mobile menu component)

## Summary of Changes

| Location | Change |
|----------|--------|
| Lines 252-257 | Replace height animation with fixed positioning |
| After line 55 | Add body scroll lock useEffect |
| Line 259 | Add bottom padding to nav |
| (Optional) | Add webkit touch scrolling class |

## Alternative Approaches (Not Recommended)

### Alternative 1: Use a Modal/Dialog Library
- Pros: Built-in scroll lock, accessibility
- Cons: Overkill, adds dependency, changes UX feel

### Alternative 2: Portal the Menu
- Pros: Cleaner DOM isolation
- Cons: Breaks animation context, more complex

### Alternative 3: Max-Height Instead of Fixed
- Pros: Simpler CSS
- Cons: Still allows some overflow issues, harder to calculate dynamic height
