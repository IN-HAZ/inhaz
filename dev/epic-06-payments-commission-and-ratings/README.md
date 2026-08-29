# Epic 06: Payments, Commission & Ratings System

**Epic ID:** `EPIC-06`
**Title:** Cash-on-Delivery Handshake, Platform Commission Ledger & Rating System
**Priority:** P0 (Core Operations)
**Target Release:** MVP Sprint 4

---

## 1. Executive Summary
This epic defines the payment execution, platform commission accounting, digital receipts, driver debt enforcement, and post-trip quality rating mechanisms for inHaz built on Laravel 13 REST API backend and Expo SDK 57 React Native app. It mandates Cash-on-Delivery (COD) handshakes, automatically calculates and records platform commission (default 12.5%) into an immutable ledger, enforces a strict 200 MAD driver debt threshold gating driver online availability, provides post-trip digital transaction receipts, and handles two-step ratings and dispute complaint filing.

---

## 2. Included User Stories

| Story ID | Title | Summary | Priority |
| :--- | :--- | :--- | :--- |
| **US-601** | [Cash-on-Delivery Handshake & Digital Receipt](us-601-cash-on-delivery-handshake-and-receipt/README.md) | Cash-on-delivery handshake UI, payment confirmation, and post-trip digital receipt generation. | P0 |
| **US-602** | [Platform Commission Ledger & Driver Balance](us-602-platform-commission-ledger-and-driver-balance/README.md) | Automated commission fee ledger deduction, net balance tracking, and 200 MAD driver debt gating. | P0 |
| **US-603** | [Post-Trip Ratings & Dispute Filing](us-603-post-trip-ratings-and-dispute-filing/README.md) | Two-step dark rating bottom sheet (1-5 stars) and category-based dispute filing with cargo photos. | P1 |
| **US-604** | [Payment Method Selection Screen](us-604-payment-method-selection/README.md) | Profile settings payment method selection screen with active COD mode and disabled card/wallet stubs. | P1 |

---

## 3. Epic Acceptance Criteria
* Driver collects exact agreed cash price upon delivery completion and both client and driver receive downloadable/viewable digital receipts.
* Platform commission (default 12.5%) is calculated and recorded in `commission_ledgers` upon trip delivery, updating `driver_profiles.commission_balance`.
* Drivers with `commission_balance > 200 MAD` are blocked from toggling `is_online = true` and receive a debt threshold warning badge.
* Post-trip rating workflow captures 1-5 star feedback, updates driver aggregate rating, and allows dispute submission with photo upload to S3/Laravel Filesystem.
* Payment method selection defaults to Cash-on-Delivery for MVP with clear visual indicators for coming-soon digital payment options.
