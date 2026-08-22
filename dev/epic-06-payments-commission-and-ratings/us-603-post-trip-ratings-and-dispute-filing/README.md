# User Story: US-603 — Post-Trip Ratings & Dispute Filing

**Story ID:** `US-603`
**Epic:** [EPIC-06: Payments, Commission & Ratings System](../overview.md)
**Role:** Client & Driver
**Priority:** P1

---

## 1. User Story Statement
**As a** client or driver,  
**I want to** submit a 1-5 star rating or open a dispute complaint post-delivery,  
**So that** high service quality is rewarded and damages or misconduct are reported.

---

## 2. Technical Endpoint (`POST /api/v1/trips/{id}/rating`)

*   **Payload:** `score` (1-5), `comment` (text).
*   **Observer:** Updates `driver_profiles.rating_avg` automatically.

---

## 3. Acceptance Criteria

```gherkin
Scenario: Submit 5-star rating
  Given a completed delivery trip
  When client submits 5 stars with comment "Great driver"
  Then rating is saved and driver rating average updates
```
