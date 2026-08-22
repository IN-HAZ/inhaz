# User Story: US-201 — Driver Document Upload (Mobile)

**Story ID:** `US-201`
**Epic:** [EPIC-02: Driver Onboarding & Document Verification](../overview.md)
**Role:** Driver
**Priority:** P0

---

## 1. User Story Statement
**As an** aspiring driver,  
**I want to** select my vehicle type and upload clear photos of my ID, vehicle registration, and insurance,  
**So that** platform administrators can verify my identity and authorize me to accept delivery jobs.

---

## 2. Business Rules & Upload Contract

### 2.1 Mandatory Documents
1.  CIN (National Identity Card) - Front
2.  CIN (National Identity Card) - Back
3.  `Carte Grise` (Vehicle Registration)
4.  Attestation d'assurance (Vehicle Insurance Certificate)
5.  Permis de conduire (Driver License)

### 2.2 Endpoint Contract (`POST /api/v1/driver/documents`)
*   **Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`.
*   **Validation:** Image size max 10MB per file; types allowed: `image/jpeg`, `image/png`.
*   **Storage:** Stored in `secure-documents/{driver_id}/`.
*   **Status Update:** Sets `driver_profiles.verification_status = 'pending'`.

---

## 3. Acceptance Criteria

```gherkin
Scenario: Successful document submission
  Given I am on the Driver Verification screen
  When I select vehicle type "Triporteur" and upload photos for all 5 required documents
  And I tap "Submit for Verification"
  Then my verification_status changes to "pending"
  And I see a confirmation message "Documents submitted for admin review"
```
