# Epic 02: Driver Onboarding & Verification

**Epic ID:** `EPIC-02`
**Title:** Driver Onboarding, Vehicle Details & Document Verification Pipeline
**Priority:** P0 (Blocker for Driver Operations)
**Target Release:** MVP Sprint 2

---

## 1. Executive Summary
Before a user can operate as a driver on inHaz, they must submit mandatory identity and vehicle verification documents. This epic covers the mobile document submission interface with 4 mandatory documents (CIN, carte grise, assurance, permis professionnel), secure private cloud storage via Laravel Filesystem (S3-compatible bucket), driver pending validation screen, operational dashboard, driver profile screen, and the Filament back-office document verification gallery used by administrators to inspect, approve, or reject driver applications.

---

## 2. Included User Stories

| Story ID | Title | Summary | Priority |
| :--- | :--- | :--- | :--- |
| **US-201** | [Driver Document Upload (Mobile)](us-201-driver-document-upload-mobile/README.md) | Mobile interface for uploading 4 mandatory document photos with expiry dates. | P0 |
| **US-202** | [Driver Pending Validation Status Screen](us-202-driver-pending-validation-screen/README.md) | Verification status screen displaying review window, document badges, and support contact action. | P0 |
| **US-203** | [Admin Document Inspection & Approval (Filament)](us-203-admin-document-inspection-and-approval-filament/README.md) | Back-office side-by-side inspection gallery for admins to validate driver credentials. | P0 |
| **US-204** | [Driver Operational Dashboard Screen](us-204-driver-dashboard/README.md) | Dedicated home screen in driver mode featuring online toggle, earnings, commission balance, and trip feed. | P0 |
| **US-205** | [Driver Profile Screen (Driver Mode)](us-205-driver-profile-screen/README.md) | Driver profile screen showcasing vehicle specs, rating score, verification badge, and accounting ledger link. | P1 |

---

## 3. Epic Acceptance Criteria
*   Drivers must upload all 4 mandatory documents (CIN, carte grise, assurance, permis professionnel) with valid expiry dates prior to submission.
*   Document files are uploaded securely to private S3-compatible storage via Laravel Filesystem.
*   Admins can inspect documents via time-limited signed URLs in the Filament back-office panel.
*   Drivers can monitor their review progress on the Pending Validation screen and receive real-time push/in-app notifications upon approval or rejection.
*   Approved drivers can access the Driver Operational Dashboard, toggle online/offline state, view MAD earnings and commission balance, and navigate to nearby requests.
