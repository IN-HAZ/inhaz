import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/auth';
import { useToast } from '@/components/ui/ToastProvider';
import { useProfilePhoto } from '@/lib/hooks/useProfilePhoto';
import { getErrorMessage } from '@/lib/api/errors';
import { ArrowLeft, ArrowRight, Camera, UserRound } from 'lucide-react-native';

/**
 * Client onboarding (W7 §6.3). Shown after `/auth/role-choice` for users
 * without a client persona: display name (PUT /me) + optional profile photo
 * (mock upload until backend ticket B5), then land on the client home.
 * Existing complete profiles skip this entirely (§6.1).
 */
export default function ClientOnboardingScreen() {
  const { setUser } = useAuthStore();
  const toast = useToast();
  const photo = useProfilePhoto('client-avatar');

  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    if (!name.trim()) {
      toast.error('Veuillez entrer votre nom complet');
      return;
    }
    setSaving(true);
    try {
      const updated = await authApi.updateProfile({ name: name.trim(), email: null });
      setUser(updated);
      toast.success('Bienvenue sur inHaz !');

      // Photo is best-effort until the backend photo endpoint ships (B5); a
      // failure never blocks the client from reaching the home.
      if (photo.hasPhoto) {
        const uploaded = await photo.upload();
        if (!uploaded) {
          toast.warning('Photo de profil non synchronisée pour le moment (B5).');
        }
      }

      router.replace('/(client)');
    } catch (e: any) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="pt-14 px-6">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
        >
          <ArrowLeft size={18} color="#374151" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-6 pt-6">
        <Text className="text-3xl font-black text-gray-900 mb-2">
          Vos informations
        </Text>
        <Text className="text-gray-500 text-base">
          Une dernière étape pour finaliser votre profil client.
        </Text>

        {/* Profile photo (optional, preview only until B5) */}
        <View className="items-center mt-8 mb-8">
          <TouchableOpacity
            onPress={photo.chooseSource}
            activeOpacity={0.85}
            className="w-24 h-24 rounded-full bg-primary-100 items-center justify-center border-4 border-white shadow-sm shadow-primary-800/10"
          >
            {photo.hasPhoto ? (
              <Image source={{ uri: photo.photo.uri as string }} className="w-full h-full rounded-full" />
            ) : (
              <View className="items-center justify-center">
                <Camera size={26} color="#4B2861" />
              </View>
            )}
          </TouchableOpacity>
          <Text className="text-gray-400 text-xs mt-2">Ajouter une photo (optionnel)</Text>
        </View>

        {/* Name */}
        <View className="mb-2">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Nom complet</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Mohamed Alami"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="words"
            editable={!saving}
            className="border border-gray-200 rounded-2xl px-4 py-3.5 text-base text-gray-900 bg-gray-50"
          />
        </View>
        <View className="flex-row items-center mt-1 mb-8">
          <UserRound size={12} color="#9CA3AF" />
          <Text className="text-gray-400 text-xs ml-1.5">
            Votre nom sera visible par les chauffeurs lors de la livraison.
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleFinish}
          disabled={saving}
          className="bg-primary-800 rounded-2xl py-4 flex-row items-center justify-center"
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text className="text-white font-semibold text-base">Commencer</Text>
              <View className="ml-2">
                <ArrowRight size={20} color="white" />
              </View>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}