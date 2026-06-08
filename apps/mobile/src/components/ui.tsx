import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="mb-3.5">
      <Text className="text-muted text-[10px] tracking-widest uppercase mb-2">{label}</Text>
      {children}
    </View>
  );
}

export function Btn({
  children,
  onPress,
  disabled,
  tone = "solid",
}: {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  tone?: "solid" | "ghost" | "danger";
}) {
  const cls =
    tone === "solid" ? "bg-accent" : tone === "danger" ? "border border-neg" : "border border-line";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`rounded-lg px-4 py-3 items-center ${cls} ${disabled ? "opacity-50" : ""}`}
    >
      {children}
    </Pressable>
  );
}
