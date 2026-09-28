import { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import type { RefObject } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft, Truck, Bike } from 'lucide-react-native';
import * as Location from 'expo-location';

import type { BaseMapHandle, MapPoint, Region, RouteMarker } from '@/components/map/core/BaseMapTypes';
import { requestsApi } from '@/lib/api/requests';
import { fileUriToBlob, putToSignedUrl } from '@/lib/api/files';
import { getPlaceDetails, reverseGeocode, PlaceSearchResult } from '@/lib/api/geocoding';
import { getErrorMessage } from '@/lib/api/errors';

import { usePlaceSearch } from '@/lib/hooks/usePlaceSearch';
import { useCameraPermission } from '@/lib/hooks/useCameraPermission';
import { useImagePicker } from '@/lib/hooks/useImagePicker';
import type { StopItem, PhotoItem, VehicleOption, RequestWizardMapView } from './types';
import { SelectedPinCard } from './SelectedPinCard';
import {
  RequestWizardSheet,
  REQUEST_WIZARD_SCREEN_HEIGHT,
  REQUEST_WIZARD_SNAP_PEEK,
} from './RequestWizardSheet';
import { Step1Locations } from './Step1Locations';
import { Step2Package } from './Step2Package';
import { Step3Vehicle } from './Step3Vehicle';
import { Step4Pricing } from './Step4Pricing';
import { Step5Review } from './Step5Review';

const VEHICLE_OPTIONS: VehicleOption[] = [
  { id: 'moto',         label: 'Moto',         sub: 'Petits colis (< 10 kg)',    icon: Bike  },
  { id: 'triporteur',   label: 'Triporteur',   sub: 'Moyen colis (< 300 kg)',    icon: Truck },
  { id: 'fourgonnette', label: 'Fourgonnette', sub: 'Volumineux (< 1000 kg)',    icon: Truck },
  { id: 'camion',       label: 'Camion',       sub: 'Lourd / Palettes (> 1T)',   icon: Truck },
];

function makeStop(type: 'PICKUP' | 'DESTINATION'): StopItem {
  return { type, address: '', contact_name: '', contact_phone: '' };
}

/** Compute the best-fit region for a set of coordinates. */
function fitRegion(points: { latitude: number; longitude: number }[]): Region | null {
  if (points.length === 0) return null;
  if (points.length === 1) return { latitude: points[0].latitude, longitude: points[0].longitude, latitudeDelta: 0.04, longitudeDelta: 0.04 };
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const pad = 0.5;
  return {
    latitude:  (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta:  Math.max(0.02, (maxLat - minLat) * (1 + pad)),
    longitudeDelta: Math.max(0.02, (maxLng - minLng) * (1 + pad)),
  };
}

export interface RequestWizardProps {
  /** The home's map handle — the wizard only drives the camera, never mounts a map. */
  mapRef: RefObject<BaseMapHandle | null>;
  /** The home's current GPS position (requested on home entry, W8 §7). */
  currentLocation: MapPoint | null;
  /**
   * The wizard registers its recenter handler here so the home's shared
   * RecenterButton drives the wizard camera too (fixed in W8 to always
   * re-center).
   */
  recenterRef: RefObject<((point: MapPoint) => void) | null>;
  /** Forwards a freshly acquired GPS position back to the home (blue dot). */
  onCurrentLocationChange: (point: MapPoint) => void;
  /** Pushes the wizard's map view up — the home applies it to the shared map. */
  onMapViewUpdate: (view: RequestWizardMapView) => void;
  /** Step 1 back → close the overlay (the map stays mounted underneath). */
  onClose: () => void;
}

/**
 * RequestWizard (W8) — owns the 5-step request state, draft, validation and
 * publish, extracted verbatim from `app/(client)/requests/create.tsx`.
 *
 * The map lives on the home screen: the wizard records its map view
 * (markers/polyline/region/bottom padding/map-press handler) and pushes it to
 * the home via `onMapViewUpdate`, so the map never remounts between steps.
 */
export function RequestWizard({
  mapRef,
  currentLocation,
  recenterRef,
  onCurrentLocationChange,
  onMapViewUpdate,
  onClose,
}: RequestWizardProps) {
  const router   = useRouter();

  // Camera permission state machine for package photos (feature-time only).
  // The `request-package-photos` key predates W8 (W3) so a permanent denial
  // stays remembered across the move from the create screen.
  const { state: cameraState, request: requestCamera, openSettings: openCameraSettings } =
    useCameraPermission('request-package-photos');

  // Shared gallery/camera picker (requests the media-library permission and
  // recovers Android MainActivity kills — see useImagePicker).
  const { pickFromLibrary, pickFromCamera } = useImagePicker({ quality: 0.8 });

  const [draftId,       setDraftId]       = useState<number | null>(null);
  const [step,          setStep]          = useState(1);
  const [isInitializing, setIsInitializing] = useState(true);

  // ── Stops ─────────────────────────────────────────────────────────────────────
  const [stops, setStops] = useState<StopItem[]>([makeStop('PICKUP'), makeStop('DESTINATION')]);

  // ── Other form state ──────────────────────────────────────────────────────────
  const [description,   setDescription]   = useState('');
  const [weightKg,      setWeightKg]      = useState('');
  const [photos,        setPhotos]        = useState<PhotoItem[]>([]);
  const [vehicleType,   setVehicleType]   = useState('');
  const [proposedPrice, setProposedPrice] = useState(20);
  const [isSaving,      setIsSaving]      = useState(false);
  const [isPublishing,  setIsPublishing]  = useState(false);

  // Live position used for place-search bias — seeded from the home's GPS (§7)
  // and refreshed when the user pins "use current location" for a stop.
  const [liveLocation,  setLiveLocation]  = useState<MapPoint | null>(currentLocation);

  // ── Map view state (drives the home's shared map via onMapViewUpdate) ────────
  const [flyRegion,     setFlyRegion]     = useState<Region | null>(null);
  const [selectedPin,   setSelectedPin]   = useState<{ latitude: number; longitude: number; address: string } | null>(null);
  // map bottom padding tells Google Maps the visible area
  const [mapBottomPad, setMapBottomPad] = useState(REQUEST_WIZARD_SCREEN_HEIGHT - REQUEST_WIZARD_SNAP_PEEK);

  // ── Search ────────────────────────────────────────────────────────────────────
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
  const { results: searchResults, loading: isSearching, search } = usePlaceSearch(liveLocation);

  // ── Init ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    async function init() {
      try {
        const res = await requestsApi.createDraft();
        if (alive) setDraftId(res.request.id);
      } catch {
        Alert.alert('Erreur', "Impossible d'initialiser la demande");
      } finally {
        if (alive) setIsInitializing(false);
      }
    }
    init();
    return () => { alive = false; };
  }, []);

  // Prefill the pickup stop from the home's GPS position (the home requested it
  // on entry — the wizard never re-triggers a permission prompt at mount).
  useEffect(() => {
    if (!currentLocation) return;
    if (stops[0]?.latitude != null || stops[0]?.address.trim() !== '') return;
    let alive = true;
    (async () => {
      const pt = currentLocation;
      setLiveLocation(pt);
      let addr = '';
      try { addr = await reverseGeocode(pt.latitude, pt.longitude); } catch {}
      if (!alive) return;
      setStops((prev) => {
        const u = [...prev];
        if (u[0] && u[0].latitude == null) {
          u[0] = { ...u[0], latitude: pt.latitude, longitude: pt.longitude, address: addr || 'Ma position actuelle' };
        }
        return u;
      });
      if (!alive) return;
      setFlyRegion({ latitude: pt.latitude, longitude: pt.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 });
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation]);

  // Register the recenter bridge used by the home's shared RecenterButton.
  useEffect(() => {
    recenterRef.current = (pt: MapPoint) => {
      setLiveLocation(pt);
      setFlyRegion({ latitude: pt.latitude, longitude: pt.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 });
    };
    return () => { recenterRef.current = null; };
  }, [recenterRef]);

  // ── Stop helpers ──────────────────────────────────────────────────────────────
  const updateStop = (index: number, field: keyof StopItem, value: any) => {
    setStops((prev) => { const u = [...prev]; u[index] = { ...u[index], [field]: value }; return u; });
  };

  const addStop = () => {
    setStops((prev) => [...prev.slice(0, prev.length - 1), makeStop('DESTINATION'), prev[prev.length - 1]]);
  };

  const removeStop = (index: number) => {
    if (stops.length <= 2) return;
    setStops((prev) => prev.filter((_, i) => i !== index));
  };

  const moveStop = (index: number, direction: 'up' | 'down') => {
    setStops((prev) => {
      const arr = [...prev];
      const t   = direction === 'up' ? index - 1 : index + 1;
      if (t < 1 || t > arr.length - 2) return prev;
      [arr[index], arr[t]] = [arr[t], arr[index]];
      return arr;
    });
  };

  // ── Search ────────────────────────────────────────────────────────────────────
  const handleAddressInputChange = (index: number, text: string) => {
    updateStop(index, 'address',   text);
    updateStop(index, 'latitude',  undefined);
    updateStop(index, 'longitude', undefined);
    setActiveSearchIndex(index);
    search(text);
  };

  const handleSelectSearchResult = async (index: number, result: PlaceSearchResult) => {
    search('');
    setActiveSearchIndex(null);
    const details = await getPlaceDetails(result);
    if (details) {
      setStops((prev) => {
        const u = [...prev];
        u[index] = { ...u[index], address: details.address, latitude: details.latitude, longitude: details.longitude };
        return u;
      });
      setFlyRegion({ latitude: details.latitude, longitude: details.longitude, latitudeDelta: 0.03, longitudeDelta: 0.03 });
    }
  };

  const useCurrentLocation = async (index: number) => {
    updateStop(index, 'isLocating', true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission refusée', 'Accès à la géolocalisation requis.'); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const pt: MapPoint = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setLiveLocation(pt);
      onCurrentLocationChange(pt);
      let addr = '';
      try { addr = await reverseGeocode(pt.latitude, pt.longitude); } catch {}
      setStops((prev) => {
        const u = [...prev];
        u[index] = { ...u[index], latitude: pt.latitude, longitude: pt.longitude, address: addr || 'Ma position actuelle', isLocating: false };
        return u;
      });
      setFlyRegion({ latitude: pt.latitude, longitude: pt.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 });
    } catch {
      Alert.alert('Erreur', 'Impossible de récupérer votre position GPS');
    } finally {
      updateStop(index, 'isLocating', false);
    }
  };

  // ── Map tap ───────────────────────────────────────────────────────────────────
  const handleMapPress = async (point: MapPoint) => {
    Keyboard.dismiss();
    search('');

    const address = await reverseGeocode(point.latitude, point.longitude);

    // If user was actively editing a stop, assign directly — no card needed
    if (activeSearchIndex !== null) {
      const idx = activeSearchIndex;
      setActiveSearchIndex(null);
      setStops((prev) => {
        const u = [...prev];
        u[idx] = { ...u[idx], latitude: point.latitude, longitude: point.longitude, address };
        return u;
      });
      return;
    }

    // No active stop → show the role-selection card
    setSelectedPin({ ...point, address });
  };

  const applySelectedPinToStop = (role: 'PICKUP' | 'DESTINATION' | 'STOP') => {
    if (!selectedPin) return;
    if (role === 'PICKUP') {
      setStops((prev) => { const u = [...prev]; u[0] = { ...u[0], address: selectedPin.address, latitude: selectedPin.latitude, longitude: selectedPin.longitude }; return u; });
    } else if (role === 'DESTINATION') {
      setStops((prev) => { const u = [...prev]; const l = u.length - 1; u[l] = { ...u[l], address: selectedPin.address, latitude: selectedPin.latitude, longitude: selectedPin.longitude }; return u; });
    } else {
      setStops((prev) => [
        ...prev.slice(0, prev.length - 1),
        { type: 'DESTINATION', address: selectedPin.address, latitude: selectedPin.latitude, longitude: selectedPin.longitude, contact_name: '', contact_phone: '' },
        prev[prev.length - 1],
      ]);
    }
    setSelectedPin(null);
  };

  // ── Smart map centering when stops' coords change ────────────────────────────
  const stopsKey = stops.filter((s) => s.latitude && s.longitude).map((s) => `${s.latitude?.toFixed(4)},${s.longitude?.toFixed(4)}`).join('|');

  useEffect(() => {
    const coordStops = stops.filter((s) => s.latitude && s.longitude);
    if (coordStops.length === 0) return;

    const points = coordStops.map((s) => ({ latitude: s.latitude!, longitude: s.longitude! }));

    if (coordStops.length === 1) {
      // Center on the single stop
      setFlyRegion({ latitude: points[0].latitude, longitude: points[0].longitude, latitudeDelta: 0.04, longitudeDelta: 0.04 });
    } else {
      // Fit all stops; use fitToCoordinates for accurate padding-aware centering
      const fit = fitRegion(points);
      if (fit) setFlyRegion(fit);
      // Also call fitToCoordinates which respects mapPadding
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(points, mapBottomPad);
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopsKey]);

  // ── Markers & polyline + the view pushed up to the home map ──────────────────
  const mapMarkers = useMemo<RouteMarker[]>(() => {
    const markers: RouteMarker[] = stops
      .filter((s) => s.latitude && s.longitude)
      .map((s, visIdx, arr) => ({
        id: `stop_${stops.indexOf(s)}`,
        point: { latitude: s.latitude!, longitude: s.longitude! },
        title: visIdx === 0 ? 'Retrait' : visIdx === arr.length - 1 ? 'Destination' : `Étape ${visIdx}`,
        description: s.address,
        pinColor: visIdx === 0 ? '#2563EB' : visIdx === arr.length - 1 ? '#DC2626' : '#F97316',
      }));

    if (selectedPin) {
      markers.push({ id: 'selected_pin', point: { latitude: selectedPin.latitude, longitude: selectedPin.longitude }, title: 'Sélectionné', description: selectedPin.address, pinColor: '#7928CA' });
    }
    return markers;
  }, [stops, selectedPin]);

  const mapPolyline = useMemo<MapPoint[]>(
    () => stops.filter((s) => s.latitude && s.longitude).map((s) => ({ latitude: s.latitude!, longitude: s.longitude! })),
    [stops],
  );

  const mapView = useMemo<RequestWizardMapView>(
    () => ({
      region: flyRegion,
      markers: mapMarkers,
      polyline: mapPolyline,
      bottomPadding: mapBottomPad,
      // Step 1 keeps tap-to-pin; later steps disable map interaction.
      onMapPress: step === 1 ? handleMapPress : undefined,
    }),
    // handleMapPress closes over activeSearchIndex, so recompute with it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flyRegion, mapMarkers, mapPolyline, mapBottomPad, step, activeSearchIndex],
  );

  // Push the wizard's map view up — the home applies it to the shared map.
  useEffect(() => {
    onMapViewUpdate(mapView);
  }, [mapView, onMapViewUpdate]);

  // ── Validation ────────────────────────────────────────────────────────────────
  const anyLocating      = stops.some((s) => s.isLocating);
  const canProceedStep1  =
    !anyLocating &&
    stops.every((s) => s.latitude != null && s.longitude != null && s.address.trim() !== '');

  const isPhotosUploading = photos.some((p) => p.status === 'uploading');
  const isPhotosFailed    = photos.some((p) => p.status === 'failed');
  const canProceedStep2   = !isPhotosUploading && !isPhotosFailed && description.trim() !== '';
  const canProceedStep3   = vehicleType !== '';

  // ── Step navigation ───────────────────────────────────────────────────────────
  const handleNextStep = async () => {
    if (!draftId) return;
    setIsSaving(true);
    try {
      if (step === 1) {
        await requestsApi.patchStep(draftId, 'locations', { stops: stops.map((s, i) => ({ type: s.type, order: i, address: s.address, latitude: s.latitude, longitude: s.longitude, contact_name: s.contact_name, contact_phone: s.contact_phone })) });
        setStep(2);
      } else if (step === 2) {
        await requestsApi.patchStep(draftId, 'package', { package_description: description, package_weight_kg: weightKg ? parseFloat(weightKg) : undefined });
        setStep(3);
      } else if (step === 3) {
        await requestsApi.patchStep(draftId, 'vehicle', { vehicle_type: vehicleType });
        setStep(4);
      } else if (step === 4) {
        await requestsApi.patchStep(draftId, 'pricing', { proposed_price: proposedPrice });
        setStep(5);
      }
    } catch (e: any) {
      Alert.alert('Erreur', getErrorMessage(e) || "Impossible d'enregistrer l'étape");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Photo upload ──────────────────────────────────────────────────────────────
  const showCameraBlockedAlert = () =>
    Alert.alert(
      'Caméra inaccessible',
      "L'accès à la caméra a été bloqué. Ouvrez les réglages de l'app pour l'autoriser.",
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Ouvrir les réglages', onPress: () => openCameraSettings() },
      ],
    );

  const showCameraDeniedAlert = () =>
    Alert.alert(
      'Caméra requise',
      "L'accès à la caméra est nécessaire pour photographier le colis.",
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Réessayer', onPress: () => handleSelectPhotos(true) },
      ],
    );

  /** Returns true when the camera is usable; otherwise shows the UX for the current state. */
  const ensureCameraAccess = async (): Promise<boolean> => {
    if (cameraState === 'granted') return true;
    if (cameraState === 'blocked') {
      // Permanently denied → message + Settings only, never re-open the dialog.
      showCameraBlockedAlert();
      return false;
    }
    const next = await requestCamera();
    if (next === 'granted') return true;
    if (next === 'blocked') {
      showCameraBlockedAlert();
      return false;
    }
    showCameraDeniedAlert();
    return false;
  };

  const handleSelectPhotos = async (useCamera = false) => {
    try {
      if (useCamera && !(await ensureCameraAccess())) {
        return;
      }
      const picked = useCamera
        ? await pickFromCamera()
        : await pickFromLibrary({ multiple: true });
      if (picked && !picked.canceled && picked.images.length > 0) {
        const items: PhotoItem[] = picked.images.map((a, i) => ({ id: `${Date.now()}_${i}`, uri: a.uri, fileName: a.fileName || `cargo_${Date.now()}_${i}.jpg`, status: 'selected' }));
        setPhotos((prev) => [...prev, ...items]);
        items.forEach(startPhotoUpload);
      }
    } catch { Alert.alert('Erreur', 'Impossible de capturer la photo'); }
  };

  const startPhotoUpload = async (item: PhotoItem) => {
    if (!draftId) return;
    setPhotos((prev) => prev.map((p) => p.id === item.id ? { ...p, status: 'uploading' } : p));
    try {
      const list = await requestsApi.getPresignedUrls(draftId, [{ filename: item.fileName, content_type: 'image/jpeg' }]);
      if (!list?.length) throw new Error();
      const { photo_key, upload_url } = list[0];
      try {
        const blob = await fileUriToBlob(item.uri);
        await putToSignedUrl(upload_url, blob, 'image/jpeg');
      } catch {}
      await requestsApi.confirmPhoto(draftId, photo_key);
      setPhotos((prev) => prev.map((p) => p.id === item.id ? { ...p, status: 'uploaded', photoKey: photo_key } : p));
    } catch {
      setPhotos((prev) => prev.map((p) => p.id === item.id ? { ...p, status: 'failed', error: "Échec de l'envoi" } : p));
    }
  };

  const removePhoto = (id: string) => setPhotos((prev) => prev.filter((p) => p.id !== id));

  const handlePublish = async () => {
    if (!draftId) return;
    setIsPublishing(true);
    try {
      await requestsApi.publish(draftId);
      Alert.alert('Succès', 'Votre demande a été publiée !', [{ text: 'OK', onPress: () => router.replace('/requests') }]);
    } catch (e: any) {
      Alert.alert('Erreur', getErrorMessage(e) || 'Impossible de publier la demande');
    } finally { setIsPublishing(false); }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  const isNextDisabled =
    isSaving ||
    (step === 1 && !canProceedStep1) ||
    (step === 2 && !canProceedStep2) ||
    (step === 3 && !canProceedStep3);

  return (
    // Transparent overlay + box-none: the home's map stays visible above the
    // bottom sheet (single map instance, W8), and map taps fall through so
    // step 1 can pin stops. Only the sheet / buttons / pin card are touchable.
    <View className="absolute inset-0 z-20" pointerEvents="box-none">

      {/* ── Back button ──────────────────────────────────────────────────────── */}
      <TouchableOpacity
        onPress={() => (step > 1 ? setStep(step - 1) : onClose())}
        className="absolute top-12 left-4 z-20 bg-white/90 p-2.5 rounded-full shadow-md"
      >
        <ArrowLeft size={20} color="#1F2937" />
      </TouchableOpacity>

      {/* ── Step badge ───────────────────────────────────────────────────────── */}
      <View className="absolute top-12 right-4 z-20 bg-gray-900/90 px-3 py-1.5 rounded-full">
        <Text className="text-white text-[11px] font-bold">Étape {step} / 5</Text>
      </View>

      {/* ── Selected pin card (floats in visible map area) ───────────────────── */}
      {selectedPin && (
        // bottom tracks the sheet: mapBottomPad = screen height - sheet top,
        // so the card hovers just above the sheet.
        <View
          className="absolute left-3 right-3 z-[25]"
          style={{ bottom: mapBottomPad + 12 }}
        >
          <SelectedPinCard
            selectedPin={selectedPin}
            onDismiss={() => setSelectedPin(null)}
            onApply={applySelectedPinToStop}
          />
        </View>
      )}

      {/* ── Draggable bottom sheet ───────────────────────────────────────────── */}
      <RequestWizardSheet
        step={step}
        showBack={step > 1}
        isNextDisabled={isNextDisabled}
        isSaving={isSaving}
        onNext={handleNextStep}
        onBack={() => setStep(step - 1)}
        onSheetTopChange={(top) => setMapBottomPad(REQUEST_WIZARD_SCREEN_HEIGHT - top)}
      >
        {step === 1 && (
          <Step1Locations
            stops={stops}
            activeSearchIndex={activeSearchIndex}
            searchResults={searchResults}
            isSearching={isSearching}
            onAddressInputChange={handleAddressInputChange}
            onSelectSearchResult={handleSelectSearchResult}
            onSetActiveSearchIndex={setActiveSearchIndex}
            onUpdateStopField={updateStop}
            onAddStop={addStop}
            onRemoveStop={removeStop}
            onUseCurrentLocation={useCurrentLocation}
            onMoveStop={moveStop}
          />
        )}
        {step === 2 && (
          <Step2Package
            description={description} weightKg={weightKg} photos={photos}
            isPhotosUploading={isPhotosUploading} isPhotosFailed={isPhotosFailed}
            onDescriptionChange={setDescription} onWeightKgChange={setWeightKg}
            onSelectPhotos={handleSelectPhotos} onRetryUpload={startPhotoUpload} onRemovePhoto={removePhoto}
          />
        )}
        {step === 3 && <Step3Vehicle vehicleOptions={VEHICLE_OPTIONS} selectedVehicleType={vehicleType} onSelectVehicle={setVehicleType} />}
        {step === 4 && (
          <Step4Pricing proposedPrice={proposedPrice} onIncreasePrice={() => setProposedPrice((p) => p + 10)} onDecreasePrice={() => setProposedPrice((p) => Math.max(20, p - 10))} />
        )}
        {step === 5 && (
          <Step5Review stops={stops} description={description} weightKg={weightKg} photos={photos} vehicleType={vehicleType} proposedPrice={proposedPrice} isPublishing={isPublishing} onPublish={handlePublish} />
        )}
      </RequestWizardSheet>

      {/* ── Init overlay ─────────────────────────────────────────────────────── */}
      {isInitializing && (
        <View className="absolute inset-0 z-30 bg-white/95 items-center justify-center">
          <ActivityIndicator size="large" color="#7928CA" />
          <Text className="text-gray-500 text-[13px] mt-3">Initialisation de la demande...</Text>
        </View>
      )}
    </View>
  );
}