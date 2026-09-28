import { forwardRef, useCallback } from "react";
import { View } from "react-native";
import * as Location from "expo-location";
import { BaseMap } from "../core/BaseMap";
import { CurrentLocationLayer } from "../layers/CurrentLocationLayer";
import { NearbyRequestLayer } from "../layers/NearbyRequestLayer";
import { RecenterButton } from "../controls/RecenterButton";
import type {
    BaseMapHandle,
    MapPoint,
    Region,
    NearbyRequestMarker,
} from "../core/BaseMapTypes";

export interface DriverHomeMapProps {
    region?: Region | null;
    currentLocation?: MapPoint | null;
    requests?: NearbyRequestMarker[];
    onMarkerPress?: (requestId: string) => void;
    onMapPress?: (point: MapPoint) => void;
    onRecenter?: (point: MapPoint) => void;
    bottomPadding?: number;
    showRecenterButton?: boolean;
}

const LATITUDE_DELTA = 0.05;
const LONGITUDE_DELTA = 0.05;

/**
 * DriverHomeMap (W9) — the dedicated driver-home map composition.
 *
 * - Style: `default` (standard Google Maps — full detail)
 * - Layers: current user location dot + nearby open-request markers
 * - Controls: floating recenter button (parent re-centers via `region`)
 * - Interactions: marker taps (`onMarkerPress`), map taps optional
 *
 * Shares `BaseMap` + `CurrentLocationLayer` + `RecenterButton` with the other
 * variants — no duplicated MapView implementation. Exposes `BaseMapHandle`.
 */
export const DriverHomeMap = forwardRef<BaseMapHandle, DriverHomeMapProps>(
    function DriverHomeMap(
        {
            region,
            currentLocation,
            requests = [],
            onMarkerPress,
            onMapPress,
            onRecenter,
            bottomPadding = 0,
            showRecenterButton = true,
        },
        ref,
    ) {
        const handleRecenter = useCallback(async () => {
            if (currentLocation) {
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
        }, [currentLocation, onRecenter]);

        return (
            <View className="flex-1 relative">
                <BaseMap
                    ref={ref}
                    region={region}
                    mapStyle="default"
                    bottomPadding={bottomPadding}
                    onMapPress={onMapPress}
                >
                    <CurrentLocationLayer location={currentLocation} />
                    <NearbyRequestLayer
                        requests={requests}
                        onMarkerPress={onMarkerPress}
                    />
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