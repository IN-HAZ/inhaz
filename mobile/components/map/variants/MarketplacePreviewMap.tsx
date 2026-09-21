import { useRef, useEffect } from "react";
import { View } from "react-native";
import { BaseMap } from "../core/BaseMap";
import { RouteMarkersLayer } from "../layers/RouteMarkersLayer";
import { PolylineLayer } from "../layers/PolylineLayer";
import type { MapPoint, Region, BaseMapHandle, RouteMarker } from "../core/BaseMapTypes";

export interface MarketplacePreviewMapProps {
    pickupCoords?: MapPoint | null;
    destinationCoords?: MapPoint | null;
    /** Height of the map container in px. Defaults to 160. */
    height?: number;
}

/**
 * MarketplacePreviewMap — small inline route preview inside the marketplace
 * request detail screen.
 *
 * - Style: `minimal` (clean roads — avoids POI clutter in a card context)
 * - Layers: pickup + destination pins, straight-line polyline
 * - Controls: none
 * - Interactions: none
 *
 * Renders nothing if neither coordinate is available.
 * Auto-fits to both coordinates when both are present; centers on one if only
 * one is provided.
 */
export function MarketplacePreviewMap({
    pickupCoords,
    destinationCoords,
    height = 160,
}: MarketplacePreviewMapProps) {
    const mapRef = useRef<BaseMapHandle | null>(null);

    if (!pickupCoords && !destinationCoords) return null;

    const markers: RouteMarker[] = [];
    if (pickupCoords) {
        markers.push({
            id: "marketplace_pickup",
            point: pickupCoords,
            title: "Retrait",
            pinColor: "#2563EB",
        });
    }
    if (destinationCoords) {
        markers.push({
            id: "marketplace_destination",
            point: destinationCoords,
            title: "Destination",
            pinColor: "#DC2626",
        });
    }

    const polylinePoints: MapPoint[] = [pickupCoords, destinationCoords].filter(
        (p): p is MapPoint => p != null,
    );

    const initialRegion = (): Region | undefined => {
        if (pickupCoords && destinationCoords) {
            const minLat = Math.min(pickupCoords.latitude, destinationCoords.latitude);
            const maxLat = Math.max(pickupCoords.latitude, destinationCoords.latitude);
            const minLng = Math.min(pickupCoords.longitude, destinationCoords.longitude);
            const maxLng = Math.max(pickupCoords.longitude, destinationCoords.longitude);
            return {
                latitude: (minLat + maxLat) / 2,
                longitude: (minLng + maxLng) / 2,
                latitudeDelta: Math.max(0.02, (maxLat - minLat) * 1.6),
                longitudeDelta: Math.max(0.02, (maxLng - minLng) * 1.6),
            };
        }
        const single = pickupCoords ?? destinationCoords!;
        return {
            latitude: single.latitude,
            longitude: single.longitude,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
        };
    };

    // fitToCoordinates for accurate framing when both points are present
    useEffect(() => {
        if (!pickupCoords || !destinationCoords) return;
        const timer = setTimeout(() => {
            mapRef.current?.fitToCoordinates([pickupCoords, destinationCoords]);
        }, 200);
        return () => clearTimeout(timer);
    }, [
        pickupCoords?.latitude,
        pickupCoords?.longitude,
        destinationCoords?.latitude,
        destinationCoords?.longitude,
    ]);

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
