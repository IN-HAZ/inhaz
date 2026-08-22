# User Story: US-101 — Phone OTP Authentication

**Story ID:** `US-101`
**Epic:** [EPIC-01: Core Infrastructure & Authentication](../overview.md)
**Role:** Client & Driver
**Priority:** P0

---

## 1. Implementation Status Audit
*   **Backend (`backend/`):** **PARTIALLY IMPLEMENTED**. `AuthController` exists with `/v1/auth/send-otp` and `/v1/auth/verify-otp`. Uses `otps` table and `users` table.
*   **Mobile (`mobile/`):** **NEEDS UI ALIGNMENT**. Phone entry and OTP verification screens exist in `app/auth/`, but require integration with the **inHaz Design System**.

---

## 2. Design System Application & UI Specs
Per `tech-spects/design_system.md`:
*   **Colors:** Background canvas `bg-inhaz-surface-subtle` (`#F7F6FA`) in light mode; `bg-inhaz-dark` (`#100D14`) in dark mode.
*   **Primary CTA Button:** Uses Electric Purple (`bg-inhaz-purple`, `#7928CA`) with 12px rounded control (`rounded-control`).
*   **OTP Code Input Fields:** 6 individual digit boxes using `font-mono` (`JetBrainsMono`) with focus border `border-inhaz-purple-light` (`#9047E0`).
*   **Countdown Timer:** Monospace 60-second resend timer formatted as ` tabular-nums text-inhaz-text-secondary`.

---

## 3. Business Rules & Technical Requirements

### 3.1 OTP Generation & Request (`POST /api/v1/auth/send-otp`)
*   **Input Validation:** Phone number validated (E.164 format e.g., `+212600000000`).
*   **Rate Limiting:** Maximum 1 request per phone number per 60 seconds.
*   **Storage & TTL:** 6-digit random code stored in Redis with 5-minute TTL.

### 3.2 OTP Verification (`POST /api/v1/auth/verify-otp`)
*   Verifies 6-digit code. On success, returns Sanctum Bearer Token and User Profile.

---

## 4. Acceptance Criteria (Gherkin Format)

```gherkin
Scenario: Successful OTP authentication with Design System styling
  Given I am on the OTP screen with "bg-inhaz-dark" canvas
  When I enter a valid phone number "+212612345678" and press "bg-inhaz-purple" CTA button
  Then an OTP code is dispatched via SMS
  And 6 monospace digit inputs appear with a 60s countdown timer
```
