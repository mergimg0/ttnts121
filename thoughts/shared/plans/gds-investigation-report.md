# GDS Investigation Report
Generated: 2026-01-29

## Goal
Investigate the GDS admin page data connections and identify issues with data display and filtering.

## Current State

### Data Overview
- **Total records in gds_students collection:** 126
- **Monday students:** 79 (expected: 43)
- **Wednesday students:** 28 (expected: 17)
- **Saturday students:** 19 (expected: 10)
- **Duplicate entries found:** 59 records appear to be duplicates (same name + day + ageGroup)

### Key Findings

## Issue 1: DUPLICATE RECORDS FROM DOUBLE IMPORT
**Severity: HIGH**
**Status: Data integrity issue**

The data was imported twice, creating duplicate records. The expected totals were:
- Monday: 43 (actual: 79 - roughly 2x)
- Wednesday: 17 (actual: 28 - roughly 2x)
- Saturday: 10 (actual: 19 - roughly 2x)

Evidence: 59 records have the exact same (studentName + day + ageGroup) combination.

**Solution:**
```typescript
// Script to deduplicate GDS students
// Run once to clean up the data

const snapshot = await adminDb.collection("gds_students").get();
const seen = new Map<string, string>(); // key -> docId
const toDelete: string[] = [];

snapshot.docs.forEach(doc => {
  const data = doc.data();
  const key = `${data.studentName}|${data.day}|${data.ageGroup}`;
  if (seen.has(key)) {
    toDelete.push(doc.id);
  } else {
    seen.set(key, doc.id);
  }
});

// Delete duplicates
for (const id of toDelete) {
  await adminDb.collection("gds_students").doc(id).delete();
}
```

---

## Issue 2: MISSING COMPOSITE INDEX FOR FILTERING
**Severity: HIGH**
**Status: Firestore query fails**

When filtering by `day`, `ageGroup`, or `status`, the API returns:
```json
{"success":false,"error":"Failed to fetch GDS students"}
```

This is because Firestore requires composite indexes when combining:
- `orderBy("studentName")` with `where("day", "==")`
- `orderBy("studentName")` with `where("ageGroup", "==")`
- etc.

**Solution: Create composite indexes in firestore.indexes.json:**
```json
{
  "collectionGroup": "gds_students",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "day", "order": "ASCENDING" },
    { "fieldPath": "studentName", "order": "ASCENDING" }
  ]
},
{
  "collectionGroup": "gds_students",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "ageGroup", "order": "ASCENDING" },
    { "fieldPath": "studentName", "order": "ASCENDING" }
  ]
},
{
  "collectionGroup": "gds_students",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "studentName", "order": "ASCENDING" }
  ]
},
{
  "collectionGroup": "gds_students",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "day", "order": "ASCENDING" },
    { "fieldPath": "ageGroup", "order": "ASCENDING" },
    { "fieldPath": "studentName", "order": "ASCENDING" }
  ]
},
{
  "collectionGroup": "gds_students",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "day", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "studentName", "order": "ASCENDING" }
  ]
}
```

---

## Issue 3: MISMATCHED AGE GROUP VALUES
**Severity: HIGH**
**Status: Data format mismatch**

The TypeScript types define these valid age groups:
```typescript
export type GDSAgeGroup = "Y1-Y2" | "Y3-Y4" | "Y5-Y6" | "Y6-Y7" | "6-7" | "9-10";
```

But the imported data contains different formats:
```json
["GDS", "Y1 - Y2", "Y3 - Y4", "Y3-Y4", "Y5 - Y6", "Y6 - Y7"]
```

**Problems:**
1. `"Y1 - Y2"` (with spaces) vs `"Y1-Y2"` (no spaces)
2. `"Y3 - Y4"` vs `"Y3-Y4"`
3. `"Y5 - Y6"` vs `"Y5-Y6"`
4. `"Y6 - Y7"` vs `"Y6-Y7"`
5. `"GDS"` is not a valid age group at all

This breaks filtering because:
- UI sends `?ageGroup=Y1-Y2`
- Data has `"Y1 - Y2"` (with spaces)
- No match found

**Solution: Data migration script:**
```typescript
const ageGroupMapping: Record<string, string> = {
  "Y1 - Y2": "Y1-Y2",
  "Y3 - Y4": "Y3-Y4",
  "Y5 - Y6": "Y5-Y6",
  "Y6 - Y7": "Y6-Y7",
  "GDS": "Y3-Y4", // Default unknown values
};

const snapshot = await adminDb.collection("gds_students").get();
const batch = adminDb.batch();

snapshot.docs.forEach(doc => {
  const data = doc.data();
  const mappedAgeGroup = ageGroupMapping[data.ageGroup];
  if (mappedAgeGroup) {
    batch.update(doc.ref, { ageGroup: mappedAgeGroup });
  }
});

await batch.commit();
```

---

## Issue 4: MISSING /api/admin/gds/students/summary ENDPOINT
**Severity: MEDIUM**
**Status: 404 Error**

The GDS overview page (`/admin/gds/page.tsx`) calls:
```typescript
const response = await fetch(`/api/admin/gds/students/summary?day=${selectedDay}`);
```

But this endpoint does not exist. The route pattern `/api/admin/gds/students/[id]` handles this as an ID lookup, returning "Student not found".

**Current API structure:**
```
/api/admin/gds/students/
  route.ts          -> GET (list), POST (create)
  [id]/
    route.ts        -> GET, PUT, DELETE by ID
```

**Missing:**
```
/api/admin/gds/students/
  summary/
    route.ts        -> GET summary by day
```

**Solution: Create `/api/admin/gds/students/summary/route.ts`:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { GDSDay, GDSAgeGroup, GDSAgeGroupSummary } from "@/types/gds";

const AGE_GROUPS: GDSAgeGroup[] = ["Y1-Y2", "Y3-Y4", "Y5-Y6", "Y6-Y7"];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const day = searchParams.get("day") as GDSDay | null;

    let query = adminDb.collection("gds_students");
    if (day) {
      query = query.where("day", "==", day);
    }

    const snapshot = await query.get();
    const students = snapshot.docs.map(doc => doc.data());

    // Calculate summary by age group
    const summaryMap = new Map<GDSAgeGroup, GDSAgeGroupSummary>();

    AGE_GROUPS.forEach(ag => {
      summaryMap.set(ag, {
        ageGroup: ag,
        totalStudents: 0,
        activeStudents: 0,
        averageAttendance: 0,
        totalSessions: 0,
      });
    });

    students.forEach(student => {
      const ag = student.ageGroup as GDSAgeGroup;
      const summary = summaryMap.get(ag);
      if (summary) {
        summary.totalStudents++;
        if (student.status === "active") {
          summary.activeStudents++;
        }
      }
    });

    const data = Array.from(summaryMap.values()).filter(s => s.totalStudents > 0);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching GDS summary:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch summary" },
      { status: 500 }
    );
  }
}
```

---

## Issue 5: TIMESTAMP SERIALIZATION
**Severity: LOW**
**Status: Working but inconsistent**

The timestamps are returned as Firestore format:
```json
{
  "enrolledAt": {"_seconds": 1769696648, "_nanoseconds": 228000000},
  "updatedAt": {"_seconds": 1769696648, "_nanoseconds": 228000000}
}
```

The students page handles this with a conversion function:
```typescript
const formatDate = (date: Date | { seconds: number } | undefined) => {
  if (!date) return "-";
  const d = date instanceof Date ? date : new Date(date.seconds * 1000);
  return d.toLocaleDateString("en-GB", {...});
};
```

But it checks for `seconds` not `_seconds`. This is inconsistent with the actual data format.

**Solution: Update formatDate function:**
```typescript
const formatDate = (date: Date | { _seconds: number } | { seconds: number } | undefined) => {
  if (!date) return "-";
  if (date instanceof Date) return date.toLocaleDateString(...);
  if ('_seconds' in date) return new Date(date._seconds * 1000).toLocaleDateString(...);
  if ('seconds' in date) return new Date(date.seconds * 1000).toLocaleDateString(...);
  return "-";
};
```

---

## Implementation Plan

### Phase 1: Data Cleanup (Critical)
1. Create a one-time deduplication script
2. Create a migration script to fix age group formats
3. Run both scripts

### Phase 2: Add Missing API
1. Create `/api/admin/gds/students/summary/route.ts`

### Phase 3: Fix Composite Indexes
1. Add indexes to `firestore.indexes.json`
2. Deploy indexes: `firebase deploy --only firestore:indexes`

### Phase 4: Fix Timestamp Handling
1. Update `formatDate` function in students page

---

## Files to Modify

| File | Change |
|------|--------|
| NEW: `src/app/api/admin/gds/students/summary/route.ts` | Create summary endpoint |
| `firestore.indexes.json` | Add composite indexes |
| `src/app/admin/gds/students/page.tsx` | Fix timestamp handling |
| NEW: `scripts/fix-gds-data.ts` | One-time data migration |

---

## Testing Verification

After fixes, verify:

```bash
# 1. Summary endpoint works
curl "http://localhost:3000/api/admin/gds/students/summary?day=monday"
# Expected: { success: true, data: [...age group summaries...] }

# 2. Day filter works
curl "http://localhost:3000/api/admin/gds/students?day=monday"
# Expected: Only Monday students

# 3. Age group filter works
curl "http://localhost:3000/api/admin/gds/students?ageGroup=Y1-Y2"
# Expected: Only Y1-Y2 students

# 4. Total counts match expected
# Monday: 43, Wednesday: 17, Saturday: 10 (after deduplication)
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Data loss during cleanup | Low | High | Backup before running scripts |
| Index deployment fails | Low | Medium | Test locally first |
| Stale cache | Medium | Low | Clear browser cache |

---

## Estimated Effort

- Phase 1 (Data Cleanup): 1 hour
- Phase 2 (Summary API): 30 minutes
- Phase 3 (Indexes): 30 minutes
- Phase 4 (Timestamp): 15 minutes
- Testing: 30 minutes

**Total: ~3 hours**
