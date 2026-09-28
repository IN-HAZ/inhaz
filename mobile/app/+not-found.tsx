import { Text, View, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useAuthStore, useRole } from "@/lib/store/auth";

export default function NotFoundScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { isDriver } = useRole();

  // Bare `/` would cold-match the first alphabetical group; always target the
  // user's own area explicitly (W5 §5.2).
  const goHome = () => {
    if (!isAuthenticated) {
      router.replace("/auth/login");
      return;
    }
    router.replace(isDriver ? "/(driver)" : "/(client)");
  };

  return (
    <>
      <Stack.Screen options={{ title: "Introuvable" }} />
      <View className="flex-1 items-center justify-center p-5">
        <Text className="text-xl font-bold text-gray-900">
          Cette page n'existe pas.
        </Text>
        <TouchableOpacity onPress={goHome} className="mt-4 py-3">
          <Text className="text-sm text-primary-700 font-semibold">
            Retour à l'accueil
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}