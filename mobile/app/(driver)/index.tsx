import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { User, ShieldAlert, ChevronRight, FileText } from 'lucide-react-native';

import { authApi } from '@/lib/api/auth';
import { useAuthStore, useRole } from '@/lib/store/auth';
import { driverApi } from '@/lib/api/driver';
import { requestsApi } from '@/lib/api/requests';
import { queryKeys } from '@/lib/api/queryKeys';
import { getErrorMessage } from '@/lib/api/errors';
import { useToast } from '@/components/ui/ToastProvider';
import { useDriverDashboard } from '@/lib/hooks/useDriverDashboard';
import { useLocationOnEntry } from '@/lib/hooks/useLocationOnEntry';
import { useRealtimeRequests } from '@/lib/hooks/useRealtimeRequests';
import { DriverHomeMap } from '@/components/map/variants/DriverHomeMap';
import type { MapPoint, NearbyRequestMarker } from '@/components/map/core/BaseMapTypes';
import type { NearbyRequest } from '@/lib/api/mock/types';

/** Map bottom padding (px) while the live list is shown (roughly the card). */
const LIVE_LIST_FOOTER = 216;

/**
 * Adapter from the API/mock dashboard-request shape to the map layer shape.
 */
function toRequestMarkers(requests: NearbyRequest[]): NearbyRequestMarker[] {
  return requests.map((r) => ({
    id: String(r.id),
    latitude: r.position.latitude,
    longitude: r.position.longitude,
    title: r.title ?? undefined,
    pickupAddress: r.pickup_address,
    destinationAddress: r.destination_address,
    proposedPriceMAD: r.proposed_price ? Number(r.proposed_price) : undefined,
    distanceM: r.distance_m,
  }));
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 bg-gray-50 rounded-xl px-2.5 py-2">
      <Text className="text-gray-400 text-[9px] uppercase font-bold" numberOfLines={1}>{label}</Text>
      <Text className="text-gray-900 text-[13px] font-extrabold mt-0.5" numberOfLines={1}>{value}</Text>
    </View>
  );
}

function LiveRequestRow({
  request,
  onPress,
  last,
}: {
  request: NearbyRequest;
  onPress: () => void;
  last: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`flex-row items-center px-4 py-2.5 ${last ? '' : 'border-b border-gray-50'}`}
    >
      <View className="w-9 h-9 rounded-xl bg-purple-50 items-center justify-center mr-3">
        <Text className="text-base">📦</Text>
      </View>
      <View className="flex-1 mr-2">
        <Text className="text-gray-900 text-[13px] font-semibold" numberOfLines={1}>
          {request.title ?? 'Demande à proximité'}
        </Text>
        <Text className="text-gray-500 text-[11px]" numberOfLines={1}>
          {request.pickup_address} → {request.destination_address}
        </Text>
      </View>
      <View className="items-end">
        {request.proposed_price ? (
          <Text className="text-primary-800 font-extrabold text-xs">{Number(request.proposed_price).toFixed(0)} MAD</Text>
        ) : null}
        <Text className="text-gray-400 text-[10px]">{((request.distance_m ?? 0) / 1000).toFixed(1)} km</Text>
      </View>
    </TouchableOpacity>
  );
}

/**
 * Driver home (W9) — map-first.
 *
 * The single `DriverHomeMap` instance fills the screen; over it (never
 * remounting the map):
 * - approved: a compact dashboard strip (online toggle + gains du jour /
 *   courses / commission + "Résumé" → full dashboard) and a floating
 *   max-3 live list fed by the realtime mock feed (W6 seam);
 * - unapproved: the W7 verification banner over a read-only map — request
 *   markers stay visible but taps and the live list are disabled.
 *
 * Realtime subscription runs ONLY while the home is focused AND the driver
 * is approved; the hook merges events into the shared TanStack cache.
 */
export default function DriverHomeScreen() {
  const router = useRouter();
  const toast = useToast();
  const { user, setUser } = useAuthStore();
  const { driverStatus, isDriverApproved } = useRole();

  // True while this screen is the focused tab (drives subscription + queries).
  const [focused, setFocused] = useState(false);

  const { currentLocation, setCurrentLocation, homeRegion, setHomeRegion } =
    useLocationOnEntry();

  // W7 §6.5: refresh the persona on focus while unapproved — an admin
  // approval lands on `/me`, so returning to the home picks the new state up.
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      if (!isDriverApproved) {
        authApi.me().then(setUser).catch(() => {});
      }
      return () => setFocused(false);
    }, [isDriverApproved, setUser])
  );

  // Keep the backend aware of the driver position (approved only).
  useEffect(() => {
    if (isDriverApproved && currentLocation) {
      driverApi
        .updateLocation(currentLocation.latitude, currentLocation.longitude)
        .catch(() => {});
    }
  }, [isDriverApproved, currentLocation]);

  // Baseline nearby requests — geo/marker shape, mock-backed until Phase B.
  // Unapproved drivers still see the markers read-only (Q4).
  const nearbyQuery = useQuery({
    queryKey: queryKeys.nearby.requests,
    queryFn: () =>
      requestsApi.nearbyRequests(
        1,
        currentLocation
          ? {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }
          : undefined,
      ),
    enabled: focused && !!currentLocation,
  });

  // Live subscription: only while the home is active AND the driver approved.
  useRealtimeRequests({ enabled: focused && isDriverApproved });

  const allNearby = nearbyQuery.data ?? [];

  const liveList = useMemo(
    () =>
      [...allNearby]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 3),
    [allNearby],
  );

  const markers = useMemo(() => toRequestMarkers(allNearby), [allNearby]);

  // Compact dashboard strip — full dashboard stays reachable via "Résumé".
  const { summary, toggleOnline, isTogglingOnline } = useDriverDashboard();
  const isOnline = summary?.is_online ?? false;

  const handleToggleOnline = async () => {
    try {
      const res = await toggleOnline();
      toast.success(res.message);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const handleRecenter = useCallback(
    (pt: MapPoint) => {
      setCurrentLocation(pt);
      setHomeRegion({ ...pt, latitudeDelta: 0.05, longitudeDelta: 0.05 });
    },
    [setCurrentLocation, setHomeRegion],
  );

  const openRequest = useCallback(
    (requestId: string) => {
      if (isDriverApproved) router.push(`/driver/marketplace/${requestId}`);
    },
    [isDriverApproved, router],
  );

  const statusLabel =
    driverStatus === 'PENDING' ? 'Vérification en cours' :
    driverStatus === 'REJECTED' ? 'Candidature rejetée' :
    driverStatus === 'APPROVED' ? 'Compte approuvé' : null;

  const rejectionReason =
    driverStatus === 'REJECTED' ? user?.driver_profile?.rejection_reason : null;

  const restrictedMessage =
    driverStatus === 'REJECTED'
      ? rejectionReason
        ? `Candidature rejetée : ${rejectionReason}`
        : 'Votre candidature a été rejetée.'
      : "Vérification en cours — vos fonctionnalités seront débloquées après validation par notre équipe.";

  return (
    <View className="flex-1 bg-white">
      {/* ── The single map instance — overlays never remount it ─────────────── */}
      <DriverHomeMap
        region={homeRegion}
        currentLocation={currentLocation}
        requests={markers}
        onMarkerPress={openRequest}
        onRecenter={handleRecenter}
        bottomPadding={isDriverApproved ? LIVE_LIST_FOOTER : 0}
      />

      {/* ── Header overlay ─────────────────────────────────────────────────── */}
      <View className="absolute top-0 left-0 right-0 z-10 bg-white/95">
        <View className="flex-row items-center justify-between px-6 pt-14 pb-3">
          <View className="flex-row items-center gap-2">
            <Text className="text-2xl font-black text-primary-800">inHaz</Text>
            <View className="bg-primary-50 px-2.5 py-0.5 rounded-full border border-primary-100">
              <Text className="text-primary-800 text-xs font-extrabold uppercase">Pro</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => router.push('/driver/documents')}
              className="w-10 h-10 bg-white border border-gray-200 rounded-full items-center justify-center"
            >
              <FileText size={18} color="#4B2861" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/driver/profile')}
              className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center"
            >
              <User size={20} color="#4B2861" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Unapproved: W7 verification banner over the read-only map ──────── */}
      {driverStatus && driverStatus !== 'APPROVED' && (
        <View className={`absolute top-[104px] inset-x-4 z-10 rounded-2xl p-4 ${
          driverStatus === 'REJECTED' ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'
        }`}>
          <View className="flex-row items-start">
            <View className="mt-0.5">
              <ShieldAlert
                size={18}
                color={driverStatus === 'REJECTED' ? '#dc2626' : '#d97706'}
              />
            </View>
            <View className="flex-1 ml-2.5">
              <Text className={`font-bold text-sm ${
                driverStatus === 'REJECTED' ? 'text-red-700' : 'text-amber-700'
              }`}>
                {statusLabel}
              </Text>
              <Text className={`text-[13px] leading-5 mt-0.5 ${
                driverStatus === 'REJECTED' ? 'text-red-600' : 'text-amber-600'
              }`}>
                {restrictedMessage}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/driver/documents')}
            className="mt-3 self-start bg-white border border-amber-200 px-3 py-1.5 rounded-lg"
          >
            <Text className="text-amber-700 text-xs font-bold">Mes documents</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Approved: compact dashboard strip ───────────────────────────────── */}
      {isDriverApproved && (
        <View className="absolute top-[104px] inset-x-4 z-10 bg-white rounded-2xl p-3.5 border border-gray-100 shadow-md">
          <View className="flex-row items-center mb-3">
            <View className="flex-1 mr-2">
              <Text className="text-gray-900 text-sm font-bold" numberOfLines={1}>
                Bonjour, {user?.name || user?.customer_profile?.name || 'Chauffeur'}
              </Text>
              <View className="flex-row items-center mt-0.5">
                <View className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                <Text className={`text-[10px] font-extrabold uppercase ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                  {isOnline ? 'En ligne' : 'Hors ligne'}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <Switch
                value={isOnline}
                onValueChange={handleToggleOnline}
                disabled={isTogglingOnline}
                trackColor={{ false: '#E4E4E7', true: '#00C853' }}
                thumbColor="#FFFFFF"
              />
              <TouchableOpacity
                onPress={() => router.push('/driver/dashboard')}
                className="ml-2.5 flex-row items-center bg-purple-50 px-2.5 py-2 rounded-lg border border-purple-100"
              >
                <Text className="text-primary-800 text-[11px] font-bold">Résumé</Text>
                <ChevronRight size={12} color="#4B2861" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row gap-2">
            <MetricChip label="Gains" value={`${summary?.today_earnings_mad ?? 0} MAD`} />
            <MetricChip label="Courses" value={`${summary?.completed_trips_today ?? 0}`} />
            <MetricChip label="Commission" value={`${summary?.commission_balance_mad ?? 0} MAD`} />
          </View>
        </View>
      )}

      {/* ── Approved: floating max-3 live list (realtime mock feed) ─────────── */}
      {isDriverApproved && (
        <View
          className="absolute inset-x-4 bottom-4 z-10 bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden"
          style={{ maxHeight: LIVE_LIST_FOOTER - 36 }}
        >
          <View className="flex-row items-center justify-between px-4 pt-3 pb-1.5">
            <Text className="text-[13px] font-bold text-gray-900">Demandes en direct</Text>
            <View className="flex-row items-center gap-1.5">
              <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <Text className="text-gray-400 text-[10px] uppercase font-bold">Live</Text>
            </View>
          </View>
          {liveList.length === 0 ? (
            <View className="px-4 pb-3 pt-1">
              <Text className="text-gray-400 text-xs">En attente de nouvelles demandes…</Text>
            </View>
          ) : (
            liveList.map((r, i) => (
              <LiveRequestRow
                key={r.id}
                request={r}
                last={i === liveList.length - 1}
                onPress={() => openRequest(String(r.id))}
              />
            ))
          )}
        </View>
      )}
    </View>
  );
}