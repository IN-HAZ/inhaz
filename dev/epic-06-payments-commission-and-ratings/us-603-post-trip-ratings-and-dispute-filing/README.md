# User Story: US-603 — Post-Trip Ratings & Dispute Filing

**Story ID:** `US-603`
**Epic:** [EPIC-06: Payments, Commission & Ratings System](../README.md)
**Role:** Client & Driver
**Priority:** P1

---

## 1. User Story Statement
**As a** client or driver,  
**I want to** rate completed trips (1-5 stars) and optionally file a dispute complaint with details and photos,  
**So that** service quality is maintained and incidents are escalated to administration for resolution.

---

## 2. Implementation Status
* **Backend:** NOT STARTED — Rating submission `POST /api/v1/trips/{id}/rating` and dispute filing `POST /api/v1/trips/{id}/dispute` endpoints to be created in Laravel 13.
* **Mobile:** NOT STARTED — Two-step rating and dispute bottom sheet (`valuation_de_la_livraison_mode_sombre_1` & `_2`) to be built in Expo SDK 57.

---

## 3. Design System & UI Specs

### Design System Reference Mockups
![Delivery Rating Step 1 Screen](assets/rating_step1_screen.png)

![Delivery Rating Step 2 / Dispute Screen](assets/rating_step2_screen.png)


## 4. Business Rules & Technical Requirements
### 4.1 Rating Calculation
* Rating scale is 1 to 5 integer stars.
* Submitting a rating updates `driver_profiles.rating` running average score and `total_trips` counter.
* Driver can also rate client (1-5 stars) after cash handshake completion.

### 4.2 Dispute Filing & Storage
* Dispute endpoint `POST /api/v1/trips/{id}/dispute` accepts multipart payload: `category`, `description`, and `photos[]`.
* Photos stored via Laravel Filesystem on S3 under `disputes/{trip_id}/`.
* Creates a record in `disputes` table with status `pending`, triggering notification to Filament admin back-office complaint queue (US-702).

---

## 5. Acceptance Criteria (Gherkin)

```gherkin
Scenario: Client submits 5-star rating after successful delivery
  Given client completed trip "TRIP-4910"
  When two-step rating bottom sheet appears (Step 1)
  And client selects 5 gold stars and enters text "Excellent livreur, très rapide !"
  And taps "Valider la note" (#7928CA)
  Then rating is saved and driver average rating is updated automatically

Scenario: Client files dispute for damaged cargo with photo attachment
  Given client completed trip "TRIP-4910" with damaged goods
  When client taps "Signaler un problème" on Step 1 rating sheet
  Then Step 2 dispute filing screen opens with category choices
  When client selects category "Marchandise endommagée", attaches 2 photos, enters description, and taps "Soumettre la réclamation" (#E53935)
  Then system creates dispute record in "pending" status and uploads photos to storage
```
