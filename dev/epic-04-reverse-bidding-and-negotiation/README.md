# Epic 04: Reverse Bidding & Negotiation Engine

**Epic ID:** `EPIC-04`
**Title:** Reverse Bidding Engine, Real-Time Streaming & Concurrency Control
**Priority:** P0 (Core Differentiator)
**Target Release:** MVP Sprint 2

---

## 1. Executive Summary
The reverse-bidding engine is the core differentiator of inHaz. It allows online drivers to view nearby requests, accept proposed prices, or submit counter-offers (+10%, +20%, custom price). Bids stream in real-time to the client via WebSockets. When a client accepts an offer, an atomic database transaction locks the request and rejects competing bids.

---

## 2. Included User Stories

| Story ID | Title | Summary | Priority |
| :--- | :--- | :--- | :--- |
| **US-401** | [Driver Nearby Request Feed & Quick Bidding](us-401-driver-nearby-request-feed-and-quick-bidding/overview.md) | Driver feed of nearby requests with one-handed quick counter buttons (+10%, +20%). | P0 |
| **US-402** | [Client Realtime Stream & Offer Acceptance](us-402-client-realtime-offer-stream-and-acceptance-locking/overview.md) | Real-time WebSocket bid stack for clients with atomic offer acceptance and row locking. | P0 |
| **US-403** | [Counter-Offer Negotiation Flow](us-403-counter-offer-negotiation-flow/overview.md) | Multi-round counter-price bidding between client and driver. | P1 |

---

## 3. Epic Acceptance Criteria
*   Drivers see open requests within 15km radius matching their vehicle type.
*   Bids stream to client within <200ms via WebSockets (`Laravel Reverb`).
*   Accepting an offer executes inside `DB::transaction()` with `lockForUpdate()`.
*   Competing bids are automatically rejected upon offer acceptance.
