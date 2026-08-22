# Epic 07: Admin Back-Office & Governance (Filament)

**Epic ID:** `EPIC-07`
**Title:** Back-Office Operations, User Management, Dispute Resolution & System Configuration
**Priority:** P1 (Operations)
**Target Release:** MVP Sprint 4

---

## 1. Executive Summary
This epic covers back-office operations using **Filament v5**: managing user accounts, blocking/unblocking accounts, resolving customer complaints via full chat transcript inspection, settling driver commission fees, and configuring global system parameters (pricing grid per km, commission percentages).

---

## 2. Included User Stories

| Story ID | Title | Summary | Priority |
| :--- | :--- | :--- | :--- |
| **US-701** | [Filament User & Driver Management](us-701-filament-user-and-driver-management/overview.md) | User search, block/unblock, and driver commission settlement actions. | P1 |
| **US-702** | [Filament Complaint & Dispute Resolution](us-702-filament-complaint-and-dispute-resolution/overview.md) | Inspect complaint queue, chat transcripts, package photos, and issue resolutions. | P1 |
| **US-703** | [Filament System Settings & Pricing Grid](us-703-filament-system-settings-and-pricing-grid/overview.md) | Platform parameters page for updating commission rates, min prices, and per-km pricing grids. | P2 |

---

## 3. Epic Acceptance Criteria
*   Admin can block/unblock user accounts in Filament panel.
*   Admin can inspect full trip chat logs when resolving complaints.
*   Updating commission rate on System Settings page does NOT retroactively affect existing completed trip records.
