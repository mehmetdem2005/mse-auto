// Atoms — en küçük, tek-sorumluluklu UI parçaları (Atomic Design).
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
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  tone?: "solid" | "ghost" | "danger";
  accessibilityLabel?: string;
}) {
  const cls =
    tone === "solid" ? "bg-accent" : tone === "danger" ? "border border-neg" : "border border-line";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      // HIG: dokunma hedefi ≥44pt (min-h-[44px])
      className={`rounded-xl px-4 py-3 min-h-[44px] items-center justify-center ${cls} ${disabled ? "opacity-50" : ""}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </Pressable>
  );
}

type BadgeTone = "pos" | "neg" | "muted" | "accent";
const BADGE: Record<BadgeTone, string> = {
  pos: "bg-pos/10 text-pos",
  neg: "bg-neg/10 text-neg",
  muted: "bg-panel2 text-muted",
  accent: "bg-accent/10 text-accent",
};

export function Badge({ tone = "muted", children }: { tone?: BadgeTone; children: ReactNode }) {
  const [bg, fg] = BADGE[tone].split(" ");
  return (
    <View className={`${bg} px-2 py-1 rounded-full self-start`}>
      <Text className={`${fg} text-[11px] font-medium`}>{children}</Text>
    </View>
  );
}
