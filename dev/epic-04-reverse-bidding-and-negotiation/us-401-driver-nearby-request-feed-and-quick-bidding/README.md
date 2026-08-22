# User Story: US-401 — Driver Nearby Request Feed & Quick Bidding

**Story ID:** `US-401`
**Epic:** [EPIC-04: Reverse Bidding & Negotiation Engine](../overview.md)
**Role:** Driver
**Priority:** P0

---

## 1. Implementation Status Audit
*   **Backend (`backend/`):** **IMPLEMENTED**. `DeliveryRequestController@browse` handles searching open requests, `OfferController@store` handles offer submission (`POST /v1/requests/{id}/offers`).
*   **Mobile (`mobile/`):** **NEEDS DESIGN SYSTEM UI ALIGNMENT**. Driver feed in `app/driver/` needs to apply the One-Handed Ergonomic Bidding layout and quick counter buttons (`+10%`, `+20%`).

---

## 2. Design System Application & UI Specs
Per `tech-spects/design_system.md`:
*   **Driver Dashboard Header:** High-contrast `● ONLINE` status pill with dark surface `#100D14`. Displays daily earnings (`tabular-nums font-mono`).
*   **Request Card Surface:** `bg-inhaz-surface-light` (light mode) or `bg-inhaz-dark-card` (`#18141F` dark mode) with `rounded-card` (16px radius).
*   **Quick Counter Buttons:**
    *   `[ Accept Proposed Price ]`: Solid Electric Purple (`bg-inhaz-purple`).
    *   `[ +10% ]`: Dark counter button (`bg-inhaz-dark`, white text).
    *   `[ +20% ]`: Dark counter button (`bg-inhaz-dark`, white text).
    *   `[ Custom Counter ]`: Input field with `font-mono` MAD value.

---

## 3. Acceptance Criteria

```gherkin
Scenario: Driver counters via one-handed Quick Action
  Given I am in Driver Mode with "● ONLINE" status badge
  When a nearby request card appears showing "Client Offer: 60 MAD"
  And I tap the quick button "+20% (72 MAD)" (bg-inhaz-dark)
  Then an offer of 72 MAD is submitted and streamed to the client
```
