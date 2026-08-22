# User Story: US-703 — Filament System Settings & Pricing Grid

**Story ID:** `US-703`
**Epic:** [EPIC-07: Admin Back-Office & Governance](../overview.md)
**Role:** Admin
**Priority:** P2

---

## 1. User Story Statement
**As a** platform admin,  
**I want to** update the platform commission percentage, minimum base prices, and per-km pricing grid in a Filament settings page,  
**So that** business parameters can be updated dynamically without code redeployments.

---

## 2. Technical Settings Fields

*   `commission_rate`: Decimal (%)
*   `min_price`: Decimal (MAD)
*   `max_driver_debt`: Decimal (MAD)
*   `pricing_grid`: JSON array of vehicle rates.

---

## 3. Acceptance Criteria

```gherkin
Scenario: Admin updates commission rate
  Given platform commission rate is 12.5%
  When admin updates settings to 15.0% and saves
  Then new trips snapshot 15.0% commission, while past completed trips retain their original recorded commission amount
```
