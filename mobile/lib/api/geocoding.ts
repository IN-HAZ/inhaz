import * as Location from "expo-location";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const COUNTRY = "ma"; // ISO 3166-1 alpha-2, lowercase, required by Google

console.log('[geocoding] GOOGLE_API_KEY set:', GOOGLE_API_KEY.length > 0, '| first 8 chars:', GOOGLE_API_KEY.slice(0, 8) || '(empty)');

export interface PlaceSearchResult {
    placeId: string;
    description: string;
    mainText?: string;
    secondaryText?: string;
    latitude?: number;
    longitude?: number;
}

// One session token per autocomplete "session" (from first keystroke to selection).
// Required to get Google's bundled Autocomplete+Details pricing instead of per-call pricing.
let currentSessionToken: string | null = null;

function getSessionToken(): string {
    if (!currentSessionToken) {
        currentSessionToken =
            Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
    return currentSessionToken;
}

function clearSessionToken(): void {
    currentSessionToken = null;
}

/**
 * Searches places, strictly restricted to Morocco, biased toward user location.
 * Pass an AbortSignal so callers can cancel stale in-flight requests.
 */
export async function searchPlaces(
    query: string,
    userLocation?: { latitude: number; longitude: number } | null,
    signal?: AbortSignal,
): Promise<PlaceSearchResult[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    console.log(`[geocoding] searchPlaces("${trimmed}") → key set: ${GOOGLE_API_KEY.length > 0}`);

    if (!GOOGLE_API_KEY) {
        console.log('[geocoding] No API key → using fallback geocoder');
        return fallbackGeocode(trimmed, signal);
    }

    try {
        const params = new URLSearchParams({
            input: trimmed,
            components: `country:${COUNTRY}`, // hard server-side country restriction
            language: "fr",
            sessiontoken: getSessionToken(),
            key: GOOGLE_API_KEY,
        });

        if (userLocation) {
            params.set(
                "location",
                `${userLocation.latitude},${userLocation.longitude}`,
            );
            params.set("radius", "50000");
        }

        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`;
        const response = await fetch(url, { signal });
        const data = await response.json();

        console.log('[geocoding] Google Places status:', data.status, '| error:', data.error_message ?? 'none');

        if (data.status === "OK" && Array.isArray(data.predictions) && data.predictions.length > 0) {
            const results = data.predictions.map((p: any) => ({
                placeId: p.place_id,
                description: p.description,
                mainText: p.structured_formatting?.main_text || p.description,
                secondaryText: p.structured_formatting?.secondary_text || "",
            }));
            console.log('[geocoding] Google Places results:', JSON.stringify(results, null, 2));
            return results;
        }

        // Fallback to Expo geocode on ZERO_RESULTS or non-OK response (e.g. key issue or partial query)
        return fallbackGeocode(trimmed, signal);
    } catch (e: any) {
        if (e.name === "AbortError") throw e; // let caller's cancellation logic handle it
        console.warn("Google Places Autocomplete error:", e);
        return fallbackGeocode(trimmed, signal);
    }
}

/**
 * Fallback path, used if no API key, API failure, or zero results.
 * Handles React Native compatibility and safe country filtering.
 */
async function fallbackGeocode(
    query: string,
    signal?: AbortSignal,
): Promise<PlaceSearchResult[]> {
    try {
        let coordsList = await Location.geocodeAsync(query);
        // If single/no result, try geocoding with Morocco country context for multiple city/region matches
        if (coordsList.length <= 1 && !query.toLowerCase().includes("maroc") && !query.toLowerCase().includes("morocco")) {
            const countryCoords = await Location.geocodeAsync(`${query}, Maroc`);
            if (countryCoords.length > coordsList.length) {
                coordsList = countryCoords;
            }
        }

        if (coordsList.length === 0) return [];

        const results: PlaceSearchResult[] = [];
        for (let i = 0; i < coordsList.length && i < 8; i++) {
            if (signal?.aborted) {
                const abortErr = new Error("Aborted");
                abortErr.name = "AbortError";
                throw abortErr;
            }
            const c = coordsList[i];
            let mainTitle = query;
            let cityRegion = "";
            let iso: string | undefined;

            try {
                const addr = await Location.reverseGeocodeAsync({
                    latitude: c.latitude,
                    longitude: c.longitude,
                });
                if (addr && addr.length > 0) {
                    const a = addr[0];
                    iso = a.isoCountryCode?.toLowerCase();
                    mainTitle = a.name || a.street || query;
                    cityRegion = [a.district, a.city || a.subregion || a.region]
                        .filter(Boolean)
                        .join(", ");
                }
            } catch (err) {}

            // Skip only if explicitly a non-Moroccan country code
            if (iso && iso !== "ma" && iso !== "mar") continue;

            const secondary = cityRegion ? `${cityRegion}, Maroc` : "Maroc";
            const fullDescription = mainTitle !== cityRegion && cityRegion ? `${mainTitle}, ${secondary}` : mainTitle;

            results.push({
                placeId: `expo_${c.latitude}_${c.longitude}_${i}`,
                description: fullDescription,
                mainText: mainTitle,
                secondaryText: secondary,
                latitude: c.latitude,
                longitude: c.longitude,
            });
        }
        console.log('[geocoding] Fallback results:', JSON.stringify(results, null, 2));
        return results;
    } catch (err: any) {
        if (err.name === "AbortError") throw err;
        console.warn("Expo Location geocode fallback error:", err);
        return [];
    }
}

/**
 * Resolves a selected suggestion to exact coordinates. Call this once per session,
 * then clear the session token (billing boundary — a session ends at selection).
 */
export async function getPlaceDetails(
    place: PlaceSearchResult,
): Promise<{ latitude: number; longitude: number; address: string } | null> {
    if (place.latitude && place.longitude) {
        clearSessionToken();
        return {
            latitude: place.latitude,
            longitude: place.longitude,
            address: place.description,
        };
    }

    if (GOOGLE_API_KEY && place.placeId && !place.placeId.startsWith("expo_")) {
        try {
            const params = new URLSearchParams({
                place_id: place.placeId,
                fields: "geometry,formatted_address,name,address_component",
                sessiontoken: getSessionToken(),
                key: GOOGLE_API_KEY,
            });
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`,
            );
            const data = await response.json();

            clearSessionToken(); // session ends here regardless of outcome

            if (data.status === "OK" && data.result?.geometry?.location) {
                const countryComp = data.result.address_components?.find(
                    (c: any) => c.types?.includes("country"),
                );
                if (
                    countryComp &&
                    countryComp.short_name?.toLowerCase() !== COUNTRY
                ) {
                    return null;
                }
                return {
                    latitude: data.result.geometry.location.lat,
                    longitude: data.result.geometry.location.lng,
                    address:
                        data.result.formatted_address ||
                        data.result.name ||
                        place.description,
                };
            }
        } catch (e) {
            console.warn("Google Place Details API error:", e);
            clearSessionToken();
        }
    }

    clearSessionToken();

    // Fallback geocode to resolve place description to lat/lng
    try {
        const coordsList = await Location.geocodeAsync(place.description);
        if (coordsList.length > 0) {
            return {
                latitude: coordsList[0].latitude,
                longitude: coordsList[0].longitude,
                address: place.description,
            };
        }
    } catch (err) {
        console.warn("Expo Location geocode error:", err);
    }

    return null;
}

/**
 * Reverse geocodes coordinates to a human-readable address.
 */
export async function reverseGeocode(
    latitude: number,
    longitude: number,
): Promise<string> {
    if (GOOGLE_API_KEY) {
        try {
            const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&language=fr&key=${GOOGLE_API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.status === "OK" && data.results?.length > 0) {
                return data.results[0].formatted_address;
            }
        } catch (e) {
            console.warn("Google Reverse Geocoding error:", e);
        }
    }

    try {
        const addresses = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
        });
        if (addresses.length > 0) {
            const a = addresses[0];
            return (
                [a.street, a.district, a.city].filter(Boolean).join(", ") ||
                `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            );
        }
    } catch (err) {
        console.warn("Expo reverse geocode error:", err);
    }

    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}
