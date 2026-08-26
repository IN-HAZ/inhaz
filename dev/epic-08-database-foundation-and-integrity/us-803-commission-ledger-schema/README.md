# User Story: US-803 — Commission Ledger Schema

**Story ID:** `US-803`
**Epic:** [EPIC-08: Database Foundation, Schema Integrity & Ledger](../README.md)
**Role:** Backend
**Priority:** P0

---

## 1. Implementation Status Audit
*   **Backend (`backend/database/migrations/`):** **NOT IMPLEMENTED.** `trips` lacks `commission_rate`/`commission_amount` snapshot columns; `driver_profiles` lacks `commission_balance`; no settlement audit trail exists. EPIC-06 US-602 (200 MAD debt gating) cannot be built without this.

## 2. Schema Changes

### 2.1 Snapshot columns on `trips` (spec 07 §2.1)
*   `commission_rate`: Decimal(5,2) — snapshot of `system_settings.commission_rate` at trip creation.
*   `commission_amount`: Decimal(10,2) — computed on completion: `agreed_price × commission_rate / 100`.
*   Both are **immutable after write**: no API path may update them.

### 2.2 Balance column on `driver_profiles` (spec 07 §2.2)
*   `commission_balance`: Decimal(10,2) default `0.00` — platform debt in MAD.
*   Incremented inside the same DB transaction that marks a trip `delivered`.

### 2.3 Settlement trail (spec 07 §2.4)
*   Covered by `commission_settlements` table (US-802 §2.3): admin settles → balance decremented + audit row inserted atomically.

---

## 3. Business Rules & Technical Requirements
1. All ledger mutations run inside `DB::transaction()` with `lockForUpdate()` on `driver_profiles` row to prevent race conditions on concurrent completions/settlements.
2. Balance must never go negative: settlement amount is capped at current `commission_balance`.
3. Historical integrity: changing `system_settings.commission_rate` later must NOT alter existing trips — guaranteed by snapshotting (verified by US-703 acceptance test).
4. Gating read path: `is_online = true` toggle is rejected when `commission_balance > system_settings.max_driver_debt` (default 200 MAD).

---

## 4. Acceptance Criteria (Gherkin Format)

```gherkin
Scenario: Commission snapshotted at trip creation
  Given "system_settings.commission_rate" is 12.50
  When an offer with price 80.00 MAD is accepted
  Then the created trip stores "commission_rate" = 12.50

Scenario: Debt gating blocks online toggle
  Given a driver has "commission_balance" = 205.00 MAD
  And "max_driver_debt" setting is 200
  When the driver requests "is_online" = true
  Then the API responds 403 with message "Commission balance threshold reached"

Scenario: Settlement decrements balance atomically
  Given a driver has "commission_balance" = 200.00 MAD
  When an admin records a settlement of 200.00 MAD
  Then "commission_balance" becomes 0.00
  And one "commission_settlements" row exists referencing the admin and reference number
```
