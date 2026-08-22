# User Story: US-601 — Cash-on-Delivery Handshake & Receipt

**Story ID:** `US-601`
**Epic:** [EPIC-06: Payments, Commission & Ratings System](../overview.md)
**Role:** Client & Driver
**Priority:** P0

---

## 1. Implementation Status Audit
*   **Backend (`backend/`):** **PARTIALLY IMPLEMENTED**. `TripController` handles trip transitions (`POST /v1/trips/{id}/transition`). Payment recording logic needs explicit COD ledger entry upon `delivered` state.
*   **Mobile (`mobile/`):** **NEEDS DESIGN SYSTEM UI ALIGNMENT**. Floating Cash Handshake Banner needs to be integrated into `app/trips/`.

---

## 2. Design System Application & UI Specs
Per `tech-spects/design_system.md`:
*   **Cash Handshake Floating Banner:**
    *   Border: `#00C853` (Cash Green).
    *   Background: Light green tint `#E6F9EE` in light mode; dark surface with green border in dark mode.
    *   Text Content: *"💵 Payment: 80 MAD Cash to Driver upon Delivery"*.
    *   Typography: Bold `font-mono` for price amount (`80 MAD`).

---

## 3. Acceptance Criteria

```gherkin
Scenario: Cash Handshake banner during delivery
  Given trip status is "in_transit" or "delivered"
  Then a permanent floating banner appears with green border (#00C853)
  And displays "💵 Payment: 80 MAD Cash to Driver upon Delivery"
```
