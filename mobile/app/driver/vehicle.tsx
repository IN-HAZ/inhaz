import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { driverApi } from '../../lib/api/driver';
import { useToast } from '../../components/ui/ToastProvider';
import { getErrorMessage } from '../../lib/api/errors';
import { ArrowLeft } from 'lucide-react-native';

export default function VehicleScreen() {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleSave = async () => {
    if (!brand || !model || !registrationNumber) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      await driverApi.saveVehicle({
        brand,
        model,
        registration_number: registrationNumber,
      });

      toast.success('Véhicule enregistré');
      router.back();
    } catch (error: any) {
      toast.error(getErrorMessage(error));
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
          <Text className="text-gray-900 font-semibold text-base font-semibold">Mon Véhicule</Text>
          <View className="w-6" />
        </View>
      </View>

      <View className="flex-1 px-6 pt-6">
        <View className="mb-5">
          <Text className="text-sm font-semibold text-gray-700 mb-2 font-medium">Marque</Text>
          <TextInput
            value={brand}
            onChangeText={setBrand}
            placeholder="Toyota"
            placeholderTextColor="#9CA3AF"
            className="border border-gray-200 rounded-2xl px-4 py-3.5 text-base text-gray-900 bg-gray-50 font-regular"
          />
        </View>

        <View className="mb-5">
          <Text className="text-sm font-semibold text-gray-700 mb-2 font-medium">Modèle</Text>
          <TextInput
            value={model}
            onChangeText={setModel}
            placeholder="Corolla"
            placeholderTextColor="#9CA3AF"
            className="border border-gray-200 rounded-2xl px-4 py-3.5 text-base text-gray-900 bg-gray-50 font-regular"
          />
        </View>

        <View className="mb-8">
          <Text className="text-sm font-semibold text-gray-700 mb-2 font-medium">Immatriculation</Text>
          <TextInput
            value={registrationNumber}
            onChangeText={setRegistrationNumber}
            placeholder="12345-A-12"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="characters"
            className="border border-gray-200 rounded-2xl px-4 py-3.5 text-base text-gray-900 bg-gray-50 font-regular"
          />
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          className={`rounded-2xl py-4 items-center ${loading ? 'bg-gray-200' : 'bg-primary-800'}`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base font-semibold">Enregistrer</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
