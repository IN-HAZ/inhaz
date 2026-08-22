# User Story: US-701 — Filament User & Driver Management

**Story ID:** `US-701`
**Epic:** [EPIC-07: Admin Back-Office & Governance](../overview.md)
**Role:** Admin
**Priority:** P1

---

## 1. Implementation Status Audit
*   **Backend (`backend/`):** **PARTIALLY IMPLEMENTED**. `DriverVerificationController` contains basic API endpoints (`/v1/admin/driver/*`), but full Filament v5 Back-Office Resources and Livewire interface need to be established.
*   **Web Admin:** Needs Filament v5 setup with inHaz admin design theme.

---

## 2. Web Admin Design Language Specs
Per `tech-spects/design_system.md`:
*   **Sidebar Layout:** 240px wide collapsible left sidebar with dark surface `#100D14`.
*   **Active Indicator:** Crisp Electric Purple (`#7928CA`) selection borders and active item indicators.
*   **Document Inspection Gallery:** Side-by-side inspection cards for CIN, Carte Grise, and Insurance papers with approval (`#00C853`) and rejection (`#E53935`) action buttons.
*   **Commission Reconciliation Table:** Visual table calculating 10-15% cut on cash payouts with individual status toggles.

---

## 3. Acceptance Criteria

```gherkin
Scenario: Admin approves driver in Filament Document Gallery
  Given I am logged into Filament Admin Panel (/admin)
  When I open the Document Verification Gallery with dark sidebar (#100D14)
  And click "Approve All Documents" (#00C853 button)
  Then driver verification_status updates to "approved"
```
