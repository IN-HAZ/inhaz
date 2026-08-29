# Epic 10: Localisation & Internationalisation (i18n)

**Epic ID:** `EPIC-10`
**Title:** Localisation, Internationalisation & RTL Support
**Priority:** P0 (Essential for multi-lingual Moroccan market context)
**Target Release:** MVP Sprint 1

---

## 1. Executive Summary
This epic delivers comprehensive multi-lingual and internationalisation (i18n) capabilities across the inHaz platform. It configures Expo mobile client translation via `react-i18next` supporting French (default), Arabic (with dynamic RTL layout flipping via `I18nManager.forceRTL`), and English. Additionally, it integrates language selection in the user settings UI (`langue_et_r_gion`) and enables localized API validation error responses on the Laravel 13 backend using the `Accept-Language` header and `users.locale` database setting.

---

## 2. Included User Stories

| Story ID | Title | Summary | Priority |
| :--- | :--- | :--- | :--- |
| **US-1001** | [i18n Setup & Translation Files](us-1001-i18n-setup-and-translation-files/README.md) | Setup `react-i18next` / Expo i18n for FR, AR, EN and handle dynamic RTL layout flipping for Arabic. | P0 |
| **US-1002** | [Language & Region Settings Screen](us-1002-language-region-settings-screen/README.md) | Create `langue_et_r_gion` settings screen with radio list for FR, AR, EN and country flag icons. | P0 |
| **US-1003** | [Backend Locale Support](us-1003-backend-locale-support/README.md) | Provide localized Laravel 13 validation and error responses driven by `Accept-Language` header or `users.locale`. | P1 |

---

## 3. Epic Acceptance Criteria
* The mobile application supports French (`fr`, default), Arabic (`ar`), and English (`en`) translations using `react-i18next`.
* Selecting Arabic immediately triggers dynamic RTL layout flipping via `I18nManager.forceRTL(true)` without UI breaking.
* The `langue_et_r_gion` screen displays styled radio buttons with country flags on dark mode canvas (`bg-inhaz-dark`, `#100D14`).
* Backend Laravel API reads `Accept-Language` header or `users.locale` database setting to return localized HTTP validation messages.
* Minimum delivery price tokens (`20 MAD`) and driver required document names (CIN, carte grise, assurance, permis professionnel) are translated across all locales.
