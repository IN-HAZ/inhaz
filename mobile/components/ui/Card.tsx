import { View, ViewProps } from "react-native";

interface CardProps extends ViewProps {
  variant?: "default" | "outlined" | "flat";
}

export function Card({ variant = "default", className = "", style, children, ...props }: CardProps) {
  const variantStyles = {
    default: "bg-white border border-gray-100 shadow-sm rounded-2xl p-4",
    outlined: "bg-white border border-gray-200 rounded-2xl p-4",
    flat: "bg-gray-50 rounded-2xl p-4",
  };

  return (
    <View
      className={`${variantStyles[variant]} ${className}`}
      style={[{ elevation: variant === "default" ? 1 : 0 }, style]}
      {...props}
    >
      {children}
    </View>
  );
}
