# User Story: US-502 — Realtime Driver GPS Tracking Map

**Story ID:** `US-502`
**Epic:** [EPIC-05: Trip Execution, Tracking & In-App Chat](../overview.md)
**Role:** Client & Driver
**Priority:** P0

---

## 1. User Story Statement
**As a** client awaiting delivery,  
**I want to** view the driver's live moving position icon on a map in real time,  
**So that** I know exactly when the driver will arrive.

---

## 2. Technical Implementation Specifications

*   **Driver Ping Endpoint:** `POST /api/v1/trips/{id}/location` (every 5 seconds).
*   **Redis Ephemeral Storage:** `HSET driver_loc:{driver_id} lat {lat} lng {lng} heading {heading}` (TTL: 60s).
*   **WebSocket Broadcast:** `DriverLocationUpdated` broadcast to Echo channel `private-trip.{id}`.

---

## 3. Acceptance Criteria

```gherkin
Scenario: Live driver movement on client map
  Given trip is active ("en_route_dropoff")
  When driver transmits GPS update (30.4211, -9.5982)
  Then client Echo subscriber receives coordinates within 200ms
  And map vehicle marker smoothly interpolates to new location
```
