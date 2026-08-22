# inHaz — Deep Dive: 03 Auth, Onboarding & Verification

**Document Scope:** Specifications for phone-based OTP authentication, Sanctum token management, dual-role state handling, driver onboarding workflow, document uploading, and administrative document verification pipelines.

---

## 1. Phone OTP Authentication Workflow

Authentication in inHaz is entirely passwordless, driven by SMS One-Time Passwords (OTP).

```
[ User App ]                    [ Laravel API ]                 [ SMS Provider ]
     |                                 |                               |
     |--- 1. Send Phone Number ------->|                               |
     |    (POST /auth/otp/request)     |--- 2. Generate 6-Digit OTP --->|
     |                                 |--- 3. Send SMS (Twilio/etc) ->|
     |<-- 4. HTTP 200 (OTP Dispatched)-|                               |
     |                                 |                               |
     |--- 5. Submit 6-Digit Code ----->|                               |
     |    (POST /auth/otp/verify)      |--- 6. Verify against Redis -->|
     |                                 |--- 7. Find/Create User ------>|
     |                                 |--- 8. Issue Sanctum Token --->|
     |<-- 9. HTTP 200 + Bearer Token --|                               |
```

### 1.1 Step-by-Step Execution Rules

1.  **OTP Request Endpoint (`POST /api/v1/auth/otp/request`):**
    *   Input: `phone` (String, validated using regex for Moroccan / local phone standards e.g. `+212...`).
    *   **Throttling Rule:** Checked via Redis rate limiter. Maximum 1 request per phone number every 60 seconds. Maximum 5 requests per IP address per hour.
    *   **Generation & Storage:** Generates a 6-digit numeric string (e.g. `482910`). Hashes the code using bcrypt or SHA-256 and stores it in Redis with key `otp:{phone}` and a hard expiration (TTL) of 300 seconds (5 minutes).
    *   **Dispatch:** Asynchronously dispatches a queued Job (`SendSmsJob`) to transmit the code via SMS Provider (e.g. Twilio / MessageBird / local gateway).

2.  **OTP Verification Endpoint (`POST /api/v1/auth/otp/verify`):**
    *   Input: `phone` (String), `code` (String, 6 digits).
    *   **Validation Rule:** Checks Redis key `otp:{phone}`. If key does not exist, returns HTTP 422 ("OTP expired or invalid").
    *   **Attempts Counter:** Increments an attempt counter `otp_attempts:{phone}` in Redis. If attempts exceed 3, key is deleted and user must request a new OTP.
    *   **User Provisioning:** Upon code match, deletes `otp:{phone}` key. Searches `users` table by `phone`.
        *   If user exists: Fetches existing account.
        *   If user does not exist: Atomically creates new `users` record (role defaults to `client`), creates associated `customer_profiles` record.
    *   **Token Generation:** Generates a Laravel Sanctum personal access token (e.g., `inHaz-Mobile-App`).
    *   **Response Payload:** Returns user object, active role, customer/driver profile data, and the plain-text Bearer Token.

---

## 2. Dual-Role Management & State Switching

An inHaz user can act as both a Client (shipping goods) and a Driver (delivering goods).

### 2.1 Role Mechanics
*   The `users.role` field tracks default privileges (`client` or `driver`).
*   The token carries user identity, not static privileges. Authorization is dynamically verified on every request using API middleware and Policies.
*   **Switching to Driver Mode:**
    1.  User clicks "Switch to Driver" in profile menu.
    2.  App checks `driver_profiles` for the user.
    3.  If no `driver_profiles` record exists, app initiates **Driver Onboarding Flow**.
    4.  If `driver_profiles` exists, API evaluates `driver_profiles.verification_status`:
        *   `unsubmitted`: Redirects to Document Upload screen.
        *   `pending`: Displays banner "Verification under review by Admin". Driver features locked.
        *   `rejected`: Displays rejection reasons. Driver features locked.
        *   `approved`: Unlocks Driver Mode toggle, enabling `is_online` status switch.

---

## 3. Driver Onboarding & Document Pipeline

```
+------------------+     Upload      +-------------------+    Submit    +--------------------+
| Driver Onboarding|---------------->| Driver Documents  |------------->| Verification Status|
| Screen (Mobile)  |  (POST /docs)   | (S3 Storage)      |              | Set to PENDING     |
+------------------+                 +-------------------+              +---------+----------+
                                                                                  |
                                                                                  v
+------------------+   Approve /     +-------------------+   Filament   +--------------------+
| Driver Mode      |<----------------| Driver Status     |<-------------| Admin Verification |
| Unlocked         |   Reject Action | Set to APPROVED   |   Action     | Resource (Web)     |
+------------------+                 +-------------------+              +--------------------+
```

### 3.1 Document Upload Requirements
A driver must submit five mandatory document items:
1.  National Identity Card (CIN) – Front Photo
2.  National Identity Card (CIN) – Back Photo
3.  Vehicle Registration (`Carte Grise`) Photo
4.  Vehicle Insurance Certificate Photo
5.  Driver's License Photo

### 3.2 Document Upload API (`POST /api/v1/driver/documents`)
*   **Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`.
*   **Inputs:** `type` (Enum: `cin_front`, `cin_back`, `carte_grise`, `insurance`, `license`), `file` (Image file: JPEG/PNG, max 10MB), `expires_at` (Date, optional depending on document type).
*   **Processing:**
    *   Validates file MIME type and size.
    *   Uploads file to private S3 bucket (`secure-documents/{driver_id}/{type}_{timestamp}.jpg`).
    *   Creates or updates `driver_documents` record with `status = 'pending'`.
    *   Sets `driver_profiles.verification_status = 'pending'`.

### 3.3 Admin Verification Workflow (Filament Back-Office)
1.  Admin navigates to **Driver Verification Resource** in Filament panel.
2.  Filament table displays drivers with `verification_status = 'pending'`.
3.  Admin clicks driver detail to view side-by-side document inspection gallery.
4.  System displays temporary signed URLs (valid 15 minutes) to render document images without exposing public S3 links.
5.  **Admin Action — Approve:**
    *   Sets all pending `driver_documents.status` to `approved`.
    *   Sets `driver_profiles.verification_status = 'approved'`.
    *   Triggers Push Notification to driver: "Your driver documents have been approved! You can now go online."
6.  **Admin Action — Reject:**
    *   Admin selects specific document(s) and inputs rejection reason (e.g., "Insurance document expired").
    *   Sets selected `driver_documents.status = 'rejected'` and updates `rejection_reason`.
    *   Sets `driver_profiles.verification_status = 'rejected'`.
    *   Triggers Push Notification to driver: "Document verification update required. Please check rejected documents."

---

## 4. Security & Access Control Policies

*   **Middleware Enforcement:** All driver-centric endpoints (`/api/v1/driver/*`) pass through `EnsureDriverIsApproved` middleware.
*   **API Response for Unapproved Access:** If a driver attempts to query nearby requests (`GET /api/v1/requests/nearby`) or set online status (`POST /api/v1/driver/online`) while status is not `approved`, API returns HTTP 403 Forbidden with payload:
    `{ "error": "DRIVER_NOT_APPROVED", "status": "pending" }`.
