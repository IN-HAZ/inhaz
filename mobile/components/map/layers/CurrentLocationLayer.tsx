import { View } from "react-native";
import { Marker } from "react-native-maps";
import type { MapPoint } from "../core/BaseMapTypes";

interface CurrentLocationLayerProps {
    location: MapPoint | null | undefined;
}

/**
 * Renders the user's current position as a blue dot.
 * Designed to be placed directly inside a BaseMap / MapView as a child.
 */
export function CurrentLocationLayer({ location }: CurrentLocationLayerProps) {
    if (!location) return null;

    return (
        <Marker coordinate={location} anchor={{ x: 0.5, y: 0.5 }}>
            <View
                style={{
                    height: 20,
                    width: 20,
                    borderRadius: 10,
                    backgroundColor: "#2563EB",
                    borderWidth: 3,
                    borderColor: "#fff",
                    shadowColor: "#000",
                    shadowRadius: 3,
                    shadowOpacity: 0.3,
                    elevation: 4,
                }}
            />
        </Marker>
    );
}
