// Atoms — en küçük, tek-sorumluluklu UI parçaları (Atomic Design).
import { useReduceMotion } from "@/lib/reduce-motion";
import { Plus } from "lucide-react-native";
import { type ReactElement, type ReactNode, cloneElement, isValidElement } from "react";
import { Pressable, Text, View } from "react-native";

/**
 * Etiketli alan. RN `Text` web'de gerçek `<label htmlFor>` üretmediğinden,
 * etiketi tek-kaynak olarak içteki kontrole `accessibilityLabel` (web'de aria-label)
 * olarak enjekte eder → WCAG 2.2 "form alanı etiketli" kuralı tüm alanlarda sağlanır.
 */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  const labelled =
    isValidElement<{ accessibilityLabel?: string }>(children) &&
    children.props.accessibilityLabel == null
      ? cloneElement(children as ReactElement<{ accessibilityLabel?: string }>, {
          accessibilityLabel: label,
        })
      : children;
  return (
    <View className="mb-3.5">
      <Text className="text-muted text-[10px] tracking-widest uppercase mb-2">{label}</Text>
      {labelled}
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

/** Material 3 FAB — ekranın birincil eylemi (yüzen, sağ-alt). Vektör ikon (emoji yasak). */
export function Fab({
  onPress,
  accessibilityLabel,
}: {
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const reduce = useReduceMotion();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="absolute right-5 bottom-5 w-14 h-14 rounded-2xl bg-accent items-center justify-center"
      // M3 bas-küçül geri bildirimi (state layer) + elevation; reduce-motion'da scale kapalı.
      style={({ pressed }) => ({
        shadowColor: "#0F172A",
        shadowOpacity: pressed ? 0.12 : 0.22,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        elevation: pressed ? 3 : 6,
        transform: [{ scale: pressed && !reduce ? 0.92 : 1 }],
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
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
