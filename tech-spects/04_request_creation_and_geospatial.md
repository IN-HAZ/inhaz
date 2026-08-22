# inHaz — Deep Dive: 04 Request Creation & Geospatial Infrastructure

**Document Scope:** Technical specification for delivery request submission by clients, multi-stop routing, package photo handling, Google Maps geospatial services integration, price recommendation engine, and nearby request discovery algorithms for drivers.

---

## 1. Request Creation Architecture

Clients create delivery requests specifying what goods need to be moved, from where, to where, and at what proposed initial price.

```
[ Client Mobile App ]                           [ Laravel API ]                     [ Google Maps API ]
        |                                              |                                    |
        |--- 1. Address Autocomplete Query ----------->| (or directly from client SDK) ---->|
        |<-- 2. Return Address Suggestions ------------|                                    |
        |                                              |                                    |
        |--- 3. Select Pickup & Dropoff Coordinates -->|                                    |
        |                                              |--- 4. Calculate Distance & Polyline->|
        |                                              |<-- 5. Return Distance Matrix ------|
        |                                              |                                    |
        |--- 6. Submit Full Delivery Request --------->|                                    |
        |    (POST /api/v1/requests)                   |--- 7. Validate (Form Request) --->|
        |                                              |--- 8. Store Request, Stops, Photos->|
        |                                              |--- 9. Broadcast `RequestCreated` -->|
        |<-- 10. HTTP 201 + Request Object ------------|                                    |
```

---

## 2. Geospatial Services & Google Maps Integration

### 2.1 API Key Segregation & Security
*   **Client-Side Mobile API Key:** Restricted to Android (package name + SHA-1 fingerprint) and iOS (bundle ID). Authorized ONLY for Google Maps SDK map rendering.
*   **Server-Side Backend API Key:** IP-restricted to backend server IPs. Authorized for Geocoding API, Places API, and Distance Matrix / Directions API. Server-side key is never exposed to mobile binaries.

### 2.2 Geocoding & Address Resolution
1.  **Search (Places Autocomplete):** When client types origin or destination address, app queries Places API with country restriction (Morocco, `components=country:ma`).
2.  **Coordinate Extraction:** Returns place details including canonical string address, latitude, and longitude.
3.  **Reverse Geocoding:** If client pinpoints location directly on interactive map, client sends latitude/longitude to API, which queries Reverse Geocoding API to resolve human-readable street address.

---

## 3. Price Recommendation Engine

While inHaz features reverse-bidding, the application provides an initial fair market price recommendation to assist the client in submitting realistic offers.

### 3.1 Price Calculation Formula
$$\text{Recommended Price (MAD)} = \max\Big(\text{Base Fare}_{\text{vehicle}}, \, (\text{Distance}_{\text{km}} \times \text{PerKmRate}_{\text{vehicle}}) + \text{StopFee} \times N_{\text{extra\_stops}}\Big)$$

### 3.2 Vehicle Pricing Grid Parameters (Configurable via System Settings)

| Vehicle Type | Base Fare (MAD) | Per-KM Rate (MAD/km) | Max Weight Capacity | Recommended Cargo Types |
| :--- | :--- | :--- | :--- | :--- |
| **Triporteur** | 25.00 MAD | 4.00 MAD/km | Up to 300 kg | Small furniture, single appliances, boxes |
| **Van** | 50.00 MAD | 7.00 MAD/km | Up to 800 kg | Washing machines, beds, small apartment moves |
| **Truck** | 100.00 MAD | 12.00 MAD/km | Up to 2500 kg | Full home moves, heavy industrial goods |

*   **Extra Stop Fee:** 15.00 MAD per intermediate `RequestStop`.
*   **Minimum Threshold:** Absolute platform minimum price across any request is 20.00 MAD (enforced server-side).

---

## 4. Multi-Stop & Package Photos Workflow

### 4.1 Multi-Stop Structuring
*   Client can add up to 3 intermediate waypoints between pickup and dropoff.
*   Each waypoint generates a `request_stops` record storing `stop_order` (1, 2, 3), latitude, longitude, address, and specific dropoff/pickup instructions.

### 4.2 Package Photo Handling
*   Client can capture up to 3 photos of the items to be transported.
*   Photos are uploaded directly or attached during request creation.
*   Uploaded to `public-assets/requests/{request_id}/{photo_id}.jpg`.
*   Image paths stored in `request_photos` table and included in driver request preview feeds.

---

## 5. Nearby Request Discovery Algorithm for Drivers

Drivers in "Online" mode receive a list and map view of open delivery requests within their operational radius.

```
[ Driver App (GET /requests/nearby) ]
                 |
                 v
+-------------------------------------------------+
| Backend Query Execution                         |
| 1. Fetch Driver Current Coordinates (Lat, Lng)  |
| 2. Fetch Driver Vehicle Type (e.g. Van)         |
| 3. Apply Spatial Radius Filter (e.g. 15 km)     |
| 4. Apply Status Filter (status = 'open')        |
+-------------------------------------------------+
                 |
                 v
+-------------------------------------------------+
| Spatial Filtering Strategy                      |
| (Bounding Box Pre-filter + Haversine Formula)   |
+-------------------------------------------------+
                 |
                 v
[ Return Array of Nearby Requests with Distance ]
```

### 5.1 Geospatial Query Mechanics

To ensure scalable performance without heavy GIS database extensions, the nearby query uses a 2-stage spatial filtering strategy:

1.  **Stage 1 — Bounding Box Pre-Filter:**
    Calculates latitude/longitude minimum and maximum boundaries for a search radius $R$ (default: 15 km) around the driver's location $(\text{lat}_d, \text{lng}_d)$:
    $$\Delta\text{lat} = \frac{R}{111.045}$$
    $$\Delta\text{lng} = \frac{R}{111.045 \times \cos(\text{lat}_d)}$$
    Filters `delivery_requests` where `origin_latitude` is between $(\text{lat}_d - \Delta\text{lat})$ and $(\text{lat}_d + \Delta\text{lat})$, and `origin_longitude` is between $(\text{lng}_d - \Delta\text{lng})$ and $(\text{lng}_d + \Delta\text{lng})$. Utilizing database composite indexes, this eliminates 99% of non-relevant rows instantly.

2.  **Stage 2 — Precise Haversine Distance Calculation:**
    Computes exact radial distance $d$ for remaining candidate requests:
    $$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta\text{lng}}{2}\right)}\right)$$
    Where $r = 6371\text{ km}$. Requests within radius $R$ are ordered by proximity (`distance_from_driver ASC`) and returned to the driver app.
