# Epic 01: Core Infrastructure & Authentication

**Epic ID:** `EPIC-01`
**Title:** Core Infrastructure, Database Setup & Phone OTP Authentication
**Priority:** P0 (Blocker)
**Target Release:** MVP Sprint 1

---

## 1. Executive Summary
This epic establishes the technical foundation for the inHaz platform. It encompasses setting up the Laravel REST API backend, initial database schema migrations, phone-based passwordless OTP authentication via SMS, Sanctum API token authorization, and seamless client/driver role switching within the unified Expo mobile app.

---

## 2. Included User Stories

| Story ID | Title | Summary | Priority |
| :--- | :--- | :--- | :--- |
| **US-101** | [Phone OTP Authentication](us-101-phone-otp-authentication/overview.md) | Request and verify 6-digit SMS OTP codes to register or log in. | P0 |
| **US-102** | [Sanctum Token & Session Management](us-102-sanctum-token-and-session-management/overview.md) | Issue, validate, and revoke Sanctum API Bearer tokens for mobile API requests. | P0 |
| **US-103** | [Dual-Role Switching (Client / Driver)](us-103-dual-role-switching-client-driver/overview.md) | Allow users to seamlessly switch context between Client mode and Driver mode. | P0 |

---

## 3. Epic Acceptance Criteria
*   User can register or log in using a valid phone number and 6-digit OTP code within 60 seconds.
*   OTP requests are throttled (max 1 per 60s per phone; max 3 failed verification attempts before invalidation).
*   API endpoints require valid Sanctum token (`Authorization: Bearer <token>`).
*   Role switching retains single user identity while switching UI presentation and API authorization scopes.
