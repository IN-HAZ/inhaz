/**
 * Named Google Maps JSON style arrays for each MapStyleTheme.
 *
 * Usage:
 *   import { getMapStyle } from './mapStyles';
 *   <MapView customMapStyle={getMapStyle('dark')} />
 *
 * References:
 *   https://mapstyle.withgoogle.com/
 *   Design system §4.2 — dark canvas #100D14, cards #18141F
 */

import type { MapStyleElement } from "react-native-maps";
import type { MapStyleTheme } from "./BaseMapTypes";

// ─── Dark theme ───────────────────────────────────────────────────────────────
// Matches the Obsidian dark mode canvas (#100D14) and card surface (#18141F).
const darkStyle = [
    { elementType: "geometry", stylers: [{ color: "#100D14" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#100D14" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746E7E" }] },
    {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#B8B0C4" }],
    },
    {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#746E7E" }],
    },
    {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#18141F" }],
    },
    {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#4A3E57" }],
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#2D2638" }],
    },
    {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#18141F" }],
    },
    {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9CA3AF" }],
    },
    {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#3D3350" }],
    },
    {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#221C2B" }],
    },
    {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#C4B5FD" }],
    },
    {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#18141F" }],
    },
    {
        featureType: "transit.station",
        elementType: "labels.text.fill",
        stylers: [{ color: "#746E7E" }],
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#07050D" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#515C6D" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#17263C" }],
    },
];

// ─── Minimal theme ────────────────────────────────────────────────────────────
// Roads only — suppresses all POI, business labels, and transit.
// Best for small preview tiles where map detail would be visual noise.
const minimalStyle = [
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    {
        featureType: "administrative",
        elementType: "labels",
        stylers: [{ visibility: "simplified" }],
    },
    {
        featureType: "road",
        elementType: "labels.icon",
        stylers: [{ visibility: "off" }],
    },
    {
        featureType: "landscape",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
    },
];

// ─── Public helper ────────────────────────────────────────────────────────────

/**
 * Returns the Google Maps JSON style array for the given theme.
 * Returns `undefined` for "default" (no custom style = native Google Maps look).
 */
export function getMapStyle(
    theme: MapStyleTheme,
): MapStyleElement[] | undefined {
    switch (theme) {
        case "dark":
            return darkStyle;
        case "minimal":
            return minimalStyle;
        case "default":
        default:
            return undefined;
    }
}
