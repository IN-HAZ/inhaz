import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from "react-native";
import { ReactNode } from "react";

interface ButtonProps extends TouchableOpacityProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

// Container styling lives in global.css (`.btn` / `.btn-<variant>`).
// Text color is looked up here because RN <Text> does not inherit `color`
// from a parent <View>.
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
  return (
    <TouchableOpacity
      disabled={disabled || loading}
      className={`btn btn-${variant} ${sizeStyles[size]} ${
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