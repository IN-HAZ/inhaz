# User Story: US-403 — Counter-Offer Negotiation Flow

**Story ID:** `US-403`
**Epic:** [EPIC-04: Reverse Bidding & Negotiation Engine](../overview.md)
**Role:** Client & Driver
**Priority:** P1

---

## 1. User Story Statement
**As a** client or driver,  
**I want to** propose a counter-price to an existing offer rather than rejecting it outright,  
**So that** we can negotiate an agreeable price for both parties.

---

## 2. Business Rules & Workflow

*   Client clicks "Counter" on a driver's offer card, inputs custom price (e.g. 85 MAD).
*   Updates offer status to `countered` and sends broadcast to driver (`private-user.{driver_id}`).
*   Driver receives prompt: "Client proposed counter of 85 MAD. Accept or Decline?"

---

## 3. Acceptance Criteria

```gherkin
Scenario: Client sends counter-offer to driver
  Given driver offered 100 MAD on an 80 MAD request
  When client submits a counter-offer of 90 MAD
  Then driver receives a real-time notification with option to Accept 90 MAD
```
