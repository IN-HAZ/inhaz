import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { PackageSearch, CarFront, ChevronRight, ArrowLeft } from 'lucide-react-native';

/**
 * Role choice (W7 §6.2). Shown right after OTP when the persona is incomplete
 * (no name, no role chosen, no driver profile). The two paths persist the
 * persona through their onboarding (client → PUT /me name; driver → apply →
 * driver_profile); the backend `role` field itself only moves to `driver`
 * after approval (ticket B1), so nothing here calls switchRole in Phase A.
 */
export default function RoleChoiceScreen() {
  return (
    <View className="flex-1 bg-white">
      {/* Header */}
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
          Comment souhaitez-vous utiliser inHaz ?
        </Text>
        <Text className="text-gray-500 text-base leading-6">
          Choisissez votre profil pour continuer. Vous pourrez changer plus
          tard depuis vos réglages.
        </Text>

        <View className="mt-10 space-y-5">
          {/* Client */}
          <TouchableOpacity
            onPress={() => router.replace('/onboarding/client')}
            activeOpacity={0.85}
            className="flex-row items-center bg-primary-50 border border-primary-100 rounded-3xl p-5"
          >
            <View className="w-14 h-14 bg-primary-800 rounded-2xl items-center justify-center mr-4">
              <PackageSearch size={26} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 text-lg font-bold">Client</Text>
              <Text className="text-gray-500 text-[13px] leading-5 mt-0.5">
                Publiez une demande et suivez vos colis.
              </Text>
            </View>
            <View className="w-8 h-8 bg-primary-800 rounded-full items-center justify-center">
              <ChevronRight size={15} color="white" />
            </View>
          </TouchableOpacity>

          {/* Driver */}
          <TouchableOpacity
            onPress={() => router.replace('/onboarding/driver')}
            activeOpacity={0.85}
            className="flex-row items-center bg-purple-50 border border-purple-100 rounded-3xl p-5"
          >
            <View className="w-14 h-14 bg-primary-800 rounded-2xl items-center justify-center mr-4">
              <CarFront size={26} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 text-lg font-bold">Chauffeur</Text>
              <Text className="text-gray-500 text-[13px] leading-5 mt-0.5">
                Répondez aux demandes près de chez vous et gagnez.
              </Text>
            </View>
            <View className="w-8 h-8 bg-primary-800 rounded-full items-center justify-center">
              <ChevronRight size={15} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Section 6.2 footnote: persistence is Phase B */}
        <Text className="text-gray-400 text-xs text-center mt-10 leading-5">
          Le choix du rôle est enregistré via votre onboarding (nom / dossier
          chauffeur). Le changement de rôle complet arrive dans une prochaine
          version (Phase B).
        </Text>
      </View>
    </View>
  );
}