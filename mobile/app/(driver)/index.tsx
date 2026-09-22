import { useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { authApi } from '@/lib/api/auth';
import { useAuthStore, useRole } from '@/lib/store/auth';
import { useToast } from '@/components/ui/ToastProvider';
import { User, LayoutDashboard, Store, FileText, ShieldAlert } from 'lucide-react-native';

/**
 * Driver home (W5/W7). The map-first home + live feed land in W9; the
 * dashboard summary moves there as a compact header.
 *
 * W7 §6.5 (home-level gate, deepened per-feature in W9): unapproved drivers
 * get a French verification banner + explanation, and the restricted actions
 * (Marketplace, Tableau de bord) show a "Vérification en cours" toast instead
 * of navigating. Profile and Documents stay reachable so a pending driver can
 * finish or follow their dossier. Approval is backend-driven and re-fetched
 * whenever the home regains focus while still unapproved.
 */
export default function DriverHomeScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const { driverStatus, isDriverApproved } = useRole();
  const toast = useToast();

  const statusLabel =
    driverStatus === 'PENDING' ? 'Vérification en cours' :
    driverStatus === 'REJECTED' ? 'Candidature rejetée' :
    driverStatus === 'APPROVED' ? 'Compte approuvé' : null;

  const rejectionReason = driverStatus === 'REJECTED' ? user?.driver_profile?.rejection_reason : null;

  // Refresh the persona on focus while unapproved: an admin approval lands on
  // `/me`, so returning to the home (or the app) picks the new state up.
  useFocusEffect(
    useCallback(() => {
      if (!isDriverApproved) {
        authApi.me().then(setUser).catch(() => {});
      }
    }, [isDriverApproved, setUser])
  );

  const restrictedMessage =
    driverStatus === 'REJECTED'
      ? rejectionReason
        ? `Candidature rejetée : ${rejectionReason}`
        : 'Votre candidature a été rejetée.'
      : "Vérification en cours — vos fonctionnalités seront débloquées après validation par notre équipe.";

  const goRestricted = (label: string) => {
    if (isDriverApproved) return;
    toast.warning(label === 'Marketplace'
      ? "Marketplace verrouillée — vérification en cours."
      : "Tableau de bord verrouillé — vérification en cours.");
  };

  const openOrWarn = (label: string, open: () => void) => {
    if (isDriverApproved) {
      open();
    } else {
      goRestricted(label);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-14 pb-4 border-b border-gray-100">
        <View className="flex-row items-center gap-2">
          <Text className="text-2xl font-black text-primary-800">inHaz</Text>
          <View className="bg-primary-50 px-2.5 py-0.5 rounded-full border border-primary-100">
            <Text className="text-primary-800 text-xs font-extrabold uppercase">Pro</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/driver/profile')}
          className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center"
        >
          <User size={20} color="#4B2861" />
        </TouchableOpacity>
      </View>

      {/* Verification banner (W7 §6.5) */}
      {driverStatus && driverStatus !== 'APPROVED' && (
        <View className={`mx-4 mt-4 rounded-2xl p-4 ${
          driverStatus === 'REJECTED' ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'
        }`}>
          <View className="flex-row items-start">
            <ShieldAlert
              size={18}
              color={driverStatus === 'REJECTED' ? '#dc2626' : '#d97706'}
              style={{ marginTop: 2 }}
            />
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
        </View>
      )}

      {/* Main Content */}
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-20 h-20 bg-primary-100 rounded-3xl items-center justify-center mb-6">
          <Text className="text-primary-800 text-3xl font-black">PRO</Text>
        </View>

        <Text className="text-gray-900 text-xl font-bold mb-2">
          Bienvenue, {user?.name || user?.customer_profile?.name || 'Chauffeur'}
        </Text>

        {/* Tier-2 driver verification state (W5 §5.3) */}
        {driverStatus && (
          <View className={`px-3 py-1.5 rounded-full mb-6 ${
            driverStatus === 'APPROVED' ? 'bg-green-50' :
            driverStatus === 'REJECTED' ? 'bg-red-50' : 'bg-amber-50'
          }`}>
            <Text className={`text-xs font-semibold ${
              driverStatus === 'APPROVED' ? 'text-green-700' :
              driverStatus === 'REJECTED' ? 'text-red-700' : 'text-amber-700'
            }`}>
              {statusLabel}
            </Text>
          </View>
        )}

        <Text className="text-gray-500 text-base text-center mb-8">
          {isDriverApproved
            ? 'Gérez vos livraisons et consultez les opportunités à proximité.'
            : 'Votre candidature est en cours d’examen par notre équipe.'}
        </Text>

        {/* Restricted actions (W7 §6.5) */}
        <View className="flex-row gap-4 w-full">
          <TouchableOpacity
            onPress={() => openOrWarn('Dashboard', () => router.push('/driver/dashboard'))}
            className={`flex-1 py-4 rounded-2xl items-center flex-row justify-center gap-2 ${
              isDriverApproved ? 'bg-primary-800 shadow-sm' : 'bg-gray-200'
            }`}
          >
            <LayoutDashboard size={20} color={isDriverApproved ? 'white' : '#9CA3AF'} />
            <Text className={`font-bold text-sm ${isDriverApproved ? 'text-white' : 'text-gray-400'}`}>
              Tableau de bord
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => openOrWarn('Marketplace', () => router.push('/driver/marketplace'))}
            className={`flex-1 py-4 rounded-2xl items-center flex-row justify-center gap-2 border ${
              isDriverApproved ? 'bg-purple-50 border-purple-100' : 'bg-gray-50 border-gray-100'
            }`}
          >
            <Store size={20} color={isDriverApproved ? '#4B2861' : '#9CA3AF'} />
            <Text className={`font-bold text-sm ${isDriverApproved ? 'text-primary-800' : 'text-gray-400'}`}>
              Marketplace
            </Text>
          </TouchableOpacity>
        </View>

        {/* Always-reachable: dossier + profile (§6.5 "profile stays visible") */}
        <View className="flex-row gap-4 w-full mt-4">
          <TouchableOpacity
            onPress={() => router.push('/driver/documents')}
            className="flex-1 flex-row items-center justify-center gap-2 bg-white border border-gray-200 py-3.5 rounded-2xl"
          >
            <FileText size={16} color="#4B2861" />
            <Text className="text-gray-700 font-semibold text-sm">Documents</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/driver/profile')}
            className="flex-1 flex-row items-center justify-center gap-2 bg-white border border-gray-200 py-3.5 rounded-2xl"
          >
            <User size={16} color="#4B2861" />
            <Text className="text-gray-700 font-semibold text-sm">Profil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}