import { forwardRef, useCallback } from "react";
import { View } from "react-native";
import * as Location from "expo-location";
import { BaseMap } from "../core/BaseMap";
import { CurrentLocationLayer } from "../layers/CurrentLocationLayer";
import { DriversLayer } from "../layers/DriversLayer";
import { RouteMarkersLayer } from "../layers/RouteMarkersLayer";
import { PolylineLayer } from "../layers/PolylineLayer";
import { RecenterButton } from "../controls/RecenterButton";
import type {
    MapPoint,
    Region,
    BaseMapHandle,
    NearbyDriverMarker,
    RouteMarker,
} from "../core/BaseMapTypes";
import type { ReactNode } from "react";

export interface RequestMapProps {
    region?: Region | null;
    currentLocation?: MapPoint | null;
    drivers?: NearbyDriverMarker[];
    markers?: RouteMarker[];
    polyline?: MapPoint[];
    showRecenterButton?: boolean;
    bottomPadding?: number;
    onMapPress?: (point: MapPoint) => void;
    onRegionChange?: (region: Region) => void;
    onRecenter?: (point: MapPoint) => void;
    /** Extra markers / overlays rendered inside the MapView (native only). */
    children?: ReactNode;
}

const LATITUDE_DELTA = 0.05;
const LONGITUDE_DELTA = 0.05;

/**
 * RequestMap — full-screen interactive map for the request creation flow.
 *
 * - Style: `default` (standard Google Maps — full detail for route planning)
 * - Layers: current location, nearby drivers, route stop pins, route polyline
 * - Controls: floating recenter button
 * - Interactions: tap-to-pin (`onMapPress`), region change, recenter
 *
 * Exposes `BaseMapHandle` via ref for programmatic `fitToCoordinates` /
 * `animateToRegion` calls from the parent screen.
 */
export const RequestMap = forwardRef<BaseMapHandle, RequestMapProps>(
    function RequestMap(
        {
            region,
            currentLocation,
            drivers = [],
            markers = [],
            polyline = [],
            showRecenterButton = true,
            bottomPadding = 0,
            onMapPress,
            onRegionChange,
            onRecenter,
            children,
        },
        ref,
    ) {
        const handleRecenter = useCallback(async () => {
            if (currentLocation) {
                // If we already have a location, just callback — BaseMap's
                // ref.animateToRegion is called by the parent via the forwarded ref.
                onRecenter?.(currentLocation);
                return;
            }
            const { status } =
                await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;
            const pos = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            const pt: MapPoint = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
            };
            onRecenter?.(pt);
            onRegionChange?.({
                ...pt,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA,
            });
        }, [currentLocation, onRecenter, onRegionChange]);

        return (
            <View className="flex-1 relative">
                <BaseMap
                    ref={ref}
                    region={region}
                    mapStyle="default"
                    bottomPadding={bottomPadding}
                    onRegionChange={onRegionChange}
                    onMapPress={onMapPress}
                >
                    <CurrentLocationLayer location={currentLocation} />
                    <DriversLayer drivers={drivers} />
                    <RouteMarkersLayer markers={markers} />
                    <PolylineLayer points={polyline} />
                    {children}
                </BaseMap>

                {showRecenterButton && (
                    <RecenterButton
                        onPress={handleRecenter}
                        bottomOffset={bottomPadding}
                    />
                )}
            </View>
        );
    },
);
