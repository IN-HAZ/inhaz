import { View, Text } from "react-native";
import { Marker, Callout } from "react-native-maps";
import type { NearbyRequestMarker } from "../core/BaseMapTypes";

interface NearbyRequestLayerProps {
    requests: NearbyRequestMarker[];
    onMarkerPress?: (requestId: string) => void;
}

/**
 * Renders nearby open requests (package chip + price badge) on the driver
 * home map. The callout previews pickup → destination, price and distance.
 * Taps bubble up through `onMarkerPress` — the parent screen owns
 * navigation / approval gating.
 *
 * Designed to be placed directly inside a BaseMap / MapView as a child.
 */
export function NearbyRequestLayer({
    requests,
    onMarkerPress,
}: NearbyRequestLayerProps) {
    if (requests.length === 0) return null;

    return (
        <>
            {requests.map((r) => (
                <Marker
                    key={r.id}
                    coordinate={{
                        latitude: r.latitude,
                        longitude: r.longitude,
                    }}
                    anchor={{ x: 0.5, y: 0.5 }}
                    onPress={() => onMarkerPress?.(r.id)}
                >
                    <View className="items-center">
                        <View className="h-9 min-w-[38px] px-1.5 rounded-full bg-white border-2 border-inhaz-purple items-center justify-center flex-row gap-0.5">
                            <Text className="text-sm">📦</Text>
                            {r.proposedPriceMAD != null && (
                                <Text className="text-primary-800 text-[10px] font-extrabold">
                                    {r.proposedPriceMAD} MAD
                                </Text>
                            )}
                        </View>
                        <View className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-inhaz-purple" />
                    </View>

                    <Callout>
                        <View className="min-w-[190px] p-2.5">
                            <Text className="text-[13px] font-bold text-gray-900">
                                {r.title ?? "Demande à proximité"}
                            </Text>
                            <Text className="text-[11px] text-gray-500 mt-1">
                                {r.pickupAddress
                                    ? `Retrait : ${r.pickupAddress}`
                                    : ""}
                                {r.pickupAddress && r.destinationAddress
                                    ? "\n"
                                    : ""}
                                {r.destinationAddress
                                    ? `Destination : ${r.destinationAddress}`
                                    : ""}
                            </Text>
                            {(r.proposedPriceMAD != null ||
                                r.distanceM != null) && (
                                <Text className="text-[11px] text-primary-800 font-semibold mt-1">
                                    {r.proposedPriceMAD != null &&
                                        `${r.proposedPriceMAD} MAD`}
                                    {r.proposedPriceMAD != null &&
                                        r.distanceM != null &&
                                        " · "}
                                    {r.distanceM != null &&
                                        `${(r.distanceM / 1000).toFixed(1)} km`}
                                </Text>
                            )}
                        </View>
                    </Callout>
                </Marker>
            ))}
        </>
    );
}