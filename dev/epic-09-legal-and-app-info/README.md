# Epic 09: Legal & App Information Screens

**Epic ID:** `EPIC-09`
**Title:** Legal Compliance, Terms of Service, App Info & Help Centre
**Priority:** P1 (Compliance)
**Target Release:** MVP Sprint 5

---

## 1. Executive Summary
This epic handles legal transparency, static information screens, terms of service, and user support resources within the inHaz mobile app (Expo SDK 57). It delivers dynamic content rendering for Privacy Policy & Terms of Service (US-901), company mission and app version info (US-902), and an interactive categorized FAQ Help Centre (US-903) powered by dynamic REST API endpoints from Laravel 13.

---

## 2. Included User Stories

| Story ID | Title | Summary | Priority |
| :--- | :--- | :--- | :--- |
| **US-901** | [Privacy Policy & Terms Screen](us-901-privacy-policy-screen/README.md) | Dynamic Privacy Policy and Terms of Service screen rendering scrollable markdown from Laravel API. | P1 |
| **US-902** | [About inHaz Screen](us-902-about-inhaz-screen/README.md) | Application version details, mission statement, contact support email, and social links screen. | P2 |
| **US-903** | [Help Centre & FAQ Screen](us-903-help-centre-screen/README.md) | Accordion list of categorized FAQ items (Client, Driver, Payments, Account) fetched from API. | P1 |

---

## 3. Epic Acceptance Criteria
* Users can view Privacy Policy & Terms of Service rendered as smooth scrollable markdown in dark mode (`#100D14`).
* App details, version numbers, contact emails, and social links are accessible from Profile > About inHaz.
* Help Centre displays expandable FAQ accordions filtered by categories (Client, Driver, Payments, Account) updated dynamically from backend API.
* All legal and help screens support multi-language switching (French default, Arabic RTL, English).
