# Epic 03: Request Creation & Geospatial Infrastructure

**Epic ID:** `EPIC-03`
**Title:** Client Delivery Request Flow, Maps Integration & Recommended Pricing
**Priority:** P0 (Core Functionality)
**Target Release:** MVP Sprint 2

---

## 1. Executive Summary
This epic enables clients to create delivery requests by specifying pickup/dropoff addresses, intermediate waypoints, package descriptions, item photos, and an initial proposed price. It integrates Google Maps Places Autocomplete, Geocoding, Distance Matrix calculations, and automated base price recommendations.

---

## 2. Included User Stories

| Story ID | Title | Summary | Priority |
| :--- | :--- | :--- | :--- |
| **US-301** | [Client Delivery Request Form](us-301-client-delivery-request-form/overview.md) | Multi-step request creation form with package description, photo attachment, and vehicle selection. | P0 |
| **US-302** | [Google Maps Integration](us-302-google-maps-places-autocomplete-and-geocoding/overview.md) | Places Autocomplete address search, pin-on-map selection, and route distance calculation. | P0 |
| **US-303** | [Recommended Price Calculator](us-303-recommended-price-calculator/overview.md) | Dynamic calculation of recommended baseline transport price based on distance and vehicle type. | P1 |

---

## 3. Epic Acceptance Criteria
*   Clients can input pickup and dropoff addresses via map search or map pin.
*   System accurately calculates trip distance in kilometers via Google Distance Matrix.
*   Initial proposed price is guided by vehicle pricing parameters (Triporteur, Van, Truck).
*   Request is saved in `delivery_requests` table with status `open` and broadcast to nearby drivers.
