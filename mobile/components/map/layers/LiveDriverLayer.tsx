import { useRef, useEffect } from "react";
import { View, Text, Animated } from "react-native";
import { Marker } from "react-native-maps";
import type { MapPoint } from "../core/BaseMapTypes";

interface LiveDriverLayerProps {
    /** Driver's current real-time GPS position. Null hides the marker. */
    driverLocation: MapPoint | null | undefined;
    /** Vehicle heading in degrees (0 = North, 90 = East). Used for icon rotation. */
    heading?: number;
    /** Vehicle type string used to pick the emoji icon. */
    vehicleType?: string;
}

function getVehicleEmoji(vehicleType?: string): string {
    const type = vehicleType?.toLowerCase() ?? "";
    if (type.includes("moto")) return "🛵";
    if (type.includes("camion")) return "🚛";
    return "🚚"; // default: truck / triporteur / fourgonnette
}

/**
 * Renders an animated driver pin for real-time live tracking.
 *
 * The marker smoothly re-positions between GPS pings via the `driverLocation`
 * prop — each prop change triggers a smooth camera-less animation on the marker
 * itself. Heading drives a CSS-style rotation via the `Animated` API.
 *
 * Designed to be placed directly inside a BaseMap / MapView as a child.
 *
 * NOTE: Full WebSocket integration (listening to `DriverLocationUpdated`) is
 * the responsibility of the parent variant (`LiveTrackingMap`). This layer
 * is purely presentational.
 */
export function LiveDriverLayer({
    driverLocation,
    heading = 0,
    vehicleType,
}: LiveDriverLayerProps) {
    const rotationAnim = useRef(new Animated.Value(heading)).current;
    const prevHeading = useRef(heading);

    // Animate rotation when heading changes
    useEffect(() => {
        // Choose shortest rotation path
        let delta = heading - prevHeading.current;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        const nextValue = (rotationAnim as any)._value + delta;
        prevHeading.current = heading;

        Animated.timing(rotationAnim, {
            toValue: nextValue,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [heading]);

    if (!driverLocation) return null;

    const rotation = rotationAnim.interpolate({
        inputRange: [-360, 360],
        outputRange: ["-360deg", "360deg"],
    });

    return (
        <Marker
            coordinate={driverLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
        >
            <Animated.View
                style={{
                    transform: [{ rotate: rotation }],
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <View
                    style={{
                        height: 40,
                        width: 40,
                        borderRadius: 20,
                        backgroundColor: "#7928CA",
                        borderWidth: 3,
                        borderColor: "#fff",
                        alignItems: "center",
                        justifyContent: "center",
                        shadowColor: "#000",
                        shadowRadius: 4,
                        shadowOpacity: 0.35,
                        elevation: 6,
                    }}
                >
                    <Text style={{ fontSize: 18 }}>
                        {getVehicleEmoji(vehicleType)}
                    </Text>
                </View>
            </Animated.View>
        </Marker>
    );
}
