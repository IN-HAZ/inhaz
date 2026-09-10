import type { ReactNode } from 'react';

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

export interface MapRendererProps {
  region?: Region | null;
  currentLocation?: MapPoint | null;
  drivers?: NearbyDriverMarker[];
  markers?: RouteMarker[];
  polyline?: MapPoint[];
  showRecenterButton?: boolean;
  /** Pixels the bottom sheet covers — maps controls and centering adjust above this */
  bottomPadding?: number;
  onMapPress?: (point: MapPoint) => void;
  onRegionChange?: (region: Region) => void;
  onRecenter?: (point: MapPoint) => void;
  /** Extra markers (native only; ignored on web). */
  children?: ReactNode;
}
