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
            <View className="h-5 w-5 rounded-full bg-blue-600 border-[3px] border-white shadow-md" />
        </Marker>
    );
}