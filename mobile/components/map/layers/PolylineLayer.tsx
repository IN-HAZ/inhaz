import { Polyline } from "react-native-maps";
import type { MapPoint } from "../core/BaseMapTypes";

interface PolylineLayerProps {
    points: MapPoint[];
    /** Stroke color. Defaults to brand purple. */
    color?: string;
    /** Stroke width in pts. Defaults to 4. */
    width?: number;
}

/**
 * Renders a route polyline connecting an ordered array of coordinates.
 * Requires at least 2 points — renders nothing with fewer.
 * Designed to be placed directly inside a BaseMap / MapView as a child.
 */
export function PolylineLayer({
    points,
    color = "#7928CA",
    width = 4,
}: PolylineLayerProps) {
    if (points.length < 2) return null;

    return <Polyline coordinates={points} strokeColor={color} strokeWidth={width} />;
}
