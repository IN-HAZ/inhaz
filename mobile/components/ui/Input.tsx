import { View, Text, TextInput, TextInputProps } from "react-native";
import { ReactNode } from "react";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  className = "",
  ...props
}: InputProps) {
  return (
    <View className="mb-4 w-full">
      {label && (
        <Text className="text-sm font-medium text-gray-700 mb-1.5 font-medium">
          {label}
        </Text>
      )}
      <View
        className={`flex-row items-center border rounded-2xl px-4 py-1 bg-gray-50 ${
          error ? "border-red-500" : "border-gray-200"
        }`}
      >
        {leftIcon && <View className="mr-3">{leftIcon}</View>}
        <TextInput
          className={`flex-1 text-base text-gray-900 py-3 font-regular ${className}`}
          placeholderTextColor="#9CA3AF"
          {...props}
        />
        {rightIcon && <View className="ml-3">{rightIcon}</View>}
      </View>
      {error && (
        <Text className="text-xs text-red-500 mt-1 font-regular">{error}</Text>
      )}
    </View>
  );
}
