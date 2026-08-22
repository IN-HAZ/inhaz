# User Story: US-503 — In-App Trip Chat & Media

**Story ID:** `US-503`
**Epic:** [EPIC-05: Trip Execution, Tracking & In-App Chat](../overview.md)
**Role:** Client & Driver
**Priority:** P1

---

## 1. User Story Statement
**As a** client or driver involved in an active trip,  
**I want to** send text messages and photo attachments within an in-app chat thread,  
**So that** we can clarify pickup locations or handling details directly.

---

## 2. Technical API Contract (`POST /api/v1/messages`)

*   **Access Control:** Gated by `MessagePolicy`. Only assigned client and driver can read/write.
*   **Payload:** `request_id`, `content`, `image` (optional).
*   **Side Effects:** Broadcasts `MessageSent` event to `private-request.{id}` and sends push notification if recipient offline.

---

## 3. Acceptance Criteria

```gherkin
Scenario: Send chat message with photo
  Given an active trip between Client and Driver
  When Client types "I am at main gate" and attaches photo of building
  Then Driver receives message and photo preview in chat thread instantly
```
