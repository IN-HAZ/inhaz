# User Story: US-601 — Cash-on-Delivery Handshake & Digital Receipt

**Story ID:** `US-601`
**Epic:** [EPIC-06: Payments, Commission & Ratings System](../README.md)
**Role:** Client & Driver
**Priority:** P0

---

## 1. User Story Statement
**As a** client or driver,  
**I want to** confirm the exact Cash-on-Delivery (COD) amount during trip completion and view a digital receipt,  
**So that** cash payments are settled accurately and both parties have an official transaction record.

---

## 2. Implementation Status
* **Backend:** NOT STARTED — Sanctum API endpoint `POST /api/v1/trips/{id}/confirm-cash` and receipt generation `GET /api/v1/trips/{id}/receipt` to be implemented in Laravel 13.
* **Mobile:** NOT STARTED — UI components for COD payment banner and digital receipt summary sheet (`modes_de_paiement`) to be built in Expo SDK 57.

---

## 3. Design System & UI Specs

### Design System Reference Mockups
![Payment Method Selection Screen](assets/payment_handshake_screen.png)


## 4. Business Rules & Technical Requirements
### 4.1 Cash Collection & Settlement
* The trip agreed bid price (e.g. 245 MAD) must match the exact cash amount collected by the driver at dropoff. Minimum trip base price floor is 20 MAD (configurable via `system_settings`).
* Driver MUST tap "Confirm Cash Received" before marking trip status as `completed`.
* Client app receives realtime status update via Laravel Reverb (`TripCompleted` event) showing "Cash Handover Verified".

### 4.2 Digital Receipt Generation
* API Endpoint `GET /api/v1/trips/{id}/receipt` returns a signed JSON structure and downloadable PDF receipt link stored in S3/Laravel Filesystem.
* Receipt metadata includes: Trip ID, Client Name, Driver Name, Vehicle Type, Origin, Destination, Pickup Timestamp, Dropoff Timestamp, Itemized Fare Breakdown, Payment Method ("Cash on Delivery"), and System Taxes/Commission note.
* Multi-language support for receipt content: French (default), Arabic (RTL layout), and English.

---

## 5. Acceptance Criteria (Gherkin)

```gherkin
Scenario: Driver verifies COD cash payment and views digital receipt
  Given driver has arrived at destination for trip "TRIP-8821" with agreed fare "245 MAD"
  When driver taps "Confirm Cash Received (245 MAD)" on trip completion sheet
  Then trip status changes to "completed"
  And a digital receipt summary card pops up displaying exact breakdown "245 MAD Cash"
  And client app receives instant Reverb websocket event showing "Trip Paid & Completed"

Scenario: Client views digital receipt after completion
  Given a completed trip "TRIP-8821" with cash payment of "245 MAD"
  When client taps "View Receipt" from trip details screen
  Then system opens digital receipt sheet with itemized breakdown and "Download Receipt" option
```
