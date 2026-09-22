import { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { authApi } from "@/lib/api/auth";
import { useToast } from "@/components/ui/ToastProvider";
import { getErrorMessage } from "@/lib/api/errors";
import { phoneSchema } from "@/lib/validation/auth";
import { Phone, ArrowRight } from "lucide-react-native";

export default function LoginScreen() {
  const [phone, setPhone] = useState("+212");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSendOtp = async () => {
    const validation = phoneSchema.safeParse(phone);
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message || "Numéro de téléphone invalide.");
      return;
    }

    const sanitizedPhone = validation.data;
    setLoading(true);

    try {
      await authApi.sendOtp(sanitizedPhone);
      toast.success("Code OTP envoyé. Vérifiez votre email (Mailpit).");
      router.push({ pathname: "/auth/otp", params: { phone: sanitizedPhone } });
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
      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-12">
          <View className="w-20 h-20 bg-primary-800 rounded-3xl items-center justify-center mb-6">
            <Text className="text-white text-3xl font-bold">in</Text>
          </View>
          <Text className="text-3xl font-black text-gray-900 mb-2">
            Bienvenue
          </Text>
          <Text className="text-gray-500 text-base text-center font-regular">
            Connectez-vous avec votre numéro de téléphone
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Numéro de téléphone
          </Text>
          <View className="input-default border-gray-200">
            <Phone size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-3 text-base text-gray-900 py-3 font-regular"
              placeholder="+212 600 000 000"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              editable={!loading}
            />
          </View>
        </View>

        <TouchableOpacity
          className="bg-primary-800 rounded-2xl py-4 flex-row items-center justify-center"
          onPress={handleSendOtp}
          disabled={loading}
        >
          <Text className="text-white font-semibold text-base">
            {loading ? "Envoi en cours..." : "Recevoir le code"}
          </Text>
          {!loading && (
            <View className="ml-2">
              <ArrowRight size={20} color="white" />
            </View>
          )}
        </TouchableOpacity>

        <Text className="text-gray-400 text-xs text-center mt-6 font-regular">
          En continuant, vous acceptez nos conditions d'utilisation
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
