import { View, Text, ViewProps } from "react-native";
import { ReactNode } from "react";

interface BadgeProps extends ViewProps {
  children: ReactNode;
  variant?: "success" | "warning" | "error" | "info" | "neutral";
  size?: "sm" | "md";
}

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  className = "",
  style,
  ...props
}: BadgeProps) {
  const variantStyles = {
    success: "bg-emerald-50 border-emerald-200",
    warning: "bg-amber-50 border-amber-200",
    error: "bg-red-50 border-red-200",
    info: "bg-blue-50 border-blue-200",
    neutral: "bg-gray-100 border-gray-200",
  };

  const textVariantStyles = {
    success: "text-emerald-700",
    warning: "text-amber-700",
    error: "text-red-700",
    info: "text-blue-700",
    neutral: "text-gray-700",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 rounded-lg border",
    md: "px-3 py-1 rounded-xl border",
  };

  const textSizeStyles = {
    sm: "text-xs font-semibold",
    md: "text-sm font-semibold",
  };

  return (
    <View
      className={`flex-row items-center justify-center ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
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
