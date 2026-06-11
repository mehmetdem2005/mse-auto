import { PressScale } from "@/components/motion";
import { type EventFacts, parseEventFacts } from "@/domain/personal";
import { haptic } from "@/lib/haptics";
// Molecules — atom + primitive bileşimleri (Atomic Design).
import { useReduceMotion } from "@/lib/reduce-motion";
import { LinearGradient } from "expo-linear-gradient";
import { type LucideIcon, MapPin, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react-native";
import { type ReactNode, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Linking, Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

// Yükseltilmiş yüzey gölge token'ları (elevation ölçeği).
const SHADOW = {
  shadowColor: "#0F172A",
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;
const SHADOW_LG = {
  shadowColor: "#0F172A",
  shadowOpacity: 0.1,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 10 },
  elevation: 6,
} as const;

export function Card({
  children,
  onPress,
  accent,
  elevated,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: () => void;
  accent?: boolean;
  /** Hero üstüne binen kartlar için güçlü gölge. */
  elevated?: boolean;
  accessibilityLabel?: string;
}) {
  const cls = `bg-panel border rounded-2xl p-4 ${accent ? "border-pos/40" : "border-line"}`;
  const shadow = elevated ? SHADOW_LG : SHADOW;
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={`${cls} active:opacity-70`}
        style={shadow}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View className={cls} style={shadow}>
      {children}
    </View>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <Text className="text-muted text-[10px] uppercase tracking-widest mb-2">{children}</Text>;
}

export function EmptyState({
  title,
  hint,
  Icon = Sparkles,
}: { title: string; hint?: string; Icon?: LucideIcon }) {
  return (
    <View className="items-center py-16 px-6">
      {/* İllüstratif madalyon — gradyan halka + yumuşak iç daire (AAA görsel). */}
      <View className="mb-5 items-center justify-center">
        <LinearGradient
          colors={["#6366F1", "#7C3AED"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View className="w-[68px] h-[68px] rounded-full bg-panel items-center justify-center">
            <Icon size={28} color="#6366F1" />
          </View>
        </LinearGradient>
      </View>
      <Text className="text-text text-lg font-bold text-center">{title}</Text>
      {hint ? (
        <Text className="text-muted text-sm text-center mt-2 leading-5 max-w-[280px]">{hint}</Text>
      ) : null}
    </View>
  );
}

/** EventFacts'i okunur "olgu" rozetlerine çevirir; konum için haritada-aç bağlantısı. */
export function FactChips({ raw }: { raw: unknown }) {
  const { i18n } = useTranslation();
  const facts = parseEventFacts(raw);
  if (!facts || (!facts.geo && facts.numeric === undefined && !facts.text)) return null;
  return (
    <View className="flex-row flex-wrap gap-2 mt-3">
      {facts.geo ? <GeoChip geo={facts.geo} /> : null}
      {facts.numeric !== undefined ? (
        <View className="bg-accent/10 px-3 py-2 rounded-lg flex-row items-center gap-1.5">
          <Text className="text-accent text-xs font-semibold">
            {facts.numericKind ? `${facts.numericKind}: ` : ""}
            {facts.numeric.toLocaleString(i18n.language)}
            {facts.currency ? ` ${facts.currency}` : ""}
          </Text>
        </View>
      ) : null}
      {facts.text ? (
        <View className="bg-panel2 px-3 py-2 rounded-lg">
          <Text className="text-muted text-xs" numberOfLines={1}>
            “{facts.text}”
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function GeoChip({ geo }: { geo: NonNullable<EventFacts["geo"]> }) {
  const open = () => {
    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${geo.lat},${geo.lng}`);
  };
  return (
    <Pressable
      onPress={open}
      // HIG dokunma hedefi
      className="bg-pos/10 px-3 py-2 min-h-[44px] rounded-lg flex-row items-center gap-1.5 active:opacity-70"
      accessibilityRole="link"
      accessibilityLabel={`Konumu haritada aç: ${geo.lat.toFixed(3)}, ${geo.lng.toFixed(3)}`}
    >
      <MapPin size={14} color="#16A34A" />
      <Text className="text-pos text-xs font-semibold">
        {geo.lat.toFixed(3)}, {geo.lng.toFixed(3)} · haritada aç
      </Text>
    </Pressable>
  );
}

/** Tek parıltılı (shimmer) iskelet bloğu — nabız opaklık (reduce-motion'da sabit). */
function Shimmer({ className }: { className: string }) {
  const reduce = useReduceMotion();
  const o = useSharedValue(0.5);
  useEffect(() => {
    if (reduce) return;
    o.value = withRepeat(
      withTiming(1, { duration: 850, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [reduce, o]);
  const style = useAnimatedStyle(() => ({ opacity: reduce ? 0.6 : o.value }));
  return <Animated.View className={`bg-panel2 ${className}`} style={style} />;
}

/** İskelet yükleme — kart silüeti, shimmer (algılanan performans; spinner yerine). */
export function SkeletonCard() {
  return (
    <View className="bg-panel border border-line rounded-2xl p-4 mb-3" style={SHADOW}>
      <View className="flex-row items-center gap-2.5">
        <Shimmer className="w-10 h-10 rounded-xl" />
        <View className="flex-1 gap-2">
          <Shimmer className="h-3 rounded-full w-3/5" />
          <Shimmer className="h-2.5 rounded-full w-2/5" />
        </View>
      </View>
      <Shimmer className="h-3 rounded-full mt-4 w-11/12" />
      <Shimmer className="h-3 rounded-full mt-2 w-4/5" />
    </View>
  );
}

/** Geri bildirim oyu — bası animasyonlu (PressScale), ≥48px AAA hedef. */
export function Vote({
  kind,
  label,
  onPress,
}: { kind: "up" | "down"; label: string; onPress: () => void }) {
  return (
    <PressScale
      onPress={() => {
        haptic.light();
        onPress();
      }}
      className="w-12 h-12 rounded-full bg-panel2 items-center justify-center"
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {kind === "up" ? (
        <ThumbsUp size={18} color="#16A34A" />
      ) : (
        <ThumbsDown size={18} color="#64748B" />
      )}
    </PressScale>
  );
}
