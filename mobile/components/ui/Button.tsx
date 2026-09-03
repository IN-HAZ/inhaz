import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from "react-native";
import { ReactNode } from "react";

interface ButtonProps extends TouchableOpacityProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  style,
  ...props
}: ButtonProps) {
  const variantStyles = {
    primary: "bg-primary-800 active:bg-primary-900",
    secondary: "bg-primary-100 active:bg-primary-200",
    outline: "border border-gray-200 bg-white active:bg-gray-50",
    danger: "bg-red-600 active:bg-red-700",
  };

  const textVariantStyles = {
    primary: "text-white",
    secondary: "text-primary-800",
    outline: "text-gray-700",
    danger: "text-white",
  };

  const sizeStyles = {
    sm: "py-2 px-3 rounded-xl",
    md: "py-3 px-4 rounded-2xl",
    lg: "py-4 px-6 rounded-2xl",
  };

  const textSizeStyles = {
    sm: "text-xs font-semibold",
    md: "text-sm font-semibold",
    lg: "text-base font-semibold",
  };

  return (
    <TouchableOpacity
      disabled={disabled || loading}
      className={`flex-row items-center justify-center ${sizeStyles[size]} ${variantStyles[variant]} ${
        disabled || loading ? "opacity-50" : ""
      } ${className}`}
      style={style}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "outline" || variant === "secondary" ? "#4B2861" : "#FFFFFF"} size="small" />
      ) : typeof children === "string" ? (
        <Text className={`${textSizeStyles[size]} ${textVariantStyles[variant]}`}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}
