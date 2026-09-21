import { View, Text } from "react-native";
import { Marker, Callout } from "react-native-maps";
import type { NearbyDriverMarker } from "../core/BaseMapTypes";

interface DriversLayerProps {
    drivers: NearbyDriverMarker[];
}

/**
 * Renders nearby driver pins (truck emoji) with optional vehicle info callouts.
 * Designed to be placed directly inside a BaseMap / MapView as a child.
 */
export function DriversLayer({ drivers }: DriversLayerProps) {
    if (drivers.length === 0) return null;

    return (
        <>
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
                        <View className="h-8 w-8 rounded-full bg-inhaz-purple border-2 border-white items-center justify-center">
                            <Text className="text-sm">🚚</Text>
                        </View>
                    </View>

                    {driver.vehicleModel && (
                        <Callout>
                            <View className="min-w-[120px] p-2">
                                <Text className="text-[13px] font-semibold">
                                    {driver.vehicleModel}
                                </Text>
                                {driver.vehicleType && (
                                    <Text className="text-[11px] text-gray-500">
                                        {driver.vehicleType}
                                        {driver.distanceKm !== undefined
                                            ? ` · ${driver.distanceKm.toFixed(1)} km`
                                            : ""}
                                    </Text>
                                )}
                                {driver.rating !== undefined && (
                                    <Text className="text-[11px] text-amber-500">
                                        ★ {driver.rating.toFixed(1)}
                                    </Text>
                                )}
                            </View>
                        </Callout>
                    )}
                </Marker>
            ))}
        </>
    );
}