import { AreaChart, Donut } from "@/features/admin/charts";
import {
  ActBtn,
  ConsoleShell,
  ErrText,
  LegendRow,
  Loading,
  Stat,
  money,
} from "@/features/admin/ui";
import { type BillingInterval, type Plans, api } from "@/lib/api";
import { useTheme } from "@/theme";
import { useMutation, useQuery } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";

export default function AnalyticsScreen(): ReactNode {
  const aTheme = useTheme();
  const stats = useQuery({ queryKey: ["adminStats"], queryFn: api.adminStats });
  const prices = useQuery({ queryKey: ["adminPrices"], queryFn: api.adminPrices });
  const series = useQuery({
    queryKey: ["adminTimeseries", 30],
    queryFn: () => api.adminTimeseries(30),
  });
  const s = stats.data;
  return (
    <ConsoleShell title="Analitik" sub="kullanıcı · MRR">
      {stats.isLoading ? <Loading /> : null}
      {stats.error ? <ErrText e={stats.error} /> : null}
      {s ? (
        <ScrollView className="flex-1 px-5" contentContainerClassName="pt-4 pb-8">
          <View className="flex-row flex-wrap gap-2.5">
            <Stat n={s.totalUsers} l="kullanıcı" />
            <Stat n={s.proUsers} l="pro abone" tone="accent" />
            <Stat n={s.freeUsers} l="ücretsiz" />
            <Stat n={s.activeWatchers} l="aktif watcher" tone="pos" />
          </View>
          <View className="bg-panel border border-line rounded-xl p-4 mt-3">
            <Text className="text-muted text-[10px] uppercase tracking-widest">
              MRR · aylık gelir
            </Text>
            <Text className="text-pos text-3xl font-extrabold mt-1">{money(s.mrrCents)}</Text>
            <Text className="text-muted text-xs mt-1">
              {money(s.mrrCents * 12)} / yıl · {s.subscriptionsByInterval.month} aylık ·{" "}
              {s.subscriptionsByInterval.year} yıllık
            </Text>
          </View>

          {/* Son 30 gün — gerçek tespit zaman serisinden alan grafiği (dokun → değer) */}
          {series.data && series.data.totals.checkRuns > 0 ? (
            <View className="bg-panel border border-line rounded-xl p-4 mt-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-muted text-[10px] uppercase tracking-widest">
                  tespitler · son 30 gün
                </Text>
                <Text className="text-accent text-xs font-bold">
                  {series.data.totals.detections} tespit
                </Text>
              </View>
              <AreaChart
                points={series.data.points.map((p) => p.detections)}
                dates={series.data.points.map((p) => p.date)}
                unit="tespit"
              />
            </View>
          ) : null}

          {/* Plan dağılımı — gerçek free/pro sayılarından donut (dokun → sayı/yüzde) */}
          <View className="bg-panel border border-line rounded-xl p-4 mt-3">
            <Text className="text-muted text-[10px] uppercase tracking-widest mb-3">
              plan dağılımı
            </Text>
            <View className="flex-row items-center gap-5">
              <Donut pro={s.proUsers} free={s.freeUsers} />
              <View className="gap-2">
                <LegendRow color="#6366F1" label={`Pro · ${s.proUsers}`} />
                <LegendRow color={aTheme.colors.line} label={`Ücretsiz · ${s.freeUsers}`} />
              </View>
            </View>
          </View>

          <Text className="text-muted text-[10px] uppercase tracking-widest mt-6 mb-2">
            fiyatlandırma
          </Text>
          <PriceEditor interval="month" prices={prices.data} onSaved={() => prices.refetch()} />
          <PriceEditor interval="year" prices={prices.data} onSaved={() => prices.refetch()} />
          <Text className="text-muted text-[11px] mt-2">
            Fiyat değişimi yalnız yeni satın alma/yenilemeler için geçerlidir; mevcut aboneler dönem
            sonuna dek eski fiyattan devam eder.
          </Text>
        </ScrollView>
      ) : null}
    </ConsoleShell>
  );
}

function PriceEditor({
  interval,
  prices,
  onSaved,
}: {
  interval: BillingInterval;
  prices: Plans | undefined;
  onSaved: () => void;
}): ReactNode {
  const current = prices?.prices.find((p) => p.interval === interval) ?? null;
  const [val, setVal] = useState("");
  useEffect(() => {
    if (current) setVal((current.amountCents / 100).toString());
  }, [current]);
  const save = useMutation({
    mutationFn: () =>
      api.setPrice(interval, Math.round(Number(val) * 100), current?.currency ?? "usd"),
    onSuccess: onSaved,
  });
  return (
    <View className="bg-panel border border-line rounded-xl p-4 mb-2.5">
      <Text className="text-text text-sm uppercase mb-2">
        pro · {interval === "month" ? "aylık" : "yıllık"}
      </Text>
      <View className="flex-row items-center gap-2">
        <TextInput
          value={val}
          onChangeText={setVal}
          keyboardType="decimal-pad"
          placeholder="4.99"
          placeholderTextColor="#94A3B8"
          accessibilityLabel={`Pro ${interval === "month" ? "aylık" : "yıllık"} fiyat`}
          className="flex-1 bg-ink border border-line rounded-lg px-3 py-2 text-text"
        />
        <ActBtn
          label="kaydet"
          tone="solid"
          disabled={save.isPending || !val}
          onPress={() => save.mutate()}
        />
      </View>
      <Text className="text-muted text-xs mt-2">
        şu an: {current ? money(current.amountCents, current.currency) : "—"}
      </Text>
    </View>
  );
}
