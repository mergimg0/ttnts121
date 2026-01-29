# Kraken: Coupon/Discount Code System

## Task
Implement Phase 4.1: Coupon/Discount Code System for TTNTS121

## Checkpoints
<!-- Resumable state for kraken agent -->
**Task:** Implement coupon system with types, validator, admin pages, and checkout integration
**Started:** 2026-01-28T14:00:00Z
**Last Updated:** 2026-01-28T14:00:00Z

### Phase Status
- Phase 1 (Types & Validator): -> IN_PROGRESS (started 2026-01-28T14:00:00Z)
- Phase 2 (API Routes): o PENDING
- Phase 3 (Admin Pages): o PENDING
- Phase 4 (Checkout Integration): o PENDING
- Phase 5 (Build Verification): o PENDING

### Validation State
```json
{
  "test_count": 0,
  "tests_passing": 0,
  "files_modified": [],
  "last_test_command": "",
  "last_test_exit_code": null
}
```

### Resume Context
- Current focus: Creating types and coupon validator
- Next action: Create src/types/coupon.ts
- Blockers: None

## Requirements
1. Types - src/types/coupon.ts with Coupon and CouponUse interfaces
2. Coupon Validator - src/lib/coupon-validator.ts
3. Admin Pages - List, Create, Edit coupons
4. API Routes - CRUD for coupons, validate endpoint
5. Checkout Component - coupon-input.tsx
6. Integration with checkout page
7. Sidebar link for Coupons
