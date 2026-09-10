import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import MapView, { type Region as MapViewRegion } from "react-native-maps";
import type { BaseMapProps, BaseMapHandle, Region } from "./BaseMapTypes";
import { getMapStyle } from "./mapStyles";

const LATITUDE_DELTA = 0.05;
const LONGITUDE_DELTA = 0.05;

/** Default fallback center — Marrakech, Morocco. */
const MOROCCO_CENTER: Region = {
    latitude: 31.6295,
    longitude: -7.9811,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
};

/**
 * BaseMap — the raw map engine.
 *
 * Zero domain knowledge. Handles:
 * - MapView initialization with the correct initial region
 * - Animated camera jumps when `region` prop changes after mount
 * - Map style theming via `mapStyle` prop
 * - Exposes `fitToCoordinates` and `animateToRegion` via ref handle
 *
 * All markers, polylines, and overlays are passed as `children` (layers).
 */
export const BaseMap = forwardRef<BaseMapHandle, BaseMapProps>(
    function BaseMap(
        {
            region,
            initialRegion,
            mapStyle = "default",
            showsCompass = true,
            bottomPadding = 0,
            onRegionChange,
            onMapPress,
            children,
        },
        ref,
    ) {
        const mapRef = useRef<MapView | null>(null);
        const isFirstMount = useRef(true);

        useImperativeHandle(ref, () => ({
            fitToCoordinates: (coords, bottomPad = 0) => {
                if (coords.length === 0 || !mapRef.current) return;
                mapRef.current.fitToCoordinates(coords, {
                    edgePadding: {
                        top: 80,
                        bottom: bottomPad + 40,
                        left: 40,
                        right: 40,
                    },
                    animated: true,
                });
            },
            animateToRegion: (r, duration = 400) => {
                mapRef.current?.animateToRegion(r, duration);
            },
        }));

        // Animate camera when the controlled `region` prop changes after first mount.
        useEffect(() => {
            if (isFirstMount.current) {
                isFirstMount.current = false;
                return;
            }
            if (region && mapRef.current) {
                mapRef.current.animateToRegion(
                    {
                        latitude: region.latitude,
                        longitude: region.longitude,
                        latitudeDelta: region.latitudeDelta ?? LATITUDE_DELTA,
                        longitudeDelta:
                            region.longitudeDelta ?? LONGITUDE_DELTA,
                    },
                    400,
                );
            }
        }, [region]);

        const resolvedInitialRegion: Region =
            initialRegion ??
            (region
                ? region
                : MOROCCO_CENTER);

        return (
            <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                initialRegion={resolvedInitialRegion}
                showsUserLocation={false}
                showsMyLocationButton={false}
                showsCompass={showsCompass}
                mapPadding={{ top: 0, bottom: bottomPadding, left: 0, right: 0 }}
                customMapStyle={getMapStyle(mapStyle)}
                onRegionChangeComplete={(r: MapViewRegion) =>
                    onRegionChange?.({
                        latitude: r.latitude,
                        longitude: r.longitude,
                        latitudeDelta: r.latitudeDelta,
                        longitudeDelta: r.longitudeDelta,
                    })
                }
                onPress={(e) => onMapPress?.(e.nativeEvent.coordinate)}
            >
                {children}
            </MapView>
        );
    },
);
