# User Story: US-702 — Filament Complaint & Dispute Resolution

**Story ID:** `US-702`
**Epic:** [EPIC-07: Admin Back-Office & Governance](../overview.md)
**Role:** Admin
**Priority:** P1

---

## 1. User Story Statement
**As a** platform admin,  
**I want to** view reported complaints, inspect cargo photos, and read full chat transcripts,  
**So that** I can fairly resolve disputes between clients and drivers.

---

## 2. Technical Capabilities

*   `ComplaintResource`: Infolist with embedded chat transcript view and photo gallery.
*   Actions: `Dismiss`, `Issue Warning`, `Suspend Account`.

---

## 3. Acceptance Criteria

```gherkin
Scenario: Admin reviews damage dispute
  Given an open complaint about broken chair
  When admin opens ComplaintResource detail page
  Then admin views attached damage photo and full chat transcript log
```
