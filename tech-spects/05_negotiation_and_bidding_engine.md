# inHaz — Deep Dive: 05 Negotiation & Bidding Engine

**Document Scope:** Complete technical specification of the reverse-bidding negotiation engine, state transition rules, WebSocket event broadcasting, concurrency control, atomic offer acceptance, and conflict resolution policies.

---

## 1. Reverse-Bidding State Machine & Lifecycle

The negotiation engine governs the interaction between a client posting a transport request and multiple drivers competing for the contract.

```
                    +---------------------+
                    |     [ OPEN ]        |
                    | (Request Created)   |
                    +----------+----------+
                               |
                               | Driver Submits Offer
                               v
                    +---------------------+
                    |   [ NEGOTIATING ]   |
                    | (Offers Streaming)  |
                    +----------+----------+
                               |
                               | Client Accepts Offer
                               v
                    +---------------------+
                    |   [ IN_PROGRESS ]   |
                    | (Trip Created)      |
                    +---------------------+
```

### 1.1 Delivery Request States

*   `OPEN`: Request published by client, waiting for first driver bid.
*   `NEGOTIATING`: At least one active offer submitted by a driver. Client is evaluating incoming bids.
*   `IN_PROGRESS`: Client has accepted an offer. Offer locked, trip initialized, driver dispatched.
*   `COMPLETED`: Delivery executed successfully and marked complete by driver.
*   `CANCELLED`: Request cancelled by client prior to pickup or aborted due to non-acceptance.

### 1.2 Offer States

*   `PENDING`: Bid submitted by driver, awaiting client action.
*   `COUNTERED`: Client sent a counter-price proposition back to the driver.
*   `ACCEPTED`: Selected by client as winning bid.
*   `REJECTED`: Declined by client or automatically rejected when another offer was accepted.
*   `EXPIRED`: Bid timed out after expiration window (default: 15 minutes without response).

---

## 2. Driver Bidding Mechanics

When an online driver views a request, they can choose from three bidding actions:

1.  **Accept Proposed Price:** Submits an offer matching exact client `proposed_price`.
2.  **Quick Percentage Increments:**
    *   `+10%`: `offered_price` = $\text{proposed\_price} \times 1.10$ (rounded up to nearest MAD).
    *   `+20%`: `offered_price` = $\text{proposed\_price} \times 1.20$ (rounded up to nearest MAD).
3.  **Custom Counter Price:** Driver inputs a custom MAD value. Must be equal to or greater than `settings.min_price`.

### 2.1 Bidding API (`POST /api/v1/offers`)
*   **Headers:** `Authorization: Bearer <token>`
*   **Payload:** `delivery_request_id` (UUID), `offered_price` (Decimal), `eta_minutes` (Integer).
*   **Validation Rules:**
    *   Driver MUST have `verification_status = 'approved'` and `is_online = true`.
    *   Driver CANNOT bid on their own request (if acting as client).
    *   Request status MUST be `open` or `negotiating`.
    *   Driver cannot have an existing `pending` offer on the same request (must update existing offer).
*   **Side Effects:**
    *   Inserts record into `offers` table with status `pending`.
    *   If request status was `open`, transitions `delivery_requests.status` to `negotiating`.
    *   Triggers Laravel Event `OfferSubmitted`, which broadcasts payload to private Echo channel `private-request.{id}`.

---

## 3. Real-Time Bid Streaming via WebSockets

Bids stream instantaneously to the client app without requiring manual pull-to-refresh.

```
[ Driver App ]            [ Laravel API ]           [ Reverb WebSockets ]         [ Client App ]
      |                          |                            |                         |
      |-- 1. POST /offers ------>|                            |                         |
      |                          |-- 2. DB Insert Offer ----->|                         |
      |                          |-- 3. Broadcast Event ----->|                         |
      |                          |   (OfferSubmitted)         |--- 4. Push via Echo --->|
      |<-- 5. HTTP 201 Created --|                            |    (private-request.id) |
```

### 3.1 Broadcast Payload (`OfferSubmitted` Event)
Channel: `private-request.{delivery_request_id}`
Event Name: `offer.submitted`
Payload:
*   `offer_id`: UUID
*   `offered_price`: Decimal (e.g. `85.00`)
*   `eta_minutes`: Integer (e.g. `5`)
*   `driver`:
    *   `id`: UUID
    *   `name`: String (e.g. "Karim T.")
    *   `rating`: Decimal (e.g. `4.90`)
    *   `total_trips`: Integer (e.g. `142`)
    *   `vehicle_type`: Enum (`triporteur`)
    *   `distance_from_pickup_km`: Decimal (e.g. `1.2`)

---

## 4. Offer Acceptance & Concurrency Control Mechanics

A major technical challenge in reverse-bidding systems is preventing race conditions where a client accepts an offer while another driver cancels or two client actions overlap.

```
                  Client Clicks "Accept Offer X"
                               |
                               v
               +-------------------------------+
               | Start DB Transaction          |
               +---------------+---------------+
                               |
                               v
               +-------------------------------+
               | Lock Request Row              |
               | (SELECT ... FOR UPDATE)       |
               +---------------+---------------+
                               |
         Is Status STILL 'open' or 'negotiating'?
                   /               \
                 YES                NO
                 /                    \
                v                      v
+-------------------------------+  +-------------------------------+
| 1. Set Offer X = 'accepted'   |  | Rollback Transaction          |
| 2. Set All Other Offers =     |  | Return HTTP 409 Conflict      |
|    'rejected'                 |  | ("Request no longer available"|
| 3. Set Request = 'in_progress'|  +-------------------------------+
| 4. Create Trip Record         |
| 5. Commit Transaction         |
+---------------+---------------+
                |
                v
+-------------------------------+
| Broadcast Events:             |
| - OfferAccepted to Driver X   |
| - RequestClosed to others     |
+-------------------------------+
```

### 4.1 Transactional Guarantee & Row Locking

The acceptance API endpoint (`POST /api/v1/requests/{id}/accept`) executes strictly inside a database transaction:

1.  **Row Locking:** Executes `DB::table('delivery_requests')->where('id', $id)->lockForUpdate()->first()`. This prevents any concurrent API request from reading or modifying the request status until the current transaction completes.
2.  **Status Check:** Verifies that request status is `open` or `negotiating`. If status is already `in_progress` or `cancelled`, rolls back transaction and returns HTTP 409 Conflict.
3.  **Winning Offer Status:** Updates selected offer record status to `accepted`.
4.  **Bulk Rejection:** Updates all other pending offers for this request: `UPDATE offers SET status = 'rejected' WHERE delivery_request_id = $id AND id != $accepted_offer_id`.
5.  **Request Transition:** Updates request status to `in_progress`.
6.  **Trip Record Generation:** Creates a new `trips` record linking `delivery_request_id`, `driver_id`, `customer_id`, agreed final price, and snapshots current `commission_rate`.
7.  **Transaction Commit:** Commits all changes atomically to database.
8.  **Event Dispatch:**
    *   `OfferAccepted` event broadcast to winning driver (`private-user.{driver_id}`).
    *   `OfferRejected` events broadcast to non-winning drivers (`private-user.{other_driver_id}`).
