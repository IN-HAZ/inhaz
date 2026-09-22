import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  Keyboard,
  PanResponder,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Truck, Bike } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

import { RequestMap } from '@/components/map/variants/RequestMap';
import type { BaseMapHandle as MapRendererHandle, RouteMarker, MapPoint, Region } from '@/components/map/core/BaseMapTypes';
import { requestsApi } from '@/lib/api/requests';
import { fileUriToBlob, putToSignedUrl } from '@/lib/api/files';
import { getPlaceDetails, reverseGeocode, PlaceSearchResult } from '@/lib/api/geocoding';
import { getErrorMessage } from '@/lib/api/errors';

import { usePlaceSearch } from '@/lib/hooks/usePlaceSearch';
import { useCameraPermission } from '@/lib/hooks/useCameraPermission';
import { StopItem, PhotoItem, VehicleOption } from '@/components/requests/types';
import { SelectedPinCard } from '@/components/requests/SelectedPinCard';
import { Step1Locations } from '@/components/requests/Step1Locations';
import { Step2Package } from '@/components/requests/Step2Package';
import { Step3Vehicle } from '@/components/requests/Step3Vehicle';
import { Step4Pricing } from '@/components/requests/Step4Pricing';
import { Step5Review } from '@/components/requests/Step5Review';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Snap points (distance from top of screen where the sheet starts) ──────────
const SNAP_PEEK = Math.round(SCREEN_HEIGHT * 0.52); // ~52% from top → map takes top 52%
const SNAP_MID  = Math.round(SCREEN_HEIGHT * 0.34); // ~34% from top
const SNAP_FULL = Math.round(SCREEN_HEIGHT * 0.08); // ~8% from top  → almost full form
const SNAP_POINTS = [SNAP_PEEK, SNAP_MID, SNAP_FULL];

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

export default function CreateRequestScreen() {
  const router   = useRouter();

  // Camera permission state machine for package photos (feature-time only).
  // The same featureKey is reused by the RequestWizard after the W8 refactor so
  // a permanent denial stays remembered across the move.
  const { state: cameraState, request: requestCamera, openSettings: openCameraSettings } =
    useCameraPermission('request-package-photos');

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

  // ── Map state ─────────────────────────────────────────────────────────────────
  const [currentLocation, setCurrentLocation] = useState<MapPoint | null>(null);
  const [flyRegion,       setFlyRegion]       = useState<Region | null>(null);
  const [selectedPin,     setSelectedPin]     = useState<{ latitude: number; longitude: number; address: string } | null>(null);
  // map bottom padding tells Google Maps the visible area
  const [mapBottomPad, setMapBottomPad] = useState(SCREEN_HEIGHT - SNAP_PEEK);
  const mapRef = useRef<MapRendererHandle>(null);

  // ── Search ────────────────────────────────────────────────────────────────────
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
  const { results: searchResults, loading: isSearching, search } = usePlaceSearch(currentLocation);

  // ── Bottom sheet draggable ────────────────────────────────────────────────────
  const sheetTopAnim    = useRef(new Animated.Value(SNAP_PEEK)).current;
  const sheetTopRef     = useRef(SNAP_PEEK);   // live value for pan math
  const dragBaseRef     = useRef(SNAP_PEEK);   // value at the moment touch starts
  const isKbOpenRef     = useRef(false);
  const kbHeightRef     = useRef(0);

  // Keep sheetTopRef in sync with animated value
  useEffect(() => {
    const id = sheetTopAnim.addListener(({ value }) => { sheetTopRef.current = value; });
    return () => sheetTopAnim.removeListener(id);
  }, []);

  const snapSheet = useCallback((target: number) => {
    const clamped = Math.max(SNAP_FULL, Math.min(SNAP_PEEK, target));
    Animated.spring(sheetTopAnim, { toValue: clamped, useNativeDriver: false, tension: 80, friction: 12 }).start();
    // Update map bottom padding when sheet settles
    setMapBottomPad(SCREEN_HEIGHT - clamped);
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:  () => true,
      onMoveShouldSetPanResponder:   (_, gs) => Math.abs(gs.dy) > 4,
      onPanResponderGrant: () => {
        dragBaseRef.current = sheetTopRef.current;
      },
      onPanResponderMove: (_, gs) => {
        const next    = dragBaseRef.current + gs.dy;
        const clamped = Math.max(SNAP_FULL - 30, Math.min(SNAP_PEEK + 30, next));
        sheetTopAnim.setValue(clamped);
      },
      onPanResponderRelease: (_, gs) => {
        const current = sheetTopRef.current;
        let target: number;

        if (gs.vy > 0.6) {
          // Fast swipe down → next lower snap (bigger number = lower on screen)
          target = SNAP_POINTS.find((p) => p > current + 10) ?? SNAP_PEEK;
        } else if (gs.vy < -0.6) {
          // Fast swipe up → next higher snap (smaller number = higher on screen)
          target = [...SNAP_POINTS].reverse().find((p) => p < current - 10) ?? SNAP_FULL;
        } else {
          // Nearest snap point
          target = SNAP_POINTS.reduce((best, p) =>
            Math.abs(p - current) < Math.abs(best - current) ? p : best,
          );
        }

        const clamped = Math.max(SNAP_FULL, Math.min(SNAP_PEEK, target));
        Animated.spring(sheetTopAnim, { toValue: clamped, useNativeDriver: false, tension: 80, friction: 12 }).start();
        setMapBottomPad(SCREEN_HEIGHT - clamped);
      },
    }),
  ).current;

  // Keyboard: expand sheet so inputs stay visible
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        isKbOpenRef.current = true;
        kbHeightRef.current = e.endCoordinates.height;
        // Expand to SNAP_FULL so keyboard doesn't cover the form
        snapSheet(SNAP_FULL);
      },
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        isKbOpenRef.current = false;
        kbHeightRef.current = 0;
        // Don't auto-collapse — let user decide sheet position
      },
    );
    return () => { show.remove(); hide.remove(); };
  }, []);

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

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (!alive) return;
          const pt: MapPoint = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setCurrentLocation(pt);
          let addr = '';
          try { addr = await reverseGeocode(pt.latitude, pt.longitude); } catch {}
          setStops((prev) => {
            const u = [...prev];
            if (u[0] && !u[0].latitude) u[0] = { ...u[0], latitude: pt.latitude, longitude: pt.longitude, address: addr || 'Ma position actuelle' };
            return u;
          });
          setFlyRegion({ latitude: pt.latitude, longitude: pt.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 });
        }
      } catch {}
    }
    init();
    return () => { alive = false; };
  }, []);

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
  }, [stopsKey]);

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
      setCurrentLocation(pt);
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

  // ── Markers & polyline ────────────────────────────────────────────────────────
  const mapMarkers: RouteMarker[] = stops
    .filter((s) => s.latitude && s.longitude)
    .map((s, visIdx, arr) => ({
      id: `stop_${stops.indexOf(s)}`,
      point: { latitude: s.latitude!, longitude: s.longitude! },
      title: visIdx === 0 ? 'Retrait' : visIdx === arr.length - 1 ? 'Destination' : `Étape ${visIdx}`,
      description: s.address,
      pinColor: visIdx === 0 ? '#2563EB' : visIdx === arr.length - 1 ? '#DC2626' : '#F97316',
    }));

  if (selectedPin) {
    mapMarkers.push({ id: 'selected_pin', point: { latitude: selectedPin.latitude, longitude: selectedPin.longitude }, title: 'Sélectionné', description: selectedPin.address, pinColor: '#7928CA' });
  }

  const mapPolyline: MapPoint[] = stops.filter((s) => s.latitude && s.longitude).map((s) => ({ latitude: s.latitude!, longitude: s.longitude! }));

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
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8, allowsMultipleSelection: !useCamera };
      const result = useCamera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (!result.canceled && result.assets?.length > 0) {
        const items: PhotoItem[] = result.assets.map((a, i) => ({ id: `${Date.now()}_${i}`, uri: a.uri, fileName: a.fileName || `cargo_${Date.now()}_${i}.jpg`, status: 'selected' }));
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
  if (isInitializing) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#7928CA" />
        <Text className="text-gray-500 text-[13px] mt-3">Initialisation de la demande...</Text>
      </View>
    );
  }

  const isNextDisabled =
    isSaving ||
    (step === 1 && !canProceedStep1) ||
    (step === 2 && !canProceedStep2) ||
    (step === 3 && !canProceedStep3);

  return (
    <View className="flex-1 bg-black">

      {/* ── Full-screen map ──────────────────────────────────────────────────── */}
      <View className="absolute inset-0">
        <RequestMap
          ref={mapRef}
          region={flyRegion}
          currentLocation={currentLocation}
          markers={mapMarkers}
          polyline={mapPolyline}
          bottomPadding={mapBottomPad}
          showRecenterButton
          onRecenter={(pt) => setCurrentLocation(pt)}
          onMapPress={handleMapPress}
        />
      </View>

      {/* ── Back button ──────────────────────────────────────────────────────── */}
      <TouchableOpacity
        onPress={() => (step > 1 ? setStep(step - 1) : router.back())}
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
        // bottom is an Animated value derived from the sheet position
        <Animated.View
          className="absolute left-3 right-3 z-[25]"
          style={{ bottom: Animated.subtract(SCREEN_HEIGHT - SNAP_FULL, sheetTopAnim as any) }}
        >
          <SelectedPinCard
            selectedPin={selectedPin}
            onDismiss={() => setSelectedPin(null)}
            onApply={applySelectedPinToStop}
          />
        </Animated.View>
      )}

      {/* ── Draggable bottom sheet ───────────────────────────────────────────── */}
      {/* top is the Animated value driving the drag; the rest is Tailwind. */}
      <Animated.View
        className="absolute left-0 right-0 bottom-0 bg-white rounded-t-3xl shadow-2xl z-10"
        style={{ top: sheetTopAnim }}
      >

        {/* Drag handle — responds to pan gestures */}
        <View className="pt-2.5 pb-2 px-5 border-b border-gray-100" {...panResponder.panHandlers}>
          <View className="sheet-drag-handle mb-2.5" />
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-bold text-gray-900 flex-1">
              {step === 1 && '1. Adresses & Trajet'}
              {step === 2 && '2. Colis & Photos'}
              {step === 3 && '3. Type de Véhicule'}
              {step === 4 && '4. Budget & Prix proposé'}
              {step === 5 && '5. Récapitulatif & Publication'}
            </Text>
            <View className="flex-row gap-[5px]">
              {[1, 2, 3, 4, 5].map((s) => (
                <View
                  key={s}
                  className={`h-[7px] rounded ${
                    s === step
                      ? 'w-[18px] bg-inhaz-purple'
                      : s < step
                        ? 'w-[7px] bg-purple-300'
                        : 'w-[7px] bg-gray-200'
                  }`}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Scrollable form */}
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pt-3 pb-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={() => snapSheet(SNAP_FULL)}
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
        </ScrollView>

        {/* Nav buttons */}
        {step < 5 && (
          <View className={`flex-row items-center justify-between px-5 pt-3 border-t border-gray-100 ${Platform.OS === 'ios' ? 'pb-7' : 'pb-4'}`}>
            {step > 1 ? (
              <TouchableOpacity onPress={() => setStep(step - 1)} className="px-5 py-3 rounded-xl border border-gray-300">
                <Text className="text-gray-700 text-xs font-bold">Retour</Text>
              </TouchableOpacity>
            ) : <View />}
            <TouchableOpacity
              onPress={handleNextStep}
              disabled={isNextDisabled}
              className={`px-7 py-3 rounded-xl ${isNextDisabled ? 'bg-purple-300' : 'bg-inhaz-purple'}`}
            >
              {isSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-white text-xs font-bold">Suivant →</Text>}
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </View>
  );
}
