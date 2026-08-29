# User Story: US-701 — Admin 2-Factor Authentication (2FA) Login

**Story ID:** `US-701`
**Epic:** [EPIC-07: Admin Back-Office & Governance](../README.md)
**Role:** Admin
**Priority:** P1

---

## 1. User Story Statement
**As a** platform administrator,  
**I want to** authenticate with Two-Factor Authentication (TOTP app or SMS OTP) when signing into Filament,  
**So that** admin back-office access and sensitive financial controls are protected against unauthorized access.

---

## 2. Implementation Status
* **Backend:** NOT STARTED — Filament 2FA authentication challenge middleware, TOTP secret provider, and SMS OTP fallback to be implemented in Laravel 13.
* **Mobile:** NOT APPLICABLE — Web Admin interface.

---

## 3. Design System & UI Specs
Per `tech-spects/design_system.md` and Filament v5 Theme:
* Login Background: `#100D14` dark surface centered card.
* Accent: `#7928CA` electric purple buttons and input focus rings.
* 2FA Challenge View: 6-digit OTP code input boxes with countdown timer, toggle link between "Use Authenticator App (TOTP)" and "Send SMS Code", and recovery code modal link.

---

## 4. Business Rules & Technical Requirements
### 4.1 Multi-Factor Authentication Enforcement
* All users accessing `/admin` with administrative roles MUST have 2FA enabled.
* Supports TOTP standard RFC 6238 (Google Authenticator, Authy, 1Password).
* Supports SMS 2FA code fallback sent to admin's registered Moroccan phone number.
* Emergency backup recovery codes generated during 2FA setup.

### 4.2 Security Rules
* 2FA verification session expires after 2 hours of inactivity or complete browser closure.
* Maximum 3 failed 2FA code attempts triggers 15-minute lock on admin account.

---

## 5. Acceptance Criteria (Gherkin)

```gherkin
Scenario: Admin logs into Filament panel with TOTP 2FA code
  Given admin enters valid email and password on Filament login page (/admin/login)
  Then system prompts for 2-Factor Authentication code
  When admin inputs valid 6-digit TOTP code from Google Authenticator
  Then admin is authenticated and redirected to Filament dashboard

Scenario: Admin falls back to SMS 2FA code
  Given admin is on the 2FA challenge screen
  When admin clicks "Send SMS 2FA Code"
  Then an SMS containing a 6-digit code is dispatched to admin's phone
  And entering the correct SMS code completes authentication successfully
```
