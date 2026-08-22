# User Story: US-301 — Client Delivery Request Form

**Story ID:** `US-301`
**Epic:** [EPIC-03: Request Creation & Geospatial Infrastructure](../overview.md)
**Role:** Client
**Priority:** P0

---

## 1. Implementation Status Audit
*   **Backend (`backend/`):** **IMPLEMENTED**. `DeliveryRequestController` handles request creation (`POST /v1/requests`), intermediate stops, and photos (`POST /v1/requests/{id}/photos`).
*   **Mobile (`mobile/`):** **NEEDS DESIGN SYSTEM UI ALIGNMENT**. Request screens in `app/requests/` need to apply the inHaz Reverse-Bidding Bottom Sheet and Price Stepper UI components.

---

## 2. Design System Application & UI Specs
Per `tech-spects/design_system.md`:
*   **Layout Component:** **Reverse-Bidding Bottom Sheet** with 24px top rounded corners (`rounded-sheet`), sliding over fullscreen Google Map.
*   **Vehicle Chips:**
    *   `Triporteur`: Border `#0066FF`, Text `#0066FF`.
    *   `Camionnette / Van`: Border `#FF8800`, Text `#FF8800`.
    *   `Truck`: Border `#7928CA`, Text `#7928CA`.
*   **Price Stepper (`PriceStepper.tsx`):**
    *   `-10` button (White card, `#7928CA` text).
    *   Price Display: 3xl bold `font-mono` (`80 MAD`).
    *   `+10` button (`bg-inhaz-purple`, white text).
*   **Publish Button:** Full-width Electric Purple button (`bg-inhaz-purple`, `rounded-control`, 16px font bold).

---

## 3. Technical Specifications (`POST /api/v1/requests`)

*   **Payload:** `origin_address`, `origin_latitude`, `origin_longitude`, `destination_address`, `destination_latitude`, `destination_longitude`, `required_vehicle_type`, `description`, `proposed_price`.

---

## 4. Acceptance Criteria

```gherkin
Scenario: Create request using inHaz Design System Bottom Sheet
  Given I am on the Map Home screen
  When the 24px rounded Bottom Sheet opens
  And I adjust my proposed price to 80 MAD using the Price Stepper (-10 / +10 buttons)
  And I tap "PUBLISH REQUEST (NOTIFY DRIVERS)" (bg-inhaz-purple)
  Then the request is published and enters status "open" (blue status badge)
```
