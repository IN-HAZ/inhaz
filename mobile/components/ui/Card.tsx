import { View, ViewProps } from "react-native";

interface CardProps extends ViewProps {
  variant?: "default" | "outlined" | "flat";
}

// Variant styling lives in global.css (`.card-<variant>`).
export function Card({ variant = "default", className = "", style, children, ...props }: CardProps) {
  return (
    <View
      className={`card-${variant} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}