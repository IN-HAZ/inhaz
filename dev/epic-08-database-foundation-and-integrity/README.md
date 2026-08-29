# Epic 08: Database Foundation, Schema Integrity & Ledger

**Epic ID:** `EPIC-08`
**Title:** Schema–Spec Alignment, Missing Domain Tables, Commission Ledger & Data Integrity
**Priority:** P0 (Blocker — unblocks EPIC-04/05/06/07/10)
**Target Release:** MVP Sprint 1

---

## 1. Executive Summary
Audit of `backend/database/migrations/` against technical specifications reveals schema drift and missing domain tables across core modules. This epic establishes database schema completeness, including missing geospatial columns, commission ledger snapshots, missing support/integrity tables (`saved_addresses`, `content_pages`, `faq_items`, `messages`, `payments`, `commission_settlements`, `system_settings`, `complaints`, `audit_logs`), and user localization preferences via the `users.locale` column. All migration schemas adhere to strict foreign key constraints, composite index performance policies, and multi-language/geospatial data models required for the inHaz platform.

---

## 2. Included User Stories

| Story ID | Title | Summary | Priority |
| :--- | :--- | :--- | :--- |
| **US-801** | [Schema Drift Alignment](us-801-schema-drift-alignment/README.md) | Align existing tables (`users`, `driver_profiles`, `delivery_requests`, `offers`, `trips`) with spec: geo columns, enums, naming, `locale`. | P0 |
| **US-802** | [Missing Domain Tables & Content Schemas](us-802-missing-domain-tables/README.md) | Create missing domain tables: `saved_addresses`, `content_pages`, `faq_items`, `messages`, `payments`, `commission_settlements`, `system_settings`, `complaints`, `audit_logs`. | P0 |
| **US-803** | [Commission Ledger Schema](us-803-commission-ledger-schema/README.md) | Commission snapshot columns on `trips`, balance tracking on `driver_profiles`, settlement audit trail. | P0 |
| **US-804** | [Indexes, Constraints & Performance](us-804-indexes-constraints-performance/README.md) | Composite indexes for geospatial/bidding/trip lookups, FK integrity policies, seeders. | P1 |

---

## 3. Epic Acceptance Criteria
* Every table defined in technical specs exists in Laravel migrations with matching column types, UUID primary keys, and exact nullability rules.
* The `saved_addresses` table exists with UUID primary key, composite index on `user_id`, and coordinates (`lat`, `lng`).
* The `content_pages` table exists with unique `slug`, `locale`, and Markdown `body_md`.
* The `faq_items` table exists with `category`, `question`, `answer`, and `sort_order`.
* The `users` table includes the `locale` column (defaulting to `fr`).
* `php artisan migrate:fresh --seed` runs successfully without errors on a clean PostgreSQL setup.
* Foreign keys declare explicit `cascadeOnDelete()` or `restrictOnDelete()` rules per domain isolation policies.
* Spec-mandated composite indexes exist (geospatial bounding-box, offers lookup, active-trip lookup, user saved addresses).
