import { useEffect, useState } from "react";
import * as Location from "expo-location";
import type { MapPoint, Region } from "@/components/map/core/BaseMapTypes";

/** Default map zoom (lat/lng delta) used by the client + driver homes. */
export const HOME_DELTA = 0.05;

/**
 * Shared "GPS on entry" hook (W9).
 *
 * Asks for foreground permissions and resolves the current position ONCE,
 * when the screen mounts — never at app boot. Both the client home and the
 * driver home use it so the permission prompt + first-fix logic stays in a
 * single place. `setHomeRegion` (a stable setState) lets callers recenter
 * the camera later.
 *
 * Location is best-effort: on denial/failure the map still renders with the
 * base map's fallback region.
 */
export function useLocationOnEntry(): {
    currentLocation: MapPoint | null;
    setCurrentLocation: (pt: MapPoint | null) => void;
    homeRegion: Region | null;
    setHomeRegion: (r: Region | null) => void;
} {
    const [currentLocation, setCurrentLocation] = useState<MapPoint | null>(
        null,
    );
    const [homeRegion, setHomeRegion] = useState<Region | null>(null);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const { status } =
                    await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") return;
                const pos = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                if (!alive) return;
                const pt: MapPoint = {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                };
                setCurrentLocation(pt);
                setHomeRegion({
                    ...pt,
                    latitudeDelta: HOME_DELTA,
                    longitudeDelta: HOME_DELTA,
                });
            } catch {
                // Best-effort — leave the fallback region in place.
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    return {
        currentLocation,
        setCurrentLocation,
        homeRegion,
        setHomeRegion,
    };
}