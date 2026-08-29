# User Story: US-1003 — Backend Locale Support

**Story ID:** `US-1003`
**Epic:** [EPIC-10: Localisation & Internationalisation (i18n)](../README.md)
**Role:** All
**Priority:** P1

---

## 1. User Story Statement
**As an** API consumer or mobile client,  
**I want the** Laravel 13 REST API to validate inputs and return error messages localized in the requesting user's language,  
**So that** system error alerts and validation notices render accurately in French, Arabic, or English.

---

## 2. Implementation Status
* **Backend:** NOT STARTED — `SetLocaleMiddleware` and localized Laravel validation dictionary files to be created.
* **Mobile:** NOT STARTED — HTTP client interceptor to attach `Accept-Language` header pending.

---

## 3. Design System & UI Specs
Per `tech-spects/design_system.md` and Stitch dark-mode export:
* API responses format error messages rendered on mobile toast / alert popups using dark surface styling (`bg-inhaz-dark`, `#100D14`) and purple accent highlights (`inhaz.purple`, `#7928CA`).

---

## 4. Business Rules & Technical Requirements

### 4.1 Middleware Locale Resolution
* Create Laravel 13 `SetLocaleMiddleware` attached to global API middleware group.
* Locale evaluation priority:
  1. `Accept-Language` HTTP header (e.g. `ar`, `fr`, `en`).
  2. `users.locale` database column for authenticated Sanctum sessions.
  3. Default fallback locale: `fr`.
* Sets global application locale via `app()->setLocale($locale)`.

### 4.2 Localized Response Resources
* Translation files configured in `backend/lang/{fr,ar,en}/`:
  - `validation.php`: Input validation error strings.
  - `messages.php`: System alerts (e.g. minimum delivery amount `20 MAD`, driver document verification status).

---

## 5. Acceptance Criteria (Gherkin)

```gherkin
Scenario: Validation errors returned in Arabic via Accept-Language header
  Given an API request to create a delivery request with invalid payload
  And the HTTP header "Accept-Language: ar" is set
  Then the API responds with HTTP 422 Unprocessable Entity
  And the JSON validation error messages are formatted in Arabic

Scenario: Authenticated session locale fallback
  Given an authenticated user with users.locale set to "en"
  When an API request is made without Accept-Language header
  Then the backend resolves locale from user profile as "en"
```
