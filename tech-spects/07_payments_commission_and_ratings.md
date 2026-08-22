# inHaz — Deep Dive: 07 Payments, Commission & Ratings System

**Document Scope:** Detailed technical specification of the cash payment handshake model, platform commission ledger, driver balance tracking, out-of-band settlement workflows, post-trip rating systems, and complaint resolution pipelines.

---

## 1. Cash Payment Handshake Model (COD)

At the MVP stage, inHaz operates on a direct **Cash-on-Delivery (COD)** model. The client pays the full agreed price directly to the driver in physical currency upon delivery completion.

```
[ Driver App ]                                                        [ Client App ]
      |                                                                      |
      |--- 1. Clicks "Mark Delivered" -------------------------------------->|
      |                                                                      |
      |   +-------------------------------------------------------------+    |
      |   | FLOATING CASH HANDSHAKE BANNER                              |    |
      |   | "Collect 80 MAD Cash from Client upon delivery completion"  |    |
      |   +-------------------------------------------------------------+    |
      |                                                                      |
      |<-- 2. Client Confirms Receipt & Handover ----------------------------|
      |                                                                      |
      |--- 3. Trip Status transitions to `DELIVERED` ----------------------->|
```

### 1.1 Payment Execution Rules
*   No in-app credit card processing or payment gateway integration is required for MVP.
*   The `agreed_price` agreed upon during negotiation represents the exact cash amount handed to the driver.
*   Upon driver marking delivery as complete, a `payments` audit record is automatically generated:
    *   `method`: `cash`
    *   `amount`: `agreed_price`
    *   `status`: `completed`
    *   `transaction_ref`: `COD-{trip_id}`

---

## 2. Platform Commission Ledger & Driver Balance Tracking

Although the client pays the driver in cash, the platform takes a commission percentage (typically 10% to 15%) on each completed trip.

### 2.1 Commission Snapshotting Rule
To protect historical integrity against future system parameter changes:
1.  When an offer is accepted and a `trips` record is created, the backend reads `settings.commission_rate` (e.g. `12.5%`).
2.  The rate is snapshotted directly onto `trips.commission_rate`.
3.  Upon trip completion, `commission_amount` is calculated:
    $$\text{Commission Amount} = \text{agreed\_price} \times \left(\frac{\text{commission\_rate}}{100}\right)$$
4.  Example: For an 80 MAD trip with 12.5% commission rate, `commission_amount` = 10.00 MAD.

### 2.2 Driver Commission Balance Ledger
*   Every completed trip increases the driver's platform debt:
    $$\text{driver\_profiles.commission\_balance} \leftarrow \text{commission\_balance} + \text{commission\_amount}$$
*   The driver can view their current `commission_balance` on their mobile dashboard.

### 2.3 Commission Thresholds & Driver Gating
*   **Maximum Owed Limit (`settings.max_driver_debt`):** Default: 200 MAD.
*   **Gating Enforcement:** If `driver_profiles.commission_balance` exceeds `max_driver_debt`, the API automatically blocks the driver from toggling `is_online = true`, displaying message: *"Commission balance threshold reached (200 MAD). Please settle your platform fees to continue receiving requests."*

### 2.4 Settlement Workflow (Driver Payment to Platform)
1.  The driver pays their accumulated commission to the platform through designated out-of-band channels (e.g., Bank Transfer / Cash Deposit to company account / Wafacash).
2.  Admin verifies payment receipt in the Filament Admin Panel.
3.  Admin uses the **Settle Commission Action** on the driver's profile in Filament.
4.  Admin inputs settled amount (e.g., 200 MAD) and upload reference number.
5.  System decrements `driver_profiles.commission_balance` and records an entry in `commission_settlements` audit table.

---

## 3. Rating & Review System

Post-delivery feedback maintains trust across the peer-to-peer network.

```
+-------------------------------------------------------------------+
|  RATE YOUR DRIVER                                                 |
|  How was your transport with Karim T.?                            |
|                                                                   |
|  ⭐ ⭐ ⭐ ⭐ ⭐  (5/5 Stars)                                         |
|                                                                   |
|  [ Comment: "Excellent service, quick and careful with fridge!" ] |
|                                                                   |
|  [ SUBMIT RATING ]                                                |
+-------------------------------------------------------------------+
```

### 3.1 Rating Submission API (`POST /api/v1/trips/{id}/rating`)
*   **Payload:** `score` (Integer 1-5), `comment` (Text, optional).
*   **Validation & Constraints:**
    *   Trip status MUST be `delivered`.
    *   User can rate each trip ONLY ONCE. Unique index on `ratings(trip_id, reviewer_id)`.
*   **Observer Execution (Server-Side Rating Aggregation):**
    When a new rating is inserted for a driver, a Laravel Model Observer automatically recalculates `driver_profiles.rating_avg` and increments `driver_profiles.total_trips`:
    $$\text{New Rating Avg} = \frac{\sum \text{scores}}{\text{total\_ratings}}$$
*   **Low Rating Warning Flag:** If a driver's `rating_avg` drops below 4.00 stars over their last 10 trips, an automated alert flag is generated in the Filament Admin Panel for review.

---

## 4. Disputes & Complaint Management Pipeline

If an issue arises during or after a trip (e.g., item damaged, price disagreement, improper behavior), either party can open a dispute.

### 4.1 Complaint Submission API (`POST /api/v1/complaints`)
*   **Payload:** `trip_id` (UUID), `category` (Enum: `damage`, `delay`, `unprofessional`, `payment_issue`, `other`), `description` (Text), `photo_urls` (Array of Strings).

### 4.2 Dispute Resolution Workflow
1.  Complaint is logged with status `open` and assigned to Filament Admin Dispute Queue.
2.  Admin inspects linked trip history, full chat transcript logs, package photos, and driver location timestamps directly inside Filament.
3.  Admin executes one of the following Actions:
    *   **Dismiss Complaint:** Mark as unfounded. Set status to `dismissed`.
    *   **Issue Warning:** Send warning notification to accused party. Set status to `resolved`.
    *   **Suspend Account:** Temporarily or permanently set `users.is_active = false` or `driver_profiles.verification_status = 'suspended'`.
    *   **Adjust Commission Balance:** Credit or debit driver's commission balance to resolve financial disputes.
