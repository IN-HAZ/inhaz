import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore, useRole } from '@/lib/store/auth';
import { User, LayoutDashboard, Store } from 'lucide-react-native';

/**
 * Driver home (W5). Light placeholder — the map-first home + live feed land in
 * W9; the dashboard summary moves here as a compact header there.
 */
export default function DriverHomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { driverStatus, isDriverApproved } = useRole();

  const statusLabel =
    driverStatus === 'PENDING' ? 'Vérification en cours' :
    driverStatus === 'REJECTED' ? 'Candidature rejetée' :
    driverStatus === 'APPROVED' ? 'Compte approuvé' : null;

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

        <View className="flex-row gap-4 w-full">
          <TouchableOpacity
            onPress={() => router.push('/driver/dashboard')}
            className="flex-1 bg-primary-800 py-4 rounded-2xl items-center flex-row justify-center gap-2 shadow-sm"
          >
            <LayoutDashboard size={20} color="white" />
            <Text className="text-white font-bold text-sm">Tableau de bord</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/driver/marketplace')}
            className="flex-1 bg-purple-50 border border-purple-100 py-4 rounded-2xl items-center flex-row justify-center gap-2"
          >
            <Store size={20} color="#4B2861" />
            <Text className="text-primary-800 font-bold text-sm">Marketplace</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}