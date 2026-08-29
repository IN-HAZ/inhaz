# User Story: US-702 — Filament User & Driver Management

**Story ID:** `US-702`
**Epic:** [EPIC-07: Admin Back-Office & Governance](../README.md)
**Role:** Admin
**Priority:** P1

---

## 1. User Story Statement
**As a** platform administrator,  
**I want to** inspect user profiles, review driver document verification, monitor driver earnings and commission balances, block/unblock users, and manually override commission settlements in Filament v5,  
**So that** driver debt compliance and account integrity are strictly maintained.

---

## 2. Implementation Status
* **Backend:** NOT STARTED — Filament v5 resources (`UserResource`, `DriverProfileResource`, `CommissionSettlementAction`) to be implemented in Laravel 13 using Eloquent models.
* **Mobile:** NOT APPLICABLE — Web Admin interface.

---

## 3. Design System & UI Specs
Per `tech-spects/design_system.md` and Filament v5 Admin Design Theme:
* Background: Dark sidebar `#100D14` (240px width) with inHaz dark dashboard surfaces.
* Accent Colors: Electric Purple (`#7928CA`) active link borders, Green (`#00C853`) for clear balance / active status, Red (`#E53935`) for blocked accounts / high debt.
* Document Inspection Gallery: Side-by-side modal displaying driver's 4 required documents:
  1. CIN (Carte d'Identité Nationale)
  2. Carte Grise (Vehicle Registration)
  3. Attestation d'Assurance (Insurance)
  4. Permis Professionnel (Driver License)
* Commission Balance Widget: Table column and detail modal showing total trip earnings, commission balance owed, 200 MAD threshold warning tag, and "Manual Cash Settlement Override" modal action.

---

## 4. Business Rules & Technical Requirements
### 4.1 Driver Verification & Document Scope
* Exactly 4 document types required for driver verification: CIN, Carte Grise, Assurance, Permis Professionnel.
* Admin can approve or reject individual documents with mandatory rejection reason text.

### 4.2 Account Blocking & Unblocking
* Admin can toggle user/driver status to `is_blocked = true`. Blocked users are immediately logged out and forbidden from obtaining Sanctum API tokens.

### 4.3 Commission Balance Manual Settlement Override
* Admin can trigger "Settle Commission Debt" modal action in Filament panel, entering cash payment amount received from driver and optional reference notes.
* Subtracts payment from `driver_profiles.commission_balance` and logs a manual credit record in `commission_ledgers`. If balance drops <= 200 MAD, `is_online` lockout flag is cleared automatically.

---

## 5. Acceptance Criteria (Gherkin)

```gherkin
Scenario: Admin performs manual commission debt settlement override in Filament
  Given driver "Youssef" has commission balance of "215 MAD" and is blocked from going online
  When admin opens driver detail in Filament (/admin/driver-profiles/45)
  And clicks action "Manual Settlement Override", inputs cash collected "215 MAD", and saves
  Then driver commission balance resets to "0 MAD"
  And driver debt lockout status is removed, allowing driver to toggle online

Scenario: Admin blocks offending user account
  Given admin is inspecting a reported client user profile in Filament
  When admin clicks "Block User Account" and submits reason "Fraudulent bidding activity"
  Then user is_blocked flag is set to true and active Sanctum API tokens are revoked
```
