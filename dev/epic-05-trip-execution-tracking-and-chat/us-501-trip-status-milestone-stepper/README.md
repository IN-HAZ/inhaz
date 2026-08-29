# User Story: US-501 — Trip Status Milestone Stepper

**Story ID:** `US-501`
**Epic:** [EPIC-05: Trip Execution, Real-Time Tracking & Chat](../README.md)
**Role:** All
**Priority:** P0

---

## 1. User Story Statement
**As a** Client or Driver,
**I want to** view a visual milestone stepper for the delivery trip,
**So that** both parties have transparent real-time visibility into the exact stage of pickup and delivery.

---

## 2. Implementation Status
* **Backend:** NOT STARTED — Milestone state transition API endpoints (`PATCH /api/v1/trips/{id}/status`) pending implementation.
* **Mobile:** NOT STARTED — Milestone vertical stepper timeline component and driver header card pending UI implementation.

---

## 3. Design System & UI Specs

### Design System Reference Mockups
![Trip In-Progress Milestone Stepper Screen](assets/milestone_stepper_screen.png)


## 4. Business Rules & Technical Requirements
### 4.1 Strict Sequential State Machine
* Milestone transitions must occur strictly in order: `heading_to_pickup` -> `arrived_pickup` -> `cargo_collected` -> `en_route` -> `delivered`.
* Attempting to skip milestones or transition out of order is rejected by backend validation (HTTP 422).

### 4.2 Status Update Broadcast (Laravel Reverb)
* Driver status updates trigger `TripStatusUpdated` event broadcast via Laravel Reverb to channel `private-trip.{id}`.
* Client UI updates instantly without requiring page pull-to-refresh.

### 4.3 Audit & Timestamp Logging
* Each milestone status change records exact timestamp, driver geolocation, and user ID in `trip_status_logs` table.

---

## 5. Acceptance Criteria (Gherkin)

```gherkin
Scenario: Driver advances trip milestone sequentially
  Given the trip is currently in status "heading_to_pickup"
  When the driver taps "Signal Arrival at Pickup"
  Then trip status advances to "arrived_pickup"
  And the milestone step highlights green checked for completed steps
  And the next step "cargo_collected" highlights in Electric Purple (#7928CA)

Scenario: Backend blocks out-of-order status transition
  Given the trip is currently in status "heading_to_pickup"
  When an API request attempts to update status directly to "en_route"
  Then the backend rejects the request with HTTP 422 "Transition de statut invalide"

Scenario: Client views updated milestone ETA via WebSockets
  Given I am viewing the active trip screen "course_en_cours"
  When the driver updates status to "cargo_collected"
  Then the timeline stepper updates live with the new step active and updated ETA display
```
