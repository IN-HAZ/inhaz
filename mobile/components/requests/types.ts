export interface StopItem {
  type: 'PICKUP' | 'DESTINATION';
  address: string;
  contact_name: string;
  contact_phone: string;
  latitude?: number;
  longitude?: number;
  /** True while a GPS/geocode operation is in progress for this stop */
  isLocating?: boolean;
}

export interface PhotoItem {
  id: string;
  uri: string;
  fileName: string;
  photoKey?: string;
  status: 'selected' | 'uploading' | 'uploaded' | 'failed';
  error?: string;
}

export interface VehicleOption {
  id: string;
  label: string;
  sub: string;
  icon: any;
}

// ─── Wizard × home map contract (W8) ──────────────────────────────────────────

import type { MapPoint, Region, RouteMarker } from '@/components/map/core/BaseMapTypes';

/**
 * The request wizard's view of the shared map (W8). The home owns the single
 * `RequestMap` instance (map never remounts between wizard steps); the wizard
 * pushes this view up through `onMapViewUpdate` and the home applies it as the
 * map's props.
 *
 * `onMapPress` is live only on step 1 (tap-to-pin / assign to active stop);
 * later steps disable map interaction.
 */
export interface RequestWizardMapView {
  region: Region | null;
  markers: RouteMarker[];
  polyline: MapPoint[];
  /** Visible map area under the sheet, in px (drives `mapPadding.bottom`). */
  bottomPadding: number;
  onMapPress: ((point: MapPoint) => void) | undefined;
}
