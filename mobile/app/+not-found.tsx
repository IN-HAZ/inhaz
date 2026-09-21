import { Text, View, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ title: "Introuvable" }} />
      <View className="flex-1 items-center justify-center p-5">
        <Text className="text-xl font-bold text-gray-900">
          Cette page n'existe pas.
        </Text>
        <TouchableOpacity onPress={() => router.replace("/")} className="mt-4 py-3">
          <Text className="text-sm text-primary-700 font-semibold">
            Retour à l'accueil
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}