# Epic 03: Request Creation & Geospatial Infrastructure

**Epic ID:** `EPIC-03`
**Title:** Client Delivery Request Flow, Maps Integration & Recommended Pricing
**Priority:** P0 (Core Functionality)
**Target Release:** MVP Sprint 2

---

## 1. Executive Summary
This epic enables clients to create delivery requests by specifying pickup/dropoff addresses, intermediate waypoints, package descriptions, item photos via native camera capture, saved locations from an address book, and proposed pricing. It integrates Google Maps Places Autocomplete, Geocoding, Distance Matrix calculations, and automated base price recommendations with a strict minimum price floor of 20 MAD.

---

## 2. Included User Stories

| Story ID | Title | Summary | Priority |
| :--- | :--- | :--- | :--- |
| **US-301** | [Client Delivery Request Form & Photo Capture](us-301-client-delivery-request-form/README.md) | Multi-step request creation wizard with package details, camera photo capture (Expo ImagePicker <=2MB), vehicle selection, and 20 MAD minimum price floor. | P0 |
| **US-302** | [Google Maps Integration & Location Picker](us-302-google-maps-places-autocomplete-and-geocoding/README.md) | Full-screen dark map view, animated driver pins, Places autocomplete, and pin-on-map mode. | P0 |
| **US-303** | [Recommended Price Calculator](us-303-recommended-price-calculator/README.md) | Dynamic baseline pricing calculation based on distance, vehicle type, and 20 MAD minimum floor. | P1 |
| **US-304** | [Address Book / Saved Locations Screen](us-304-address-book/README.md) | Saved locations CRUD (Home, Work, custom labels) for instant address pre-filling. | P0 |

---

## 3. Epic Acceptance Criteria
*   Clients can input pickup and dropoff addresses via map search, center crosshair pin placement, or saved Address Book entries.
*   System accurately calculates driving route distance in kilometers using Google Distance Matrix API.
*   Recommended initial proposed price is pre-filled according to vehicle type rules and enforces a hard minimum price floor of 20 MAD.
*   Clients can attach package photos via native device camera or gallery picker, compressed to <= 2MB before upload.
*   Delivery requests are stored in `delivery_requests` table with status `open` and broadcast to nearby online drivers in real-time via Laravel Reverb.
