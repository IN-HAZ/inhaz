import { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, KeyboardAvoidingView, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth";
import { useToast } from "@/components/ui/ToastProvider";
import { getErrorMessage } from "@/lib/api/errors";
import { otpSchema } from "@/lib/validation/auth";
import { ShieldCheck, ArrowLeft, ArrowRight } from "lucide-react-native";

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const toast = useToast();

  const handleVerifyOtp = async () => {
    const validation = otpSchema.safeParse(code);
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message || "Le code doit contenir 6 chiffres.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.post("/auth/verify-otp", {
        phone,
        code: validation.data,
      });

      if (response.data.user && response.data.token) {
        await setSession(response.data.user, response.data.token);
        toast.success("Connexion réussie !");
        const u = response.data.user;
        const incomplete = !u.name && !u.customer_profile?.name;
        router.replace(incomplete ? '/(tabs)/profile' : '/(tabs)');
      }
    } catch (e: any) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
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

      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-10">
          <View className="w-16 h-16 bg-primary-100 rounded-2xl items-center justify-center mb-4">
            <ShieldCheck size={28} color="#4B2861" />
          </View>
          <Text className="text-3xl font-black text-gray-900 mb-2">
            Vérification
          </Text>
          <Text className="text-gray-500 text-base text-center font-regular">
            Code envoyé au
          </Text>
          <Text className="text-primary-800 font-semibold text-base mt-1 font-semibold">
            {phone}
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2 font-medium">
            Code à 6 chiffres
          </Text>
          <TextInput
            className="border border-gray-200 rounded-2xl px-4 py-4 text-base text-center text-2xl tracking-widest text-gray-900 bg-gray-50 font-semibold"
            placeholder="000000"
            placeholderTextColor="#D1D5DB"
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          className="bg-primary-800 rounded-2xl py-4 flex-row items-center justify-center"
          onPress={handleVerifyOtp}
          disabled={loading}
        >
          <Text className="text-white font-semibold text-base font-semibold">
            {loading ? "Vérification..." : "Vérifier"}
          </Text>
          {!loading && <ArrowRight size={20} color="white" style={{ marginLeft: 8 }} />}
        </TouchableOpacity>

        <TouchableOpacity
          className="py-4 items-center"
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text className="text-gray-400 text-sm font-regular">
            Modifier le numéro
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
