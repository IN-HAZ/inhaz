# inHAZ — User Stories & Implementation Status Matrix

**Repository:** `inHAZ` (P2P Urban Freight Platform — Morocco)  
**Last Updated:** 2026-09-02 18:10:00  
**Total Epics:** 10  
**Total User Stories:** 39  

---

## 📊 1. Overall Implementation Summary

| Status | Count | Percentage | Definition |
| :--- | :---: | :---: | :--- |
| 🟢 **`done`** | **17** | **43.6%** | End-to-end implemented (backend API, mobile UI / Filament admin, unit/feature tests passing). |
| 🟡 **`done_partial`** | **10** | **25.6%** | Backend or Mobile foundation exists; full feature parity, UI screens, or integrations pending. |
| 🔴 **`todo`** | **12** | **30.8%** | Spec defined; implementation not yet started or screen placeholder only. |
| ⚪ **`blocked`** | **0** | **0.0%** | Hard blocker prevents implementation. |

---

## 🗺️ 2. Epics Status Overview

| Epic ID | Title | Priority | Total US | 🟢 Done | 🟡 Partial | 🔴 Todo |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **EPIC-01** | [Core Infrastructure & Authentication](#epic-01-core-infrastructure--authentication) | P0 | 6 | 4 | 1 | 1 |
| **EPIC-02** | [Driver Onboarding & Verification](#epic-02-driver-onboarding--verification) | P0 | 5 | 5 | 0 | 0 |
| **EPIC-03** | [Request Creation & Geospatial](#epic-03-request-creation--geospatial) | P0 | 4 | 1 | 2 | 1 |
| **EPIC-04** | [Reverse Bidding & Negotiation](#epic-04-reverse-bidding--negotiation) | P0 | 3 | 2 | 1 | 0 |
| **EPIC-05** | [Trip Execution, Tracking & Chat](#epic-05-trip-execution-tracking--chat) | P0 | 3 | 1 | 1 | 1 |
| **EPIC-06** | [Payments, Commission & Ratings](#epic-06-payments-commission--ratings) | P1 | 4 | 2 | 2 | 0 |
| **EPIC-07** | [Admin Back-Office & Governance](#epic-07-admin-back-office--governance) | P1 | 4 | 1 | 1 | 2 |
| **EPIC-08** | [Database Foundation & Integrity](#epic-08-database-foundation--integrity) | P0 | 4 | 1 | 2 | 1 |
| **EPIC-09** | [Legal & App Info](#epic-09-legal--app-info) | P2 | 3 | 0 | 0 | 3 |
| **EPIC-10** | [Localisation & i18n](#epic-10-localisation--i18n) | P2 | 3 | 0 | 0 | 3 |
| **TOTAL** | | | **39** | **17** | **10** | **12** |

---

## 🔍 3. Detailed User Story Breakdown

---

### Epic 01: Core Infrastructure & Authentication
**Spec Folder:** [dev/epic-01-core-infra-and-auth](file:///home/bagi/Notes/dev/in-haz/dev/epic-01-core-infra-and-auth)

#### US-101: Phone OTP Authentication
* **State:** 🟢 `done`
* **Summary:** Passwordless 6-digit OTP request and verification over SMS for mobile user registration and login.
* **Related Files:**
  * Spec: [dev/epic-01-core-infra-and-auth/us-101-phone-otp-authentication/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-01-core-infra-and-auth/us-101-phone-otp-authentication/README.md)
  * Backend Controller: [backend/app/Http/Controllers/Api/V1/AuthController.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Http/Controllers/Api/V1/AuthController.php)
  * Backend Service: [backend/app/Services/AuthService.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Services/AuthService.php)
  * Backend Requests: [backend/app/Http/Requests/Api/V1/Auth/SendOtpRequest.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Http/Requests/Api/V1/Auth/SendOtpRequest.php), [backend/app/Http/Requests/Api/V1/Auth/VerifyOtpRequest.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Http/Requests/Api/V1/Auth/VerifyOtpRequest.php)
  * Backend Model & Command: [backend/app/Models/Otp.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Models/Otp.php), [backend/app/Console/Commands/PruneOtps.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Console/Commands/PruneOtps.php)
  * Backend Test: [backend/tests/Feature/Auth/OtpAuthenticationTest.php](file:///home/bagi/Notes/dev/in-haz/backend/tests/Feature/Auth/OtpAuthenticationTest.php)
  * Mobile Screens: [mobile/app/auth/login.tsx](file:///home/bagi/Notes/dev/in-haz/mobile/app/auth/login.tsx), [mobile/app/auth/otp.tsx](file:///home/bagi/Notes/dev/in-haz/mobile/app/auth/otp.tsx)
  * Mobile Store & Security: [mobile/lib/store/auth.ts](file:///home/bagi/Notes/dev/in-haz/mobile/lib/store/auth.ts), [mobile/lib/storage/secureStore.ts](file:///home/bagi/Notes/dev/in-haz/mobile/lib/storage/secureStore.ts), [mobile/lib/api/client.ts](file:///home/bagi/Notes/dev/in-haz/mobile/lib/api/client.ts), [mobile/lib/validation/auth.ts](file:///home/bagi/Notes/dev/in-haz/mobile/lib/validation/auth.ts)
* **Details & Status:** Fully implemented on backend and mobile. Upgraded with hardware enclave secure store token persistence (`expo-secure-store`), 401 response interceptor event listeners for automated session teardown, and Zod client-side validation for Moroccan phone numbers and 6-digit OTP codes.
* **Problems / Notes:** Production SMS Gateway driver (e.g., Twilio / Infobip) needs API key config in `.env`; local environment logs OTPs to Mailpit/database.

#### US-102: Sanctum Token & Session Management
* **State:** 🟢 `done`
* **Summary:** Bearer token generation on login, token validation middleware, and token revocation on logout.
* **Related Files:**
  * Spec: [dev/epic-01-core-infra-and-auth/us-102-sanctum-token-and-session-management/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-01-core-infra-and-auth/us-102-sanctum-token-and-session-management/README.md)
  * Backend Migration: [backend/database/migrations/2026_08_23_170003_create_personal_access_tokens_table.php](file:///home/bagi/Notes/dev/in-haz/backend/database/migrations/2026_08_23_170003_create_personal_access_tokens_table.php)
  * Mobile API Client: [mobile/lib/api/client.ts](file:///home/bagi/Notes/dev/in-haz/mobile/lib/api/client.ts)
  * Mobile Store: [mobile/lib/store/auth.ts](file:///home/bagi/Notes/dev/in-haz/mobile/lib/store/auth.ts)
* **Details & Status:** Full token lifecycle handling. Mobile Axios client injects `Authorization: Bearer <token>` header, handles 401 unauthenticated errors, and persists token securely using SecureStore.
* **Problems / Notes:** None.

#### US-103: Dual-Role Switching (Client / Driver)
* **State:** 🟢 `done`
* **Summary:** Allow users to seamlessly switch mode between Client (posting requests) and Driver (bidding on trips).
* **Related Files:**
  * Spec: [dev/epic-01-core-infra-and-auth/us-103-dual-role-switching-client-driver/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-01-core-infra-and-auth/us-103-dual-role-switching-client-driver/README.md)
  * Backend Endpoint: [backend/routes/api.php](file:///home/bagi/Notes/dev/in-haz/backend/routes/api.php) (`POST /api/v1/auth/switch-role`)
  * Backend Middleware: [backend/app/Http/Middleware/EnsureUserIsDriver.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Http/Middleware/EnsureUserIsDriver.php)
  * Backend Test: [backend/tests/Feature/Auth/RoleSwitchingTest.php](file:///home/bagi/Notes/dev/in-haz/backend/tests/Feature/Auth/RoleSwitchingTest.php)
  * Mobile Store & Layout: [mobile/lib/store/auth.ts](file:///home/bagi/Notes/dev/in-haz/mobile/lib/store/auth.ts), [mobile/app/(tabs)/_layout.tsx](file:///home/bagi/Notes/dev/in-haz/mobile/app/(tabs)/_layout.tsx)
* **Details & Status:** Backend validates driver verification status before allowing role switch to `driver`. Mobile app dynamically updates navigation tabs and context based on active role.
* **Problems / Notes:** None.

#### US-104: Personal Info Screen
* **State:** 🟡 `done_partial`
* **Summary:** View and edit personal profile information (name, email, read-only phone number).
* **Related Files:**
  * Spec: [dev/epic-01-core-infra-and-auth/us-104-personal-info-screen/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-01-core-infra-and-auth/us-104-personal-info-screen/README.md)
  * Backend Controller: [backend/app/Http/Controllers/Api/V1/AuthController.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Http/Controllers/Api/V1/AuthController.php) (`GET /me`, `PUT /me`)
  * Backend Request: [backend/app/Http/Requests/Api/V1/Profile/UpdateProfileRequest.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Http/Requests/Api/V1/Profile/UpdateProfileRequest.php)
  * Backend Test: [backend/tests/Feature/Auth/UserProfileTest.php](file:///home/bagi/Notes/dev/in-haz/backend/tests/Feature/Auth/UserProfileTest.php)
  * Mobile Profile Screen: [mobile/app/(tabs)/profile.tsx](file:///home/bagi/Notes/dev/in-haz/mobile/app/(tabs)/profile.tsx)
* **Details & Status:** Backend profile retrieval (`GET /me`) and update (`PUT /me`) endpoints are fully functional. Mobile app includes profile viewing and inline name/email editing on `mobile/app/(tabs)/profile.tsx`.
* **Problems / Notes:** Dedicated profile picture / avatar photo picker upload (`POST /api/v1/profile/avatar`) is pending implementation.

#### US-105: Profile Configuration Screen
* **State:** 🔴 `todo`
* **Summary:** Application configuration settings and push notification preference toggles.
* **Related Files:**
  * Spec: [dev/epic-01-core-infra-and-auth/us-105-profile-configuration-screen/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-01-core-infra-and-auth/us-105-profile-configuration-screen/README.md)
  * Mobile Placeholder: [mobile/app/(tabs)/two.tsx](file:///home/bagi/Notes/dev/in-haz/mobile/app/(tabs)/two.tsx)
* **Details & Status:** Spec defines toggles for push notifications (trip updates, promotional alerts) and theme settings.
* **Problems / Notes:** `mobile/app/(tabs)/two.tsx` is currently an unconfigured placeholder screen. Needs configuration UI layout.

#### US-106: Activity History Screen
* **State:** 🟢 `done`
* **Summary:** Timeline history of past delivery requests for clients and completed trips for drivers.
* **Related Files:**
  * Spec: [dev/epic-01-core-infra-and-auth/us-106-activity-history-screen/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-01-core-infra-and-auth/us-106-activity-history-screen/README.md)
  * Backend Controllers: [backend/app/Http/Controllers/Api/V1/DeliveryRequestController.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Http/Controllers/Api/V1/DeliveryRequestController.php), [backend/app/Http/Controllers/Api/V1/TripController.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Http/Controllers/Api/V1/TripController.php)
  * Mobile Client Requests Screen: [mobile/app/requests/index.tsx](file:///home/bagi/Notes/dev/in-haz/mobile/app/requests/index.tsx)
  * Mobile Driver Trips Screen: [mobile/app/trips/index.tsx](file:///home/bagi/Notes/dev/in-haz/mobile/app/trips/index.tsx)
* **Details & Status:** Both client requests history and driver trip history list screens are implemented with pull-to-refresh, status tab filters (active vs history), and route navigation.
* **Problems / Notes:** None.

---

### Epic 02: Driver Onboarding & Verification
**Spec Folder:** [dev/epic-02-driver-onboarding-and-verification](file:///home/bagi/Notes/dev/in-haz/dev/epic-02-driver-onboarding-and-verification)

#### US-201: Driver Document Upload (Mobile)
* **State:** 🟢 `done`
* **Summary:** Driver mobile document upload for CIN (ID), Driving License, Vehicle Registration, and Insurance, plus vehicle detail entry.
* **Related Files:**
  * Spec: [dev/epic-02-driver-onboarding-and-verification/us-201-driver-document-upload-mobile/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-02-driver-onboarding-and-verification/us-201-driver-document-upload-mobile/README.md)
  * Backend Controllers: [backend/app/Http/Controllers/Api/V1/DriverVerificationController.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Http/Controllers/Api/V1/DriverVerificationController.php), [backend/app/Http/Controllers/DocumentController.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Http/Controllers/DocumentController.php)
  * Backend Models: [backend/app/Models/DriverDocument.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Models/DriverDocument.php), [backend/app/Models/Vehicle.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Models/Vehicle.php)
  * Backend Test: [backend/tests/Feature/Driver/DriverOnboardingTest.php](file:///home/bagi/Notes/dev/in-haz/backend/tests/Feature/Driver/DriverOnboardingTest.php)
  * Mobile Screens: [mobile/app/driver/onboarding.tsx](file:///home/bagi/Notes/dev/in-haz/mobile/app/driver/onboarding.tsx), [mobile/app/driver/documents/upload.tsx](file:///home/bagi/Notes/dev/in-haz/mobile/app/driver/documents/upload.tsx), [mobile/app/driver/vehicle.tsx](file:///home/bagi/Notes/dev/in-haz/mobile/app/driver/vehicle.tsx)
* **Details & Status:** Document upload API with validation (PDF, JPEG, PNG, max 10MB), secure streaming endpoint (`GET /api/v1/driver/documents/{id}/view`), vehicle creation, and step-by-step mobile UI flow.
* **Problems / Notes:** None.

#### US-202: Driver Pending Validation Screen
* **State:** 🟢 `done`
* **Summary:** Status screen for drivers waiting for document verification or rejected accounts.
* **Related Files:**
  * Spec: [dev/epic-02-driver-onboarding-and-verification/us-202-driver-pending-validation-screen/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-02-driver-onboarding-and-verification/us-202-driver-pending-validation-screen/README.md)
  * Backend Enum: [backend/app/Enums/DriverProfileStatus.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Enums/DriverProfileStatus.php)
  * Mobile Screen: [mobile/app/driver/onboarding.tsx](file:///home/bagi/Notes/dev/in-haz/mobile/app/driver/onboarding.tsx)
* **Details & Status:** Mobile onboarding screen checks driver status (`PENDING`, `APPROVED`, `REJECTED`), displays warning banner, and blocks marketplace access until approved.
* **Problems / Notes:** None.

#### US-203: Admin Document Inspection & Approval (Filament)
* **State:** 🟢 `done`
* **Summary:** Admin web portal interface to inspect uploaded driver documents and approve/reject driver profiles.
* **Related Files:**
  * Spec: [dev/epic-02-driver-onboarding-and-verification/us-203-admin-document-inspection-and-approval-filament/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-02-driver-onboarding-and-verification/us-203-admin-document-inspection-and-approval-filament/README.md)
  * Filament Resources: [backend/app/Filament/Resources/DriverProfileResource.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Filament/Resources/DriverProfileResource.php), [backend/app/Filament/Resources/DriverDocumentResource.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Filament/Resources/DriverDocumentResource.php)
  * Filament Relation Manager: [backend/app/Filament/Resources/DriverProfileResource/RelationManagers/DocumentsRelationManager.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Filament/Resources/DriverProfileResource/RelationManagers/DocumentsRelationManager.php)
  * Backend Test: [backend/tests/Feature/Driver/DriverVerificationAdminTest.php](file:///home/bagi/Notes/dev/in-haz/backend/tests/Feature/Driver/DriverVerificationAdminTest.php)
* **Details & Status:** Complete Filament V5 admin panel integration with inline document streaming viewer and approval/rejection actions.
* **Problems / Notes:** None.

#### US-204: Driver Dashboard
* **State:** 🟢 `done`
* **Summary:** Driver central hub for managing active trips, viewing earnings overview, monitoring commission balance, toggling online availability status, and previewing location map.
* **Related Files:**
  * Spec: [dev/epic-02-driver-onboarding-and-verification/us-204-driver-dashboard/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-02-driver-onboarding-and-verification/us-204-driver-dashboard/README.md)
  * Backend Config: [backend/config/inhaz.php](file:///home/bagi/Notes/dev/in-haz/backend/config/inhaz.php) (`max_commission_debt_mad`)
  * Backend Migration: [backend/database/migrations/2026_09_02_160000_add_is_online_to_driver_profiles_table.php](file:///home/bagi/Notes/dev/in-haz/backend/database/migrations/2026_09_02_160000_add_is_online_to_driver_profiles_table.php)
  * Backend Controller: [backend/app/Http/Controllers/Api/V1/DriverController.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Http/Controllers/Api/V1/DriverController.php) (`dashboardSummary`, `toggleOnline`, `updateLocation`)
  * Backend Test: [backend/tests/Feature/Driver/DriverDashboardTest.php](file:///home/bagi/Notes/dev/in-haz/backend/tests/Feature/Driver/DriverDashboardTest.php)
  * Global Map Component: [mobile/components/map/MapRenderer.tsx](file:///home/bagi/Notes/dev/in-haz/mobile/components/map/MapRenderer.tsx)
  * Mobile Screen: [mobile/app/driver/dashboard.tsx](file:///home/bagi/Notes/dev/in-haz/mobile/app/driver/dashboard.tsx)
  * Mobile API Client: [mobile/lib/api/driver.ts](file:///home/bagi/Notes/dev/in-haz/mobile/lib/api/driver.ts)
* **Details & Status:** Fully implemented on backend and mobile. Features online/offline switch toggle (with green `#00C853` indicator), configurable commission debt threshold validation (200.00 MAD), daily earnings computation, active trip shortcut card, interactive cross-platform `MapRenderer`, and feature test coverage.
* **Problems / Notes:** None.

#### US-205: Driver Profile Screen
* **State:** 🟢 `done`
* **Summary:** Display driver profile details, vehicle specifications, average rating, and verification badge.
* **Related Files:**
  * Spec: [dev/epic-02-driver-onboarding-and-verification/us-205-driver-profile-screen/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-02-driver-onboarding-and-verification/us-205-driver-profile-screen/README.md)
  * Mobile Screen: [mobile/app/driver/profile.tsx](file:///home/bagi/Notes/dev/in-haz/mobile/app/driver/profile.tsx)
  * Backend Resource: [backend/app/Http/Resources/DriverProfileResource.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Http/Resources/DriverProfileResource.php)
* **Details & Status:** Profile screen displays verified status badge, total completed trips, vehicle details (make, plate, capacity), and document status.
* **Problems / Notes:** None.

---

### Epic 03: Request Creation & Geospatial
**Spec Folder:** [dev/epic-03-request-creation-and-geospatial](file:///home/bagi/Notes/dev/in-haz/dev/epic-03-request-creation-and-geospatial)

#### US-301: Client Delivery Request Form & 5-Step Wizard
* **State:** 🟢 `done`
* **Summary:** Client 5-step delivery request wizard (`cr_er_une_demande`) with split-screen Google Map trajectory, step-by-step `PATCH` draft sync, S3 batch presigned URL photo uploads, vehicle card selection, 20 MAD price floor enforcement, and summary review screen.
* **Related Files:**
  * Spec: [dev/epic-03-request-creation-and-geospatial/us-301-client-delivery-request-form/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-03-request-creation-and-geospatial/us-301-client-delivery-request-form/README.md)
  * Backend Controller: [backend/app/Http/Controllers/Api/V1/DeliveryRequestController.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Http/Controllers/Api/V1/DeliveryRequestController.php), [backend/app/Http/Controllers/Api/V1/RequestPhotoController.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Http/Controllers/Api/V1/RequestPhotoController.php)
  * Backend Service: [backend/app/Services/DeliveryRequestService.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Services/DeliveryRequestService.php)
  * Backend Models: [backend/app/Models/DeliveryRequest.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Models/DeliveryRequest.php), [backend/app/Models/RequestStop.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Models/RequestStop.php), [backend/app/Models/RequestPhoto.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Models/RequestPhoto.php)
  * Backend Migration: [backend/database/migrations/2026_09_08_000000_add_vehicle_type_to_delivery_requests_table.php](file:///home/bagi/Notes/dev/in-haz/backend/database/migrations/2026_09_08_000000_add_vehicle_type_to_delivery_requests_table.php)
  * Backend Test: [backend/tests/Feature/DeliveryRequestApiTest.php](file:///home/bagi/Notes/dev/in-haz/backend/tests/Feature/DeliveryRequestApiTest.php)
  * Mobile Screen & API: [mobile/app/requests/create.tsx](file:///home/bagi/Notes/dev/in-haz/mobile/app/requests/create.tsx), [mobile/lib/api/requests.ts](file:///home/bagi/Notes/dev/in-haz/mobile/lib/api/requests.ts)
* **Details & Status:** Fully implemented on backend and mobile. Features draft creation (`POST /api/v1/requests`), step-by-step state saving (`PATCH /api/v1/requests/{id}`), S3 batch presigned upload URLs (`POST /api/v1/requests/{id}/photos/presigned-urls`), photo confirmation (`POST /api/v1/requests/{id}/photos/confirm`), split-screen Google Map trajectory polyline, vehicle cards (Moto, Triporteur, Fourgonnette, Camion), proposed price controls with 20 MAD minimum floor banner, and publish action (`POST /api/v1/requests/{id}/publish`).
* **Problems / Notes:** None.

#### US-302: Google Maps / Places Autocomplete & Geocoding
* **State:** 🟡 `done_partial`
* **Summary:** Interactive address autocomplete search and map pin picker for pickup and dropoff locations.
* **Related Files:**
  * Spec: [dev/epic-03-request-creation-and-geospatial/us-302-google-maps-places-autocomplete-and-geocoding/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-03-request-creation-and-geospatial/us-302-google-maps-places-autocomplete-and-geocoding/README.md)
  * Mobile Form: [mobile/app/requests/create.tsx](file:///home/bagi/Notes/dev/in-haz/mobile/app/requests/create.tsx)
* **Details & Status:** Mobile form captures latitude, longitude, and formatted text addresses for stops.
* **Problems / Notes:** Live Google Places Autocomplete dropdown and interactive map pin placement component require Google Maps JavaScript/Native API Key integration.

#### US-303: Recommended Price Calculator
* **State:** 🟡 `done_partial`
* **Summary:** Calculate recommended price in MAD based on distance, cargo weight, and vehicle category.
* **Related Files:**
  * Spec: [dev/epic-03-request-creation-and-geospatial/us-303-recommended-price-calculator/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-03-request-creation-and-geospatial/us-303-recommended-price-calculator/README.md)
  * Backend Service: [backend/app/Services/DeliveryRequestService.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Services/DeliveryRequestService.php)
  * Mobile Form: [mobile/app/requests/create.tsx](file:///home/bagi/Notes/dev/in-haz/mobile/app/requests/create.tsx)
* **Details & Status:** Form auto-fills initial recommended price during creation based on client-side calculation rules.
* **Problems / Notes:** Price calculator needs dynamic synchronization with the back-office pricing grid configured via Filament (US-704).

#### US-304: Address Book / Saved Locations
* **State:** 🔴 `todo`
* **Summary:** Save and re-use frequent pickup/dropoff locations (Home, Warehouse, Store).
* **Related Files:**
  * Spec: [dev/epic-03-request-creation-and-geospatial/us-304-address-book/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-03-request-creation-and-geospatial/us-304-address-book/README.md)
* **Details & Status:** Spec defines database model for saved locations per customer profile.
* **Problems / Notes:** Database migration for `saved_addresses` table and mobile quick-select address dropdown are pending creation.

---

### Epic 04: Reverse Bidding & Negotiation
**Spec Folder:** [dev/epic-04-reverse-bidding-and-negotiation](file:///home/bagi/Notes/dev/in-haz/dev/epic-04-reverse-bidding-and-negotiation)

#### US-401: Driver Nearby Request Feed & Quick Bidding
* **State:** 🟢 `done`
* **Summary:** Drivers view open delivery requests in their area and place counter-bids/offers with quick price adjustment buttons.
* **Related Files:**
  * Spec: [dev/epic-04-reverse-bidding-and-negotiation/us-401-driver-nearby-request-feed-and-quick-bidding/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-04-reverse-bidding-and-negotiation/us-401-driver-nearby-request-feed-and-quick-bidding/README.md)
  * Backend Controller: [backend/app/Http/Controllers/Api/V1/OfferController.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Http/Controllers/Api/V1/OfferController.php) (`POST /delivery-requests/{id}/offers`)
  * Backend Service: [backend/app/Services/OfferService.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Services/OfferService.php)
  * Backend Model: [backend/app/Models/Offer.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Models/Offer.php)
  * Backend Test: [backend/tests/Feature/OfferApiTest.php](file:///home/bagi/Notes/dev/in-haz/backend/tests/Feature/OfferApiTest.php)
  * Mobile Screens: [mobile/app/driver/marketplace/index.tsx](file:///home/bagi/Notes/dev/in-haz/mobile/app/driver/marketplace/index.tsx), [mobile/app/driver/marketplace/[id].tsx](file:///home/bagi/Notes/dev/in-haz/mobile/app/driver/marketplace/[id].tsx)
* **Details & Status:** Complete bidding API and mobile UI. Drivers can submit custom amounts or quick bid buttons (+10%, +20% of target price).
* **Problems / Notes:** None.

#### US-402: Client Realtime Offer Stream & Acceptance / Locking
* **State:** 🟢 `done`
* **Summary:** Client views incoming bids, selects winning driver offer, which locks request and creates trip while rejecting competing offers.
* **Related Files:**
  * Spec: [dev/epic-04-reverse-bidding-and-negotiation/us-402-client-realtime-offer-stream-and-acceptance-locking/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-04-reverse-bidding-and-negotiation/us-402-client-realtime-offer-stream-and-acceptance-locking/README.md)
  * Backend Controller: [backend/app/Http/Controllers/Api/V1/OfferController.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Http/Controllers/Api/V1/OfferController.php) (`POST /offers/{id}/accept`)
  * Backend Service: [backend/app/Services/OfferService.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Services/OfferService.php)
  * Backend Test: [backend/tests/Feature/OfferE2ETest.php](file:///home/bagi/Notes/dev/in-haz/backend/tests/Feature/OfferE2ETest.php)
  * Mobile Screens: [mobile/app/requests/[id].tsx](file:///home/bagi/Notes/dev/in-haz/mobile/app/requests/[id].tsx), [mobile/app/requests/offers/[id].tsx](file:///home/bagi/Notes/dev/in-haz/mobile/app/requests/offers/[id].tsx)
* **Details & Status:** Full offer list rendering with driver ratings and bid amounts. Acceptance action atomically transitions request status, generates `Trip`, and rejects competitor bids.
* **Problems / Notes:** Real-time updates rely on polling refetch rather than WebSockets/Pusher.

#### US-403: Counter-Offer Negotiation Flow
* **State:** 🟡 `done_partial`
* **Summary:** Multi-round negotiation allowing clients and drivers to propose counter-offer amounts before final acceptance.
* **Related Files:**
  * Spec: [dev/epic-04-reverse-bidding-and-negotiation/us-403-counter-offer-negotiation-flow/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-04-reverse-bidding-and-negotiation/us-403-counter-offer-negotiation-flow/README.md)
  * Backend Controller: [backend/app/Http/Controllers/Api/V1/OfferController.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Http/Controllers/Api/V1/OfferController.php) (`counter` action)
  * Mobile Screen: [mobile/app/requests/offers/[id].tsx](file:///home/bagi/Notes/dev/in-haz/mobile/app/requests/offers/[id].tsx)
* **Details & Status:** Basic driver offer submission and client decision actions are implemented.
* **Problems / Notes:** Multi-turn client counter-proposal input controls (client offering intermediate price back to driver) need UI enhancement.

---

### Epic 05: Trip Execution, Tracking & Chat
**Spec Folder:** [dev/epic-05-trip-execution-tracking-and-chat](file:///home/bagi/Notes/dev/in-haz/dev/epic-05-trip-execution-tracking-and-chat)

#### US-501: Trip Status Milestone Stepper
* **State:** 🟢 `done`
* **Summary:** Sequential state machine for trip execution (`assigned` ➔ `arrived_at_pickup` ➔ `goods_loaded` ➔ `in_transit` ➔ `arrived_at_dropoff` ➔ `completed`).
* **Related Files:**
  * Spec: [dev/epic-05-trip-execution-tracking-and-chat/us-501-trip-status-milestone-stepper/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-05-trip-execution-tracking-and-chat/us-501-trip-status-milestone-stepper/README.md)
  * Backend Controller: [backend/app/Http/Controllers/Api/V1/TripController.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Http/Controllers/Api/V1/TripController.php) (`POST /trips/{id}/transition`)
  * Backend Service: [backend/app/Services/TripService.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Services/TripService.php)
  * Backend Request: [backend/app/Http/Requests/Api/V1/TransitionTripRequest.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Http/Requests/Api/V1/TransitionTripRequest.php)
  * Backend Tests: [backend/tests/Feature/TripApiTest.php](file:///home/bagi/Notes/dev/in-haz/backend/tests/Feature/TripApiTest.php), [backend/tests/Feature/TripE2ETest.php](file:///home/bagi/Notes/dev/in-haz/backend/tests/Feature/TripE2ETest.php)
  * Mobile Screen: [mobile/app/trips/[id].tsx](file:///home/bagi/Notes/dev/in-haz/mobile/app/trips/[id].tsx)
* **Details & Status:** Robust state machine with transition validation rules, status timestamp records, and step-wise mobile UI stepper for driver and client.
* **Problems / Notes:** None.

#### US-502: Realtime Driver GPS Tracking / Map
* **State:** 🟡 `done_partial`
* **Summary:** Live map showing driver GPS location updates during active delivery trips.
* **Related Files:**
  * Spec: [dev/epic-05-trip-execution-tracking-and-chat/us-502-realtime-driver-gps-tracking-map/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-05-trip-execution-tracking-and-chat/us-502-realtime-driver-gps-tracking-map/README.md)
  * Mobile Screen: [mobile/app/trips/[id].tsx](file:///home/bagi/Notes/dev/in-haz/mobile/app/trips/[id].tsx)
* **Details & Status:** Trip details screen renders static route map container with pickup and dropoff markers.
* **Problems / Notes:** Live background driver GPS location broadcasting via WebSockets/Reverb/Pusher and moving driver marker animation are pending integration.

#### US-503: In-App Trip Chat & Media
* **State:** 🔴 `todo`
* **Summary:** Real-time text chat between client and driver with photo attachment for proof of delivery.
* **Related Files:**
  * Spec: [dev/epic-05-trip-execution-tracking-and-chat/us-503-in-app-trip-chat-and-media/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-05-trip-execution-tracking-and-chat/us-503-in-app-trip-chat-and-media/README.md)
  * Mobile Screen: [mobile/app/trips/[id].tsx](file:///home/bagi/Notes/dev/in-haz/mobile/app/trips/[id].tsx)
* **Details & Status:** Phone call launcher (`Linking.openURL('tel:...')`) is integrated in trip view.
* **Problems / Notes:** In-app chat modal/screen, database messages table, and photo attachment upload inside chat are not implemented yet.

---

### Epic 06: Payments, Commission & Ratings
**Spec Folder:** [dev/epic-06-payments-commission-and-ratings](file:///home/bagi/Notes/dev/in-haz/dev/epic-06-payments-commission-and-ratings)

#### US-601: Cash on Delivery (COD) Handshake & Receipt
* **State:** 🟢 `done`
* **Summary:** Cash collection verification by driver upon trip completion and digital receipt display.
* **Related Files:**
  * Spec: [dev/epic-06-payments-commission-and-ratings/us-601-cash-on-delivery-handshake-and-receipt/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-06-payments-commission-and-ratings/us-601-cash-on-delivery-handshake-and-receipt/README.md)
  * Backend Controller: [backend/app/Http/Controllers/Api/V1/TripController.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Http/Controllers/Api/V1/TripController.php)
  * Backend Model: [backend/app/Models/Trip.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Models/Trip.php)
  * Mobile Screen: [mobile/app/trips/[id].tsx](file:///home/bagi/Notes/dev/in-haz/mobile/app/trips/[id].tsx)
* **Details & Status:** Driver confirms cash collection during final milestone transition. Fare breakdown digital receipt rendered on screen.
* **Problems / Notes:** None.

#### US-602: Platform Commission Ledger & Driver Balance
* **State:** 🟡 `done_partial`
* **Summary:** Deduct platform commission from driver balance on trip completion and maintain double-entry transaction history.
* **Related Files:**
  * Spec: [dev/epic-06-payments-commission-and-ratings/us-602-platform-commission-ledger-and-driver-balance/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-06-payments-commission-and-ratings/us-602-platform-commission-ledger-and-driver-balance/README.md)
  * Backend Model: [backend/app/Models/DriverProfile.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Models/DriverProfile.php) (`wallet_balance` field)
* **Details & Status:** `wallet_balance` field stored on driver profiles.
* **Problems / Notes:** Automated commission deduction listener on trip completion and ledger history API endpoint (`GET /api/v1/driver/ledger`) require US-803 database schema completion.

#### US-603: Post-Trip Ratings & Dispute Filing
* **State:** 🟢 `done`
* **Summary:** 1-to-5 star rating and feedback submission for client and driver after trip completion.
* **Related Files:**
  * Spec: [dev/epic-06-payments-commission-and-ratings/us-603-post-trip-ratings-and-dispute-filing/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-06-payments-commission-and-ratings/us-603-post-trip-ratings-and-dispute-filing/README.md)
  * Backend Controller: [backend/app/Http/Controllers/Api/V1/TripController.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Http/Controllers/Api/V1/TripController.php) (`rate` method)
  * Backend Request: [backend/app/Http/Requests/Api/V1/RateTripRequest.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Http/Requests/Api/V1/RateTripRequest.php)
  * Backend Model: [backend/app/Models/Rating.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Models/Rating.php)
  * Backend Test: [backend/tests/Feature/TripApiTest.php](file:///home/bagi/Notes/dev/in-haz/backend/tests/Feature/TripApiTest.php)
  * Mobile Screen: [mobile/app/trips/[id].tsx](file:///home/bagi/Notes/dev/in-haz/mobile/app/trips/[id].tsx)
* **Details & Status:** Backend endpoint (`POST /api/v1/trips/{id}/rate`) validates score (1-5), ensures reviewer participated in trip, and prevents duplicate ratings. Integrated into mobile trip screen.
* **Problems / Notes:** None.

#### US-604: Payment Method Selection
* **State:** 🟡 `done_partial`
* **Summary:** Select preferred payment method (Cash on Delivery, In-App Wallet, Online Card).
* **Related Files:**
  * Spec: [dev/epic-06-payments-commission-and-ratings/us-604-payment-method-selection/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-06-payments-commission-and-ratings/us-604-payment-method-selection/README.md)
  * Mobile Form: [mobile/app/requests/create.tsx](file:///home/bagi/Notes/dev/in-haz/mobile/app/requests/create.tsx)
* **Details & Status:** Cash on Delivery (COD) selected by default during delivery request creation.
* **Problems / Notes:** Online card payments (CMI integration) are planned for post-MVP phase.

---

### Epic 07: Admin Back-Office & Governance
**Spec Folder:** [dev/epic-07-admin-back-office-and-governance](file:///home/bagi/Notes/dev/in-haz/dev/epic-07-admin-back-office-and-governance)

#### US-701: Admin 2FA Login
* **State:** 🟡 `done_partial`
* **Summary:** Require mandatory Two-Factor Authentication (2FA) for admin panel authentication.
* **Related Files:**
  * Spec: [dev/epic-07-admin-back-office-and-governance/us-701-admin-2fa-login/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-07-admin-back-office-and-governance/us-701-admin-2fa-login/README.md)
  * Backend Middleware: [backend/app/Http/Middleware/EnsureUserIsAdmin.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Http/Middleware/EnsureUserIsAdmin.php)
  * Backend Provider: [backend/app/Providers/Filament/AdminPanelProvider.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Providers/Filament/AdminPanelProvider.php)
* **Details & Status:** Admin role protection middleware and Filament authentication guard are enforced for `/admin`.
* **Problems / Notes:** Mandatory 2FA TOTP/SMS challenge step during admin login is pending integration.

#### US-702: Filament User & Driver Management
* **State:** 🟢 `done`
* **Summary:** Admin panel management tables for reviewing users, driver accounts, vehicles, and status filters.
* **Related Files:**
  * Spec: [dev/epic-07-admin-back-office-and-governance/us-702-filament-user-and-driver-management/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-07-admin-back-office-and-governance/us-702-filament-user-and-driver-management/README.md)
  * Filament Resources: [backend/app/Filament/Resources/DriverProfileResource.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Filament/Resources/DriverProfileResource.php), [backend/app/Filament/Resources/DriverDocumentResource.php](file:///home/bagi/Notes/dev/in-haz/backend/app/Filament/Resources/DriverDocumentResource.php)
  * Backend Test: [backend/tests/Feature/Driver/DriverVerificationAdminTest.php](file:///home/bagi/Notes/dev/in-haz/backend/tests/Feature/Driver/DriverVerificationAdminTest.php)
* **Details & Status:** Full Filament resource tables for filtering, searching, document reviewing, approving, and suspending drivers.
* **Problems / Notes:** None.

#### US-703: Filament Complaint & Dispute Resolution
* **State:** 🔴 `todo`
* **Summary:** Back-office ticket queue for managing client/driver disputes, complaints, and trip refund requests.
* **Related Files:**
  * Spec: [dev/epic-07-admin-back-office-and-governance/us-703-filament-complaint-and-dispute-resolution/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-07-admin-back-office-and-governance/us-703-filament-complaint-and-dispute-resolution/README.md)
* **Details & Status:** Spec defines dispute resource workflows for admin staff.
* **Problems / Notes:** Filament `DisputeResource` and complaints database table are not created yet.

#### US-704: Filament System Settings & Pricing Grid
* **State:** 🔴 `todo`
* **Summary:** Admin interface to configure platform commission percentage and vehicle pricing grids.
* **Related Files:**
  * Spec: [dev/epic-07-admin-back-office-and-governance/us-704-filament-system-settings-and-pricing-grid/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-07-admin-back-office-and-governance/us-704-filament-system-settings-and-pricing-grid/README.md)
* **Details & Status:** Spec defines system setting keys for commission rate (e.g. 10%) and base price per km per vehicle type.
* **Problems / Notes:** Settings page in Filament panel is pending implementation.

---

### Epic 08: Database Foundation & Integrity
**Spec Folder:** [dev/epic-08-database-foundation-and-integrity](file:///home/bagi/Notes/dev/in-haz/dev/epic-08-database-foundation-and-integrity)

#### US-801: Schema Drift Alignment
* **State:** 🟢 `done`
* **Summary:** Synchronize migration files with technical domain specs across Postgres and SQLite testing environments.
* **Related Files:**
  * Spec: [dev/epic-08-database-foundation-and-integrity/us-801-schema-drift-alignment/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-08-database-foundation-and-integrity/us-801-schema-drift-alignment/README.md)
  * Migrations: [backend/database/migrations/](file:///home/bagi/Notes/dev/in-haz/backend/database/migrations/) (21 migration files)
* **Details & Status:** All core domain model migrations are synced with exact enum statuses, foreign key cascading constraints, and nullable columns.
* **Problems / Notes:** None.

#### US-802: Missing Domain Tables
* **State:** 🟡 `done_partial`
* **Summary:** Create all essential database tables defined in domain technical specifications.
* **Related Files:**
  * Spec: [dev/epic-08-database-foundation-and-integrity/us-802-missing-domain-tables/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-08-database-foundation-and-integrity/us-802-missing-domain-tables/README.md)
  * Migrations: [backend/database/migrations/](file:///home/bagi/Notes/dev/in-haz/backend/database/migrations/)
* **Details & Status:** Core entities (`users`, `customer_profiles`, `driver_profiles`, `vehicles`, `driver_documents`, `delivery_requests`, `request_stops`, `request_photos`, `offers`, `trips`, `ratings`, `otps`) are implemented.
* **Problems / Notes:** Ancillary tables (`commission_ledgers`, `saved_addresses`, `trip_messages`) are pending migration creation.

#### US-803: Commission Ledger Schema
* **State:** 🔴 `todo`
* **Summary:** Migration for double-entry ledger table tracking commission deductions, wallet balances, and payout records.
* **Related Files:**
  * Spec: [dev/epic-08-database-foundation-and-integrity/us-803-commission-ledger-schema/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-08-database-foundation-and-integrity/us-803-commission-ledger-schema/README.md)
* **Details & Status:** Spec defines schema fields for `commission_ledgers` (amount, direction, reference_type, balance_after).
* **Problems / Notes:** Migration file not created yet.

#### US-804: Indexes, Constraints & Performance Tuning
* **State:** 🟡 `done_partial`
* **Summary:** Database indexing and performance constraints for high-throughput geospatial and request status queries.
* **Related Files:**
  * Spec: [dev/epic-08-database-foundation-and-integrity/us-804-indexes-constraints-performance/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-08-database-foundation-and-integrity/us-804-indexes-constraints-performance/README.md)
  * Migrations: [backend/database/migrations/](file:///home/bagi/Notes/dev/in-haz/backend/database/migrations/)
* **Details & Status:** Primary keys, foreign keys, and unique indexes exist on core tables.
* **Problems / Notes:** Spatial composite indexes on (`latitude`, `longitude`) and request feed status filtering columns need explicit optimization migration.

---

### Epic 09: Legal & App Info
**Spec Folder:** [dev/epic-09-legal-and-app-info](file:///home/bagi/Notes/dev/in-haz/dev/epic-09-legal-and-app-info)

#### US-901: Privacy Policy Screen
* **State:** 🔴 `todo`
* **Summary:** Static mobile screen displaying privacy policy, data usage disclosures, and legal terms.
* **Related Files:**
  * Spec: [dev/epic-09-legal-and-app-info/us-901-privacy-policy-screen/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-09-legal-and-app-info/us-901-privacy-policy-screen/README.md)
* **Details & Status:** Legal content specification for data collection disclosures.
* **Problems / Notes:** Screen missing in Expo mobile app router (`mobile/app/legal/privacy.tsx`).

#### US-902: About inHAZ Screen
* **State:** 🔴 `todo`
* **Summary:** Static mobile screen displaying platform version, company information, and mission details.
* **Related Files:**
  * Spec: [dev/epic-09-legal-and-app-info/us-902-about-inhaz-screen/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-09-legal-and-app-info/us-902-about-inhaz-screen/README.md)
* **Details & Status:** App branding and version info specification.
* **Problems / Notes:** Screen missing in Expo mobile app router (`mobile/app/legal/about.tsx`).

#### US-903: Help Centre Screen
* **State:** 🔴 `todo`
* **Summary:** Mobile help center featuring searchable FAQ list and customer support contact shortcuts.
* **Related Files:**
  * Spec: [dev/epic-09-legal-and-app-info/us-903-help-centre-screen/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-09-legal-and-app-info/us-903-help-centre-screen/README.md)
* **Details & Status:** Support FAQ specification.
* **Problems / Notes:** Screen missing in Expo mobile app router (`mobile/app/legal/help.tsx`).

---

### Epic 10: Localisation & i18n
**Spec Folder:** [dev/epic-10-localisation-and-i18n](file:///home/bagi/Notes/dev/in-haz/dev/epic-10-localisation-and-i18n)

#### US-1001: i18n Setup & Translation Files
* **State:** 🔴 `todo`
* **Summary:** Framework setup for multi-language support (French, Arabic/Darija, English) with JSON translation dictionaries.
* **Related Files:**
  * Spec: [dev/epic-10-localisation-and-i18n/us-1001-i18n-setup-and-translation-files/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-10-localisation-and-i18n/us-1001-i18n-setup-and-translation-files/README.md)
* **Details & Status:** i18n specification for mobile application.
* **Problems / Notes:** Mobile UI components currently contain hardcoded English/French string literals without `i18n` translation hooks.

#### US-1002: Language / Region Settings Screen
* **State:** 🔴 `todo`
* **Summary:** User interface to switch preferred language (French, Arabic, English) with RTL layout adaptation for Arabic.
* **Related Files:**
  * Spec: [dev/epic-10-localisation-and-i18n/us-1002-language-region-settings-screen/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-10-localisation-and-i18n/us-1002-language-region-settings-screen/README.md)
* **Details & Status:** Language selector specification.
* **Problems / Notes:** Language selector component not created yet.

#### US-1003: Backend Locale Support
* **State:** 🔴 `todo`
* **Summary:** Backend API middleware to parse `Accept-Language` headers and return localized validation and error responses.
* **Related Files:**
  * Spec: [dev/epic-10-localisation-and-i18n/us-1003-backend-locale-support/README.md](file:///home/bagi/Notes/dev/in-haz/dev/epic-10-localisation-and-i18n/us-1003-backend-locale-support/README.md)
* **Details & Status:** Backend localization specification.
* **Problems / Notes:** Backend API currently returns default English response messages.

---

## 🎯 4. Next Action Items & Priority Roadmap

1. **Complete Partial High-Priority User Stories (Sprint 1 Refinement):**
   * **US-104:** Implement avatar photo picker and upload endpoint (`POST /api/v1/profile/avatar`).
   * **US-302:** Wire Google Places Autocomplete dropdown into request creation form (`mobile/app/requests/create.tsx`).
   * **US-502:** Integrate WebSocket / Reverb live driver location updates into active trip screen (`mobile/app/trips/[id].tsx`).

2. **Database & Commission Foundations (Sprint 2):**
   * **US-803 & US-602:** Create `commission_ledgers` migration table and wire automatic commission deduction listener on trip completion.
   * **US-704:** Create Filament pricing grid configuration resource.

3. **Secondary Screens & Polish (Sprint 3):**
   * **US-105 & US-1002:** Implement profile configuration toggles and language switcher screen.
   * **US-901, US-902, US-903:** Add static legal pages (Privacy Policy, About, Help Centre).
