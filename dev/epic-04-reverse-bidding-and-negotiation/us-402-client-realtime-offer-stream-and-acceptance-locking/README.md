# User Story: US-402 — Client Realtime Offer Stream & Acceptance Locking

**Story ID:** `US-402`
**Epic:** [EPIC-04: Reverse Bidding & Negotiation Engine](../overview.md)
**Role:** Client
**Priority:** P0

---

## 1. Implementation Status Audit
*   **Backend (`backend/`):** **PARTIALLY IMPLEMENTED**. `OfferController@accept` handles offer acceptance (`POST /v1/offers/{id}/accept`). However, real-time WebSocket event broadcasting (`Laravel Reverb`) needs to be fully wired up.
*   **Mobile (`mobile/`):** **NEEDS DESIGN SYSTEM UI ALIGNMENT**. Incoming bid stream in `app/requests/` needs to apply the Live Incoming Bids Stack, 60s circular timer, and Status Chips.

---

## 2. Design System Application & UI Specs
Per `tech-spects/design_system.md`:
*   **Status Chip Mapping:**
    *   `negotiating`: Background `#F2E8FD`, Text `#7928CA`, Border `#D6B5F7`.
*   **Incoming Offer Card:**
    *   Driver rating badge with star icon (e.g., `⭐ 4.9`).
    *   Vehicle badge tag: `🛵 Triporteur` (`#0066FF`) or `🚐 Camionnette` (`#FF8800`).
    *   Monospace Price tag: 28px bold `font-mono` (`80 MAD`).
    *   Accept CTA: Electric Purple (`bg-inhaz-purple`).
*   **60-Second Bid Timer:** Circular progress countdown indicator around each incoming bid.

---

## 3. Acceptance Criteria

```gherkin
Scenario: Client accepts streamed bid with Design System feedback
  Given I am watching the negotiating screen with purple status chip (#7928CA)
  When a new offer card arrives displaying "80 MAD" with 60-second bid timer
  And I tap "ACCEPT" (bg-inhaz-purple)
  Then Haptic feedback triggers (Medium Impact)
  And status changes to "in_progress" (Orange status badge)
```
