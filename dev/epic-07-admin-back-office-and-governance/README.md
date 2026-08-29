# Epic 07: Admin Back-Office & Governance (Filament)

**Epic ID:** `EPIC-07`
**Title:** Back-Office Operations, User Management, Dispute Resolution & System Configuration
**Priority:** P1 (Operations)
**Target Release:** MVP Sprint 5

---

## 1. Executive Summary
This epic covers administration and back-office governance using **Filament v5** on Laravel 13. It enables administrators to authenticate via 2-Factor Authentication (2FA), inspect user profiles and driver verification documents (CIN, carte grise, assurance, permis professionnel), block/unblock accounts, process commission settlements and manual balance overrides, resolve disputes via full trip chat transcript logs, and configure global system parameters (pricing grid per km, 20 MAD minimum price floor, platform commission rates, active cities, vehicle types, and CMS pages/FAQs).

---

## 2. Included User Stories

| Story ID | Title | Summary | Priority |
| :--- | :--- | :--- | :--- |
| **US-701** | [Admin 2-Factor Authentication (2FA) Login](us-701-admin-2fa-login/README.md) | Multi-factor authentication for Filament admin panel supporting TOTP and SMS 2FA verification. | P1 |
| **US-702** | [Filament User & Driver Management](us-702-filament-user-and-driver-management/README.md) | User search, account block/unblock, driver earnings/debt balance inspection, and manual commission settlement override. | P1 |
| **US-703** | [Filament Complaint & Dispute Resolution](us-703-filament-complaint-and-dispute-resolution/README.md) | Inspect complaint queue, chat transcripts, package damage photos, and record dispute resolutions. | P1 |
| **US-704** | [Filament System Settings & Content Management](us-704-filament-system-settings-and-pricing-grid/README.md) | Parameter settings for pricing grid, 20 MAD min base price, commission rate, active cities, vehicle types, CMS content pages, and FAQs. | P2 |

---

## 3. Epic Acceptance Criteria
* Admin users must complete 2FA authentication (TOTP or SMS code) to access Filament back-office (`/admin`).
* Admin can block/unblock user accounts and perform manual driver commission balance adjustments.
* Admin can inspect full trip chat logs and uploaded damage photos when resolving customer complaints.
* System pricing grid (per-km rates, 20 MAD minimum base price), platform commission percentage, active cities, vehicle types, CMS content pages, and FAQ items can be edited via Filament settings without code redeployments.
