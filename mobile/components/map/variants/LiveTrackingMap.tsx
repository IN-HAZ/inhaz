import { useRef, useEffect, useCallback } from "react";
import { View } from "react-native";
import * as Location from "expo-location";
import { BaseMap } from "../core/BaseMap";
import { CurrentLocationLayer } from "../layers/CurrentLocationLayer";
import { LiveDriverLayer } from "../layers/LiveDriverLayer";
import { RouteMarkersLayer } from "../layers/RouteMarkersLayer";
import { PolylineLayer } from "../layers/PolylineLayer";
import { RecenterButton } from "../controls/RecenterButton";
import type {
    MapPoint,
    Region,
    BaseMapHandle,
    RouteMarker,
} from "../core/BaseMapTypes";

export interface LiveTrackingMapProps {
    /** Client's own GPS position (blue dot). */
    clientLocation?: MapPoint | null;
    /** Driver's real-time GPS position — updated externally via WebSocket. */
    driverLocation?: MapPoint | null;
    /** Driver heading in degrees. Used for pin rotation animation. */
    driverHeading?: number;
    /** Driver vehicle type string — selects the emoji icon. */
    driverVehicleType?: string;
    /** Ordered stop coordinates for the route pins. */
    stops?: RouteMarker[];
    /** Route polyline coordinates. */
    polyline?: MapPoint[];
    /** Auto-follow the driver pin with the camera. Defaults to true. */
    followDriver?: boolean;
    bottomPadding?: number;
    onRecenter?: (point: MapPoint) => void;
}

const FOLLOW_DELTA = 0.01;

/**
 * LiveTrackingMap — real-time trip tracking map for the client view.
 *
 * - Style: `default` (full detail — client needs street-level context)
 * - Layers: client location dot, animated driver pin, route stops, polyline
 * - Controls: recenter button
 * - Interactions: recenter; auto-follow driver camera when `followDriver=true`
 *
 * WebSocket integration: the parent screen listens to the `DriverLocationUpdated`
 * Pusher/Echo event and passes the updated `driverLocation` prop here.
 * This component handles only the visual animation.
 */
export function LiveTrackingMap({
    clientLocation,
    driverLocation,
    driverHeading = 0,
    driverVehicleType,
    stops = [],
    polyline = [],
    followDriver = true,
    bottomPadding = 0,
    onRecenter,
}: LiveTrackingMapProps) {
    const mapRef = useRef<BaseMapHandle | null>(null);
    const isFollowing = useRef(followDriver);

    // Keep isFollowing in sync with prop
    useEffect(() => {
        isFollowing.current = followDriver;
    }, [followDriver]);

    // Auto-follow: animate camera to driver position whenever it updates
    useEffect(() => {
        if (!driverLocation || !isFollowing.current) return;
        mapRef.current?.animateToRegion(
            {
                latitude: driverLocation.latitude,
                longitude: driverLocation.longitude,
                latitudeDelta: FOLLOW_DELTA,
                longitudeDelta: FOLLOW_DELTA,
            },
            600,
        );
    }, [driverLocation]);

    const handleRecenter = useCallback(async () => {
        const target = driverLocation ?? clientLocation;
        if (target) {
            mapRef.current?.animateToRegion(
                {
                    latitude: target.latitude,
                    longitude: target.longitude,
                    latitudeDelta: FOLLOW_DELTA,
                    longitudeDelta: FOLLOW_DELTA,
                },
                500,
            );
            onRecenter?.(target);
            return;
        }
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });
        const pt: MapPoint = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
        };
        mapRef.current?.animateToRegion(
            { ...pt, latitudeDelta: FOLLOW_DELTA, longitudeDelta: FOLLOW_DELTA },
            500,
        );
        onRecenter?.(pt);
    }, [driverLocation, clientLocation, onRecenter]);

    const initialRegion: Region | undefined = driverLocation
        ? {
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
              latitudeDelta: FOLLOW_DELTA,
              longitudeDelta: FOLLOW_DELTA,
          }
        : clientLocation
          ? {
                latitude: clientLocation.latitude,
                longitude: clientLocation.longitude,
                latitudeDelta: 0.04,
                longitudeDelta: 0.04,
            }
          : undefined;

    return (
        <View className="flex-1 relative">
            <BaseMap
                ref={mapRef}
                initialRegion={initialRegion}
                mapStyle="default"
                bottomPadding={bottomPadding}
            >
                <CurrentLocationLayer location={clientLocation} />
                <LiveDriverLayer
                    driverLocation={driverLocation}
                    heading={driverHeading}
                    vehicleType={driverVehicleType}
                />
                <RouteMarkersLayer markers={stops} />
                <PolylineLayer points={polyline} />
            </BaseMap>

            <RecenterButton
                onPress={handleRecenter}
                bottomOffset={bottomPadding}
            />
        </View>
    );
}
