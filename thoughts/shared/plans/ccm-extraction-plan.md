# CCM Knowledge Extraction Plan

Generated: 2026-01-28

## Goal

Extract actionable knowledge from 24 ACTIVE Network CCM (Camp & Class Manager) documentation files (~53MB) to inform feature development for TTNTS121. The extraction must:

1. Avoid context overflow by processing documents in small batches
2. Preserve intermediate progress to enable resumption
3. Map CCM concepts to TTNTS121's existing data model
4. Identify feature gaps and enhancement opportunities

## Document Inventory

### By Size (Processing Order - Smallest First)

| Priority | File | Size | Category |
|----------|------|------|----------|
| 1 | CCM Online Registration User Guide.pdf | 192KB | Registration |
| 2 | Refund Limit FAQ.pdf | 240KB | Financial |
| 3 | Financial Overview User Guide.pdf | 424KB | Financial |
| 4 | CCM - Custom Reports.pdf | 428KB | Reporting |
| 5 | Report Concierge User Guide.pdf | 448KB | Reporting |
| 6 | Thriva Migration to CCM User Guide.docx | 508KB | Integration |
| 7 | Attendance Tracking User Guide.pdf | 544KB | Operations |
| 8 | Online Account User Guide.pdf | 564KB | Registration |
| 9 | CCM - Reg Adjustments 2.0 pdf.pdf | 612KB | Financial |
| 10 | Season Setup User Guide.pdf | 728KB | Season/Program |
| 11 | OnlineAccountFAQ.pdf | 772KB | Registration |
| 12 | ACTIVE Reserve Agency User Guide.pdf | 1.0MB | Reservations |
| 13 | ACTIVE Reserve Consumer Experience.pdf | 1.1MB | Reservations |
| 14 | Integrating with CCM 3.20.pdf | 1.2MB | Integration |
| 15 | OnlineAccountOverviewUpdate.pdf | 1.2MB | Registration |
| 16 | ACTIVE Connect for CCM user guide.pdf | 1.6MB | Communications |
| 17 | CCM - Online Registration Basics.pdf | 1.6MB | Registration |
| 18 | ACTIVE Captivate for CCM User Guide.pdf | 2.0MB | Communications |
| 19 | User Guide_Point of Sale.pdf | 3.0MB | Financial |
| 20 | Email Overview FAQ.docx | 6.1MB | Communications |
| 21 | Group Assignment User Guide.docx | 6.3MB | Season/Program |
| 22 | Registration URL Links.docx | 6.3MB | Registration |
| 23 | Camp & Class Manager Season Reports.docx | 7.0MB | Season/Program |
| 24 | Email Overview.docx | 7.1MB | Communications |

### By Category

| Category | Count | Total Size | Documents |
|----------|-------|------------|-----------|
| Registration | 6 | ~10MB | Online Reg Guide, Basics, Account Guide, FAQ, Overview, URL Links |
| Financial | 4 | ~4.3MB | Financial Overview, Reg Adjustments, Refund FAQ, Point of Sale |
| Season/Program | 3 | ~14MB | Season Setup, Season Reports, Group Assignment |
| Communications | 4 | ~17MB | Email Overview, Email FAQ, Captivate, Connect |
| Reporting | 2 | ~0.9MB | Custom Reports, Report Concierge |
| Operations | 1 | ~0.5MB | Attendance Tracking |
| Reservations | 2 | ~2.1MB | Reserve Agency, Reserve Consumer |
| Integration | 2 | ~1.7MB | Integrating with CCM, Thriva Migration |

## Processing Strategy

### Context Management

**Problem:** 24 documents totaling ~53MB will overflow context if processed together.

**Solution:** Process in 6 phases with intermediate output files:

```
Phase 1: Small docs (1-6)     → ~2.2MB  → output-phase-1.md
Phase 2: Medium docs (7-11)   → ~3.2MB  → output-phase-2.md
Phase 3: Large PDFs (12-19)   → ~12MB   → output-phase-3.md
Phase 4: Large DOCX (20-24)   → ~33MB   → output-phase-4.md (split further)
Phase 5: Synthesis            → Combine outputs
Phase 6: Gap Analysis         → Compare to TTNTS121
```

### Batch Processing Rules

1. **Maximum 3-4 documents per batch** (stay under ~5MB per batch)
2. **Write intermediate output immediately** after each batch
3. **Clear context** between phases (start new agent session)
4. **Smallest documents first** - build vocabulary before tackling large docs

## Phase Breakdown

### Phase 1: Foundation (Small Docs)
**Batch 1a:** CCM Online Registration User Guide.pdf, Refund Limit FAQ.pdf
**Batch 1b:** Financial Overview User Guide.pdf, CCM - Custom Reports.pdf
**Batch 1c:** Report Concierge User Guide.pdf, Thriva Migration to CCM User Guide.docx

**Output:** `/thoughts/shared/extraction/phase-1-foundation.md`

**Extraction Focus:**
- Core terminology and concepts
- Registration flow basics
- Financial structure (refunds, payments)
- Report capabilities

### Phase 2: Core Features (Medium Docs)
**Batch 2a:** Attendance Tracking User Guide.pdf, Online Account User Guide.pdf
**Batch 2b:** CCM - Reg Adjustments 2.0 pdf.pdf, Season Setup User Guide.pdf
**Batch 2c:** OnlineAccountFAQ.pdf

**Output:** `/thoughts/shared/extraction/phase-2-core-features.md`

**Extraction Focus:**
- Attendance tracking patterns
- Account management (parent/child relationships)
- Registration adjustments (transfers, cancellations)
- Season/program hierarchy

### Phase 3: Advanced Features (Large PDFs)
**Batch 3a:** ACTIVE Reserve Agency User Guide.pdf, ACTIVE Reserve Consumer Experience.pdf
**Batch 3b:** Integrating with CCM 3.20.pdf, OnlineAccountOverviewUpdate.pdf
**Batch 3c:** ACTIVE Connect for CCM user guide.pdf, CCM - Online Registration Basics.pdf
**Batch 3d:** ACTIVE Captivate for CCM User Guide.pdf, User Guide_Point of Sale.pdf

**Output:** `/thoughts/shared/extraction/phase-3-advanced.md`

**Extraction Focus:**
- Reservation system patterns
- Integration APIs and webhooks
- Marketing/communications features
- Point of sale operations

### Phase 4: Deep Dive (Large DOCX - Split Further)
**Batch 4a:** Email Overview FAQ.docx (alone - 6.1MB)
**Batch 4b:** Group Assignment User Guide.docx (alone - 6.3MB)
**Batch 4c:** Registration URL Links.docx (alone - 6.3MB)
**Batch 4d:** Camp & Class Manager Season Reports.docx (alone - 7.0MB)
**Batch 4e:** Email Overview.docx (alone - 7.1MB)

**Output:** `/thoughts/shared/extraction/phase-4-deep-dive.md`

**Extraction Focus:**
- Email template patterns and triggers
- Group/cohort assignment logic
- URL routing and deep linking
- Reporting schemas and KPIs

### Phase 5: Synthesis
**Input:** All phase output files
**Output:** `/thoughts/shared/extraction/ccm-knowledge-synthesis.md`

**Tasks:**
1. Consolidate duplicate concepts across documents
2. Build unified glossary
3. Create feature matrix
4. Identify CCM patterns applicable to TTNTS121

### Phase 6: Gap Analysis
**Input:** Synthesis + TTNTS121 codebase analysis
**Output:** `/thoughts/shared/plans/ccm-knowledge-extraction.md` (final deliverable)

**Tasks:**
1. Map CCM features to TTNTS121 current state
2. Identify missing features
3. Prioritize by implementation effort
4. Create feature roadmap

## Extraction Schema

### Per-Document Extraction Template

```markdown
## Document: [filename]
**Category:** [Registration|Financial|Season|Communications|Reporting|Operations|Reservations|Integration]
**Pages:** [count]
**Last Updated:** [if available]

### Key Concepts
- Concept 1: Definition
- Concept 2: Definition

### Data Entities
| Entity | Fields | Relationships |
|--------|--------|---------------|
| Entity1 | field1, field2 | relates to X |

### Workflows
1. **Workflow Name**
   - Step 1
   - Step 2
   - Triggers: [what initiates]
   - Outcomes: [what happens after]

### Business Rules
- Rule 1: When X, then Y
- Rule 2: Constraint description

### UI Patterns
- Pattern: Description (with reference to screenshots if present)

### API/Integration Points
- Endpoint/webhook: Description

### Relevance to TTNTS121
- **Applicable:** Feature X maps to our Session model
- **Gap:** We lack feature Y
- **Enhancement:** Could improve Z
```

### Category-Specific Schemas

#### Registration Documents
```yaml
focus_areas:
  - Registration flow steps
  - Cart behavior (multi-session, quantity)
  - Participant data collection (Name, DOB, Gender, Medical)
  - Parent/guardian relationships
  - Waitlist handling
  - Coupon/discount application
  - Payment plan options
  - Confirmation emails

ttnts121_mapping:
  Session Selection → /sessions page
  Shopping Cart → CartProvider + CartSidebar
  Participant Info → Booking.childFirstName, childLastName, childDOB
  Parent Info → Booking.parentFirstName, parentLastName, parentEmail
  Checkout → /checkout + Stripe integration
```

#### Financial Documents
```yaml
focus_areas:
  - Payment processing (full pay, installments)
  - Refund workflows (full, partial, credit balance)
  - Adjustments (transfers, credits, write-offs)
  - Point of sale operations
  - Financial reporting

ttnts121_mapping:
  Payment → stripePaymentIntentId, paymentStatus
  Refunds → refundedAmount, /api/admin/stripe/refunds
  Reporting → /admin/payments dashboard
```

#### Season/Program Documents
```yaml
focus_areas:
  - Season hierarchy (Season → Program → Session)
  - Date range management
  - Capacity/enrollment
  - Group assignments (age groups, skill levels)
  - Waitlist auto-promotion

ttnts121_mapping:
  Season → Program (dateRange, isActive)
  Session → Session (startDate, endDate, capacity, enrolled)
  Groups → ageMin, ageMax on Session
```

#### Communications Documents
```yaml
focus_areas:
  - Email types (confirmation, reminder, marketing)
  - Email templates and personalization
  - Trigger conditions
  - Contact management
  - Campaign tracking

ttnts121_mapping:
  Confirmation → email-templates.ts booking confirmation
  Reminders → /api/cron/session-reminders
  Marketing → marketingConsent on Booking
```

#### Reporting Documents
```yaml
focus_areas:
  - Standard reports (attendance, financial, enrollment)
  - Custom report builder
  - Export formats
  - Scheduled reports
  - KPIs and metrics

ttnts121_mapping:
  Dashboard stats → /admin StatsCard components
  Exports → Not yet implemented
```

#### Operations Documents
```yaml
focus_areas:
  - Attendance tracking (check-in/out)
  - Roster management
  - Day-of operations
  - Emergency contacts

ttnts121_mapping:
  Attendance → Not yet implemented
  Emergency → Booking.emergencyContact
```

## Intermediate Output Files

```
/thoughts/shared/extraction/
├── phase-1-foundation.md
├── phase-2-core-features.md
├── phase-3-advanced.md
├── phase-4-deep-dive.md
├── ccm-glossary.md
├── ccm-feature-matrix.md
├── ccm-knowledge-synthesis.md
└── ccm-ttnts121-gap-analysis.md
```

## Final Deliverable Structure

```markdown
# CCM Knowledge Extraction: TTNTS121 Feature Guide

## Executive Summary
- Total documents processed: 24
- Key concepts extracted: N
- Features applicable: N
- Gaps identified: N

## CCM Platform Overview
- What is CCM
- Core architecture
- User types (Admin, Parent, Participant)

## Feature Catalog

### 1. Registration System
#### CCM Capabilities
#### Current TTNTS121 State
#### Gaps & Enhancements
#### Implementation Priority

### 2. Payment & Financial
[Same structure]

### 3. Season & Program Management
[Same structure]

### 4. Communications
[Same structure]

### 5. Reporting & Analytics
[Same structure]

### 6. Operations
[Same structure]

## Glossary
| CCM Term | Definition | TTNTS121 Equivalent |

## Data Model Comparison
| CCM Entity | CCM Fields | TTNTS121 Entity | TTNTS121 Fields | Gap |

## Recommended Roadmap
### Phase 1: Quick Wins (1-2 weeks)
### Phase 2: Core Enhancements (1 month)
### Phase 3: Advanced Features (2-3 months)

## Appendix
- Document processing log
- Raw extraction notes
```

## Execution Instructions

### For Each Phase

1. **Start fresh context** (new agent session or /clear)
2. **Read phase documents** in specified batches
3. **Extract using template** for each document
4. **Write intermediate output** immediately after batch
5. **Verify output saved** before proceeding

### Batch Processing Command Pattern

```bash
# Phase 1, Batch 1a
Read: CCM Online Registration User Guide.pdf
Read: Refund Limit FAQ.pdf
Extract using template
Write to: /thoughts/shared/extraction/phase-1-foundation.md (append)
```

### Recovery Protocol

If context overflows mid-phase:
1. Check last written intermediate file
2. Note which documents were processed
3. Start new session
4. Resume from next unprocessed document

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Context overflow | Small batches, immediate writes |
| Lost progress | Intermediate files, processing log |
| Document unreadable | Note in log, skip to next |
| Duplicate content | Dedup in synthesis phase |
| Large DOCX files | Process alone, extract key sections only |

## Success Criteria

1. All 24 documents processed
2. Intermediate files for each phase
3. Unified glossary created
4. Feature matrix with gap analysis
5. Prioritized roadmap for TTNTS121

## Estimated Effort

| Phase | Documents | Batches | Est. Time |
|-------|-----------|---------|-----------|
| Phase 1 | 6 | 3 | 30 min |
| Phase 2 | 5 | 3 | 30 min |
| Phase 3 | 8 | 4 | 45 min |
| Phase 4 | 5 | 5 | 60 min |
| Phase 5 | Synthesis | 1 | 30 min |
| Phase 6 | Gap Analysis | 1 | 30 min |
| **Total** | **24** | **17** | **~4 hours** |

## Next Steps

1. Create `/thoughts/shared/extraction/` directory
2. Start Phase 1, Batch 1a
3. Follow batch processing pattern
4. Write outputs incrementally
5. Proceed through all phases
6. Deliver final knowledge document
