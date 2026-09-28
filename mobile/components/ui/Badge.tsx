import { View, Text, ViewProps } from "react-native";
import { ReactNode } from "react";

interface BadgeProps extends ViewProps {
  children: ReactNode;
  variant?: "success" | "warning" | "error" | "info" | "neutral";
  size?: "sm" | "md";
}

// Container/text styling lives in global.css (`.badge-<variant>` /
// `.badge-<variant>-text`). Text needs its own class: RN <Text> does not
// inherit `color` from a parent <View>.
const textVariantStyles = {
  success: "badge-success-text",
  warning: "badge-warning-text",
  error: "badge-error-text",
  info: "badge-info-text",
  neutral: "badge-neutral-text",
};

const sizeStyles = {
  sm: "px-2 py-0.5 rounded-lg border",
  md: "px-3 py-1 rounded-xl border",
};

const textSizeStyles = {
  sm: "text-xs font-semibold",
  md: "text-sm font-semibold",
};

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  className = "",
  style,
  ...props
}: BadgeProps) {
  return (
    <View
      className={`flex-row items-center justify-center ${sizeStyles[size]} badge-${variant} ${className}`}
      style={style}
      {...props}
    >
      {typeof children === "string" ? (
        <Text className={`${textSizeStyles[size]} ${textVariantStyles[variant]}`}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}