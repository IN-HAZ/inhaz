# User Story: US-102 — Sanctum Token & Session Management

**Story ID:** `US-102`
**Epic:** [EPIC-01: Core Infrastructure & Authentication](../overview.md)
**Role:** Client & Driver
**Priority:** P0

---

## 1. User Story Statement
**As an** authenticated mobile user,  
**I want to** remain securely logged in across app launches using an API Bearer token,  
**So that** I don't have to re-verify my phone number every time I open the app.

---

## 2. Technical Specifications & Security Mechanics

### 2.1 Token Issuance & Storage
*   Issued via `User::createToken('mobile-app')->plainTextToken` upon OTP verification.
*   Token is stored client-side in **Expo SecureStore** (encrypted device keychain).
*   Passed in HTTP Request headers: `Authorization: Bearer <token>`.

### 2.2 Token Validation & Expiration Policy
*   All protected endpoints pass through `auth:sanctum` middleware.
*   Tokens do not expire automatically by default, but can be invalidated by admin or on user logout (`POST /api/v1/auth/logout`).
*   If user account `users.is_active` is `false`, middleware rejects request immediately with `HTTP 401 Unauthorized`.

---

## 3. Acceptance Criteria

```gherkin
Scenario: Token Authorization Success
  Given I have a valid Sanctum Bearer token in SecureStore
  When I make an API request to GET /api/v1/users/me
  Then the API returns HTTP 200 with my profile details

Scenario: Token Revocation on Logout
  Given I am logged in
  When I press "Log Out" in the settings screen
  Then the API invalidates the token in personal_access_tokens table
  And local SecureStore token is deleted
```
