/**
 * MapRenderer.tsx — backward-compatibility facade.
 *
 * `MapRenderer` is now an alias for `RequestMap` (the full-screen interactive
 * variant). All existing imports and `useRef<MapRendererHandle>` usage
 * continue to work without modification.
 *
 * New screens should import the appropriate variant directly:
 *
 *   import { DashboardMap }           from '@/components/map/variants/DashboardMap';
 *   import { RequestMap }             from '@/components/map/variants/RequestMap';
 *   import { TripRouteMap }           from '@/components/map/variants/TripRouteMap';
 *   import { MarketplacePreviewMap }  from '@/components/map/variants/MarketplacePreviewMap';
 *   import { LiveTrackingMap }        from '@/components/map/variants/LiveTrackingMap';
 */

// Primary export — keeps `<MapRenderer .../>` working in existing screens
export { RequestMap as MapRenderer } from "./variants/RequestMap";
export type { RequestMapProps as MapRendererProps } from "./variants/RequestMap";

// Handle type — keeps `useRef<MapRendererHandle>` working
export type { BaseMapHandle as MapRendererHandle } from "./core/BaseMapTypes";

// All shared types — keeps named imports like `MapPoint`, `Region`, `RouteMarker` working
export type {
    MapPoint,
    Region,
    NearbyDriverMarker,
    RouteMarker,
    MapStyleTheme,
} from "./core/BaseMapTypes";
