# User Story: US-802 — Missing Domain Tables

**Story ID:** `US-802`
**Epic:** [EPIC-08: Database Foundation, Schema Integrity & Ledger](../README.md)
**Role:** Backend
**Priority:** P0

---

## 1. Implementation Status Audit
*   **Backend (`backend/database/migrations/`):** **NOT IMPLEMENTED.** Six tables specified in `tech-spects/` have no migration and no Eloquent model.

## 2. Tables To Create

### 2.1 `messages` (spec 06 §3.2 — unblocks EPIC-05 US-503)
*   `id`, `delivery_request_id` FK (cascade), `trip_id` FK nullable, `sender_id` FK → `users.id`
*   `content` String(1000) nullable, `photo_path` String nullable (exactly one of content/photo required)
*   `read_at` Timestamp nullable; `created_at` (no `updated_at` — immutable)
*   Index: `(delivery_request_id, created_at)`

### 2.2 `payments` (spec 07 §1.1 — COD audit record)
*   `id`, `trip_id` FK unique, `method` enum (`cash`) default `cash`
*   `amount` Decimal(10,2), `status` enum (`completed`) default `completed`
*   `transaction_ref` String unique (format `COD-{trip_id}`); timestamps

### 2.3 `commission_settlements` (spec 07 §2.4 — unblocks EPIC-07 US-701 settle action)
*   `id`, `driver_profile_id` FK (restrict), `amount` Decimal(10,2), `reference_number` String
*   `settled_by` FK → `users.id` (admin), `settled_at` Timestamp; timestamps

### 2.4 `system_settings` (spec 07 §2.1/§2.3, EPIC-07 US-703)
*   `id`, `key` String unique indexed (`commission_rate`, `max_driver_debt`, `min_price`, pricing grid JSON per vehicle type)
*   `value` JSON / Text, `updated_by` FK nullable → `users.id`; timestamps

### 2.5 `complaints` (spec 02 §2.3 — unblocks EPIC-06 US-603 & EPIC-07 US-702)
*   `id`, `trip_id` FK (restrict), `complainant_id` FK, `against_id` FK
*   `category` enum (`damage, delay, unprofessional, payment_issue, other`)
*   `description` Text, `status` enum (`open, under_investigation, resolved, dismissed`) default `open`
*   `admin_notes` Text nullable; timestamps
*   Index: `(status, created_at)` for the Filament queue

### 2.7 `saved_addresses` (spec 03 — unblocks EPIC-03 US-304)
* `id` UUID PK, `user_id` FK → `users.id` (cascade), `label` String(50) (e.g., "Home", "Work", "Warehouse")
* `address` Text, `latitude` Decimal(10,8), `longitude` Decimal(11,8); timestamps
* Index: `(user_id, created_at)` for quick client location lookups

### 2.8 `content_pages` (spec 09 — unblocks EPIC-09 US-901 & US-902)
* `id` UUID PK, `slug` String unique indexed (e.g. `privacy`, `about`), `title` String(255)
* `body_md` Text, `locale` String(10) default `fr`; timestamps

### 2.9 `faq_items` (spec 09 — unblocks EPIC-09 US-903)
* `id` UUID PK, `category` String(50) (e.g., `client`, `driver`, `payments`, `account`)
* `question` Text, `answer` Text, `sort_order` Integer default 0; timestamps
* Index: `(category, sort_order)` for grouped ordered display

---

## 3. Business Rules & Technical Requirements
1. Each table gets a matching Eloquent model with proper `$casts` (JSON arrays, decimals as strings).
2. `messages` and `audit_logs` are append-only: no update/delete endpoints; enforce via model `static::updating` guard or DB triggers.
3. `system_settings` is read through a cached repository (Redis, `Cache::rememberForever` + flush on write).

---

## 4. Acceptance Criteria (Gherkin Format)

```gherkin
Scenario: All spec'd domain tables exist
  Given migrations have been executed on a fresh database
  When I list all database tables
  Then "messages", "payments", "commission_settlements", "system_settings", "complaints", "audit_logs", "saved_addresses", "content_pages" and "faq_items" exist
  And each table's columns, enums and indexes match its specification document

Scenario: Chat message immutability
  Given a saved chat message record
  When any process attempts to modify or delete it at the model layer
  Then the operation raises an exception
```
