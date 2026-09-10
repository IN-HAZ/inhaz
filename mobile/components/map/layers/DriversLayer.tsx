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
                    <View style={{ alignItems: "center" }}>
                        <View
                            style={{
                                height: 32,
                                width: 32,
                                borderRadius: 16,
                                backgroundColor: "#7928CA",
                                borderWidth: 2,
                                borderColor: "#fff",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Text style={{ fontSize: 14 }}>🚚</Text>
                        </View>
                    </View>

                    {driver.vehicleModel && (
                        <Callout>
                            <View style={{ minWidth: 120, padding: 8 }}>
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontWeight: "600",
                                    }}
                                >
                                    {driver.vehicleModel}
                                </Text>
                                {driver.vehicleType && (
                                    <Text
                                        style={{
                                            fontSize: 11,
                                            color: "#6B7280",
                                        }}
                                    >
                                        {driver.vehicleType}
                                        {driver.distanceKm !== undefined
                                            ? ` · ${driver.distanceKm.toFixed(1)} km`
                                            : ""}
                                    </Text>
                                )}
                                {driver.rating !== undefined && (
                                    <Text
                                        style={{
                                            fontSize: 11,
                                            color: "#F59E0B",
                                        }}
                                    >
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
