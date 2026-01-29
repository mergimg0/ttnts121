# Phase 5: Knowledge Synthesis

Generated: 2026-01-28
Status: Complete

---

## Executive Summary

This document synthesizes 24 CCM (Camp & Class Manager) documentation files extracted across Phases 1-4, providing a unified reference for TTNTS121 feature development.

### Documents Processed

| Phase | Documents | Focus Areas |
|-------|-----------|-------------|
| Phase 1 | 6 | Registration, Financial, Reporting foundations |
| Phase 2 | 5 | Attendance, Online Account, Season Setup |
| Phase 3 | 7 | API Integration, Connect/Captivate apps, POS |
| Phase 4 | 5 | Email, Groups, URLs, Season Reports |
| **Total** | **23** | (1 PDF not converted: CCM Registration Basics) |

---

## CCM System Architecture

### Core Hierarchy

```
Organization (Agency)
└── Season (e.g., "Summer 2024")
    └── Session (bookable program)
        ├── Tuition (pricing tiers)
        ├── Session Options (add-ons)
        └── Merchandise (physical goods)
```

### Key Entity Relationships

```
Family Account
├── Primary Parent (account holder)
├── Secondary Parent (optional)
├── Participants (children)
│   └── Authorized Persons (pickup/drop-off)
└── Orders
    └── Registrations
        ├── Session
        ├── Tuition
        ├── Session Options
        ├── Merchandise
        └── Payments
```

---

## Feature Catalog by Category

### 1. Registration & Checkout

| Feature | Description | Priority for TTNTS121 |
|---------|-------------|----------------------|
| Session selection | Browse/filter sessions | ✓ Implemented |
| Shopping cart | Multi-session cart | ✓ Implemented |
| Quantity per session | Multiple registrants | ✓ Implemented |
| User accounts | ACTIVE Passport login | HIGH |
| Custom forms | Configurable questions | HIGH |
| Electronic waivers | Digital signatures | HIGH |
| Payment plans | Installments | HIGH |
| Deposits | Partial initial payment | MEDIUM |
| Coupon codes | Discount codes | MEDIUM |
| Credit balance | Account credits | MEDIUM |
| Multi-person discounts | Sibling pricing | MEDIUM |

### 2. Customer Self-Service

| Feature | Description | Priority for TTNTS121 |
|---------|-------------|----------------------|
| Online account portal | View registrations | HIGH |
| Pay balance | Online payment | HIGH |
| Edit registration | Modify form answers | MEDIUM |
| Follow-up forms | Post-reg data collection | MEDIUM |
| Document upload | Supplemental forms | MEDIUM |
| Self-cancellation | Customer-initiated | HIGH |
| Self-transfer | Change sessions | HIGH |
| Secondary parent | Additional contact | MEDIUM |
| Authorized pickup | Safety management | MEDIUM |

### 3. Attendance & Check-in

| Feature | Description | Priority for TTNTS121 |
|---------|-------------|----------------------|
| Attendance portal | Web-based check-in | HIGH |
| QR code check-in | Scan participant QR | HIGH |
| Mobile app (Connect) | Tablet check-in | MEDIUM |
| Geolocation self-check-in | Location-based | LOW |
| Signatures | Digital capture | MEDIUM |
| Measurements | Temperature tracking | LOW |
| Attendance reports | Daily/participant | HIGH |

### 4. Financial & Payments

| Feature | Description | Priority for TTNTS121 |
|---------|-------------|----------------------|
| Credit card payments | Stripe integration | ✓ Implemented |
| Payment plans | Auto-billing | HIGH |
| Refund processing | Admin refunds | ✓ Implemented |
| Cancellation fees | Fee retention | MEDIUM |
| Credit balance | Account credits | MEDIUM |
| Multiple payment methods | Cash/check tracking | LOW |
| Accounts receivable | Aging reports | MEDIUM |
| Financial reports | Revenue tracking | MEDIUM |

### 5. Communication

| Feature | Description | Priority for TTNTS121 |
|---------|-------------|----------------------|
| Confirmation emails | Post-registration | ✓ Implemented |
| Email campaigns | Multi-blast series | ✓ Implemented |
| Text messaging | SMS notifications | LOW |
| Push notifications | Mobile app | LOW |
| Cart abandonment | Recovery emails | HIGH |
| Scheduled emails | Automated delivery | MEDIUM |

### 6. Reporting

| Feature | Description | Priority for TTNTS121 |
|---------|-------------|----------------------|
| Custom reports | Build-your-own | MEDIUM |
| Export to Excel | Data download | HIGH |
| Scheduled reports | Automated delivery | LOW |
| Cross-season reports | Multi-season view | LOW |
| Attendance reports | Check-in tracking | HIGH |
| Financial reports | Revenue/payments | MEDIUM |

### 7. Admin & Operations

| Feature | Description | Priority for TTNTS121 |
|---------|-------------|----------------------|
| Season setup wizard | 9-step configuration | ✓ Partial |
| Session management | CRUD operations | ✓ Implemented |
| Order actions | Edit/transfer/cancel | HIGH |
| Group assignments | Team/cabin organization | MEDIUM |
| Waitlist management | Invite from waitlist | ✓ Implemented |
| Direct registration links | Session-specific URLs | ✓ Implemented |

---

## API Integration Reference

### Base Configuration

| Property | Value |
|----------|-------|
| Base URL | `https://awapi.active.com/rest/` |
| Format | JSON only |
| Auth | Username + Password + Agency + Token |
| Array Limit | 2000 IDs per request |
| Time Zone | UTC for all dates |

### Key API Endpoints

| Category | Latest Version | Key Endpoint |
|----------|---------------|--------------|
| Seasons | v2 | `camps-season-info-v2` |
| Sessions | v6 | `camps-session-info-v6` |
| Registrations | v6 | `camps-registration-info-v6` |
| Payments | v1 | `camps-payment-info` |
| Persons | v2 | `camps-person-detail-info-v2` |
| Groups | v2 | `camps-group-info-v2` |
| Pickup List | v1 | `camps-pick-up-list-info` |

### Integration Patterns

**Data Sync:**
- Poll registration API with date filters
- Use `lastModifiedDate` for incremental updates
- Handle SALE/EDIT/TRANSFER/CANCELLED states

**Reporting:**
- Custom Financial Report API for flexible queries
- Max 60-day date range for payment APIs
- 95-day limit for Custom Financial Report

---

## Implementation Recommendations

### Tier 1: Core Platform (Highest Priority)

1. **User Account System**
   - Customer login/registration
   - Password reset flow
   - Session persistence

2. **Self-Cancellation/Transfer**
   - Customer-initiated cancellation
   - Configurable refund rules
   - Session transfer workflow

3. **Attendance Tracking**
   - Simple check-in page per session
   - QR code generation for bookings
   - Basic attendance reports

4. **Cart Abandonment Recovery**
   - Track incomplete registrations
   - Automated follow-up emails
   - Recovery metrics

### Tier 2: Enhanced Features

1. **Payment Plans**
   - Installment configuration
   - Auto-billing with Stripe
   - Failed payment handling

2. **Custom Registration Forms**
   - Configurable questions
   - Required/optional fields
   - Form validation

3. **Secondary Parent/Guardian**
   - Additional contact capture
   - Email notifications
   - Emergency contact list

### Tier 3: Advanced Features

1. **Electronic Waivers**
   - Digital signature capture
   - Waiver tracking
   - Signature storage

2. **Group Assignments**
   - Team/group creation
   - Self-selection during registration
   - Group-based communication

3. **Reporting Suite**
   - Custom report builder
   - Export functionality
   - Scheduled delivery

---

## Term Glossary

| CCM Term | Definition | TTNTS121 Equivalent |
|----------|------------|---------------------|
| Agency | Organization using CCM | Organization |
| Season | Program container (e.g., "Summer 2024") | Program |
| Session | Individual bookable class/camp | Session |
| Participant | Person attending session | Child |
| Parent/Guardian | Account holder | Parent |
| Registration | Booking transaction | Booking |
| Tuition | Session pricing | Price |
| Order | Collection of registrations | (Booking) |
| Family Account | Customer record | (Not implemented) |
| ACTIVE Passport | Authentication system | (Not implemented) |
| Credit Balance | Account credit | (Not implemented) |
| Session Option | Add-on item | (Not implemented) |
| Merchandise | Physical goods | (Not implemented) |

---

**Phase 5 Complete.**

*Next: Phase 6 - TTNTS121 Gap Analysis*
