# inHaz — Deep Dive: 06 Trip Execution, Tracking & In-App Chat

**Document Scope:** Detailed specification for post-acceptance trip execution, status steppers, real-time driver GPS tracking architecture, Redis location caching, WebSocket streaming, integrated chat system, and cancellation policy enforcement.

---

## 1. Trip Execution Lifecycle & Status Stepper

Once an offer is accepted, the delivery transitions into an active **Trip**. Execution is driven by the driver stepping through explicit milestone statuses.

```
[ Offer Accepted ] ---> [ HEADING_TO_PICKUP ]
                               |
                               v
                        [ ARRIVED_PICKUP ]
                               |
                               v
                        [ CARGO_COLLECTED ]
                               |
                               v
                        [ EN_ROUTE_DROPOFF ]
                               |
                               v
                        [ DELIVERED ] ---> [ Cash Handshake & Rating ]
```

### 1.1 Status Milestones & Rules

1.  `HEADING_TO_PICKUP`: Driver has accepted job and is navigating towards pickup location.
2.  `ARRIVED_PICKUP`: Driver arrives at pickup coordinates. Triggers Push Notification to client: "Driver has arrived at pickup location."
3.  `CARGO_COLLECTED`: Goods inspected and loaded onto vehicle. Client cancellation window CLOSES.
4.  `EN_ROUTE_DROPOFF`: Driver is navigating to destination / dropoff points.
5.  `DELIVERED`: Driver arrives at dropoff and completes delivery. Triggers Cash Payment handshake screen on both apps.

---

## 2. Driver Real-Time GPS Tracking Architecture

To deliver a smooth live-tracking experience on the client's map without overwhelming the relational database with thousands of GPS pings per minute, location updates utilize an **ephemeral Redis storage + WebSocket broadcast pipeline**.

```
[ Driver Mobile App ]                    [ Laravel API ]               [ Redis Ephemeral ]           [ Reverb WebSockets ]         [ Client App ]
         |                                      |                               |                             |                         |
         |-- 1. GPS Ping (Every 5s) ----------->|                               |                             |                         |
         |    (POST /trips/{id}/location)       |-- 2. Store in Redis --------->|                             |                         |
         |                                      |   (`driver_loc:{id}`)         |                             |                         |
         |                                      |-- 3. Broadcast Event ---------+---------------------------->|                         |
         |                                      |   (DriverLocationUpdated)     |                             |--- 4. Render Pin Move ->|
         |<-- 5. HTTP 200 OK -------------------|                               |                             |    (private-trip.id)   |
```

### 2.1 Location Ping API (`POST /api/v1/trips/{id}/location`)
*   **Headers:** `Authorization: Bearer <token>`
*   **Frequency:** Throttled at mobile client level to 1 ping every 5 seconds while in active trip.
*   **Payload:** `latitude` (Decimal), `longitude` (Decimal), `heading` (Decimal/Degrees 0-360), `speed` (Decimal m/s).

### 2.2 Redis Ephemeral Cache Strategy
*   Location data is NOT written to PostgreSQL/MySQL per ping.
*   Updated directly in Redis hash: `HSET driver_loc:{driver_id} lat {lat} lng {lng} heading {heading} updated_at {timestamp}`.
*   Key TTL set to 60 seconds (automatically cleared if driver goes offline or disconnects).

### 2.3 WebSocket Broadcast & Client Map Rendering
*   API dispatches `DriverLocationUpdated` event to channel `private-trip.{trip_id}`.
*   Client app listens to `DriverLocationUpdated` via Echo.
*   Client map smoothly animates driver marker icon (triporteur, van, or truck) between coordinates using interpolation (bearing/heading calculated for smooth rotation).

---

## 3. Integrated In-App Chat & Messaging Architecture

Communication between client and driver is essential for clarifying pickup instructions or exact dropoff gates.

```
+-----------------------------------------------------------------------------------+
|  Chat Thread Component (Scoped to active trip_id)                                  |
|  [ Client ] "Je suis devant l'entrée principale du bâtiment B."                   |
|  [ Driver ] "Parfait, j'arrive dans 2 minutes avec le triporteur."                |
+-----------------------------------------------------------------------------------+
|  📷 [ Attach Photo ]  |  [ Type message... ]                      |  [ SEND ]     |
+-----------------------------------------------------------------------------------+
```

### 3.1 Messaging Rules & Access Control
*   Chat is strictly scoped to an active `request_id` / `trip_id`.
*   Channel access is gated by `MessagePolicy`: Only the authenticated client and assigned driver of that request can read/write messages.
*   Chat thread becomes **Read-Only** 2 hours after trip completion and is archived.

### 3.2 Message Dispatch API (`POST /api/v1/messages`)
*   **Payload:** `request_id` (UUID), `content` (String, max 1000 chars), `image` (File, optional image attachment).
*   **Processing:**
    *   Saves record in `messages` table storing `sender_id`, `request_id`, `content`, and optional `photo_url`.
    *   Broadcasts `MessageSent` event to `private-request.{request_id}`.
    *   If recipient is not currently connected to WebSocket channel, dispatches queued Push Notification (`ExpoPushNotificationJob`) to recipient device: *"New message from [Sender Name]: [Content preview]"*.

---

## 4. Cancellation Policies & Exceptions Management

Either party may need to cancel a delivery request under certain circumstances.

### 4.1 Client Cancellation Rules
*   **Pre-Pickup Cancellation (Status = `open`, `negotiating`, or `heading_to_pickup`):**
    *   Allowed without financial penalty.
    *   Sets `delivery_requests.status = 'cancelled'`.
    *   If trip was created (`heading_to_pickup`), sets `trips.status = 'cancelled'`.
    *   Notifies assigned driver via WebSockets & Push Notification.
*   **Post-Pickup Cancellation (Status = `cargo_collected` or `en_route_dropoff`):**
    *   Client CANNOT cancel directly via mobile app once cargo is loaded.
    *   Client must contact Support / Admin or call driver directly. Prevents driver stranding with loaded goods.

### 4.2 Driver Cancellation Rules
*   If driver cancels after offer acceptance (`heading_to_pickup`):
    *   Driver sets cancellation reason.
    *   `trips.status = 'cancelled'`.
    *   Request reverts to `open` state, allowing other drivers to bid.
    *   Repeated driver cancellations trigger automated warning flag in Filament Admin Panel.
