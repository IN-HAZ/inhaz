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

const colors = {
  success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', icon: '#22c55e' },
  error: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', icon: '#ef4444' },
  warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', icon: '#f59e0b' },
};

export function Toast({ message, type = 'error', onClose, duration = 4000 }: ToastProps) {
  const [opacity] = useState(new Animated.Value(0));
  const Icon = icons[type];
  const color = colors[type];

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
    <Animated.View
      style={{ opacity }}
      className="absolute top-14 left-4 right-4 z-50"
    >
      <View
        style={{ backgroundColor: color.bg, borderColor: color.border }}
        className="border rounded-2xl p-4 flex-row items-start"
      >
        <Icon size={20} color={color.icon} style={{ marginTop: 1 }} />
        <Text
          style={{ color: color.text }}
          className="flex-1 text-sm font-medium ml-3"
        >
          {message}
        </Text>
        <TouchableOpacity onPress={onClose}>
          <X size={16} color={color.text} />
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
