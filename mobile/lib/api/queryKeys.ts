/**
 * Canonical React Query keys (W6 §6.6).
 *
 * Every query/mutation in the app must derive its key from this module so
 * invalidations and cache reads stay consistent. The prefix arrays are the
 * contract — refactoring a screen to `queryCache.invalidateQueries` against
 * these keys is the supported way to refresh data after a mutation.
 *
 * Inventory of canonical key families:
 * - `auth.me`             current user (`GET /me` / auth store)
 * - `driver.dashboard`    driver dashboard summary (polled)
 * - `driver.profile`      driver profile + vehicle + documents (from /driver/profile)
 * - `driver.documents`    document list (documents screens)
 * - `driver.nearby`       nearby drivers (mock-backed until Phase B)
 * - `nearby.*`            geolocated marketplace entities (mock-backed until Phase B)
 * - `requests.list`       client's own request list (paginated)
 * - `requests.detail`     single request, client view
 * - `requests.detailForDriver`  single request, driver view (mock-backed until Phase B)
 * - `requests.browse`     marketplace browse (paginated)
 * - `requests.browseWithGeo`    geo-scoped browse (mock-backed until Phase B)
 * - `requests.offers`     offers on a request
 * - `trips.list`          trip list by scope (driver|client) and page
 * - `trips.detail`        single trip (polled during execution)
 * - `trips.waypoints`     live waypoints for a trip
 * - `feed.live`           live in-app feed events (mock-backed until Phase B)
 */
export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },

  driver: {
    dashboard: ["driver", "dashboard"] as const,
    profile: ["driver", "profile"] as const,
    documents: ["driver", "documents"] as const,
    nearby: ["driver", "nearby"] as const,
  },

  nearby: {
    drivers: ["nearby", "drivers"] as const,
    requests: ["nearby", "requests"] as const,
  },

  requests: {
    list: (page = 1) => ["requests", "list", page] as const,
    detail: (id: number) => ["requests", "detail", id] as const,
    detailForDriver: (id: number) => ["requests", "detail-for-driver", id] as const,
    browse: (
      page = 1,
      params?: { search?: string; budget_min?: number; budget_max?: number }
    ) => ["requests", "browse", page, params] as const,
    browseWithGeo: (
      page = 1,
      params?: { latitude?: number; longitude?: number; radiusKm?: number }
    ) => ["requests", "browse-geo", page, params] as const,
    offers: (requestId: number) => ["requests", "offers", requestId] as const,
  },

  trips: {
    list: (scope: "driver" | "client", page = 1) => ["trips", scope, page] as const,
    detail: (id: number) => ["trips", "detail", id] as const,
    waypoints: (id: number) => ["trips", "waypoints", id] as const,
  },

  feed: {
    live: ["feed", "live"] as const,
  },
} as const;