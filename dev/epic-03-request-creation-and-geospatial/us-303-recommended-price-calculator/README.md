# User Story: US-303 — Recommended Price Calculator

**Story ID:** `US-303`
**Epic:** [EPIC-03: Request Creation & Geospatial Infrastructure](../overview.md)
**Role:** Client
**Priority:** P1

---

## 1. User Story Statement
**As a** client creating a request,  
**I want to** see an estimated fair market price range recommended by the app based on distance and vehicle type,  
**So that** I can propose a realistic price that attracts drivers quickly.

---

## 2. Business Rules & Calculation Formula

$$\text{Recommended Price} = \max\Big(\text{Base Fare}_{\text{vehicle}}, \, (\text{Distance}_{\text{km}} \times \text{PerKmRate}_{\text{vehicle}})\Big)$$

*   **Triporteur:** Base 25 MAD | 4.00 MAD/km
*   **Van:** Base 50 MAD | 7.00 MAD/km
*   **Truck:** Base 100 MAD | 12.00 MAD/km
*   **Absolute Minimum:** 20 MAD across all requests.

---

## 3. Acceptance Criteria

```gherkin
Scenario: Estimate price for a 10km Van transport
  Given trip distance is calculated as 10.0 km and selected vehicle is "Van"
  When the price calculator runs (Base 50 MAD + 10km * 7 MAD/km = 120 MAD)
  Then the app displays "Suggested price: 110 - 130 MAD"
```
