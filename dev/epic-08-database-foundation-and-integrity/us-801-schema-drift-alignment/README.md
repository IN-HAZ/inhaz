# User Story: US-801 — Schema Drift Alignment

**Story ID:** `US-801`
**Epic:** [EPIC-08: Database Foundation, Schema Integrity & Ledger](../README.md)
**Role:** Backend
**Priority:** P0

---

## 1. Implementation Status Audit
*   **Backend (`backend/database/migrations/`):** **DRIFT DETECTED.** Existing tables diverge from `tech-spects/02_database_schema_and_domain_models.md` on columns, enum values and naming.
*   **Mobile:** N/A.

## 2. Drift Register (Spec vs Current Migrations)

### 2.1 `delivery_requests`
| Spec Requirement | Current State | Action |
| :--- | :--- | :--- |
| `origin_latitude` Decimal(10,8) indexed, `origin_longitude` Decimal(11,8) | Missing | Add columns + composite index |
| `destination_latitude`, `destination_longitude` | Missing | Add |
| `origin_address`, `destination_address` strings | Missing | Add |
| `distance_km` Decimal(8,2) | Missing | Add |
| `required_vehicle_type` enum (`any`,`triporteur`,`van`,`truck`) default `any` | Missing | Add |
| status enum `open, negotiating, in_progress, completed, cancelled` default `open` | `DRAFT, OPEN, CANCELLED, EXPIRED, MATCHED` | Rename values (pre-production: `migrate:fresh` authorized) |

### 2.2 `driver_profiles`
| Spec Requirement | Current State | Action |
| :--- | :--- | :--- |
| `verification_status` enum (`unsubmitted, pending, approved, rejected, suspended`) | `status` enum 3 values only | Extend + rename column |
| `is_online` boolean default `false` | Missing | Add |
| `current_latitude` Decimal(10,8), `current_longitude` Decimal(11,8), nullable, indexed | Missing | Add + composite index |
| `rating_avg` Decimal(3,2) default `5.00` | Missing | Add |
| `total_trips` integer default `0` | Missing | Add |
| `commission_balance` Decimal(10,2) default `0.00` | Missing | Add (see US-803) |
| `vehicle_id` FK nullable → `vehicles.id` | Missing | Add |

### 2.3 `trips`
| Spec Requirement | Current State | Action |
| :--- | :--- | :--- |
| status enum `heading_to_pickup, arrived_pickup, cargo_collected, en_route_dropoff, delivered, cancelled` | `ASSIGNED, DRIVER_EN_ROUTE, AT_PICKUP...` | Align to spec vocabulary (mobile + API consumers updated same PR) |
| `commission_rate` Decimal(5,2), `commission_amount` Decimal(10,2) | Missing | Add (US-803) |
| `started_at`, `completed_at` | `picked_up_at`/`delivered_at` only | Add `started_at`; keep existing timestamps mapped in model casts |

### 2.4 `offers`
| Spec Requirement | Current State | Action |
| :--- | :--- | :--- |
| `driver_id` FK → `users.id` | `user_id` | Rename for spec compliance |
| `offered_price` Decimal(10,2) | `price` | Rename |
| `eta_minutes` integer | Missing | Add |
| status includes `countered` | Missing value | Add to enum |

---

## 3. Business Rules & Technical Requirements
1. All changes ship as new timestamped migrations; project is pre-production so `migrate:fresh --seed` sign-off is acceptable for enum renames.
2. Eloquent models, FormRequests and API Resources referencing renamed columns are updated in the same PR; full test suite must pass.
3. Enum vocabularies become the single contract referenced by EPIC-03/04/05/06 — no local redefinition allowed.

---

## 4. Acceptance Criteria (Gherkin Format)

```gherkin
Scenario: Schema matches specification after alignment
  Given the migrations have been run on a fresh database
  When I inspect "delivery_requests", "driver_profiles", "trips" and "offers"
  Then every column, type, default and enum value matches tech-spects/02_database_schema_and_domain_models.md
  And "php artisan migrate:fresh --seed" exits with code 0
  And the backend test suite passes without skipped tests
```
