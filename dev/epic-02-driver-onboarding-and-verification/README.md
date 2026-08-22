# Epic 02: Driver Onboarding & Document Verification

**Epic ID:** `EPIC-02`
**Title:** Driver Onboarding, Vehicle Details & Document Verification Pipeline
**Priority:** P0 (Blocker for Driver Operations)
**Target Release:** MVP Sprint 1

---

## 1. Executive Summary
Before a user can operate as a driver on inHaz, they must submit mandatory identity and vehicle verification documents. This epic covers the mobile document submission interface, secure cloud storage handling, and the Filament back-office document verification gallery used by administrators to inspect, approve, or reject driver applications.

---

## 2. Included User Stories

| Story ID | Title | Summary | Priority |
| :--- | :--- | :--- | :--- |
| **US-201** | [Driver Document Upload (Mobile)](us-201-driver-document-upload-mobile/overview.md) | Mobile interface for uploading CIN, Carte Grise, Insurance, and License photos. | P0 |
| **US-202** | [Admin Document Inspection (Filament)](us-202-admin-document-inspection-and-approval-filament/overview.md) | Back-office side-by-side inspection gallery for admins to validate driver credentials. | P0 |

---

## 3. Epic Acceptance Criteria
*   Drivers must upload 5 mandatory document photos before submission.
*   Document files are uploaded securely to private S3 bucket storage.
*   Admin can view documents via time-limited signed URLs in Filament panel.
*   Driver receives instant push notification upon document approval or rejection.
