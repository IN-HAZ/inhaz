# inHaz — Deep Dive: 08 Admin Panel & Back-Office (Filament Spec)

**Document Scope:** Detailed specification for the internal administration back-office, built using Filament v5 (Laravel/Livewire), security controls, admin resources, document verification gallery UX, dispute management queues, system setting controls, and audit trail logging.

---

## 1. Back-Office Architecture & Security Controls

The admin panel is built using **Filament v5**, running server-side within the Laravel monolith. It eliminates the need to build a separate React/SPA front-end for internal tools.

```
+-------------------------------------------------------------------+
| FILAMENT ADMIN PANEL PANEL SECURITY                               |
|                                                                   |
| 1. Separate Guard: `admin` guard (distinct from Sanctum `api`)    |
| 2. URL Prefix: `/admin`                                           |
| 3. Mandatory Multi-Factor Auth (2FA / TOTP)                       |
| 4. Role-Based Access Control (RBAC via Spatie Laravel-Permission) |
+-------------------------------------------------------------------+
```

### 1.1 Authentication & Isolation
*   Admin authentication uses a dedicated session guard (`admin`), preventing mobile API tokens from accessing admin routes.
*   Admin user accounts are managed separately with forced two-factor authentication (2FA) before panel access is granted.

---

## 2. Filament Resources & Operational Tooling

### 2.1 User Management (`UserResource`)
*   **Table View:** Lists clients and drivers. Columns: Name, Phone, Role Badge (`client` / `driver`), Status (`Active` / `Suspended`), Created Date.
*   **Search & Filters:** Searchable by Name or Phone number; filterable by Role or Status.
*   **Actions:**
    *   `Block / Suspend User`: Sets `users.is_active = false`. Immediately revokes all active Sanctum tokens.
    *   `Unblock User`: Restores account access.
    *   `View History`: Relation manager showing past delivery requests or completed trips.

---

### 2.2 Driver Verification & Inspection (`DriverResource`)
Dedicated back-office tool for onboarding drivers and reviewing submitted credentials.

```
+-------------------------------------------------------------------------------+
| FILAMENT DRIVER VERIFICATION GALLERY                                          |
| Driver: Hassan M. | Vehicle: Peugeot Partner (Van) | Status: PENDING          |
+-------------------------------------------------------------------------------+
|  [ CIN Front ]           [ CIN Back ]            [ Carte Grise ]              |
|  +--------------------+  +--------------------+  +--------------------+       |
|  | (Image Preview)    |  | (Image Preview)    |  | (Image Preview)    |       |
|  +--------------------+  +--------------------+  +--------------------+       |
|                                                                               |
|  [ Insurance Cert ]      [ Driver License ]                                   |
|  +--------------------+  +--------------------+                               |
|  | (Image Preview)    |  | (Image Preview)    |                               |
|  +--------------------+  +--------------------+                               |
|                                                                               |
|  ACTIONS:                                                                     |
|  [ 🟢 APPROVE ALL DOCUMENTS ]   [ 🔴 REJECT WITH REASON ]                      |
+-------------------------------------------------------------------------------+
```

*   **Document Inspection Gallery:** Displays temporary signed S3 image URLs of CIN, Carte Grise, Insurance, and License side-by-side.
*   **Single-Click Actions:**
    *   `Approve Driver`: Atomically updates `driver_documents.status` and sets `driver_profiles.verification_status = 'approved'`. Sends Push Notification to driver.
    *   `Reject Driver`: Opens modal demanding rejection reason per document. Sets status to `rejected` and sends notification.
*   **Bulk Actions:** Supports selecting multiple pending drivers from the table and bulk-approving credentials in a single transaction.

---

### 2.3 Delivery Request Inspector (`RequestResource`)
*   **Table View:** Comprehensive overview of all posted delivery requests. Columns: ID, Client Name, Pickup Address, Dropoff Address, Proposed Price, Status Badge (`open`, `negotiating`, `in_progress`, `completed`, `cancelled`).
*   **Filters:** Filter by Status, Date Range, Vehicle Type required, or City.
*   **Admin Override Actions:**
    *   `Cancel Request`: Force-cancel an active request in case of system error or dispute.
    *   `View Offers`: Modal displaying all bids submitted by drivers for this request.

---

### 2.4 Dispute & Complaint Queue (`ComplaintResource`)
*   **Queue View:** Filters open complaints by category (`damage`, `delay`, `unprofessional`, `payment_issue`).
*   **Transcript & Evidence Viewer:** Infolist section showing linked request details, photo attachments of damaged goods, and full real-time chat log transcript between client and driver.
*   **Resolution Actions:**
    *   `Resolve & Warn`: Closes complaint and dispatches warning notification to driver or client.
    *   `Suspend Driver`: Immediately suspends driver verification status.
    *   `Commission Adjustment`: Credits driver commission balance if unfair charges were incurred.

---

### 2.5 System Configuration Page (`SystemSettingsPage`)
A custom Filament Page allowing administrators to update platform parameters without code deployments.

```
+-------------------------------------------------------------------+
| PLATFORM SYSTEM SETTINGS                                          |
+-------------------------------------------------------------------+
|  Commission Rate (%):                     [ 12.5 ] %              |
|  Minimum Base Price (MAD):                [ 20.00 ] MAD           |
|  Maximum Driver Debt Threshold (MAD):     [ 200.00 ] MAD          |
|                                                                   |
|  PRICING GRID PER KM:                                             |
|  - Triporteur: Base [ 25.00 ] MAD | Per KM [ 4.00 ] MAD           |
|  - Van:        Base [ 50.00 ] MAD | Per KM [ 7.00 ] MAD           |
|  - Truck:      Base [ 100.00] MAD | Per KM [ 12.00] MAD           |
|                                                                   |
|  [ SAVE CONFIGURATION ]                                           |
+-------------------------------------------------------------------+
```

---

## 3. Audit Logging & Admin Accountability System

Every write action executed within the Filament Admin Panel is automatically logged to an audit table (`admin_audit_logs`) via model events:
*   `admin_id`: Foreign Key (`users.id`)
*   `action`: String (e.g. `driver.approved`, `user.blocked`, `settings.updated`)
*   `target_type`: String (e.g. `DriverProfile`)
*   `target_id`: String / UUID
*   `old_values`: JSON (Snapshot of entity state before modification)
*   `new_values`: JSON (Snapshot of entity state after modification)
*   `ip_address`: String
*   `created_at`: Timestamp
