# User Story: US-501 — Trip Status Milestone Stepper

**Story ID:** `US-501`
**Epic:** [EPIC-05: Trip Execution, Tracking & In-App Chat](../overview.md)
**Role:** Driver
**Priority:** P0

---

## 1. User Story Statement
**As a** driver executing a trip,  
**I want to** tap milestone status buttons ("Arrived at Pickup", "Cargo Collected", "Delivered"),  
**So that** the client is updated on progress and the trip lifecycle advances correctly.

---

## 2. Technical API Contract (`PATCH /api/v1/trips/{id}/status`)

*   **Status Progression Chain:** `heading_to_pickup` $\rightarrow$ `arrived_pickup` $\rightarrow$ `cargo_collected` $\rightarrow$ `en_route_dropoff` $\rightarrow$ `delivered`.
*   **Validation:** Out-of-order transitions return `HTTP 422 Unprocessable Entity`.
*   **Side Effects:** Broadcasts `TripStatusUpdated` event to `private-trip.{id}`.

---

## 3. Acceptance Criteria

```gherkin
Scenario: Driver marks arrived at pickup
  Given trip status is "heading_to_pickup"
  When driver taps "Arrived at Pickup"
  Then trip status becomes "arrived_pickup"
  And client receives push notification "Driver has arrived at pickup location"
```
