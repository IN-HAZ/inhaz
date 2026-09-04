import { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
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

const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.01; // street-level, standard for ride/delivery apps
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

export function MapRenderer({
    region,
    currentLocation,
    drivers = [],
    markers = [],
    polyline,
    showRecenterButton = true,
    onMapPress,
    onRegionChange,
    onRecenter,
    children,
}: MapRendererProps) {
    const mapRef = useRef<MapView | null>(null);

    const activeRegion: Region | undefined = region
        ? region
        : currentLocation
          ? {
                ...currentLocation,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA,
            }
          : undefined;

    const handleRecenterPress = async () => {
        if (currentLocation && mapRef.current) {
            mapRef.current.animateToRegion(
                {
                    ...currentLocation,
                    latitudeDelta: region?.latitudeDelta ?? LATITUDE_DELTA,
                    longitudeDelta: region?.longitudeDelta ?? LONGITUDE_DELTA,
                },
                500,
            );
            onRecenter?.(currentLocation);
            return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });
        const pt = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
        };
        const nextRegion = {
            ...pt,
            latitudeDelta: region?.latitudeDelta ?? LATITUDE_DELTA,
            longitudeDelta: region?.longitudeDelta ?? LONGITUDE_DELTA,
        };

        mapRef.current?.animateToRegion(nextRegion, 500);
        onRecenter?.(pt);
        onRegionChange?.(nextRegion);
    };

    return (
        <View style={{ flex: 1, position: "relative" }}>
            <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                initialRegion={activeRegion}
                region={activeRegion}
                showsUserLocation={false}
                showsMyLocationButton={false}
                showsCompass={true}
                onRegionChangeComplete={(r: MapViewRegion) =>
                    onRegionChange?.({
                        latitude: r.latitude,
                        longitude: r.longitude,
                        latitudeDelta: r.latitudeDelta,
                        longitudeDelta: r.longitudeDelta,
                    })
                }
                onPress={(e) => onMapPress?.(e.nativeEvent.coordinate)}
                mapPadding={{ top: 20, bottom: 20, left: 0, right: 0 }}
            >
                {currentLocation && (
                    <Marker
                        coordinate={currentLocation}
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <View className="h-8 w-8 items-center justify-center rounded-full bg-primary-800 border-2 border-white shadow-lg">
                            <Text className="text-base">🚚</Text>
                        </View>
                    </Marker>
                )}

                {drivers.map((driver) => (
                    <Marker
                        key={driver.id}
                        coordinate={{
                            latitude: driver.latitude,
                            longitude: driver.longitude,
                        }}
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <View className="items-center">
                            <View className="h-8 w-8 items-center justify-center rounded-full bg-primary-800 border border-white">
                                <Text className="text-sm text-white">🚚</Text>
                            </View>
                        </View>
                        {driver.vehicleModel && (
                            <Callout>
                                <View className="min-w-[120px] p-2">
                                    <Text className="text-sm font-semibold">
                                        {driver.vehicleModel}
                                    </Text>
                                    {driver.vehicleType && (
                                        <Text className="text-xs text-gray-500">
                                            {driver.vehicleType}
                                            {driver.distanceKm !== undefined
                                                ? ` · ${driver.distanceKm.toFixed(1)} km`
                                                : ""}
                                        </Text>
                                    )}
                                    {driver.rating !== undefined && (
                                        <Text className="text-xs text-amber-500">
                                            ★ {driver.rating.toFixed(1)}
                                        </Text>
                                    )}
                                </View>
                            </Callout>
                        )}
                    </Marker>
                ))}

                {markers.map((m) => (
                    <Marker
                        key={m.id}
                        coordinate={m.point}
                        title={m.title}
                        description={m.description}
                        pinColor={m.pinColor || "#7928CA"}
                    />
                ))}

                {polyline && polyline.length > 1 && (
                    <Polyline
                        coordinates={polyline}
                        strokeColor="#7928CA"
                        strokeWidth={4}
                    />
                )}

                {children}
            </MapView>

            {showRecenterButton && (
                <TouchableOpacity
                    onPress={handleRecenterPress}
                    activeOpacity={0.8}
                    className="absolute bottom-3 right-3 w-10 h-10 bg-white rounded-full items-center justify-center border border-gray-200 shadow-md"
                    style={{ elevation: 4 }}
                >
                    <LocateFixed size={20} color="#4B2861" />
                </TouchableOpacity>
            )}
        </View>
    );
}
