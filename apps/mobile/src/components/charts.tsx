// Grafik primitifleri (design-standards §veri-görselleştirme) — react-native-svg ile
// native-modülsüz, Android + mobil-web ORTAK koddan çalışır. Tema-duyarlı, a11y etiketli.
// Bilinçli sade: ağır chart kütüphanesi (victory/visx) yerine bundle-dostu çizim.
// Etkileşim (ADR-095): grafiğe DOKUNUNCA en yakın noktanın sayısal değeri çip olarak
// gösterilir — çubuklar tek tek hedef olmak yerine TÜM grafik tek geniş dokunma alanıdır
// (locationX → indeks; ≥44pt hedef kuralı küçük sütunlarda böyle sağlanır).
import { useReduceMotion } from "@/lib/reduce-motion";
import { useTheme } from "@/theme";
import { useState } from "react";
import { type LayoutChangeEvent, Platform, Pressable, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import Svg, { Circle, Line, Polyline } from "react-native-svg";

/** Dokunulan noktanın değer çipi — grafiklerin ortak "değer balonu".
 *  Web'de düz View (reanimated katmanı GPU tile cızırtısı üretir — ADR-099). */
export function ValueChip({ text }: { text: string }) {
  const reduce = useReduceMotion();
  const body = <Text className="text-ink text-[11px] font-bold">{text}</Text>;
  const cls = "self-start bg-text rounded-lg px-2.5 py-1.5 mb-1.5";
  if (Platform.OS === "web") {
    return (
      <View className={cls} accessibilityLiveRegion="polite">
        {body}
      </View>
    );
  }
  return (
    <Animated.View
      entering={reduce ? undefined : FadeIn.duration(160)}
      className={cls}
      accessibilityLiveRegion="polite"
    >
      {body}
    </Animated.View>
  );
}

/** locationX → seri indeksi (tek geniş dokunma alanı deseni). */
export function useChartTap(count: number): {
  selected: number | null;
  width: number;
  onLayout: (e: LayoutChangeEvent) => void;
  onPress: (locationX: number) => void;
} {
  const [selected, setSelected] = useState<number | null>(null);
  const [width, setWidth] = useState(0);
  return {
    selected,
    width,
    onLayout: (e) => setWidth(e.nativeEvent.layout.width),
    onPress: (locationX) => {
      if (count <= 0 || width <= 0) return;
      const idx = Math.min(count - 1, Math.max(0, Math.floor((locationX / width) * count)));
      setSelected((cur) => (cur === idx ? null : idx)); // aynı noktaya ikinci dokunuş kapatır
    },
  };
}

/**
 * Dikey çubuk grafiği — saf RN View'larla (ölçüm/SVG gerekmez, web+native birebir).
 * Günlük tespit/aktivite sayıları gibi küçük seriler için. Boş seri güvenli.
 * Dokununca değer çipi gösterir (labels varsa "etiket · değer").
 */
export function MiniBars({
  data,
  labels,
  height = 64,
  a11yLabel,
}: {
  data: number[];
  labels?: string[];
  height?: number;
  a11yLabel: string;
}) {
  const theme = useTheme();
  const max = Math.max(1, ...data);
  const tap = useChartTap(data.length);
  const sel = tap.selected;
  const chip =
    sel !== null && data[sel] !== undefined
      ? `${labels?.[sel] ? `${labels[sel]} · ` : ""}${data[sel].toLocaleString()}`
      : null;
  return (
    <View accessibilityLabel={a11yLabel} accessibilityRole="image">
      {chip ? <ValueChip text={chip} /> : null}
      <Pressable
        onLayout={tap.onLayout}
        onPress={(e) => tap.onPress(e.nativeEvent.locationX)}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
      >
        <View className="flex-row items-end gap-1.5" style={{ height }}>
          {data.map((v, i) => {
            const ratio = v / max;
            const isPeak = v === max && v > 0;
            const on = sel === i;
            return (
              <View
                key={`bar-${i}-${labels?.[i] ?? ""}`}
                className="flex-1 items-center justify-end"
              >
                <View
                  style={{
                    width: "100%",
                    // En az 2px: sıfır değer bile görünür taban (algı bütünlüğü).
                    height: Math.max(2, ratio * (height - 14)),
                    borderRadius: 4,
                    backgroundColor: on
                      ? theme.colors.text
                      : isPeak
                        ? theme.colors.accent
                        : `${theme.colors.accent}66`,
                  }}
                />
              </View>
            );
          })}
        </View>
      </Pressable>
      {labels ? (
        <View className="flex-row gap-1.5 mt-1.5">
          {labels.map((l, i) => (
            <Text
              key={`lbl-${i}-${l}`}
              className="flex-1 text-center text-muted text-[9px]"
              numberOfLines={1}
            >
              {l}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/**
 * Çizgi/alan sparkline — SVG polyline, non-scaling-stroke ile eşit kalınlık.
 * viewBox 0..100 sabit + preserveAspectRatio="none" → kapsayıcı genişliğine yayılır
 * (ölçüm yok). Güven/fiyat trendi gibi seriler için. <2 nokta → çizgi yok (nokta).
 * Dokununca en yakın noktanın değeri çip olarak gösterilir.
 */
export function Sparkline({
  data,
  height = 44,
  tone = "accent",
  a11yLabel,
  format,
}: {
  data: number[];
  height?: number;
  tone?: "accent" | "pos" | "neg";
  a11yLabel: string;
  /** Çip değer biçimi (örn. yüzde) — verilmezse toLocaleString. */
  format?: (v: number) => string;
}) {
  const theme = useTheme();
  const color = tone === "pos" ? "#16A34A" : tone === "neg" ? "#DC2626" : theme.colors.accent;
  const n = data.length;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const tap = useChartTap(n);
  // 5..95 dikey pay (kenar boşluğu); x eşit aralık.
  const pts = data.map((v, i) => {
    const x = n === 1 ? 50 : (i / (n - 1)) * 100;
    const y = 95 - ((v - min) / span) * 90;
    return { x, y };
  });
  const polyline = pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const last = pts[pts.length - 1];
  const selPt = tap.selected !== null ? pts[tap.selected] : undefined;
  const selVal = tap.selected !== null ? data[tap.selected] : undefined;
  const fmt = format ?? ((v: number) => v.toLocaleString());

  return (
    <View accessibilityLabel={a11yLabel} accessibilityRole="image">
      {selVal !== undefined ? <ValueChip text={fmt(selVal)} /> : null}
      <Pressable
        onLayout={tap.onLayout}
        onPress={(e) => tap.onPress(e.nativeEvent.locationX)}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        style={{ height }}
      >
        <Svg width="100%" height={height} viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Taban referans çizgisi */}
          <Line x1="0" y1="95" x2="100" y2="95" stroke={theme.colors.line} strokeWidth={1} />
          {n >= 2 ? (
            <Polyline
              points={polyline}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
          {selPt ? (
            <Circle
              cx={selPt.x}
              cy={selPt.y}
              r={4}
              fill={theme.colors.text}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
          {last ? (
            <Circle cx={last.x} cy={last.y} r={3} fill={color} vectorEffect="non-scaling-stroke" />
          ) : null}
        </Svg>
      </Pressable>
    </View>
  );
}
