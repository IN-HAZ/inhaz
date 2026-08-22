# User Story: US-602 — Platform Commission Ledger & Driver Balance

**Story ID:** `US-602`
**Epic:** [EPIC-06: Payments, Commission & Ratings System](../overview.md)
**Role:** Driver & Admin
**Priority:** P0

---

## 1. User Story Statement
**As a** platform system,  
**I want to** automatically calculate commission owed on completed trips and track driver debt balances,  
**So that** drivers exceeding 200 MAD platform debt are blocked until fees are settled.

---

## 2. Business Rules & Formula

$$\text{Commission Amount} = \text{agreed\_price} \times \left(\frac{\text{commission\_rate}}{100}\right)$$

*   `driver_profiles.commission_balance` increases by `commission_amount`.
*   If `commission_balance > 200.00 MAD`, driver is blocked from setting `is_online = true`.

---

## 3. Acceptance Criteria

```gherkin
Scenario: Driver exceeds debt threshold
  Given driver commission balance is 195 MAD
  When driver completes an 80 MAD trip with 12.5% commission (10 MAD fee)
  Then driver commission balance becomes 205 MAD
  And driver is blocked from toggling online until admin settles fee
```
