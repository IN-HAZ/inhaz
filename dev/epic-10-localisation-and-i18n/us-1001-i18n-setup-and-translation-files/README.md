# User Story: US-1001 — i18n Setup & Translation Files

**Story ID:** `US-1001`
**Epic:** [EPIC-10: Localisation & Internationalisation (i18n)](../README.md)
**Role:** All
**Priority:** P0

---

## 1. User Story Statement
**As an** inHaz mobile app user,  
**I want the** application interface to render in my preferred language (French, Arabic, or English) with proper text direction (RTL for Arabic),  
**So that** I can seamlessly create delivery requests or provide driver services in my native language.

---

## 2. Implementation Status
* **Backend:** NOT STARTED — `users.locale` column defined in database schema.
* **Mobile:** NOT STARTED — `react-i18next` configuration and JSON dictionary files (`fr.json`, `ar.json`, `en.json`) to be added.

---

## 3. Design System & UI Specs
Per `tech-spects/design_system.md` and Stitch dark-mode export:
* Background: `bg-inhaz-dark` (`#100D14`)
* Primary CTA: `bg-inhaz-purple` (`#7928CA`), `rounded-sheet` (24px)
* Layout elements automatically adjust flex orientation (`flex-direction: row-reverse` for RTL) when Arabic is active.
* Text elements toggle alignment between Left-to-Right (LTR) and Right-to-Left (RTL).

---

## 4. Business Rules & Technical Requirements

### 4.1 Client i18n Architecture (`mobile/`)
* Configure `react-i18next` engine with Expo runtime support.
* Locale JSON bundles located in `mobile/assets/locales/`:
  - `fr.json` (French — default fallback locale)
  - `ar.json` (Arabic — RTL enabled)
  - `en.json` (English — LTR)
* Domain-specific tokens:
  - Minimum delivery price parameter: `20 MAD` formatted per locale currency rules.
  - Driver document requirement names: `CIN`, `Carte Grise`, `Assurance`, `Permis Professionnel`.

### 4.2 RTL Dynamic Layout Flipping
* When Arabic (`ar`) is initialized or selected, call `I18nManager.forceRTL(true)` and `I18nManager.allowRTL(true)`.
* When switching to French (`fr`) or English (`en`), call `I18nManager.forceRTL(false)`.
* React Native root component triggers seamless re-render upon locale change.

---

## 5. Acceptance Criteria (Gherkin)

```gherkin
Scenario: Changing active language to Arabic activates RTL layout
  Given the mobile application is running in French (LTR)
  When the user selects "Arabic" language
  Then react-i18next switches the active locale to "ar"
  And I18nManager.forceRTL(true) is invoked
  And screen layouts flip to Right-To-Left text and flex direction

Scenario: Fallback resolution for missing keys
  Given a missing string key in English dictionary
  When the application requests translation for that key
  Then react-i18next falls back to the default French string definition
```
