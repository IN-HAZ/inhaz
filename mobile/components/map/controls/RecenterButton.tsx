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
 *
 * `position: absolute` + `bottom` stay inline because `bottomOffset` is runtime
 * geometry passed by the parent; everything else is Tailwind classes.
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
            }}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-lg items-center justify-center"
        >
            <LocateFixed size={20} color="#4B2861" />
        </TouchableOpacity>
    );
}