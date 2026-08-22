import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '../../lib/api/client';
import { useAuthStore } from '../../lib/store/auth';
import { useToast } from '../../components/ui/ToastProvider';
import { getErrorMessage } from '../../lib/api/errors';
import { ArrowLeft, CarFront, Banknote, Clock, Shield } from 'lucide-react-native';

export default function DriverApplyScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useAuthStore();
  const toast = useToast();

  const handleApply = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/driver/apply');
      setUser(response.data.user);
      router.replace('/driver/onboarding');
    } catch (error: any) {
      if (error.response?.status === 422) {
        router.replace('/driver/onboarding');
      } else {
        toast.error(getErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="pt-14 pb-4 px-6 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={22} color="#111827" />
          </TouchableOpacity>
          <Text className="text-gray-900 font-semibold text-base font-semibold">Devenir Chauffeur</Text>
          <View className="w-6" />
        </View>
      </View>

      <View className="flex-1 px-6 pt-8">
        <View className="items-center mb-10">
          <View className="w-20 h-20 bg-primary-100 rounded-3xl items-center justify-center mb-4">
            <CarFront size={32} color="#4B2861" />
          </View>
          <Text className="text-3xl font-black text-gray-900 mb-2">
            Rejoignez inHaz
          </Text>
          <Text className="text-gray-500 text-base text-center font-regular">
            Commencez à gagner de l'argent avec vos courses.
          </Text>
        </View>

        <View className="space-y-4 mb-10">
          <View className="flex-row items-start gap-3">
            <View className="w-12 h-12 bg-primary-100 rounded-2xl items-center justify-center">
              <Banknote size={22} color="#4B2861" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-semibold text-sm font-semibold">Revenus flexibles</Text>
              <Text className="text-gray-500 text-sm font-regular">Gagnez jusqu'à 3000 DH/mois</Text>
            </View>
          </View>

          <View className="flex-row items-start gap-3">
            <View className="w-12 h-12 bg-primary-100 rounded-2xl items-center justify-center">
              <Clock size={22} color="#4B2861" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-semibold text-sm font-semibold">Horaires libres</Text>
              <Text className="text-gray-500 text-sm font-regular">Travaillez quand vous voulez</Text>
            </View>
          </View>

          <View className="flex-row items-start gap-3">
            <View className="w-12 h-12 bg-primary-100 rounded-2xl items-center justify-center">
              <Shield size={22} color="#4B2861" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-semibold text-sm font-semibold">Assurance incluse</Text>
              <Text className="text-gray-500 text-sm font-regular">Couverture pendant vos courses</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleApply}
          disabled={loading}
          className="bg-primary-800 rounded-2xl py-4 items-center"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base font-semibold">Postuler maintenant</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
