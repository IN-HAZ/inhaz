# Epic 01: Core Infrastructure & Authentication

**Epic ID:** `EPIC-01`
**Title:** Core Infrastructure, Database Setup & Phone OTP Authentication
**Priority:** P0 (Blocker)
**Target Release:** MVP Sprint 1

---

## 1. Executive Summary
This epic establishes the technical foundation for the inHaz platform. It encompasses setting up the Laravel 13 REST API backend, database schema migrations, phone-based passwordless OTP authentication via SMS gateway, Sanctum API Bearer token authorization, personal profile editing, configuration settings, activity history tracking, and seamless client/driver role switching within the unified Expo mobile app. The architecture relies strictly on Laravel 13 + Sanctum + SMS gateway.

---

## 2. Included User Stories

| Story ID | Title | Summary | Priority |
| :--- | :--- | :--- | :--- |
| **US-101** | [Phone OTP Authentication](us-101-phone-otp-authentication/README.md) | Request and verify 6-digit SMS OTP codes to register or log in via SMS gateway. | P0 |
| **US-102** | [Sanctum Token & Session Management](us-102-sanctum-token-and-session-management/README.md) | Issue, validate, and revoke Sanctum API Bearer tokens for mobile API requests. | P0 |
| **US-103** | [Dual-Role Switching (Client / Driver)](us-103-dual-role-switching-client-driver/README.md) | Allow users to seamlessly switch context between Client mode and Driver mode. | P0 |
| **US-104** | [Personal Info & Profile Edit Screen](us-104-personal-info-screen/README.md) | View and edit personal profile info (name, profile picture upload, read-only phone). | P1 |
| **US-105** | [Profile Configuration & Notification Preferences](us-105-profile-configuration-screen/README.md) | Manage application settings and push notification preferences. | P1 |
| **US-106** | [Activity History Screen](us-106-activity-history-screen/README.md) | Timeline view of past delivery requests and completed driver trips. | P1 |

---

## 3. Epic Acceptance Criteria
* User can register or log in using a valid phone number and 6-digit OTP code sent via SMS gateway within 60 seconds.
* OTP requests are throttled (max 1 per 60s per phone; max 3 failed verification attempts before invalidation).
* API endpoints require valid Laravel Sanctum token (`Authorization: Bearer <token>`).
* Role switching defaults to Client mode on first login and requires verified driver status before entering Driver mode.
* Users can update profile details, configure notification toggles, and review trip history on dark-mode interface (`bg-inhaz-dark`, `#100D14`).
