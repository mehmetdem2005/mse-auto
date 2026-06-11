// Grafik primitifleri (design-standards §veri-görselleştirme) — react-native-svg ile
// native-modülsüz, Android + mobil-web ORTAK koddan çalışır. Tema-duyarlı, a11y etiketli.
// Bilinçli sade: ağır chart kütüphanesi (victory/visx) yerine bundle-dostu çizim.
import { useTheme } from "@/theme";
import { Text, View } from "react-native";
import Svg, { Circle, Line, Polyline } from "react-native-svg";

/**
 * Dikey çubuk grafiği — saf RN View'larla (ölçüm/SVG gerekmez, web+native birebir).
 * Günlük tespit/aktivite sayıları gibi küçük seriler için. Boş seri güvenli.
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
  return (
    <View accessibilityLabel={a11yLabel} accessibilityRole="image">
      <View className="flex-row items-end gap-1.5" style={{ height }}>
        {data.map((v, i) => {
          const ratio = v / max;
          const isPeak = v === max && v > 0;
          return (
            <View key={`bar-${i}-${labels?.[i] ?? ""}`} className="flex-1 items-center justify-end">
              <View
                style={{
                  width: "100%",
                  // En az 2px: sıfır değer bile görünür taban (algı bütünlüğü).
                  height: Math.max(2, ratio * (height - 14)),
                  borderRadius: 4,
                  backgroundColor: isPeak ? theme.colors.accent : `${theme.colors.accent}66`,
                }}
              />
            </View>
          );
        })}
      </View>
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
 */
export function Sparkline({
  data,
  height = 44,
  tone = "accent",
  a11yLabel,
}: {
  data: number[];
  height?: number;
  tone?: "accent" | "pos" | "neg";
  a11yLabel: string;
}) {
  const theme = useTheme();
  const color = tone === "pos" ? "#16A34A" : tone === "neg" ? "#DC2626" : theme.colors.accent;
  const n = data.length;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  // 5..95 dikey pay (kenar boşluğu); x eşit aralık.
  const pts = data.map((v, i) => {
    const x = n === 1 ? 50 : (i / (n - 1)) * 100;
    const y = 95 - ((v - min) / span) * 90;
    return { x, y };
  });
  const polyline = pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const last = pts[pts.length - 1];

  return (
    <View accessibilityLabel={a11yLabel} accessibilityRole="image" style={{ height }}>
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
        {last ? (
          <Circle cx={last.x} cy={last.y} r={3} fill={color} vectorEffect="non-scaling-stroke" />
        ) : null}
      </Svg>
    </View>
  );
}
