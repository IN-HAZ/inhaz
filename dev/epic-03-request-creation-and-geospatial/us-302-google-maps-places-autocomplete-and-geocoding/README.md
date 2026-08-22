# User Story: US-302 — Google Maps Places Autocomplete & Geocoding

**Story ID:** `US-302`
**Epic:** [EPIC-03: Request Creation & Geospatial Infrastructure](../overview.md)
**Role:** Client & Driver
**Priority:** P0

---

## 1. User Story Statement
**As a** user entering pickup or dropoff locations,  
**I want to** see live address autocomplete suggestions as I type or select a point directly on an interactive map,  
**So that** accurate latitude and longitude coordinates are captured for route calculation.

---

## 2. Technical Integration Rules

*   **Places Autocomplete:** Queries Google Places API restricted to Morocco (`country:ma`).
*   **Geocoding:** Reverse geocodes map pins to human-readable street names.
*   **Distance Matrix API:** Computes driving route distance in km between origin and destination coordinates.

---

## 3. Acceptance Criteria

```gherkin
Scenario: Select address via Places Autocomplete
  Given I am typing "Av. Mohammed V" into the pickup location field
  When I select "Av. Mohammed V, Agadir" from the dropdown suggestions
  Then the map camera centers on the location pin and stores lat/lng coordinates
```
