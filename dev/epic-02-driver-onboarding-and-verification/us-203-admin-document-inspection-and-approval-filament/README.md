# User Story: US-203 — Admin Document Inspection & Approval (Filament)

**Story ID:** `US-203`
**Epic:** [EPIC-02: Driver Onboarding & Verification](../README.md)
**Role:** Admin
**Priority:** P0

---

## 1. User Story Statement
**As a** platform administrator in the Filament back-office,  
**I want to** inspect submitted driver document images in a side-by-side gallery and approve or reject them,  
**So that** only legibly verified drivers can operate on the platform.

---

## 2. Technical Implementation Specifications

### 2.1 Filament Inspection Gallery
*   Displays signed temporary S3 URLs (15-minute TTL) for secure image rendering.
*   Shows driver personal details, phone number, vehicle type, and license plate.

### 2.2 Approval & Rejection Actions
*   **Approve Action:** Sets `driver_documents.status = 'approved'` and `driver_profiles.verification_status = 'approved'`. Triggers `DriverApprovedNotification`.
*   **Reject Action:** Requires admin to select specific invalid documents and enter a rejection reason text. Sets `driver_profiles.verification_status = 'rejected'`.

---

## 3. Acceptance Criteria

```gherkin
Scenario: Admin approves driver application
  Given I am logged into Filament Admin Panel on Driver Verification queue
  When I inspect driver "Hassan M." documents and click "Approve Driver"
  Then the driver verification status updates to "approved"
  And a push notification is sent to the driver's phone

Scenario: Admin rejects document with reason
  Given I notice an expired insurance document for a driver
  When I select "Reject Document" and enter reason "Insurance document expired on 2026-01-01"
  Then the status becomes "rejected" and the driver is notified to re-upload
```
