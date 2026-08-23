# User Story: US-804 — Indexes, Constraints & Performance

**Story ID:** `US-804`
**Epic:** [EPIC-08: Database Foundation, Schema Integrity & Ledger](../README.md)
**Role:** Backend
**Priority:** P1

---

## 1. Implementation Status Audit
*   **Backend (`backend/database/migrations/`):** **PARTIAL.** Only `trips(driver_user_id, status)` and `trips(client_user_id, status)` composite indexes exist. Spec 02 §3 mandates additional indexes that are absent.

## 2. Required Indexes (spec 02 §3)

| Table | Index | Purpose |
| :--- | :--- | :--- |
| `driver_profiles` | `(current_latitude, current_longitude)` | Nearby-driver bounding-box lookups |
| `delivery_requests` | `(origin_latitude, origin_longitude)` | Driver feed radius query (15km, EPIC-04 US-401) |
| `offers` | `(delivery_request_id, status)` | Fast pending-bid retrieval for realtime stream |
| `delivery_requests` | `(status, created_at)` | Open-request feed ordering |
| `messages` | `(delivery_request_id, created_at)` | Chat thread pagination |

## 3. Constraint & Integrity Rules
1. Explicit FK delete policy everywhere: cascade for owned children (`request_stops`, `request_photos`, `offers`, `driver_documents`), restrict where history matters (`complaints.trip_id`, `commission_settlements.driver_profile_id`, `payments.trip_id`).
2. Unique constraints: `vehicles.license_plate`, `users.phone`, `payments.transaction_ref`, `system_settings.key`.
3. Check-style guards via validation layer: `ratings.score BETWEEN 1 AND 5`, lat/lng ranges validated at FormRequest level.
4. **Seeders:** `DatabaseSeeder` produces an admin user, `system_settings` defaults (`commission_rate=12.50`, `max_driver_debt=200`, per-km pricing grid for triporteur/van/truck) and a small demo dataset for Filament development.

---

## 4. Acceptance Criteria (Gherkin Format)

```gherkin
Scenario: Driver feed query uses composite index
  Given 10,000 delivery requests exist
  When the nearby-feed query filters by "origin_latitude", "origin_longitude" and "status"
  Then the query plan uses an index scan (no sequential scan)

Scenario: Fresh install is demo-ready after seeding
  Given a clean database
  When "php artisan migrate:fresh --seed" completes
  Then default system settings, one admin account and demo drivers/requests exist
```
