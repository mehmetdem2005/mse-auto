// Whenly Console grafikleri — admin.tsx'ten taşındı (ADR-095) ve "bas → değeri gör"
// etkileşimi eklendi: çubuklar tek tek hedef olmak yerine TÜM grafik tek geniş dokunma
// alanıdır (locationX → gün indeksi; ≥44pt hedef kuralı dar sütunlarda böyle sağlanır).
// Seçilen günün sayıları grafik üstünde çip olarak gösterilir; aynı yere ikinci dokunuş kapatır.
import { ValueChip, useChartTap } from "@/components/charts";
import type { AdminTimeseriesPoint, AdminTraffic } from "@/lib/api";
import { useReduceMotion } from "@/lib/reduce-motion";
import { useTheme } from "@/theme";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { day, dayShort } from "./ui";

export type SeriesKey = "checkRuns" | "detections" | "deliveries";
export type Series = { key: SeriesKey; color: string; label: string };

export const SERIES_COLORS = {
  checks: "#C7D2FE", // indigo-200 (arka plan: toplam kontrol)
  detect: "#6366F1", // accent (tespitler — kontrollerin alt kümesi)
  deliver: "#16A34A", // pos (teslimatlar)
} as const;

export const TRAFFIC_COLORS = { site: "#6366F1", app: "#16A34A" } as const;

/** Material 3 sütun grafik — RN View'leri; bindirmeli seriler (tespit ⊆ kontrol). */
export function BarChart({
  points,
  series,
  height = 132,
}: {
  points: AdminTimeseriesPoint[];
  series: Series[];
  height?: number;
}): ReactNode {
  const reduce = useReduceMotion();
  const anim = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) {
      anim.setValue(1);
      return;
    }
    anim.setValue(0);
    const a = Animated.timing(anim, { toValue: 1, duration: 650, useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [reduce, anim]);

  const tap = useChartTap(points.length);
  const sel = tap.selected !== null ? points[tap.selected] : undefined;
  const max = Math.max(1, ...points.flatMap((p) => series.map((s) => p[s.key])));
  // Eksen yoğunluğunu seyrelt: en çok ~7 etiket göster.
  const step = Math.max(1, Math.ceil(points.length / 7));

  return (
    <View>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-muted text-[10px]">en yüksek: {max.toLocaleString("tr-TR")}</Text>
        <Text className="text-muted2 text-[10px]">değer için güne dokun</Text>
      </View>
      {sel ? (
        <ValueChip
          text={`${dayShort(sel.date)} · ${series.map((s) => `${s.label} ${sel[s.key].toLocaleString("tr-TR")}`).join(" · ")}`}
        />
      ) : null}
      <Pressable
        onLayout={tap.onLayout}
        onPress={(e) => tap.onPress(e.nativeEvent.locationX)}
        accessibilityRole="button"
        accessibilityLabel="Grafikte bir güne dokununca o günün sayıları gösterilir"
      >
        <View className="flex-row items-end" style={{ height }}>
          {points.map((p, i) => {
            const a11y = `${dayShort(p.date)}: ${p.checkRuns} kontrol, ${p.detections} tespit, ${p.deliveries} teslimat`;
            const on = tap.selected === i;
            return (
              <View
                key={p.date}
                accessibilityLabel={a11y}
                className="flex-1 items-center justify-end"
                style={{ height, opacity: tap.selected === null || on ? 1 : 0.45 }}
              >
                <View style={{ height, width: "100%", justifyContent: "flex-end" }}>
                  {series.map((s) => {
                    const target = (p[s.key] / max) * height;
                    const h = anim.interpolate({ inputRange: [0, 1], outputRange: [0, target] });
                    return (
                      <Animated.View
                        key={s.key}
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: "16%",
                          right: "16%",
                          height: h,
                          backgroundColor: s.color,
                          borderTopLeftRadius: 4,
                          borderTopRightRadius: 4,
                        }}
                      />
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      </Pressable>
      {/* X ekseni etiketleri (seyrek) */}
      <View className="flex-row mt-1.5">
        {points.map((p, i) => (
          <View key={p.date} className="flex-1 items-center">
            <Text className="text-muted2 text-[9px]">{i % step === 0 ? dayShort(p.date) : ""}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Site + uygulama edinim sinyali — kimliksiz beacon'lardan DİNAMİK (hardcode yok). */
export function TrafficBars({ days }: { days: AdminTraffic["days"] }): ReactNode {
  const reduce = useReduceMotion();
  const anim = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) {
      anim.setValue(1);
      return;
    }
    anim.setValue(0);
    const a = Animated.timing(anim, { toValue: 1, duration: 650, useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [reduce, anim]);
  const tap = useChartTap(days.length);
  const sel = tap.selected !== null ? days[tap.selected] : undefined;
  const max = Math.max(1, ...days.flatMap((d) => [d.site, d.app]));
  const step = Math.max(1, Math.ceil(days.length / 7));
  return (
    <View>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-muted text-[10px]">en yüksek: {max.toLocaleString("tr-TR")}</Text>
        <Text className="text-muted2 text-[10px]">değer için güne dokun</Text>
      </View>
      {sel ? (
        <ValueChip
          text={`${dayShort(sel.date)} · site ${sel.site.toLocaleString("tr-TR")} · uygulama ${sel.app.toLocaleString("tr-TR")}`}
        />
      ) : null}
      <Pressable
        onLayout={tap.onLayout}
        onPress={(e) => tap.onPress(e.nativeEvent.locationX)}
        accessibilityRole="button"
        accessibilityLabel="Grafikte bir güne dokununca o günün site ve uygulama sayıları gösterilir"
      >
        <View className="flex-row items-end" style={{ height: 120 }}>
          {days.map((d, i) => (
            <View
              key={d.date}
              accessible
              accessibilityLabel={`${day(d.date)}: site ${d.site}, uygulama ${d.app}`}
              className="flex-1 flex-row items-end justify-center gap-px"
              style={{ opacity: tap.selected === null || tap.selected === i ? 1 : 0.45 }}
            >
              <Animated.View
                style={{
                  width: "38%",
                  backgroundColor: TRAFFIC_COLORS.site,
                  borderTopLeftRadius: 2,
                  borderTopRightRadius: 2,
                  height: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, Math.max(d.site > 0 ? 3 : 1, (d.site / max) * 112)],
                  }),
                  opacity: d.site > 0 ? 1 : 0.25,
                }}
              />
              <Animated.View
                style={{
                  width: "38%",
                  backgroundColor: TRAFFIC_COLORS.app,
                  borderTopLeftRadius: 2,
                  borderTopRightRadius: 2,
                  height: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, Math.max(d.app > 0 ? 3 : 1, (d.app / max) * 112)],
                  }),
                  opacity: d.app > 0 ? 1 : 0.25,
                }}
              />
              {i % step === 0 ? (
                <Text className="text-muted text-[8px] absolute -bottom-4" numberOfLines={1}>
                  {dayShort(d.date)}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      </Pressable>
      <View className="h-4" />
    </View>
  );
}

/** Alan grafiği — gerçek günlük seriden SVG path; dokununca günün değeri gösterilir. */
export function AreaChart({
  points,
  dates,
  unit,
  width = 300,
  height = 72,
}: {
  points: number[];
  /** points ile aynı sırada gün anahtarları (çip etiketi için). */
  dates?: string[];
  /** Çipte değerin yanına yazılacak birim (örn. "tespit"). */
  unit?: string;
  width?: number;
  height?: number;
}): ReactNode {
  const theme = useTheme();
  const tap = useChartTap(points.length);
  if (points.length < 2) return null;
  const max = Math.max(1, ...points);
  const stepX = width / (points.length - 1);
  const y = (v: number) => height - (v / max) * (height - 6) - 2;
  const line = points.map((v, i) => `${i === 0 ? "M" : "L"}${i * stepX},${y(v)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const selVal = tap.selected !== null ? points[tap.selected] : undefined;
  return (
    <View>
      {selVal !== undefined ? (
        <ValueChip
          text={`${tap.selected !== null && dates?.[tap.selected] ? `${dayShort(dates[tap.selected])} · ` : ""}${selVal.toLocaleString("tr-TR")}${unit ? ` ${unit}` : ""}`}
        />
      ) : null}
      <Pressable
        onLayout={tap.onLayout}
        onPress={(e) => tap.onPress(e.nativeEvent.locationX)}
        accessibilityRole="button"
        accessibilityLabel="Grafikte bir noktaya dokununca o günün değeri gösterilir"
      >
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <Path d={area} fill="#6366F1" opacity={0.12} />
          <Path d={line} stroke="#6366F1" strokeWidth={2} fill="none" strokeLinejoin="round" />
          {tap.selected !== null && selVal !== undefined ? (
            <Circle
              cx={tap.selected * stepX}
              cy={y(selVal)}
              r={4}
              fill={theme.colors.text}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </Svg>
      </Pressable>
    </View>
  );
}

/** Plan dağılımı donut'u — dokununca yüzde ↔ gerçek sayılar arasında geçiş yapar. */
export function Donut({ pro, free }: { pro: number; free: number }): ReactNode {
  const dTheme = useTheme();
  const [showCounts, setShowCounts] = useState(false);
  const total = Math.max(1, pro + free);
  const size = 92;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const proLen = (pro / total) * c;
  return (
    <Pressable
      onPress={() => setShowCounts((v) => !v)}
      accessibilityRole="button"
      accessibilityLabel={`Plan dağılımı: ${pro} pro, ${free} ücretsiz. Dokununca sayı/yüzde değişir`}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={dTheme.colors.line}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#6366F1"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${proLen} ${c - proLen}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View className="absolute inset-0 items-center justify-center">
        {showCounts ? (
          <>
            <Text className="text-text text-sm font-bold">{pro.toLocaleString("tr-TR")}</Text>
            <Text className="text-muted text-[9px]">pro · {free.toLocaleString("tr-TR")} free</Text>
          </>
        ) : (
          <>
            <Text className="text-text text-sm font-bold">%{Math.round((pro / total) * 100)}</Text>
            <Text className="text-muted text-[9px]">pro</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

/** Kaynak kırılım listesi — anahtar + sayı + oransal bar (dinamik veriden). */
export function TopList({
  title,
  items,
  total,
}: {
  title: string;
  items: { key: string; count: number }[];
  total: number;
}): ReactNode {
  if (items.length === 0) return null;
  return (
    <View className="bg-panel border border-line rounded-xl p-4 mt-3">
      <Text className="text-muted text-[10px] uppercase tracking-widest mb-2">{title}</Text>
      {items.map((it) => {
        const pct = total > 0 ? Math.round((it.count / total) * 100) : 0;
        return (
          <View key={it.key} className="mt-2">
            <View className="flex-row items-center justify-between gap-2">
              <Text className="text-text text-xs flex-1 min-w-0" numberOfLines={1}>
                {it.key}
              </Text>
              <Text className="text-muted text-xs shrink-0">
                {it.count.toLocaleString("tr-TR")} · %{pct}
              </Text>
            </View>
            <View className="h-1.5 bg-panel2 rounded-full mt-1 overflow-hidden">
              <View
                className="h-1.5 bg-accent rounded-full"
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}
