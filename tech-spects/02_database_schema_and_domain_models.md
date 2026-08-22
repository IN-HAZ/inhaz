# inHaz — Deep Dive: 02 Database Schema & Domain Models

**Document Scope:** Detailed specifications of data entities, attributes, data types, relationships, indexes, constraints, state definitions, and data integrity policies for the inHaz platform.

---

## 1. Entity Relationship Overview

The domain model separates identity, logistics requests, negotiation mechanics, execution tracking, and administrative governance.

```
+---------------+        1:1        +-------------------+
|     Users     |<----------------->|  CustomerProfile  |
+-------+-------+                   +-------------------+
        |
        | 1:1                       +-------------------+
        +-------------------------->|   DriverProfile   |
        |                           +---------+---------+
        |                                     |
        | 1:N                                 | 1:N
        v                                     v
+-------+-------+                   +---------+---------+
|  Otps / Auth  |                   | DriverDocuments   |
+---------------+                   +-------------------+
        |
        | 1:N (as Client)
        v
+-------+-------+        1:N        +-------------------+
|DeliveryRequest|<----------------->|   RequestStops    |
+---+---+-------+                   +-------------------+
    |   |                1:N        +-------------------+
    |   +-------------------------->|   RequestPhotos   |
    |                               +-------------------+
    | 1:N                                     ^
    v                                         |
+---+-----------+        1:1        +---------+---------+
|    Offers     |------------------>|       Trips       |
+---------------+ (Accepted Offer)  +---------+---------+
                                              |
                                              | 1:1
                                              v
                                    +---------+---------+
                                    | Ratings / Payments|
                                    +-------------------+
```

---

## 2. Detailed Data Dictionary & Schema Specifications

### 2.1 Identity & Profiles

#### Table: `users`
Primary identity store for both clients and drivers.
*   `id`: BigAuto / UUID (Primary Key)
*   `phone`: String (Unique, Indexed, E.164 format e.g., `+212600000000`)
*   `name`: String (Nullable until profile completed)
*   `email`: String (Nullable, Unique)
*   `role`: Enum (`client`, `driver`, `admin`) — Default: `client`
*   `is_active`: Boolean — Default: `true` (Used for account suspension)
*   `language`: Enum (`ar`, `fr`, `en`) — Default: `fr`
*   `created_at`, `updated_at`: Timestamps

#### Table: `customer_profiles`
Extended profile information for client operations.
*   `id`: BigAuto / UUID (Primary Key)
*   `user_id`: Foreign Key (`users.id`, 1:1, On Delete Cascade)
*   `avatar_url`: String (Nullable)
*   `total_requests`: Integer — Default: `0`
*   `created_at`, `updated_at`: Timestamps

#### Table: `driver_profiles`
Extended profile information for driver operations.
*   `id`: BigAuto / UUID (Primary Key)
*   `user_id`: Foreign Key (`users.id`, 1:1, On Delete Cascade)
*   `vehicle_id`: Foreign Key (`vehicles.id`, Nullable, FK)
*   `verification_status`: Enum (`unsubmitted`, `pending`, `approved`, `rejected`, `suspended`) — Default: `unsubmitted`
*   `is_online`: Boolean — Default: `false`
*   `current_latitude`: Decimal(10,8) (Nullable, Indexed for spatial queries)
*   `current_longitude`: Decimal(11,8) (Nullable, Indexed for spatial queries)
*   `rating_avg`: Decimal(3,2) — Default: `5.00`
*   `total_trips`: Integer — Default: `0`
*   `commission_balance`: Decimal(10,2) — Default: `0.00` (Owed platform commission in local currency)
*   `created_at`, `updated_at`: Timestamps

#### Table: `vehicles`
Vehicle classification and specifications.
*   `id`: BigAuto / UUID (Primary Key)
*   `driver_profile_id`: Foreign Key (`driver_profiles.id`, FK)
*   `type`: Enum (`triporteur`, `van`, `truck`)
*   `brand_model`: String (e.g., "Docker 200cc", "Peugeot Partner")
*   `license_plate`: String (Unique)
*   `max_weight_kg`: Integer (e.g., 300 for triporteur, 800 for van, 2000 for truck)
*   `created_at`, `updated_at`: Timestamps

#### Table: `driver_documents`
Verification assets submitted by drivers.
*   `id`: BigAuto / UUID (Primary Key)
*   `driver_profile_id`: Foreign Key (`driver_profiles.id`, FK, On Delete Cascade)
*   `type`: Enum (`cin_front`, `cin_back`, `carte_grise`, `insurance`, `license`)
*   `file_path`: String (Path in secure storage bucket)
*   `status`: Enum (`pending`, `approved`, `rejected`) — Default: `pending`
*   `rejection_reason`: String (Nullable, text explaining why rejection occurred)
*   `expires_at`: Date (Nullable, for tracking document expiration)
*   `created_at`, `updated_at`: Timestamps

---

### 2.2 Logistics & Bidding

#### Table: `delivery_requests`
Core delivery demand posted by clients.
*   `id`: BigAuto / UUID (Primary Key)
*   `customer_id`: Foreign Key (`users.id`, FK)
*   `origin_address`: String (Human-readable address)
*   `origin_latitude`: Decimal(10,8) (Indexed)
*   `origin_longitude`: Decimal(11,8) (Indexed)
*   `destination_address`: String (Human-readable address)
*   `destination_latitude`: Decimal(10,8)
*   `destination_longitude`: Decimal(11,8)
*   `required_vehicle_type`: Enum (`any`, `triporteur`, `van`, `truck`) — Default: `any`
*   `description`: Text (Details about package, dimensions, handling needs)
*   `proposed_price`: Decimal(10,2) (Initial client proposed price in MAD)
*   `distance_km`: Decimal(8,2) (Calculated trip distance)
*   `status`: Enum (`open`, `negotiating`, `in_progress`, `completed`, `cancelled`) — Default: `open`
*   `cancellation_reason`: String (Nullable)
*   `created_at`, `updated_at`: Timestamps

#### Table: `request_stops`
Intermediate waypoints between origin and destination.
*   `id`: BigAuto / UUID (Primary Key)
*   `delivery_request_id`: Foreign Key (`delivery_requests.id`, FK, On Delete Cascade)
*   `stop_order`: Integer (1, 2, 3...)
*   `address`: String
*   `latitude`: Decimal(10,8)
*   `longitude`: Decimal(11,8)
*   `instructions`: String (Nullable)

#### Table: `request_photos`
Photo evidence of goods to be transported.
*   `id`: BigAuto / UUID (Primary Key)
*   `delivery_request_id`: Foreign Key (`delivery_requests.id`, FK, On Delete Cascade)
*   `photo_path`: String (Public bucket path)

#### Table: `offers`
Bids submitted by drivers for a specific request.
*   `id`: BigAuto / UUID (Primary Key)
*   `delivery_request_id`: Foreign Key (`delivery_requests.id`, FK, On Delete Cascade, Indexed)
*   `driver_id`: Foreign Key (`users.id`, FK, Indexed)
*   `offered_price`: Decimal(10,2) (Bidded amount in MAD)
*   `eta_minutes`: Integer (Estimated arrival time to pickup location)
*   `status`: Enum (`pending`, `accepted`, `rejected`, `countered`, `expired`) — Default: `pending`
*   `created_at`, `updated_at`: Timestamps

---

### 2.3 Execution, Payment & Governance

#### Table: `trips`
Active and historical delivery executions.
*   `id`: BigAuto / UUID (Primary Key)
*   `delivery_request_id`: Foreign Key (`delivery_requests.id`, FK, Unique)
*   `offer_id`: Foreign Key (`offers.id`, FK, Unique)
*   `driver_id`: Foreign Key (`users.id`, FK, Indexed)
*   `customer_id`: Foreign Key (`users.id`, FK, Indexed)
*   `agreed_price`: Decimal(10,2) (Final price accepted)
*   `commission_rate`: Decimal(5,2) (Snapshot of platform commission percentage at trip creation, e.g. `12.50`%)
*   `commission_amount`: Decimal(10,2) (Calculated platform fee in MAD)
*   `status`: Enum (`heading_to_pickup`, `arrived_pickup`, `cargo_collected`, `en_route_dropoff`, `delivered`, `cancelled`) — Default: `heading_to_pickup`
*   `started_at`: Timestamp (Nullable)
*   `completed_at`: Timestamp (Nullable)
*   `created_at`, `updated_at`: Timestamps

#### Table: `ratings`
Post-delivery evaluation.
*   `id`: BigAuto / UUID (Primary Key)
*   `trip_id`: Foreign Key (`trips.id`, FK, Unique)
*   `reviewer_id`: Foreign Key (`users.id`, FK)
*   `reviewee_id`: Foreign Key (`users.id`, FK)
*   `score`: Integer (1 to 5)
*   `comment`: Text (Nullable)
*   `created_at`: Timestamp

#### Table: `complaints`
Disputes submitted by clients or drivers.
*   `id`: BigAuto / UUID (Primary Key)
*   `trip_id`: Foreign Key (`trips.id`, FK)
*   `complainant_id`: Foreign Key (`users.id`, FK)
*   `against_id`: Foreign Key (`users.id`, FK)
*   `category`: Enum (`damage`, `delay`, `unprofessional`, `payment_issue`, `other`)
*   `description`: Text
*   `status`: Enum (`open`, `under_investigation`, `resolved`, `dismissed`) — Default: `open`
*   `admin_notes`: Text (Nullable)
*   `created_at`, `updated_at`: Timestamps

---

## 3. Database Indexes & Performance Optimization Strategies

1.  **Geospatial Indexes:** Composite index on `(current_latitude, current_longitude)` in `driver_profiles` and `(origin_latitude, origin_longitude)` in `delivery_requests` for fast bounding box / proximity queries.
2.  **Bidding Performance:** Index on `offers(delivery_request_id, status)` for rapid retrieval of pending bids.
3.  **Active Trip Lookup:** Index on `trips(driver_id, status)` and `trips(customer_id, status)` to immediately resolve active user state on app launch.
4.  **Foreign Key Constraints:** All child records enforce `ON DELETE CASCADE` or `ON DELETE RESTRICT` based on business criticalities.
