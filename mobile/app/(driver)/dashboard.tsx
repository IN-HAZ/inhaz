import { useState, useEffect } from "react";
import * as Location from "expo-location";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Switch,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
    TrendingUp,
    Package,
    CreditCard,
    ChevronRight,
    Navigation,
    Car,
    AlertCircle,
    Sparkles,
} from "lucide-react-native";
import { useAuthStore } from "@/lib/store/auth";
import { useDriverDashboard } from "@/lib/hooks/useDriverDashboard";
import { useToast } from "@/components/ui/ToastProvider";
import { getErrorMessage } from "@/lib/api/errors";
import { DashboardMap } from "@/components/map/variants/DashboardMap";
import type { Region, MapPoint } from "@/components/map/core/BaseMapTypes";
import { requestAllAppPermissions } from "@/lib/permissions";

const PURPLE = "#4B2861";

export default function DriverDashboardScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const toast = useToast();

    const [location, setLocation] = useState<MapPoint | null>(null);
    const [region, setRegion] = useState<Region | null>(null);

    const {
        summary,
        isLoading,
        error,
        refetch,
        isRefetching,
        toggleOnline,
        isTogglingOnline,
    } = useDriverDashboard();

    useEffect(() => {
        (async () => {
            const { status } =
                await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;
            const pos = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            const pt = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
            };
            setLocation(pt);
            setRegion({ ...pt, latitudeDelta: 0.01, longitudeDelta: 0.01 });
        })();
    }, []);

    const handleRecenterLocation = async () => {
        const res = await requestAllAppPermissions();
        if (!res.location) {
            toast.error("Géolocalisation indisponible.");
            return;
        }
        const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });
        const pt = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
        };
        setLocation(pt);
        setRegion({ ...pt, latitudeDelta: 0.01, longitudeDelta: 0.01 });
        toast.success("Position GPS réinitialisée.");
    };

    const handleToggleOnline = async () => {
        try {
            const res = await toggleOnline();
            toast.success(res.message);
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const isOnline = summary?.is_online ?? false;
    const isApproved = summary?.driver_status === "APPROVED";

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FA]">
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        tintColor={PURPLE}
                    />
                }
                contentContainerClassName="pb-10"
            >
                {/* Header */}
                <View className="px-5 pt-4 pb-5 bg-white border-b border-gray-100 flex-row items-center justify-between shadow-sm">
                    <View>
                        <View className="flex-row items-center gap-2">
                            <Text className="text-xl font-bold text-gray-900">
                                Espace Chauffeur
                            </Text>
                            <View className="flex-row items-center bg-purple-50 px-2.5 py-0.5 rounded-full">
                                <Car size={12} color={PURPLE} />
                                <Text className="text-[11px] font-semibold text-purple-900 ml-1">
                                    Pro
                                </Text>
                            </View>
                        </View>
                        <Text className="text-xs text-gray-500 mt-0.5">
                            Bonjour,{" "}
                            {user?.name ||
                                user?.customer_profile?.name ||
                                "Chauffeur"}
                        </Text>
                    </View>

                    {/* Availability Toggle */}
                    <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-2xl border border-gray-200">
                        <View className="items-end mr-2.5">
                            <View className="flex-row items-center">
                                <View
                                    className={`w-2 h-2 rounded-full mr-1.5 ${
                                        isOnline
                                            ? "bg-[#00C853]"
                                            : "bg-gray-400"
                                    }`}
                                />
                                <Text
                                    className={`text-xs font-bold ${
                                        isOnline
                                            ? "text-[#00C853]"
                                            : "text-gray-500"
                                    }`}
                                >
                                    {isOnline ? "EN LIGNE" : "HORS LIGNE"}
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={isOnline}
                            onValueChange={handleToggleOnline}
                            disabled={
                                isTogglingOnline || !isApproved
                            }
                            trackColor={{ false: "#E4E4E7", true: "#00C853" }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>

                {/* Warning Banner if account not approved */}
                {!isApproved && (
                    <View className="mx-5 mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex-row items-start">
                        <View className="mt-0.5">
                            <AlertCircle
                                size={20}
                                color="#D97706"
                            />
                        </View>
                        <View className="ml-3 flex-1">
                            <Text className="text-amber-900 font-bold text-sm">
                                Vérification en cours
                            </Text>
                            <Text className="text-amber-800 text-xs mt-0.5 leading-4">
                                Votre dossier de candidature est en cours de
                                validation par notre équipe. Vous pourrez passer
                                en ligne dès validation.
                            </Text>
                        </View>
                    </View>
                )}

                {/* Active Trip Banner if currently on a trip */}
                {summary?.active_trip_id && (
                    <TouchableOpacity
                        onPress={() =>
                            router.push(`/trips/${summary.active_trip_id}`)
                        }
                        activeOpacity={0.9}
                        className="mx-5 mt-4 bg-primary-800 rounded-2xl p-4 shadow-md flex-row items-center justify-between"
                    >
                        <View className="flex-row items-center flex-1 mr-3">
                            <View className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center mr-3">
                                <Navigation size={20} color="#FFFFFF" />
                            </View>
                            <View className="flex-1">
                                <View className="flex-row items-center">
                                    <View className="w-2 h-2 rounded-full bg-emerald-400 mr-2" />
                                    <Text className="text-emerald-300 text-xs font-bold uppercase tracking-wider">
                                        Course en cours
                                    </Text>
                                </View>
                                <Text
                                    className="text-white font-bold text-base mt-0.5"
                                    numberOfLines={1}
                                >
                                    Reprendre la navigation de la livraison
                                </Text>
                            </View>
                        </View>
                        <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
                            <ChevronRight size={18} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>
                )}

                {/* Financial Metrics Overview */}
                <View className="px-5 mt-5">
                    <Text className="text-sm font-bold text-gray-700 mb-3">
                        Résumé de la journée
                    </Text>

                    {isLoading ? (
                        <View className="py-8 items-center">
                            <ActivityIndicator size="small" color={PURPLE} />
                        </View>
                    ) : (
                        <View className="flex-row gap-3">
                            {/* Today's Earnings */}
                            <View className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <View className="w-8 h-8 rounded-xl bg-purple-50 items-center justify-center mb-2">
                                    <TrendingUp size={18} color={PURPLE} />
                                </View>
                                <Text className="text-xs text-gray-500 font-medium">
                                    Gains du jour
                                </Text>
                                <Text className="text-lg font-black text-gray-900 mt-0.5">
                                    {summary?.today_earnings_mad ?? 0}{" "}
                                    <Text className="text-xs text-gray-500 font-bold">
                                        MAD
                                    </Text>
                                </Text>
                            </View>

                            {/* Trips Completed */}
                            <View className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <View className="w-8 h-8 rounded-xl bg-blue-50 items-center justify-center mb-2">
                                    <Package size={18} color="#2563EB" />
                                </View>
                                <Text className="text-xs text-gray-500 font-medium">
                                    Courses du jour
                                </Text>
                                <Text className="text-lg font-black text-gray-900 mt-0.5">
                                    {summary?.completed_trips_today ?? 0}
                                </Text>
                            </View>

                            {/* Commission Balance */}
                            <View className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <View className="w-8 h-8 rounded-xl bg-amber-50 items-center justify-center mb-2">
                                    <CreditCard size={18} color="#D97706" />
                                </View>
                                <Text className="text-xs text-gray-500 font-medium">
                                    Commission due
                                </Text>
                                <Text className="text-lg font-black text-amber-700 mt-0.5">
                                    {summary?.commission_balance_mad ?? 0}{" "}
                                    <Text className="text-xs text-gray-500 font-bold">
                                        MAD
                                    </Text>
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Global Map Preview Section */}
                <View className="px-5 mt-6">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-sm font-bold text-gray-700">
                            Carte & Position active
                        </Text>
                        <TouchableOpacity
                            onPress={handleRecenterLocation}
                            activeOpacity={0.8}
                            className="flex-row items-center bg-purple-50 px-3 py-1 rounded-full border border-purple-100"
                        >
                            <Navigation size={12} color={PURPLE} />
                            <Text className="text-xs font-semibold text-purple-900 ml-1">
                                Activer ma position
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View className="h-52 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm">
                        <DashboardMap
                            region={region}
                            currentLocation={location}
                        />
                    </View>
                </View>

                {/* Marketplace CTA Button */}
                <View className="px-5 mt-6">
                    <TouchableOpacity
                        onPress={() => router.push("/driver/marketplace")}
                        activeOpacity={0.85}
                        className="py-4 px-6 rounded-2xl flex-row items-center justify-between shadow-lg bg-primary-800"
                    >
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 rounded-xl bg-white/15 items-center justify-center mr-3.5">
                                <Sparkles size={20} color="#FFFFFF" />
                            </View>
                            <View>
                                <Text className="text-white font-bold text-base">
                                    Consulter les demandes
                                </Text>
                                <Text className="text-purple-200 text-xs">
                                    Trouvez des courses à proximité
                                </Text>
                            </View>
                        </View>
                        <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
                            <ChevronRight size={18} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
