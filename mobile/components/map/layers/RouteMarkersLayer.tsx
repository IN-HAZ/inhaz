import { Marker } from "react-native-maps";
import type { RouteMarker } from "../core/BaseMapTypes";

interface RouteMarkersLayerProps {
    markers: RouteMarker[];
}

/**
 * Renders route stop pins (pickup, destination, intermediate stops).
 *
 * Default pin color is the brand purple (#7928CA) unless the marker provides
 * its own `pinColor`. Callers should follow the convention:
 *   - PICKUP      → #2563EB (blue)
 *   - DESTINATION → #DC2626 (red)
 *   - STOP        → #F97316 (orange)
 *
 * Designed to be placed directly inside a BaseMap / MapView as a child.
 */
export function RouteMarkersLayer({ markers }: RouteMarkersLayerProps) {
    if (markers.length === 0) return null;

    return (
        <>
            {markers.map((m) => (
                <Marker
                    key={m.id}
                    coordinate={m.point}
                    title={m.title}
                    description={m.description}
                    pinColor={m.pinColor ?? "#7928CA"}
                />
            ))}
        </>
    );
}
