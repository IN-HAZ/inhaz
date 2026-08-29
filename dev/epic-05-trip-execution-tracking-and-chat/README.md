# Epic 05: Trip Execution, Real-Time Tracking & Chat

**Epic ID:** `EPIC-05`
**Title:** Trip Execution, Milestone Stepper, GPS Tracking & In-App Chat
**Priority:** P0 (Core Operations)
**Target Release:** MVP Sprint 3

---

## 1. Executive Summary
This epic manages the execution phase of an active delivery trip following offer acceptance. It provides a 5-stage sequential milestone status stepper, real-time GPS tracking with 5-second location pings streamed via Redis + Laravel Reverb WebSockets to an interactive map canvas, and in-app trip messaging with image attachment support. The chat feature automatically opens upon match confirmation and locks to read-only status 2 hours post-delivery.

---

## 2. Included User Stories

| Story ID | Title | Summary | Priority |
| :--- | :--- | :--- | :--- |
| **US-501** | [Trip Status Milestone Stepper](us-501-trip-status-milestone-stepper/README.md) | Vertical 5-stage milestone stepper (`heading_to_pickup` -> `delivered`) with active/completed styling. | P0 |
| **US-502** | [Realtime Driver GPS Tracking Map](us-502-realtime-driver-gps-tracking-map/README.md) | Split-screen map interface with animated driver marker driven by 5s Redis + Reverb pings. | P0 |
| **US-503** | [In-App Trip Chat & Media](us-503-in-app-trip-chat-and-media/README.md) | Real-time chat bubbles, photo proof upload, system event pills, and 2-hour post-delivery read-only lock. | P1 |

---

## 3. Epic Acceptance Criteria
*   Driver transitions trip strictly through 5 sequential milestones (`heading_to_pickup` -> `arrived_pickup` -> `cargo_collected` -> `en_route` -> `delivered`).
*   Driver GPS coordinates post every 5 seconds, stored in Redis, and broadcast over WebSockets via Laravel Reverb.
*   Client map smoothly interpolates driver marker movement between location updates.
*   In-app messaging allows sending text and photo proof via S3 storage, automatically locking to read-only 2 hours after delivery.
