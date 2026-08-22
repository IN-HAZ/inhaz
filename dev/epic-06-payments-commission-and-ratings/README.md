# Epic 06: Payments, Commission & Ratings System

**Epic ID:** `EPIC-06`
**Title:** Cash-on-Delivery Handshake, Platform Commission Ledger & Rating System
**Priority:** P0 (Core Operations)
**Target Release:** MVP Sprint 3

---

## 1. Executive Summary
This epic covers the financial and governance mechanisms of inHaz: handling Cash-on-Delivery (COD) handshakes between client and driver, snapshotting platform commission percentages, updating driver commission balances, enforcing maximum debt thresholds (200 MAD limit), collecting 1-5 star ratings, and processing dispute complaints.

---

## 2. Included User Stories

| Story ID | Title | Summary | Priority |
| :--- | :--- | :--- | :--- |
| **US-601** | [Cash-on-Delivery Handshake](us-601-cash-on-delivery-handshake-and-receipt/overview.md) | COD handshake screen showing exact cash amount to be handed to driver. | P0 |
| **US-602** | [Commission Ledger & Driver Balance](us-602-platform-commission-ledger-and-driver-balance/overview.md) | Automated commission fee deduction logging and 200 MAD driver debt gating. | P0 |
| **US-603** | [Post-Trip Ratings & Disputes](us-603-post-trip-ratings-and-dispute-filing/overview.md) | 1-5 star rating submission, driver average recalculation, and dispute filing. | P1 |

---

## 3. Epic Acceptance Criteria
*   Driver collects exact agreed cash price upon delivery completion.
*   Platform commission (e.g. 12.5%) is calculated and added to `driver_profiles.commission_balance`.
*   Drivers exceeding 200 MAD debt are blocked from toggling `is_online = true`.
*   Post-trip ratings update driver aggregate average score automatically.
