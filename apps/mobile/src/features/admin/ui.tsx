// Whenly Console — paylaşılan admin parçaları (ADR-095: admin ayrı "site" hissinde
// bir konsola taşındı; app/(app)/admin/* ekranları bu modülü kullanır).
// NOT (ADR-053): Admin yalnız işletmeciye görünür — bilinçli olarak i18n kapsamı
// dışında (TR). Kullanıcı yüzeyleri 11 dilde.
import { useReduceMotion } from "@/lib/reduce-motion";
import { GRADIENT, useTheme } from "@/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft, X } from "lucide-react-native";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, Text, View } from "react-native";

/** Konsolun kendi kimliği: ürün moruyla karışmayan grafit zemin ("ayrı site" hissi). */
export const CONSOLE_BG = ["#0B1220", "#1F2A44"] as const;

export function money(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}
export const day = (iso: string): string => new Date(iso).toLocaleDateString("tr-TR");
/** "2026-06-09" → "9 Haz" (kısa, eksen etiketi). */
export function dayShort(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", timeZone: "UTC" });
}

/**
 * Konsol kabuğu — her admin ekranının sarmalayıcısı: grafit üst bar (marka +
 * başlık + geri/çıkış), altında içerik. Üst bar konsola "uygulamadan ayrı yönetim
 * sitesi" kimliğini verir.
 */
export function ConsoleShell({
  title,
  sub,
  root = false,
  children,
}: {
  title: string;
  sub?: string;
  /** true → konsol ana sayfası: geri yerine "uygulamaya dön" (X). */
  root?: boolean;
  children: ReactNode;
}): ReactNode {
  const router = useRouter();
  return (
    <View className="flex-1 bg-ink">
      <LinearGradient
        colors={[...CONSOLE_BG]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: Platform.OS === "web" ? 14 : 48,
          paddingBottom: 14,
          paddingHorizontal: 16,
        }}
      >
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => (root ? router.replace("/") : router.back())}
            accessibilityRole="button"
            accessibilityLabel={root ? "Uygulamaya dön" : "Geri"}
            className="w-11 h-11 -ml-2 items-center justify-center rounded-full active:bg-white/10"
          >
            {root ? <X size={20} color="#E2E8F0" /> : <ArrowLeft size={20} color="#E2E8F0" />}
          </Pressable>
          <LinearGradient
            colors={[...GRADIENT.brand]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text className="text-white text-sm font-extrabold">W</Text>
          </LinearGradient>
          <View className="flex-1 min-w-0">
            <Text className="text-white/55 text-[10px] tracking-[2.5px] uppercase">
              Whenly Console
            </Text>
            <Text className="text-white text-lg font-extrabold" numberOfLines={1}>
              {title}
            </Text>
          </View>
          {sub ? <Text className="text-white/60 text-[11px]">{sub}</Text> : null}
        </View>
      </LinearGradient>
      {children}
    </View>
  );
}

export function Loading(): ReactNode {
  return <Skeleton rows={4} />;
}

/** M3 skeleton (shimmer/pulse) yükleme — reduce-motion'da sabit. */
export function Skeleton({ rows = 3 }: { rows?: number }): ReactNode {
  const reduce = useReduceMotion();
  const opacity = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, opacity]);
  return (
    <View className="px-5 mt-4">
      {Array.from({ length: rows }, (_, i) => i).map((i) => (
        <Animated.View
          key={i}
          style={{ opacity: reduce ? 0.6 : opacity }}
          className="h-16 bg-panel2 rounded-2xl mb-3"
        />
      ))}
    </View>
  );
}

/** Tamsayıyı yumuşakça sayar (reduce-motion'da anında). */
export function useCountUp(target: number, reduce: boolean): number {
  const [val, setVal] = useState(reduce ? target : 0);
  useEffect(() => {
    if (reduce || target <= 0) {
      setVal(target);
      return;
    }
    const dur = 700;
    const t0 = Date.now();
    let raf = 0;
    const tick = (): void => {
      const p = Math.min(1, (Date.now() - t0) / dur);
      setVal(Math.round(target * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reduce]);
  return val;
}

export function ErrText({ e }: { e: unknown }): ReactNode {
  return (
    <Text className="text-neg px-5 mt-6">{e instanceof Error ? e.message : "yüklenemedi"}</Text>
  );
}

export function ActBtn({
  label,
  onPress,
  tone = "ghost",
  disabled,
}: {
  label: string;
  onPress: () => void;
  tone?: "solid" | "ghost" | "danger";
  disabled?: boolean;
}): ReactNode {
  const theme = useTheme();
  const wrap =
    tone === "solid" ? "bg-accent" : tone === "danger" ? "border border-neg" : "border border-line";
  const color = tone === "solid" ? "#FFFFFF" : tone === "danger" ? "#DC2626" : theme.colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={`rounded-md px-2.5 py-1.5 min-h-[32px] justify-center ${wrap} ${disabled ? "opacity-40" : ""}`}
    >
      <Text className="text-[10px] uppercase tracking-wider" style={{ color }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Stat({
  n,
  l,
  tone,
  sub,
}: { n: number; l: string; tone?: "accent" | "pos"; sub?: string }): ReactNode {
  const reduce = useReduceMotion();
  const shown = useCountUp(n, reduce);
  const color = tone === "accent" ? "text-accent" : tone === "pos" ? "text-pos" : "text-text";
  return (
    <View
      className="bg-panel border border-line rounded-2xl p-4 flex-1 min-w-[44%]"
      style={{
        shadowColor: "#0F172A",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 1,
      }}
    >
      <Text className={`${color} text-2xl font-extrabold`}>{shown.toLocaleString("tr-TR")}</Text>
      <Text className="text-muted text-[10px] uppercase tracking-widest mt-1">{l}</Text>
      {sub ? <Text className="text-muted text-[11px] mt-0.5">{sub}</Text> : null}
    </View>
  );
}

export function LegendRow({ color, label }: { color: string; label: string }): ReactNode {
  return (
    <View className="flex-row items-center gap-2">
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
      <Text className="text-text text-xs">{label}</Text>
    </View>
  );
}

export function Legend({ items }: { items: { color: string; label: string }[] }): ReactNode {
  return (
    <View className="flex-row gap-4 mt-3">
      {items.map((it) => (
        <View key={it.label} className="flex-row items-center gap-1.5">
          <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: it.color }} />
          <Text className="text-muted text-[11px]">{it.label}</Text>
        </View>
      ))}
    </View>
  );
}
