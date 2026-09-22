import type { ReactNode } from "react";

// ─── Coordinate primitives ────────────────────────────────────────────────────

export interface MapPoint {
    latitude: number;
    longitude: number;
}

export interface Region {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
}

// ─── Domain marker types ──────────────────────────────────────────────────────

export interface NearbyDriverMarker {
    id: string;
    latitude: number;
    longitude: number;
    vehicleType?: string;
    vehicleModel?: string;
    rating?: number;
    distanceKm?: number;
}

export interface RouteMarker {
    id: string;
    point: MapPoint;
    title?: string;
    description?: string;
    pinColor?: string;
}

/** A nearby open request shown on the driver home map (W9). */
export interface NearbyRequestMarker {
    id: string;
    latitude: number;
    longitude: number;
    title?: string;
    pickupAddress?: string;
    destinationAddress?: string;
    proposedPriceMAD?: number;
    distanceM?: number;
}

// ─── Map style theme ──────────────────────────────────────────────────────────

/**
 * Named map style themes applied to the underlying MapView.
 *
 * - `default`  — standard Google Maps appearance, no overrides.
 * - `dark`     — dark vector tiles matching the design system Obsidian canvas (#100D14).
 * - `minimal`  — roads-only, no POI, no transit. Best for compact preview tiles.
 */
export type MapStyleTheme = "default" | "dark" | "minimal";

// ─── BaseMap public API ───────────────────────────────────────────────────────

export interface BaseMapHandle {
    fitToCoordinates: (coords: MapPoint[], bottomPad?: number) => void;
    animateToRegion: (region: Region, duration?: number) => void;
}

export interface BaseMapProps {
    /** Controlled region — animates the camera when changed after mount. */
    region?: Region | null;
    /** Region used only on first render (uncontrolled). Falls back to Morocco center. */
    initialRegion?: Region;
    /** Visual style theme applied to the map tiles. Defaults to "default". */
    mapStyle?: MapStyleTheme;
    showsCompass?: boolean;
    /** Pixels the bottom sheet / overlays cover at the bottom — map controls shift up. */
    bottomPadding?: number;
    onRegionChange?: (region: Region) => void;
    onMapPress?: (point: MapPoint) => void;
    /** Layers rendered inside MapView (Markers, Polylines, etc.) */
    children?: ReactNode;
}
