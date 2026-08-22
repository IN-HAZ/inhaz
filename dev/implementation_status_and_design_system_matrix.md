# inHaz — Implementation Status & Design System Mapping Matrix

**Document Purpose:** Comprehensive audit mapping existing codebase implementations (`backend` & `mobile`) against the Agile Epics and applying the inHaz Design System (`design_system.md`).

---

## 1. Implementation Status Audit (Backend & Mobile)

| Epic ID & Name | Backend Status (`backend/`) | Mobile App Status (`mobile/`) | Gaps & Next Steps |
| :--- | :--- | :--- | :--- |
| **EPIC-01: Core Infra & Auth** | **80% Complete** (`AuthController`, `otps`, `users`) | **50% Complete** (`app/auth/` routes present) | Integrate `inhaz-purple` (`#7928CA`) & 6-digit monospace OTP inputs into mobile UI. |
| **EPIC-02: Driver Onboarding** | **70% Complete** (`DriverController`, `DriverVerificationController`) | **40% Complete** (`app/driver/` document upload screens) | Connect mobile upload screens to S3 storage bucket; establish Filament v5 document gallery. |
| **EPIC-03: Request Creation & Geo** | **85% Complete** (`DeliveryRequestController`, `RequestPhotoController`) | **60% Complete** (`app/requests/` creation routes) | Apply Reverse-Bidding Bottom Sheet (24px radius) & `PriceStepper` UI component in mobile app. |
| **EPIC-04: Reverse-Bidding Engine** | **75% Complete** (`OfferController` store, list, accept, reject) | **50% Complete** (Feed & bidding screens present) | Wire up real-time WebSockets (`Laravel Reverb`) & apply Quick Counter Buttons (`+10%`, `+20%`). |
| **EPIC-05: Trip Execution & Tracking** | **70% Complete** (`TripController` status transitions) | **40% Complete** (`app/trips/` active trip views) | Implement Redis 5s GPS location caching & Echo map marker interpolation; integrate chat thread. |
| **EPIC-06: Payments & Ratings** | **60% Complete** (`TripController` rating & transition) | **30% Complete** (Rating screens needed) | Render Cash Handshake Floating Banner (`#00C853`); enforce 200 MAD driver debt threshold gating. |
| **EPIC-07: Admin Governance** | **30% Complete** (Basic REST routes in `DriverVerificationController`) | N/A (Web Back-Office) | Build full Filament v5 Panel with dark sidebar (`#100D14`), 2FA, and System Settings page. |

---

## 2. Design System Application Across User Stories

The **inHaz Design System** (`tech-spects/design_system.md`) has been directly configured into the project assets:
*   `mobile/tailwind.config.js`: Configured with `inhaz.purple` (`#7928CA`), `inhaz.dark` (`#100D14`), `inhaz.surface` (`#F7F6FA`), status badge colors, custom radii (`rounded-sheet`: 24px, `rounded-control`: 12px), and monospace typography (`JetBrainsMono`).
*   `mobile/constants/Colors.ts`: Updated with light/dark brand tokens.

### Key Visual Component Contracts

1.  **Primary CTA Button:** `bg-inhaz-purple` (`#7928CA`), `rounded-control` (12px), 16px bold white text.
2.  **Reverse-Bidding Bottom Sheet:** `rounded-sheet` (24px top radius), sliding over Google Maps view.
3.  **Price Stepper:** Monospace price display (`3xl font-mono`) flanked by `-10` (white card) and `+10` (`bg-inhaz-purple`) buttons.
4.  **Driver One-Handed Bidding:** High-contrast `● ONLINE` status pill, dark counter buttons (`bg-inhaz-dark`), quick increments (`+10%`, `+20%`).
5.  **Cash Handshake Banner:** Floating banner with green border (`#00C853`) and light green background tint (`#E6F9EE`).
6.  **Status Chips:**
    *   `open`: Text `#0066FF`, Background `#EBF3FF`, Border `#B3D4FF`.
    *   `negotiating`: Text `#7928CA`, Background `#F2E8FD`, Border `#D6B5F7`.
    *   `in_progress`: Text `#FF8800`, Background `#FFF4E5`, Border `#FFCD99`.
    *   `delivered`: Text `#00C853`, Background `#E6F9EE`, Border `#99E8B8`.
    *   `cancelled`: Text `#E53935`, Background `#FDECEA`, Border `#F7A8A3`.
