# User Story: US-503 — In-App Trip Chat & Media

**Story ID:** `US-503`
**Epic:** [EPIC-05: Trip Execution, Real-Time Tracking & Chat](../README.md)
**Role:** Client / Driver
**Priority:** P1

---

## 1. User Story Statement
**As a** Client or Driver,
**I want to** exchange instant messages and photos within the app during a trip,
**So that** we can coordinate pickup instructions and confirm delivery details.

---

## 2. Implementation Status
* **Backend:** NOT STARTED — Chat message API, media upload to S3 (Laravel Filesystem), and Reverb messaging events pending implementation.
* **Mobile:** NOT STARTED — Chat panel screen UI, photo attachment flow, and automatic read-only lock pending implementation.

---

## 3. Design System & UI Specs

### Design System Reference Mockups
![In-App Trip Chat Screen](assets/trip_chat_screen.png)


## 4. Business Rules & Technical Requirements
### 4.1 Chat Channel & Realtime Events
* Messaging is scoped to `private-trip.{id}.chat` channel via Laravel Reverb.
* Sending a message stores a record in `trip_messages` table and broadcasts `ChatMessageSent` event.

### 4.2 Media Uploads (Laravel Filesystem / S3)
* Photos attached via camera icon are uploaded using `POST /api/v1/trips/{id}/chat/media` via Laravel Filesystem (AWS S3 storage).
* Returns a secure HTTPS URL stored in `trip_messages.attachment_url`.

### 4.3 Automatic Read-Only Lockout (2 Hours Post-Delivery)
* Chat remains writable during active trip execution.
* Exactly 2 hours after trip delivery (`delivered_at + 2 hours`), write access to chat endpoint is blocked (HTTP 403) and mobile interface displays a "Chat closed (read-only)" banner.

---

## 5. Acceptance Criteria (Gherkin)

```gherkin
Scenario: Client sends text message to driver during active trip
  Given a trip is active between client and driver
  When I type "I am waiting at the main entrance" and tap Send
  Then a purple chat bubble appears on the right
  And the message is broadcast to the driver in real-time via Laravel Reverb

Scenario: Driver uploads photo proof of arrival
  Given I am the driver on screen "suivi_et_chat"
  When I tap the camera icon and select a package photo
  Then the photo is uploaded via Laravel Filesystem to S3
  And displays as an in-line photo thumbnail in the chat thread

Scenario: Chat locks to read-only mode 2 hours after delivery
  Given a trip was marked "delivered" 2 hours and 5 minutes ago
  When either client or driver opens the trip chat panel
  Then the message input bar is replaced with "Ce chat est fermé (lecture seule)" banner
  And attempting to post a message returns HTTP 403 Forbidden
```
