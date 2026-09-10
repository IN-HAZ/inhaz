import { TouchableOpacity } from "react-native";
import { LocateFixed } from "lucide-react-native";

interface RecenterButtonProps {
    onPress: () => void;
    /** Pixels from the bottom (i.e. above the bottom sheet). Defaults to 0. */
    bottomOffset?: number;
}

/**
 * Floating recenter button — positions itself above any bottom sheet overlay.
 *
 * Stateless: the parent variant owns the location logic and passes `onPress`.
 */
export function RecenterButton({
    onPress,
    bottomOffset = 0,
}: RecenterButtonProps) {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={{
                position: "absolute",
                bottom: bottomOffset + 12,
                right: 12,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#fff",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#E5E7EB",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 4,
            }}
        >
            <LocateFixed size={20} color="#4B2861" />
        </TouchableOpacity>
    );
}
