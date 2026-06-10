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

// Material 3 buton hiyerarşisi (geriye uyum: solid=filled, ghost=outlined).
type BtnTone = "filled" | "tonal" | "outlined" | "text" | "danger" | "solid" | "ghost";
const BTN_BG: Record<BtnTone, string> = {
  filled: "bg-accent",
  solid: "bg-accent",
  tonal: "bg-accent/15",
  outlined: "border border-line",
  ghost: "border border-line",
  text: "",
  danger: "border border-neg",
};

export function Btn({
  children,
  onPress,
  disabled,
  tone = "filled",
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  tone?: BtnTone;
  accessibilityLabel?: string;
}) {
  const cls = BTN_BG[tone];
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

/** Material 3 FAB — ekranın birincil eylemi (yüzen, sağ-alt). */
export function Fab({
  onPress,
  accessibilityLabel,
  glyph = "＋",
}: {
  onPress: () => void;
  accessibilityLabel: string;
  glyph?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="absolute right-5 bottom-5 w-14 h-14 rounded-2xl bg-accent items-center justify-center active:opacity-80"
      style={{
        shadowColor: "#0F172A",
        shadowOpacity: 0.22,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        elevation: 6,
      }}
    >
      <Text
        className="text-white text-3xl leading-none"
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        {glyph}
      </Text>
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
