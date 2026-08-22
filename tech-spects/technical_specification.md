# inHaz — Technical Specification Document

**Version:** 1.0.0
**Project:** inHaz – Urban On-Demand Logistics Platform
**Architecture:** React Native (Mobile) + Laravel (Backend/API) + Filament (Admin)

---

## 1. Executive Summary & Vision
inHaz is a peer-to-peer (B2C/C2C) urban logistics platform designed to connect individuals who need to transport bulky items (furniture, appliances, etc.) with independent drivers operating suitable vehicles (triporteurs, vans, small trucks).

The core differentiator of inHaz is its **reverse-bidding negotiation system**, similar to inDrive, allowing clients and drivers to directly agree on a fair price for transport. The platform facilitates the connection, provides real-time tracking, ensures safety through document verification, and takes a minimal commission to maintain competitive pricing.

## 2. Technical Stack
Although originally conceptualized with a BaaS approach, the infrastructure has been solidified around a robust, custom-built **Laravel** ecosystem to handle complex relational data, precise API control, and custom business logic.

*   **Mobile Application (Client & Driver):** 
    *   Framework: React Native with Expo
    *   Styling: NativeWind (Tailwind CSS)
    *   State Management: Zustand or Redux Toolkit
*   **Backend & API:**
    *   Framework: Laravel (PHP)
    *   Database: Relational DB (PostgreSQL/MySQL) via Eloquent ORM
    *   Authentication: Laravel Sanctum (Token-based)
    *   Real-time Communication: Laravel Reverb or Pusher (WebSockets) via Laravel Echo
*   **Admin Dashboard:**
    *   Framework: Filament (Laravel/Livewire based) for rapid, server-rendered CRUD management.

## 3. Core Domain Entities & Data Model
The system relies on a set of normalized entities handling users, logistics, and real-time negotiations.

*   **User & Profiles:** A unified User entity handles core authentication (via Phone OTP). Users can have dual roles represented by `CustomerProfile` and `DriverProfile`.
*   **Driver Assets:** Drivers are linked to `Vehicle` entities (triporteur, van, truck) and `DriverDocument` entities (ID, vehicle registration, insurance) which require admin validation.
*   **Delivery Requests:** Created by clients, storing origin, destination, intermediate stops (`RequestStop`), photos (`RequestPhoto`), and a proposed price.
*   **Offers & Negotiation:** Drivers bid on open requests by submitting an `Offer`. A request can have multiple offers, but only one can be accepted.
*   **Trips:** Generated when an offer is accepted. Tracks the live execution of the delivery (in transit, completed, cancelled).
*   **Ratings & Reviews:** Post-trip feedback linked to the completed trip.

## 4. Key Workflows & State Machines

### 4.1 Authentication & Role Switching
Users authenticate exclusively via a secure OTP (One-Time Password) sent to their phone numbers. The system issues a secure API token (via Sanctum) upon successful verification. Users default to the Client role but can toggle to Driver mode, provided their documents have been submitted and approved by an administrator.

### 4.2 Request Creation (Client Flow)
1.  The client selects pickup and drop-off locations (using Google Maps integration).
2.  Provides item descriptions, optional photos, and selects a vehicle category.
3.  Proposes an initial price (which can be guided by a distance-based calculation).
4.  The request enters the `OPEN` state and is broadcast to nearby eligible drivers.

### 4.3 Bidding & Negotiation (Driver Flow)
1.  Drivers receive real-time notifications of nearby open requests.
2.  A driver can view the request details and submit an `Offer` (accepting the client's price or proposing a higher one).
3.  The request enters the `NEGOTIATING` state.
4.  The client views all incoming offers in real-time, comparing prices, driver ratings, and vehicle types.
5.  When the client accepts an offer, all other offers are automatically rejected, and a `Trip` is created. 

### 4.4 Trip Execution & Real-Time Tracking
1.  The Trip enters the `IN_TRANSIT` state.
2.  The driver utilizes integrated navigation to reach the pickup and drop-off points.
3.  The client views the driver's live location on a map via WebSocket broadcasts.
4.  In-app chat is unlocked, allowing direct text/photo communication between the client and the driver.
5.  Upon delivery, the driver marks the trip as `COMPLETED`.
6.  The client pays the driver in cash, and both parties can submit a `Rating`.

## 5. Integrations & External Services
*   **Geolocation & Mapping:** Google Maps API (Places Autocomplete, Geocoding, Distance Matrix, and Maps SDK) for address selection, route calculation, and live tracking.
*   **SMS Gateway:** Third-party provider (e.g., Twilio, MessageBird) for delivering OTP codes.
*   **Cloud Storage:** S3-compatible storage (via Laravel Filesystem) for securely storing package photos and sensitive driver verification documents.
*   **Push Notifications:** Expo Push Notification Services for alerts regarding new requests, offers, and chat messages.

## 6. Admin Panel (Filament)
The back-office is securely isolated and accessible only to administrators, featuring:
*   **Dashboard & Analytics:** High-level metrics on active trips, revenue (commission calculations), and user growth.
*   **User & Driver Management:** Interfaces to suspend accounts, review ratings, and handle disputes.
*   **Document Verification:** A dedicated pipeline for admins to review and approve/reject driver submitted documents (CIN, carte grise, etc.).
*   **Operational Control:** Ability to manually intervene in active trips, resolve complaints, and adjust system-wide settings (minimum price, commission rates).

## 7. UI/UX & Design Philosophy
The application adheres to the `inHaz Design System`, ensuring a premium, modern, and highly usable interface without relying on generic aesthetics.
*   **Visual Identity:** Deep dark modes (`Obsidian` backgrounds) contrasted with vibrant interactive elements (`Electric Purple`).
*   **Status Signifiers:** Clear color-coded badges for request statuses (Blue for Open, Purple for Negotiating, Orange for In-Transit, Green for Delivered).
*   **Ergonomics:** Large, accessible touch targets designed for one-handed operation (crucial for drivers on the road). Bottom-sheet architectures for rapid data entry and bidding.
*   **Micro-interactions:** Real-time countdown timers for bids, haptic feedback on chat messages, and smooth map marker animations.

## 8. Security & Performance
*   **Endpoint Security:** All API endpoints are protected by token authentication and Laravel Policies to ensure users can only access their own data.
*   **Transactional Integrity:** Critical state changes (like accepting an offer) are wrapped in database transactions with row-level locking to prevent race conditions (e.g., two drivers being accepted for the same request).
*   **Real-time Optimization:** Driver location updates are throttled and broadcast via WebSockets to minimize database write-load while maintaining a smooth client-side experience.
