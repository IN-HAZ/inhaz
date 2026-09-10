import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import MapView, {
    Marker,
    Callout,
    Polyline,
    type Region as MapViewRegion,
} from "react-native-maps";
import { LocateFixed } from "lucide-react-native";
import * as Location from "expo-location";
import type { MapRendererProps, MapPoint, Region } from "./MapRendererProps";

export * from "./MapRendererProps";

const LATITUDE_DELTA = 0.05;
const LONGITUDE_DELTA = 0.05;

export interface MapRendererHandle {
    fitToCoordinates: (coords: MapPoint[], bottomPad?: number) => void;
    animateToRegion: (region: Region, duration?: number) => void;
}

export const MapRenderer = forwardRef<MapRendererHandle, MapRendererProps>(
    function MapRenderer(
        {
            region,
            currentLocation,
            drivers = [],
            markers = [],
            polyline,
            showRecenterButton = true,
            bottomPadding = 0,
            onMapPress,
            onRegionChange,
            onRecenter,
            children,
        }: MapRendererProps,
        ref,
    ) {
        const mapRef = useRef<MapView | null>(null);
        const isFirstMount = useRef(true);

        useImperativeHandle(ref, () => ({
            fitToCoordinates: (coords, bottomPad = 0) => {
                if (coords.length === 0 || !mapRef.current) return;
                mapRef.current.fitToCoordinates(coords, {
                    edgePadding: { top: 80, bottom: bottomPad + 40, left: 40, right: 40 },
                    animated: true,
                });
            },
            animateToRegion: (r, duration = 400) => {
                mapRef.current?.animateToRegion(r, duration);
            },
        }));

        const initialRegion: Region = region
            ? region
            : currentLocation
              ? { ...currentLocation, latitudeDelta: LATITUDE_DELTA, longitudeDelta: LONGITUDE_DELTA }
              : { latitude: 31.6295, longitude: -7.9811, latitudeDelta: 0.5, longitudeDelta: 0.5 };

        // Animate to new region when caller changes it (e.g. place selected)
        useEffect(() => {
            if (isFirstMount.current) { isFirstMount.current = false; return; }
            if (region && mapRef.current) {
                mapRef.current.animateToRegion(
                    {
                        latitude: region.latitude,
                        longitude: region.longitude,
                        latitudeDelta: region.latitudeDelta ?? LATITUDE_DELTA,
                        longitudeDelta: region.longitudeDelta ?? LONGITUDE_DELTA,
                    },
                    400,
                );
            }
        }, [region]);

        const handleRecenter = async () => {
            if (currentLocation && mapRef.current) {
                mapRef.current.animateToRegion({ ...currentLocation, latitudeDelta: LATITUDE_DELTA, longitudeDelta: LONGITUDE_DELTA }, 500);
                onRecenter?.(currentLocation);
                return;
            }
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;
            const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const pt = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            const next = { ...pt, latitudeDelta: LATITUDE_DELTA, longitudeDelta: LONGITUDE_DELTA };
            mapRef.current?.animateToRegion(next, 500);
            onRecenter?.(pt);
            onRegionChange?.(next);
        };

        return (
            <View style={{ flex: 1, position: "relative" }}>
                <MapView
                    ref={mapRef}
                    style={{ flex: 1 }}
                    initialRegion={initialRegion}
                    showsUserLocation={false}
                    showsMyLocationButton={false}
                    showsCompass
                    mapPadding={{ top: 0, bottom: bottomPadding, left: 0, right: 0 }}
                    onRegionChangeComplete={(r: MapViewRegion) =>
                        onRegionChange?.({ latitude: r.latitude, longitude: r.longitude, latitudeDelta: r.latitudeDelta, longitudeDelta: r.longitudeDelta })
                    }
                    onPress={(e) => onMapPress?.(e.nativeEvent.coordinate)}
                >
                    {currentLocation && (
                        <Marker coordinate={currentLocation} anchor={{ x: 0.5, y: 0.5 }}>
                            <View style={{ height: 20, width: 20, borderRadius: 10, backgroundColor: '#2563EB', borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowRadius: 3, shadowOpacity: 0.3, elevation: 4 }} />
                        </Marker>
                    )}

                    {drivers.map((driver) => (
                        <Marker key={driver.id} coordinate={{ latitude: driver.latitude, longitude: driver.longitude }} anchor={{ x: 0.5, y: 0.5 }}>
                            <View style={{ alignItems: 'center' }}>
                                <View style={{ height: 32, width: 32, borderRadius: 16, backgroundColor: '#7928CA', borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 14 }}>🚚</Text>
                                </View>
                            </View>
                            {driver.vehicleModel && (
                                <Callout>
                                    <View style={{ minWidth: 120, padding: 8 }}>
                                        <Text style={{ fontSize: 13, fontWeight: '600' }}>{driver.vehicleModel}</Text>
                                        {driver.vehicleType && <Text style={{ fontSize: 11, color: '#6B7280' }}>{driver.vehicleType}{driver.distanceKm !== undefined ? ` · ${driver.distanceKm.toFixed(1)} km` : ''}</Text>}
                                        {driver.rating !== undefined && <Text style={{ fontSize: 11, color: '#F59E0B' }}>★ {driver.rating.toFixed(1)}</Text>}
                                    </View>
                                </Callout>
                            )}
                        </Marker>
                    ))}

                    {markers.map((m) => (
                        <Marker key={m.id} coordinate={m.point} title={m.title} description={m.description} pinColor={m.pinColor || '#7928CA'} />
                    ))}

                    {polyline && polyline.length > 1 && (
                        <Polyline coordinates={polyline} strokeColor="#7928CA" strokeWidth={4} />
                    )}

                    {children}
                </MapView>

                {showRecenterButton && (
                    <TouchableOpacity
                        onPress={handleRecenter}
                        activeOpacity={0.8}
                        style={{ position: 'absolute', bottom: bottomPadding + 12, right: 12, width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 }}
                    >
                        <LocateFixed size={20} color="#4B2861" />
                    </TouchableOpacity>
                )}
            </View>
        );
    }
);
