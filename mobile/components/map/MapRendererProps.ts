/**
 * MapRendererProps.ts — backward-compatibility re-export shim.
 *
 * All types now live in `core/BaseMapTypes.ts`.
 * Existing imports (`from '@/components/map/MapRenderer'`) continue to work.
 */
export type {
    MapPoint,
    Region,
    NearbyDriverMarker,
    RouteMarker,
    BaseMapHandle as MapRendererHandle,
    MapStyleTheme,
} from "./core/BaseMapTypes";

export type { RequestMapProps as MapRendererProps } from "./variants/RequestMap";
