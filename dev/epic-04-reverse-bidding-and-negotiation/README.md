# Epic 04: Reverse Bidding & Negotiation Engine

**Epic ID:** `EPIC-04`
**Title:** Reverse Bidding Engine, Real-Time Streaming & Concurrency Control
**Priority:** P0 (Core Differentiator)
**Target Release:** MVP Sprint 3

---

## 1. Executive Summary
The reverse bidding and negotiation engine forms the core P2P marketplace mechanism of inHaz. It allows active drivers within a matching geographic radius and vehicle type to view open delivery requests and submit competitive bids or quick counter-offers. All bids and price updates stream in real-time to clients with under 200ms latency via Laravel Reverb WebSockets. When a client accepts an offer, an atomic database transaction with `lockForUpdate()` locks the delivery request, assigns the driver, updates status to matched, and automatically rejects all competing active bids.

---

## 2. Included User Stories

| Story ID | Title | Summary | Priority |
| :--- | :--- | :--- | :--- |
| **US-401** | [Driver Nearby Request Feed & Quick Bidding](us-401-driver-nearby-request-feed-and-quick-bidding/README.md) | Driver feed of nearby requests with map/list toggle, radius filtering, and quick counter buttons. | P0 |
| **US-402** | [Client Realtime Offer Stream & Acceptance Locking](us-402-client-realtime-offer-stream-and-acceptance-locking/README.md) | Real-time stacked offer stream via Laravel Reverb with atomic offer acceptance and row locking. | P0 |
| **US-403** | [Counter-Offer Negotiation Flow](us-403-counter-offer-negotiation-flow/README.md) | Multi-round counter-price bidding and driver detail verification before offer commitment. | P1 |

---

## 3. Epic Acceptance Criteria
*   Bids stream to client within <200ms latency using Laravel Reverb WebSockets and Laravel Echo client subscriptions.
*   Drivers can submit exact prices or quick percentage counters (+10%, +20%) subject to the 20 MAD minimum price rule.
*   Accepting an offer executes inside an atomic `DB::transaction()` utilizing `lockForUpdate()` to prevent race conditions.
*   Upon offer acceptance, competing active offers for the same delivery request are automatically set to rejected status.
*   Full multi-round counter-offer negotiation updates bid history transparently for both client and driver.
