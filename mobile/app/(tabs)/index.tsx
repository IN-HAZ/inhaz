import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store/auth';
import { User, Store, Plus } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-6 pt-14 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-black text-primary-800">inHaz</Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/profile')}
          className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center"
        >
          <User size={20} color="#4B2861" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        <View className="w-20 h-20 bg-primary-100 rounded-3xl items-center justify-center mb-6">
          <Text className="text-primary-800 text-3xl font-black">in</Text>
        </View>
        <Text className="text-gray-900 text-xl font-bold mb-2">Bienvenue, {user?.name || 'Client'}</Text>
        <Text className="text-gray-500 text-base text-center mb-8">
          Réservez votre prochaine course en quelques secondes.
        </Text>

        <View className="flex-row gap-4 w-full">
          <TouchableOpacity
            onPress={() => router.push('/requests/create')}
            className="flex-1 bg-primary-800 py-4 rounded-2xl items-center"
          >
            <Plus size={20} color="white" />
            <Text className="text-white font-bold text-sm mt-1">Nouvelle demande</Text>
          </TouchableOpacity>

          {user?.role === 'driver' && (
            <TouchableOpacity
              onPress={() => router.push('/driver/marketplace')}
              className="flex-1 bg-gray-50 border border-gray-200 py-4 rounded-2xl items-center"
            >
              <Store size={20} color="#4B2861" />
              <Text className="text-primary-800 font-bold text-sm mt-1">Marketplace</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
