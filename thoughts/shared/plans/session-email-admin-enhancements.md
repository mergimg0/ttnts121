# Implementation Plan: Session Management & Email Campaign System
Generated: 2026-01-28

## Executive Summary

This plan covers three major epics for TTNTS121:

1. **Session Management Enhancements** - Improve session forms, add configurable availability thresholds, manual close toggles, and date range support
2. **Email Campaign Management System** - Build a complete contact management and email campaign system integrated with Resend API
3. **Testing & Validation** - Add Firebase verification tests and E2E testing

**Tech Stack:** Next.js 16 (App Router), React 19, Firebase Firestore, Resend API, Tailwind CSS

---

## EPIC 1: Session Management Enhancements

### 1.1 Firebase Write Verification

**Goal:** Add validation that session writes succeed with confirmation feedback and clear error handling.

**Complexity:** S (Small)

**Files to modify:**
- `src/app/admin/programs/[id]/sessions/new/page.tsx` - Add success toast
- `src/app/admin/sessions/[id]/page.tsx` - Add success toast and error handling
- `src/app/api/admin/sessions/route.ts` - Add write verification
- `src/app/api/admin/sessions/[id]/route.ts` - Add write verification

**Files to create:**
- `src/components/ui/toast.tsx` - Toast notification component (or use existing)

**Implementation steps:**
1. In POST `/api/admin/sessions`, after `adminDb.collection("sessions").add(sessionData)`:
   - Re-fetch the created document to verify write
   - Return full document data with `id`
   - Return error if document doesn't exist after write
2. In PUT `/api/admin/sessions/[id]`, after `.update(updateData)`:
   - Re-fetch document to verify update
   - Compare timestamps to confirm write
3. Add toast notifications to admin forms:
   - Success: "Session created successfully" / "Session updated"
   - Error: Display specific Firebase error message

**Acceptance criteria:**
- [ ] Session creation shows success toast with session name
- [ ] Session update shows success toast
- [ ] Firebase write failures show descriptive error message
- [ ] Created session immediately appears on /sessions page
- [ ] No silent failures - all errors surface to user

---

### 1.2 Configurable "X Spots Left" Badge Threshold

**Goal:** Allow admins to set per-session threshold for "limited availability" badge instead of hardcoded 3.

**Complexity:** S (Small)

**Files to modify:**
- `src/types/booking.ts` - Add `lowStockThreshold` to Session interface
- `src/app/admin/programs/[id]/sessions/new/page.tsx` - Add threshold field
- `src/app/admin/sessions/[id]/page.tsx` - Add threshold field
- `src/app/api/sessions/route.ts` - Use per-session threshold

**Implementation steps:**
1. Update `Session` interface in `src/types/booking.ts`:
   ```typescript
   interface Session {
     // ... existing fields
     lowStockThreshold?: number; // Default: 3
   }
   ```

2. Add form field in session creation/edit pages:
   ```tsx
   <div>
     <label>Low Stock Threshold</label>
     <Input
       type="number"
       min={1}
       max={20}
       value={formData.lowStockThreshold || 3}
       // ...
     />
     <p className="text-xs text-neutral-500">
       Show "X spots left" badge when spots remaining is at or below this number
     </p>
   </div>
   ```

3. Update public API in `src/app/api/sessions/route.ts`:
   ```typescript
   const threshold = s.lowStockThreshold || 3;
   const availabilityStatus =
     spotsLeft <= 0 ? "full"
     : spotsLeft <= threshold ? "limited"
     : "available";
   ```

**Acceptance criteria:**
- [ ] Admin can set threshold per session (1-20 range)
- [ ] Default value is 3 when not specified
- [ ] Public sessions page respects per-session threshold
- [ ] Existing sessions without threshold continue to work (fallback to 3)

---

### 1.3 Manual Close / Sold Out Toggle

**Goal:** Allow admins to manually mark a session as "Sold Out" regardless of actual capacity.

**Complexity:** S (Small)

**Files to modify:**
- `src/types/booking.ts` - Add `isForceClosed` field
- `src/app/admin/sessions/[id]/page.tsx` - Add quick action button
- `src/app/api/sessions/route.ts` - Respect force closed status

**Implementation steps:**
1. Update `Session` interface:
   ```typescript
   interface Session {
     // ... existing fields
     isForceClosed?: boolean; // When true, shows as "Sold Out"
   }
   ```

2. Add toggle button to session edit sidebar (Stats section):
   ```tsx
   <div className="pt-4 border-t border-neutral-100">
     <Button
       variant={session.isForceClosed ? "adminSecondary" : "destructive"}
       className="w-full"
       onClick={handleToggleForceClosed}
     >
       {session.isForceClosed ? "Reopen Enrollment" : "Close Enrollment"}
     </Button>
     <p className="mt-2 text-xs text-neutral-500">
       {session.isForceClosed
         ? "Session shows as Sold Out. Click to allow bookings."
         : "Mark as Sold Out regardless of capacity."}
     </p>
   </div>
   ```

3. Create API endpoint for quick toggle:
   - PATCH `/api/admin/sessions/[id]/toggle-closed`
   - Toggles `isForceClosed` boolean

4. Update public API:
   ```typescript
   const availabilityStatus =
     s.isForceClosed ? "full"
     : spotsLeft <= 0 ? "full"
     : spotsLeft <= threshold ? "limited"
     : "available";
   ```

**Acceptance criteria:**
- [ ] "Close Enrollment" button on session edit page
- [ ] Button text changes based on current state
- [ ] Force-closed sessions show as "Sold Out" on public page
- [ ] Can reopen enrollment with same button
- [ ] Does not affect actual capacity/enrolled counts

---

### 1.4 Clear Action Labels on Session Edit

**Goal:** Audit and improve all button/action labels on session management pages.

**Complexity:** S (Small)

**Files to modify:**
- `src/app/admin/sessions/[id]/page.tsx` - Update button labels
- `src/app/admin/programs/[id]/sessions/new/page.tsx` - Update button labels
- `src/app/admin/sessions/page.tsx` - Add action tooltips

**Files to create:**
- `src/components/admin/ui/confirm-dialog.tsx` - Confirmation dialog component

**Implementation steps:**
1. Audit current buttons and update labels:
   | Current | New Label |
   |---------|-----------|
   | "Save Changes" | "Save Changes" (keep) |
   | "Cancel" | "Discard Changes" |
   | "Create Session" | "Create Session" (keep) |
   | (missing) | "Delete Session" with confirmation |
   | (missing) | "View Bookings" link |

2. Add confirmation dialog for destructive actions:
   ```tsx
   <ConfirmDialog
     trigger={<Button variant="destructive">Delete Session</Button>}
     title="Delete Session?"
     description="This will permanently delete this session. This action cannot be undone."
     confirmText="Delete"
     onConfirm={handleDelete}
   />
   ```

3. Add "View Bookings" link in session stats sidebar (already exists - verify)

4. Add tooltips to icon-only buttons

**Acceptance criteria:**
- [ ] All buttons have clear, descriptive labels
- [ ] Destructive actions (delete) have confirmation dialogs
- [ ] "Discard Changes" clearly indicates unsaved changes will be lost
- [ ] Easy access to view session bookings from edit page

---

### 1.5 Date Range with Day Selection

**Goal:** Add date range picker and multi-day selector to session form.

**Complexity:** M (Medium)

**Files to modify:**
- `src/types/booking.ts` - Add `daysOfWeek` array field
- `src/app/admin/programs/[id]/sessions/new/page.tsx` - Add date range + days
- `src/app/admin/sessions/[id]/page.tsx` - Add date range + days
- `src/app/api/sessions/route.ts` - Handle multi-day sessions
- `src/app/sessions/page.tsx` - Display date ranges correctly

**Files to create:**
- `src/components/admin/ui/date-range-picker.tsx` - Date range picker
- `src/components/admin/ui/day-checkbox.tsx` - Multi-day selector

**Implementation steps:**
1. Update `Session` interface:
   ```typescript
   interface Session {
     // ... existing fields
     dayOfWeek: number;          // DEPRECATED but keep for backward compat
     daysOfWeek?: number[];      // NEW: array of days [1, 3] = Mon, Wed
     startDate: Date | Timestamp;
     endDate: Date | Timestamp;
   }
   ```

2. Create date range picker component:
   - Two date inputs (start, end)
   - Validation: end >= start
   - Clear visual feedback

3. Create day selector component:
   ```tsx
   <div className="grid grid-cols-7 gap-2">
     {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
       <button
         key={day}
         type="button"
         onClick={() => toggleDay(i)}
         className={cn(
           "p-2 rounded-lg text-sm",
           selectedDays.includes(i) ? "bg-navy text-white" : "bg-neutral-100"
         )}
       >
         {day}
       </button>
     ))}
   </div>
   ```

4. Update session form to include both:
   - Date range picker for start/end dates
   - Day checkboxes for which days session runs
   - Show calculated occurrences: "12 sessions from Jan 6 - Mar 28"

5. Update public sessions page:
   - For multi-day sessions, show in calendar on all selected days
   - Display date range in session details

6. Backward compatibility:
   - If `daysOfWeek` is undefined, use `dayOfWeek` as single-element array
   - Migration: existing sessions continue to work

**Acceptance criteria:**
- [ ] Admin can select start and end dates
- [ ] Admin can select multiple days (Mon/Wed, Tue/Thu, etc.)
- [ ] Form shows calculated number of session occurrences
- [ ] Public sessions page shows session on all selected days
- [ ] Session details show date range
- [ ] Existing single-day sessions continue to work

---

## EPIC 2: Email Campaign Management System

### 2.1 Contact List Management

**Goal:** Create contact management infrastructure in Firebase with admin UI.

**Complexity:** M (Medium)

**Files to create:**
- `src/types/contact.ts` - Contact and Campaign types
- `src/app/api/admin/contacts/route.ts` - List/create contacts
- `src/app/api/admin/contacts/[id]/route.ts` - Get/update/delete contact
- `src/app/api/admin/contacts/import/route.ts` - CSV bulk import
- `src/app/admin/contacts/page.tsx` - Contacts list page
- `src/app/admin/contacts/new/page.tsx` - Add contact form
- `src/components/admin/contacts/contact-table.tsx` - Contacts table
- `src/components/admin/contacts/import-csv-dialog.tsx` - CSV import modal

**Files to modify:**
- `src/components/admin/sidebar.tsx` - Add Contacts + Campaigns nav items

**Firebase collection schema:**
```typescript
// contacts collection
interface Contact {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  location?: string; // From LOCATIONS constant
  marketingConsent: boolean;
  consentTimestamp?: Date | Timestamp;
  source: "booking" | "waitlist" | "manual" | "import";
  tags?: string[];
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}
```

**Implementation steps:**
1. Create Contact type definitions in `src/types/contact.ts`

2. Create API routes:
   - GET `/api/admin/contacts` - List with filters (location, consent, search)
   - POST `/api/admin/contacts` - Create single contact
   - POST `/api/admin/contacts/import` - Bulk import from CSV

3. Create admin pages:
   - `/admin/contacts` - Table with search, filter by location, filter by consent
   - Columns: Name, Email, Phone, Location, Consent, Source, Added
   - Bulk actions: Export, Delete selected

4. Add "Add Contact" form:
   - Email (required, validate format)
   - First/Last Name
   - Phone (optional)
   - Location dropdown (from LOCATIONS constant)
   - Marketing consent checkbox

5. CSV import:
   - Upload dialog with drag-and-drop
   - Column mapping preview
   - Import progress indicator
   - Error handling for invalid emails

6. Update sidebar navigation:
   ```tsx
   {
     label: "Contacts",
     href: "/admin/contacts",
     icon: Users,
   },
   {
     label: "Campaigns",
     href: "/admin/campaigns",
     icon: Mail,
   },
   ```

**Acceptance criteria:**
- [ ] Contacts page shows searchable, filterable list
- [ ] Can add individual contacts manually
- [ ] Can bulk import from CSV
- [ ] Location filter uses LOCATIONS constant
- [ ] Consent status clearly displayed
- [ ] Source tracking (booking/waitlist/manual/import)

---

### 2.2 Contact Profile & Consent

**Goal:** Contact edit page with consent management and history.

**Complexity:** S (Small)

**Files to create:**
- `src/app/admin/contacts/[id]/page.tsx` - Contact edit page
- `src/types/contact.ts` - Add ConsentLog type (if not already)

**Firebase collection schema:**
```typescript
// consent_logs subcollection under contacts
interface ConsentLog {
  id: string;
  contactId: string;
  action: "granted" | "revoked";
  timestamp: Date | Timestamp;
  method: "form" | "admin" | "import";
  ipAddress?: string;
}
```

**Implementation steps:**
1. Create contact edit page:
   - Editable: name, email, phone, location
   - Toggle for marketing consent
   - View consent history log

2. When consent changes:
   - Create entry in `consent_logs` subcollection
   - Update `marketingConsent` and `consentTimestamp` on contact

3. Display consent history:
   ```tsx
   <div className="border-t pt-4">
     <h3>Consent History</h3>
     {consentLogs.map(log => (
       <div key={log.id} className="text-sm text-neutral-600">
         {log.action === "granted" ? "Opted in" : "Opted out"}
         on {formatDate(log.timestamp)} via {log.method}
       </div>
     ))}
   </div>
   ```

4. Add "Delete Contact" with confirmation

**Acceptance criteria:**
- [ ] Can edit all contact fields
- [ ] Consent toggle updates immediately
- [ ] Consent history shows all changes with timestamps
- [ ] Can delete contact (with confirmation)
- [ ] Page shows contact source (booking, waitlist, etc.)

---

### 2.3 Email Campaign Builder

**Goal:** Create campaign management section with draft/send workflow.

**Complexity:** M (Medium)

**Files to create:**
- `src/types/contact.ts` - Add Campaign type
- `src/app/api/admin/campaigns/route.ts` - List/create campaigns
- `src/app/api/admin/campaigns/[id]/route.ts` - Get/update campaign
- `src/app/admin/campaigns/page.tsx` - Campaigns list
- `src/app/admin/campaigns/new/page.tsx` - Campaign builder
- `src/app/admin/campaigns/[id]/page.tsx` - Campaign edit/view
- `src/components/admin/campaigns/recipient-filter.tsx` - Recipient targeting UI
- `src/components/admin/campaigns/email-preview.tsx` - Email preview component

**Firebase collection schema:**
```typescript
// campaigns collection
interface Campaign {
  id: string;
  name: string;
  subject: string;
  body: string; // HTML content
  status: "draft" | "sending" | "sent" | "failed";
  // Targeting
  targetType: "all" | "location" | "custom";
  targetLocations?: string[]; // If targetType === "location"
  targetContactIds?: string[]; // If targetType === "custom"
  // Stats
  recipientCount: number;
  sentCount?: number;
  sentAt?: Date | Timestamp;
  // Metadata
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  createdBy: string; // Admin uid
}
```

**Implementation steps:**
1. Create Campaign type definitions

2. Campaign list page:
   - Table: Name, Subject, Status, Recipients, Sent Date
   - Status badge (Draft/Sending/Sent/Failed)
   - Quick actions: Edit (if draft), View, Delete

3. Campaign builder form:
   - Campaign name (internal reference)
   - Email subject line
   - Email body (rich text editor or simple HTML)
   - Recipient targeting:
     - All consented contacts
     - By location (multi-select)
     - Custom list (select specific contacts)
   - Show recipient count preview

4. Email preview:
   - Show rendered HTML
   - Test send to admin email

5. Draft/Send workflow:
   - Save as Draft
   - Preview
   - Send (triggers confirmation)

**Acceptance criteria:**
- [ ] Can create campaigns with subject/body
- [ ] Can target by: all consented, location filter, custom selection
- [ ] Shows recipient count before sending
- [ ] Can save as draft and edit later
- [ ] Email preview shows formatted output
- [ ] Can send test email to admin

---

### 2.4 Campaign Sending

**Goal:** Integrate with Resend batch API for campaign delivery.

**Complexity:** M (Medium)

**Files to create:**
- `src/app/api/admin/campaigns/[id]/send/route.ts` - Execute campaign send
- `src/lib/email-batch.ts` - Batch sending with Resend

**Files to modify:**
- `src/lib/email.ts` - Add batch send function

**Implementation steps:**
1. Create batch send function in `src/lib/email-batch.ts`:
   ```typescript
   export async function sendBatchEmails(
     emails: Array<{ to: string; subject: string; html: string }>
   ): Promise<{ success: number; failed: number; errors: string[] }> {
     // Use Resend Batch API
     // https://resend.com/docs/api-reference/emails/send-batch-emails

     // Split into chunks of 100 (Resend limit)
     // Handle rate limits (10 req/sec)
     // Track success/failure counts
   }
   ```

2. Create send endpoint `/api/admin/campaigns/[id]/send`:
   - Validate campaign is in "draft" status
   - Fetch target contacts based on campaign targeting
   - Update status to "sending"
   - Call batch send function
   - Update status to "sent" or "failed"
   - Store sent count and timestamp

3. Progress tracking:
   - For large lists, could use background job
   - For MVP: synchronous with timeout handling
   - Store progress in campaign document

4. Error handling:
   - Rate limit: exponential backoff
   - Invalid emails: log and continue
   - API failure: mark campaign as "failed"

**Acceptance criteria:**
- [ ] Can send campaign to all targeted recipients
- [ ] Handles Resend rate limits gracefully
- [ ] Updates campaign status during/after send
- [ ] Logs errors for failed individual sends
- [ ] Stores sent count and timestamp
- [ ] Works with dev mode (logs only when no API key)

---

### 2.5 Email Dashboard & Analytics

**Goal:** Overview dashboard with email metrics from Resend API.

**Complexity:** M (Medium)

**Files to create:**
- `src/app/api/admin/campaigns/[id]/stats/route.ts` - Fetch Resend stats
- `src/app/admin/campaigns/[id]/stats/page.tsx` - Campaign detail stats
- `src/components/admin/campaigns/stats-card.tsx` - Stats display component

**Files to modify:**
- `src/app/admin/campaigns/page.tsx` - Add overview stats

**Implementation steps:**
1. Overview stats on campaigns list page:
   - Total contacts (with % consented)
   - Total campaigns sent
   - Last 30 days: emails sent count

2. Per-campaign stats (fetch from Resend):
   ```typescript
   // GET /api/admin/campaigns/[id]/stats
   // Fetch from Resend API: GET /emails/{email_id}

   interface CampaignStats {
     delivered: number;
     opened: number;
     clicked: number;
     bounced: number;
     complained: number;
   }
   ```

3. Campaign stats page:
   - Sent count vs target count
   - Delivery rate (delivered/sent)
   - Open rate (opened/delivered)
   - Click rate (clicked/delivered)
   - Bounce/complaint count

4. Store Resend email IDs:
   - When batch sending, store array of Resend IDs
   - Use to fetch individual email statuses

5. Note: Resend analytics may require Pro plan
   - Graceful degradation if stats unavailable
   - Show sent/delivered from our records

**Acceptance criteria:**
- [ ] Overview shows total contacts and consent rate
- [ ] Overview shows total campaigns sent
- [ ] Per-campaign view shows delivery stats
- [ ] Open/click rates displayed (if available from Resend)
- [ ] Graceful fallback when detailed stats unavailable

---

### 2.6 API Routes Summary

**All new API routes for Epic 2:**

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/admin/contacts` | List contacts with filters |
| POST | `/api/admin/contacts` | Create single contact |
| GET | `/api/admin/contacts/[id]` | Get contact details |
| PUT | `/api/admin/contacts/[id]` | Update contact |
| DELETE | `/api/admin/contacts/[id]` | Delete contact |
| POST | `/api/admin/contacts/import` | CSV bulk import |
| GET | `/api/admin/campaigns` | List campaigns |
| POST | `/api/admin/campaigns` | Create campaign |
| GET | `/api/admin/campaigns/[id]` | Get campaign details |
| PUT | `/api/admin/campaigns/[id]` | Update campaign |
| DELETE | `/api/admin/campaigns/[id]` | Delete campaign |
| POST | `/api/admin/campaigns/[id]/send` | Execute send |
| GET | `/api/admin/campaigns/[id]/stats` | Fetch Resend stats |

**Complexity:** L (Large) - across all 2.x tasks

---

## EPIC 3: Testing & Validation

### 3.1 Firebase Connection Test

**Goal:** Verify Firebase read/write works end-to-end.

**Complexity:** S (Small)

**Files to create:**
- `src/app/admin/debug/page.tsx` - Debug/test page (dev only)
- `src/app/api/admin/debug/firebase-test/route.ts` - Test endpoint

**Implementation steps:**
1. Create test endpoint:
   ```typescript
   // POST /api/admin/debug/firebase-test
   // 1. Write test document
   // 2. Read it back
   // 3. Delete it
   // 4. Return success/failure
   ```

2. Create debug page (only visible in development):
   - Button: "Test Firebase Connection"
   - Shows result: success/failure with timing
   - Button: "Create Test Session"
   - Button: "Verify Session on Public Page"

3. Verification flow:
   - Create session via admin API
   - Wait 1 second
   - Fetch from public API
   - Verify session appears
   - Clean up (delete test session)

**Acceptance criteria:**
- [ ] Debug page accessible at /admin/debug (dev only)
- [ ] Can test Firebase read/write
- [ ] Can verify session creation end-to-end
- [ ] Clear pass/fail indication

---

### 3.2 E2E Tests

**Goal:** Add Playwright tests for critical flows.

**Complexity:** M (Medium)

**Files to create:**
- `e2e/sessions.spec.ts` - Session management tests
- `e2e/campaigns.spec.ts` - Campaign management tests
- `playwright.config.ts` - Playwright configuration (if not exists)

**Implementation steps:**
1. Install Playwright if not present:
   ```bash
   npm install -D @playwright/test
   npx playwright install
   ```

2. Session tests:
   ```typescript
   test('create session appears on public page', async ({ page }) => {
     // Login to admin
     // Create session with unique name
     // Navigate to /sessions
     // Verify session appears
     // Cleanup: delete session
   });

   test('sold out toggle works', async ({ page }) => {
     // Create session
     // Toggle "Close Enrollment"
     // Verify shows "Sold Out" on public page
     // Reopen enrollment
     // Verify shows "Available" again
   });
   ```

3. Campaign tests (basic):
   ```typescript
   test('create campaign draft', async ({ page }) => {
     // Navigate to /admin/campaigns
     // Create new campaign
     // Save as draft
     // Verify appears in list
   });
   ```

4. Add to package.json scripts:
   ```json
   "test:e2e": "playwright test",
   "test:e2e:ui": "playwright test --ui"
   ```

**Acceptance criteria:**
- [ ] Playwright configured and running
- [ ] Session creation E2E test passes
- [ ] Sold out toggle E2E test passes
- [ ] Campaign draft creation test passes
- [ ] Tests clean up after themselves

---

### 3.3 Email Integration Test

**Goal:** Verify Resend integration works.

**Complexity:** S (Small)

**Files to create:**
- `src/app/api/admin/debug/email-test/route.ts` - Test email endpoint

**Files to modify:**
- `src/app/admin/debug/page.tsx` - Add email test button

**Implementation steps:**
1. Create test endpoint:
   ```typescript
   // POST /api/admin/debug/email-test
   // { to: "admin@example.com" }
   // Sends test email via Resend
   // Returns Resend email ID
   ```

2. Add to debug page:
   - Input for test email address
   - "Send Test Email" button
   - Shows: success with email ID, or error message

3. After send, poll for delivery:
   ```typescript
   // GET Resend email status
   // Show: queued -> sent -> delivered
   ```

**Acceptance criteria:**
- [ ] Can send test email from debug page
- [ ] Shows Resend email ID on success
- [ ] Shows clear error on failure
- [ ] Works in dev mode (logs only)

---

## Dependencies Graph

```
EPIC 1: Session Enhancements
  1.1 Firebase Write Verification (no deps)
  1.2 Configurable Threshold (no deps)
  1.3 Manual Close Toggle (no deps)
  1.4 Clear Action Labels (no deps)
  1.5 Date Range with Days (no deps)

EPIC 2: Email Campaigns
  2.1 Contact List Management (no deps)
  2.2 Contact Profile (depends on 2.1)
  2.3 Campaign Builder (depends on 2.1)
  2.4 Campaign Sending (depends on 2.3)
  2.5 Email Dashboard (depends on 2.4)

EPIC 3: Testing
  3.1 Firebase Test (depends on 1.1)
  3.2 E2E Tests (depends on 1.x, 2.1-2.3)
  3.3 Email Test (depends on 2.4)
```

---

## Implementation Order (Sprint Sequence)

### Sprint 1: Foundation (Days 1-3)
- 1.1 Firebase Write Verification
- 1.2 Configurable Threshold
- 1.3 Manual Close Toggle
- 1.4 Clear Action Labels

### Sprint 2: Session Date Enhancement (Days 4-5)
- 1.5 Date Range with Day Selection

### Sprint 3: Contacts (Days 6-8)
- 2.1 Contact List Management
- 2.2 Contact Profile & Consent

### Sprint 4: Campaigns (Days 9-12)
- 2.3 Email Campaign Builder
- 2.4 Campaign Sending

### Sprint 5: Analytics & Testing (Days 13-15)
- 2.5 Email Dashboard
- 3.1 Firebase Test
- 3.2 E2E Tests
- 3.3 Email Test

---

## Technical Notes

### Firebase Patterns

**Write verification pattern:**
```typescript
const docRef = await adminDb.collection("sessions").add(data);
const doc = await docRef.get();
if (!doc.exists) {
  throw new Error("Write verification failed");
}
return { id: doc.id, ...doc.data() };
```

**Batch write for campaigns:**
```typescript
const batch = adminDb.batch();
contacts.forEach(contact => {
  const ref = adminDb.collection("email_logs").doc();
  batch.set(ref, { contactId: contact.id, campaignId, status: "pending" });
});
await batch.commit();
```

### Resend API Integration

**Batch sending (up to 100 per request):**
```typescript
const response = await fetch("https://api.resend.com/emails/batch", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    emails: emails.map(e => ({
      from: fromEmail,
      to: e.to,
      subject: e.subject,
      html: e.html
    }))
  })
});
```

**Rate limits:**
- 10 requests per second
- 100 emails per batch request
- Implement exponential backoff

### UI Components to Reuse

From existing admin UI:
- `AdminCard` - Card container
- `AdminBadge` - Status badges
- `AdminTable` - Data tables
- `AdminSelect` - Dropdowns
- `Button` variants: `adminPrimary`, `adminSecondary`

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Resend rate limits | Medium | Medium | Implement batching, backoff |
| Firebase write failures | Low | High | Add retry logic, verification |
| Large contact imports | Medium | Low | Chunk processing, progress UI |
| Email deliverability | Medium | Medium | SPF/DKIM setup, warm-up |

---

## Estimated Total Effort

| Epic | Complexity | Estimated Days |
|------|------------|----------------|
| Epic 1: Session Enhancements | M | 5 days |
| Epic 2: Email Campaigns | L | 10 days |
| Epic 3: Testing | S | 3 days |
| **Total** | | **~15-18 days** |

---

## Appendix: File Creation Checklist

### New Files to Create

**Types:**
- [ ] `src/types/contact.ts`

**API Routes:**
- [ ] `src/app/api/admin/contacts/route.ts`
- [ ] `src/app/api/admin/contacts/[id]/route.ts`
- [ ] `src/app/api/admin/contacts/import/route.ts`
- [ ] `src/app/api/admin/campaigns/route.ts`
- [ ] `src/app/api/admin/campaigns/[id]/route.ts`
- [ ] `src/app/api/admin/campaigns/[id]/send/route.ts`
- [ ] `src/app/api/admin/campaigns/[id]/stats/route.ts`
- [ ] `src/app/api/admin/sessions/[id]/toggle-closed/route.ts`
- [ ] `src/app/api/admin/debug/firebase-test/route.ts`
- [ ] `src/app/api/admin/debug/email-test/route.ts`

**Admin Pages:**
- [ ] `src/app/admin/contacts/page.tsx`
- [ ] `src/app/admin/contacts/new/page.tsx`
- [ ] `src/app/admin/contacts/[id]/page.tsx`
- [ ] `src/app/admin/campaigns/page.tsx`
- [ ] `src/app/admin/campaigns/new/page.tsx`
- [ ] `src/app/admin/campaigns/[id]/page.tsx`
- [ ] `src/app/admin/campaigns/[id]/stats/page.tsx`
- [ ] `src/app/admin/debug/page.tsx`

**Components:**
- [ ] `src/components/ui/toast.tsx`
- [ ] `src/components/admin/ui/confirm-dialog.tsx`
- [ ] `src/components/admin/ui/date-range-picker.tsx`
- [ ] `src/components/admin/ui/day-checkbox.tsx`
- [ ] `src/components/admin/contacts/contact-table.tsx`
- [ ] `src/components/admin/contacts/import-csv-dialog.tsx`
- [ ] `src/components/admin/campaigns/recipient-filter.tsx`
- [ ] `src/components/admin/campaigns/email-preview.tsx`
- [ ] `src/components/admin/campaigns/stats-card.tsx`

**Lib:**
- [ ] `src/lib/email-batch.ts`

**Tests:**
- [ ] `e2e/sessions.spec.ts`
- [ ] `e2e/campaigns.spec.ts`
- [ ] `playwright.config.ts`

---

*Plan generated by Claude Plan Agent*
*Project: TTNTS121 - Children's Football Coaching Booking Website*
