import { BarChart, SERIES_COLORS } from "@/features/admin/charts";
import { ConsoleShell, ErrText, Legend, Skeleton, Stat } from "@/features/admin/ui";
import { type AdminTimeseriesPoint, api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const RANGES: { d: number; label: string }[] = [
  { d: 7, label: "7 gün" },
  { d: 14, label: "14 gün" },
  { d: 30, label: "30 gün" },
];

export default function StatsScreen(): ReactNode {
  const [days, setDays] = useState(14);
  const q = useQuery({
    queryKey: ["adminTimeseries", days],
    queryFn: () => api.adminTimeseries(days),
  });

  return (
    <ConsoleShell title="İstatistik" sub="işleyiş nabzı">
      <ScrollView className="flex-1 px-5" contentContainerClassName="pt-4 pb-10">
        {/* Aralık seçici */}
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Zaman aralığı"
          className="flex-row gap-2 mt-1 mb-4"
        >
          {RANGES.map((r) => {
            const on = r.d === days;
            return (
              <Pressable
                key={r.d}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={r.label}
                onPress={() => setDays(r.d)}
                className={`rounded-full px-4 py-2 min-h-11 justify-center ${on ? "bg-accent" : "border border-line"}`}
              >
                <Text
                  className="text-[11px] uppercase tracking-wider"
                  style={{ color: on ? "#FFFFFF" : "#475569" }}
                >
                  {r.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {q.isLoading ? <Skeleton rows={3} /> : null}
        {q.error ? <ErrText e={q.error} /> : null}
        {q.data ? <StatsBody data={q.data} /> : null}
      </ScrollView>
    </ConsoleShell>
  );
}

function StatsBody({
  data,
}: {
  data: {
    points: AdminTimeseriesPoint[];
    totals: { checkRuns: number; detections: number; deliveries: number };
  };
}): ReactNode {
  const { points, totals } = data;
  const rate = totals.checkRuns > 0 ? Math.round((totals.detections / totals.checkRuns) * 100) : 0;
  // Delta çipleri — GERÇEK seriden: bugün vs dün
  const today = points[points.length - 1];
  const yesterday = points[points.length - 2];
  const delta = (a?: number, b?: number): string | undefined => {
    if (a === undefined || b === undefined) return undefined;
    const d = a - b;
    return d === 0 ? "dünle aynı" : d > 0 ? `dünden +${d}` : `dünden ${d}`;
  };

  return (
    <View>
      {/* Toplam kartları */}
      <View className="flex-row flex-wrap gap-2.5">
        <Stat
          n={totals.checkRuns}
          l="kontrol"
          tone="accent"
          sub={delta(today?.checkRuns, yesterday?.checkRuns)}
        />
        <Stat
          n={totals.detections}
          l="tespit"
          tone="pos"
          sub={delta(today?.detections, yesterday?.detections) ?? `%${rate} tespit oranı`}
        />
        <Stat
          n={totals.deliveries}
          l="teslimat"
          sub={delta(today?.deliveries, yesterday?.deliveries)}
        />
      </View>

      {/* Kontroller & Tespitler — bindirmeli sütun grafik (dokun → günün sayıları) */}
      <Text className="text-muted text-[10px] uppercase tracking-widest mt-6 mb-2">
        kontroller & tespitler / gün
      </Text>
      <View
        className="bg-panel border border-line rounded-2xl p-4"
        style={{
          shadowColor: "#0F172A",
          shadowOpacity: 0.05,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
          elevation: 1,
        }}
      >
        <BarChart
          key={`cr-${points.length}`}
          points={points}
          series={[
            { key: "checkRuns", color: SERIES_COLORS.checks, label: "Kontrol" },
            { key: "detections", color: SERIES_COLORS.detect, label: "Tespit" },
          ]}
        />
        <Legend
          items={[
            { color: SERIES_COLORS.checks, label: "Kontrol" },
            { color: SERIES_COLORS.detect, label: "Tespit" },
          ]}
        />
      </View>

      {/* Teslimatlar */}
      <Text className="text-muted text-[10px] uppercase tracking-widest mt-6 mb-2">
        teslimatlar / gün
      </Text>
      <View
        className="bg-panel border border-line rounded-2xl p-4"
        style={{
          shadowColor: "#0F172A",
          shadowOpacity: 0.05,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
          elevation: 1,
        }}
      >
        <BarChart
          key={`dl-${points.length}`}
          points={points}
          series={[{ key: "deliveries", color: SERIES_COLORS.deliver, label: "Teslimat" }]}
        />
      </View>

      {totals.checkRuns === 0 ? (
        <Text className="text-muted text-[11px] mt-3">
          Bu aralıkta henüz kayıt yok. Watcher'lar çalıştıkça grafik dolacaktır.
        </Text>
      ) : null}
    </View>
  );
}
