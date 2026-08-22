# Epic 05: Trip Execution, Tracking & In-App Chat

**Epic ID:** `EPIC-05`
**Title:** Trip Execution Milestones, Real-Time GPS Tracking & In-App Chat
**Priority:** P0 (Core Functionality)
**Target Release:** MVP Sprint 3

---

## 1. Executive Summary
Once an offer is accepted, the system orchestrates live trip execution. Drivers step through delivery milestones (`heading_to_pickup` $\rightarrow$ `arrived_pickup` $\rightarrow$ `cargo_collected` $\rightarrow$ `en_route` $\rightarrow$ `delivered`). Clients track driver GPS location in real time via WebSockets and communicate via an integrated chat thread.

---

## 2. Included User Stories

| Story ID | Title | Summary | Priority |
| :--- | :--- | :--- | :--- |
| **US-501** | [Trip Status Milestone Stepper](us-501-trip-status-milestone-stepper/overview.md) | Driver status progression stepper buttons with automated client notifications. | P0 |
| **US-502** | [Realtime Driver GPS Tracking Map](us-502-realtime-driver-gps-tracking-map/overview.md) | GPS pings cached in Redis and streamed to client map via Echo WebSockets. | P0 |
| **US-503** | [In-App Trip Chat & Media](us-503-in-app-trip-chat-and-media/overview.md) | Scoped real-time chat between client and driver with photo attachments. | P1 |

---

## 3. Epic Acceptance Criteria
*   Driver updates trip status sequentially; out-of-order state transitions are rejected.
*   Driver location pings every 5 seconds, cached in Redis and broadcast via WebSockets.
*   Client map renders animated marker interpolation without database ping overload.
*   Chat messaging opens on offer acceptance and locks read-only 2h post-delivery.
