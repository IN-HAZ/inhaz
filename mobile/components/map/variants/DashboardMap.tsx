import { View } from "react-native";
import { BaseMap } from "../core/BaseMap";
import { CurrentLocationLayer } from "../layers/CurrentLocationLayer";
import type { MapPoint, Region } from "../core/BaseMapTypes";

export interface DashboardMapProps {
    currentLocation?: MapPoint | null;
    region?: Region | null;
}

/**
 * DashboardMap — compact, read-only map for the driver dashboard preview tile.
 *
 * - Style: `minimal` (clean roads, no POI noise in a small container)
 * - Layers: current user location dot only
 * - Controls: none (dashboard owns its own "Activer ma position" button)
 * - Interactions: disabled (no tap, no recenter)
 */
export function DashboardMap({ currentLocation, region }: DashboardMapProps) {
    return (
        <View className="flex-1">
            <BaseMap
                region={region}
                mapStyle="minimal"
                showsCompass={false}
            >
                <CurrentLocationLayer location={currentLocation} />
            </BaseMap>
        </View>
    );
}
