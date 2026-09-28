import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, BackHandler } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Plus, User } from 'lucide-react-native';

import { RequestMap } from '@/components/map/variants/RequestMap';
import type { BaseMapHandle, MapPoint, NearbyDriverMarker } from '@/components/map/core/BaseMapTypes';
import { RequestWizard } from '@/components/requests/RequestWizard';
import type { RequestWizardMapView } from '@/components/requests/types';
import { driverApi } from '@/lib/api/driver';
import { useLocationOnEntry, HOME_DELTA } from '@/lib/hooks/useLocationOnEntry';

/** Adapter from the API/mock driver shape to the map marker layer shape. */
function toDriverMarkers(drivers: Awaited<ReturnType<typeof driverApi.nearbyDrivers>>): NearbyDriverMarker[] {
  return drivers.map((d) => ({
    id: String(d.id),
    latitude: d.position.latitude,
    longitude: d.position.longitude,
    vehicleType: d.vehicle,
    rating: d.rating,
  }));
}

// Recenter button sits ABOVE the full-width "Créer une demande" CTA (24px
// bottom inset + ~52px button + 12px gap) so it stays tappable on the idle
// home; while the wizard is open the sheet's bottomPadding already clears it.
const RECENTER_IDLE_OFFSET = 88;

/**
 * Client home (W8) — map-first.
 *
 * Owns the single `RequestMap` instance and the GPS position (requested on
 * entry, not at boot). The request wizard overlays the SAME map — it never
 * remounts between wizard steps; the wizard only pushes map-view props up.
 */
export default function ClientHomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ create?: string }>();

  const mapRef = useRef<BaseMapHandle | null>(null);

  // Shared "GPS on entry" hook (W9) — permission prompt + first fix, mounted
  // once per home screen, never at app boot.
  const { currentLocation, setCurrentLocation, homeRegion, setHomeRegion } =
    useLocationOnEntry();

  const [drivers, setDrivers] = useState<NearbyDriverMarker[]>([]);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardView, setWizardView] = useState<RequestWizardMapView | null>(null);
  const wizardRecenterRef = useRef<((point: MapPoint) => void) | null>(null);
  const wizardOpenedOnceRef = useRef(false);

  // ── Nearby drivers from the mock seam, centered on the user ──────────────────
  useEffect(() => {
    if (!currentLocation) return;
    let alive = true;
    driverApi
      .nearbyDrivers({ latitude: currentLocation.latitude, longitude: currentLocation.longitude })
      .then((list) => { if (alive) setDrivers(toDriverMarkers(list)); })
      .catch(() => {});
    return () => { alive = false; };
  }, [currentLocation]);

  // ── Intent param: /?create=1 auto-opens the wizard (requests list) ───────────
  useEffect(() => {
    if (params.create === '1' && !wizardOpenedOnceRef.current) {
      wizardOpenedOnceRef.current = true;
      setWizardOpen(true);
    }
  }, [params.create]);

  /**
   * Shared recenter (W8 fix): always re-centers the camera on the current
   * location — into the wizard camera when it's open, else the idle home view.
   */
  const handleRecenter = useCallback((pt: MapPoint) => {
    setCurrentLocation(pt);
    if (wizardOpen && wizardRecenterRef.current) {
      wizardRecenterRef.current(pt);
    } else {
      setHomeRegion({ ...pt, latitudeDelta: HOME_DELTA, longitudeDelta: HOME_DELTA });
    }
  }, [wizardOpen]);

  const handleCloseWizard = useCallback(() => {
    setWizardOpen(false);
    setWizardView(null);
    router.setParams({ create: undefined });
  }, [router]);

  // Android hardware back while the wizard overlay is open closes the form
  // instead of exiting the app — the wizard is an in-screen overlay (a state
  // on this route), not a navigable route, so nothing would pop otherwise.
  useEffect(() => {
    if (!wizardOpen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleCloseWizard();
      return true; // consume — do not pop/exit
    });
    return () => sub.remove();
  }, [wizardOpen, handleCloseWizard]);

  // The wizard's view wins while open; the idle home view otherwise. When the
  // wizard has pushed no view yet (first frame), region stays uncontrolled so
  // the camera does not jump.
  const mapRegion = wizardOpen ? (wizardView?.region ?? null) : homeRegion;

  return (
    <View className="flex-1 bg-white">
      {/* ── The single map instance — never remounted by the wizard ─────────── */}
      <RequestMap
        ref={mapRef}
        region={mapRegion}
        currentLocation={currentLocation}
        drivers={drivers}
        markers={wizardView?.markers ?? []}
        polyline={wizardView?.polyline ?? []}
        bottomPadding={wizardView?.bottomPadding ?? 0}
        recenterBottomOffset={wizardOpen ? 0 : RECENTER_IDLE_OFFSET}
        showRecenterButton
        onMapPress={wizardView?.onMapPress}
        onRecenter={handleRecenter}
      />

      {/* ── Header (hidden while the wizard overlay is open) ────────────────── */}
      {!wizardOpen && (
        <View className="absolute top-0 left-0 right-0 z-10 bg-white/95">
          <View className="flex-row items-center justify-between px-6 pt-14 pb-4">
            <Text className="text-2xl font-black text-primary-800">inHaz</Text>
            <TouchableOpacity
              onPress={() => router.push('/profile')}
              className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center"
            >
              <User size={20} color="#4B2861" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── "Créer une demande" entry — opens the wizard over the same map ───── */}
      {!wizardOpen && (
        <View className="absolute inset-x-0 bottom-6 px-5 z-10">
          <TouchableOpacity
            onPress={() => setWizardOpen(true)}
            className="bg-inhaz-purple py-4 rounded-2xl items-center flex-row justify-center gap-2 shadow-lg"
          >
            <Plus size={20} color="white" />
            <Text className="text-white font-bold text-sm">Créer une demande</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── The wizard overlay — drives the shared map via onMapViewUpdate ──── */}
      {wizardOpen && (
        <RequestWizard
          mapRef={mapRef}
          currentLocation={currentLocation}
          recenterRef={wizardRecenterRef}
          onCurrentLocationChange={setCurrentLocation}
          onMapViewUpdate={setWizardView}
          onClose={handleCloseWizard}
        />
      )}
    </View>
  );
}