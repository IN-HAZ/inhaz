# Epic 08: Database Foundation, Schema Integrity & Ledger

**Epic ID:** `EPIC-08`
**Title:** Schema–Spec Alignment, Missing Domain Tables, Commission Ledger & Data Integrity
**Priority:** P0 (Blocker — unblocks EPIC-04/05/06/07)
**Target Release:** MVP Sprint 1 (must land before or with Sprint 2 features)

---

## 1. Executive Summary
Audit of `backend/database/migrations/` against `tech-spects/02_database_schema_and_domain_models.md`, `06_trip_execution_tracking_and_chat.md`, `07_payments_commission_and_ratings.md` and `08_admin_panel_filament_spec.md` reveals critical schema drift: missing geospatial columns on `delivery_requests`, missing operational columns on `driver_profiles` (`is_online`, GPS position, `rating_avg`, `commission_balance`), missing commission snapshot columns on `trips`, and six spec'd tables that do not exist yet (`messages`, `payments`, `commission_settlements`, `system_settings`, `complaints`, `audit_logs`). This epic makes the database the single source of truth aligned with the specs, so downstream epics (bidding engine, trip tracking, payments, admin) build on stable foundations.

---

## 2. Included User Stories

| Story ID | Title | Summary | Priority |
| :--- | :--- | :--- | :--- |
| **US-801** | [Schema Drift Alignment](us-801-schema-drift-alignment/README.md) | Align existing tables (`users`, `driver_profiles`, `delivery_requests`, `offers`, `trips`) with spec 02: geo columns, enums, naming. | P0 |
| **US-802** | [Missing Domain Tables](us-802-missing-domain-tables/README.md) | Create `messages`, `payments`, `commission_settlements`, `system_settings`, `complaints`, `audit_logs`. | P0 |
| **US-803** | [Commission Ledger Schema](us-803-commission-ledger-schema/README.md) | Commission snapshot columns on `trips`, balance tracking on `driver_profiles`, settlement audit trail. | P0 |
| **US-804** | [Indexes, Constraints & Performance](us-804-indexes-constraints-performance/README.md) | Composite indexes for geospatial/bidding/trip lookups, FK integrity policies, seeders. | P1 |

---

## 3. Epic Acceptance Criteria
*   Every table in `tech-spects/02_database_schema_and_domain_models.md` exists in migrations with matching columns, enums and nullability.
*   `php artisan migrate:fresh --seed` runs green from a clean clone.
*   All foreign keys declare explicit `cascadeOnDelete()` / `restrictOnDelete()` per business criticality.
*   Spec-mandated composite indexes exist (geospatial bounding-box, offers lookup, active-trip lookup).
*   No enum uses `SCREAMING_CASE`; values match spec vocabularies exactly (e.g., `heading_to_pickup`, not `DRIVER_EN_ROUTE`).
*   A schema drift checklist doc is added to `tech-spects/02_database_schema_and_domain_models.md` appendix confirming 100% coverage.

---

## 4. Dependencies & Impact
*   **Blocks:** EPIC-03 (geo columns), EPIC-04 (offers/feed indexes), EPIC-05 (`messages`, trips enums), EPIC-06 (ledger), EPIC-07 (`system_settings`, `audit_logs`, `complaints`).
*   **Migration strategy:** new columns on existing tables ship as additive migrations; destructive enum renames require `migrate:fresh` sign-off since project is pre-production.
