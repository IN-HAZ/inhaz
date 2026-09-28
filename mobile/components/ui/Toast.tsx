import { useEffect, useState } from 'react';
import { View, Text, Animated, TouchableOpacity, Platform } from 'react-native';
import { X, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react-native';

export type ToastType = 'success' | 'error' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
};

// Container/text styling lives in global.css (`.badge-<variant>`,
// `.badge-<variant>-text`). Icon `color` stays a hex prop: lucide-react-native
// renders its own <Svg>, which is not a NativeWind-registered component, so
// className cannot style it.
const typeStyles = {
  success: { container: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: '#22c55e' },
  error: { container: 'bg-red-50 border-red-200', text: 'text-red-700', icon: '#ef4444' },
  warning: { container: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: '#f59e0b' },
};

export function Toast({ message, type = 'error', onClose, duration = 4000 }: ToastProps) {
  const [opacity] = useState(new Animated.Value(0));
  const Icon = icons[type];
  const styles = typeStyles[type];

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.delay(duration),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start(() => onClose());
  }, []);

  return (
    // `opacity` stays inline: it is the animated value driving the fade.
    <Animated.View
      style={{ opacity }}
      className="absolute top-14 left-4 right-4 z-50"
    >
      <View
        className={`border rounded-2xl p-4 flex-row items-start ${styles.container}`}
      >
        <View className="mt-px">
          <Icon size={20} color={styles.icon} />
        </View>
        <Text
          className={`flex-1 text-sm font-medium ml-3 ${styles.text}`}
        >
          {message}
        </Text>
        <TouchableOpacity onPress={onClose}>
          <X size={16} color={styles.icon} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// Global toast state
let globalToast: {
  show: (message: string, type?: ToastType) => void;
} = { show: () => {} };

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType; key: number } | null>(null);

  const show = (message: string, type: ToastType = 'error') => {
    setToast({ message, type, key: Date.now() });
  };

  globalToast = { show };

  return {
    show,
    ToastComponent: toast ? (
      <Toast
        key={toast.key}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(null)}
      />
    ) : null,
  };
}

export const toast = {
  show: (message: string, type: ToastType = 'error') => globalToast.show(message, type),
  error: (message: string) => globalToast.show(message, 'error'),
  success: (message: string) => globalToast.show(message, 'success'),
  warning: (message: string) => globalToast.show(message, 'warning'),
};