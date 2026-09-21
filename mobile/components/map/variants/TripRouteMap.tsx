import { useRef, useEffect } from "react";
import { View } from "react-native";
import { BaseMap } from "../core/BaseMap";
import { RouteMarkersLayer } from "../layers/RouteMarkersLayer";
import { PolylineLayer } from "../layers/PolylineLayer";
import type { MapPoint, Region, BaseMapHandle, RouteMarker } from "../core/BaseMapTypes";

export interface TripStop {
    type: "PICKUP" | "DESTINATION" | string;
    latitude?: number | null;
    longitude?: number | null;
    address?: string;
}

export interface TripRouteMapProps {
    stops: TripStop[];
    /**
     * Optional pre-computed polyline from the routing service.
     * Falls back to straight-line connections between stops if omitted.
     */
    polyline?: MapPoint[];
    /** Height of the map container in px. Defaults to 200. */
    height?: number;
}

/** Color convention matching the request creation flow. */
function pinColor(stop: TripStop, index: number, total: number): string {
    if (stop.type === "PICKUP" || index === 0) return "#2563EB";
    if (stop.type === "DESTINATION" || index === total - 1) return "#DC2626";
    return "#F97316";
}

/**
 * TripRouteMap — static route recap for trip detail screens.
 *
 * - Style: `minimal` (roads-only, no POI — clean and uncluttered)
 * - Layers: route stop pins + polyline
 * - Controls: none
 * - Interactions: none
 *
 * Auto-fits to all stop coordinates on mount.
 */
export function TripRouteMap({
    stops,
    polyline,
    height = 200,
}: TripRouteMapProps) {
    const mapRef = useRef<BaseMapHandle | null>(null);

    const coordStops = stops.filter(
        (s): s is TripStop & { latitude: number; longitude: number } =>
            s.latitude != null && s.longitude != null,
    );

    const markers: RouteMarker[] = coordStops.map((s, i) => ({
        id: `trip_stop_${i}`,
        point: { latitude: s.latitude, longitude: s.longitude },
        title:
            s.type === "PICKUP"
                ? "Retrait"
                : s.type === "DESTINATION"
                  ? "Destination"
                  : `Étape ${i}`,
        description: s.address,
        pinColor: pinColor(s, i, coordStops.length),
    }));

    const polylinePoints: MapPoint[] =
        polyline ??
        coordStops.map((s) => ({
            latitude: s.latitude,
            longitude: s.longitude,
        }));

    // Compute initial region to contain all stops
    const initialRegion = (): Region | undefined => {
        if (coordStops.length === 0) return undefined;
        if (coordStops.length === 1) {
            return {
                latitude: coordStops[0].latitude,
                longitude: coordStops[0].longitude,
                latitudeDelta: 0.04,
                longitudeDelta: 0.04,
            };
        }
        const lats = coordStops.map((s) => s.latitude);
        const lngs = coordStops.map((s) => s.longitude);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        return {
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2,
            latitudeDelta: Math.max(0.02, (maxLat - minLat) * 1.5),
            longitudeDelta: Math.max(0.02, (maxLng - minLng) * 1.5),
        };
    };

    // fitToCoordinates after map has rendered for accurate padding-aware framing
    useEffect(() => {
        if (coordStops.length < 2) return;
        const timer = setTimeout(() => {
            mapRef.current?.fitToCoordinates(
                coordStops.map((s) => ({
                    latitude: s.latitude,
                    longitude: s.longitude,
                })),
            );
        }, 200);
        return () => clearTimeout(timer);
    }, [coordStops.length]);

    return (
        // `height` stays inline: it is a dynamic prop; the rest is Tailwind.
        <View style={{ height }} className="overflow-hidden rounded-xl">
            <BaseMap
                ref={mapRef}
                initialRegion={initialRegion()}
                mapStyle="minimal"
                showsCompass={false}
            >
                <RouteMarkersLayer markers={markers} />
                <PolylineLayer points={polylinePoints} />
            </BaseMap>
        </View>
    );
}
