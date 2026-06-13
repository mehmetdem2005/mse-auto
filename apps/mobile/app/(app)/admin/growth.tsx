import { toast } from "@/components/feedback";
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
import { api } from "@/lib/api";
import { useTheme } from "@/theme";
import { useMutation, useQuery } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { Pressable, ScrollView, Share, Text, View } from "react-native";

const RANGES = [7, 30, 90];

// ADR-103: büyüme — kayıt trendi + dönüşüm hunisi + churn + MRR + CSV dışa aktarım.
export default function GrowthScreen(): ReactNode {
  const theme = useTheme();
  const [days, setDays] = useState(30);
  const q = useQuery({ queryKey: ["adminGrowth", days], queryFn: () => api.adminGrowth(days) });

  const exportCsv = useMutation({
    mutationFn: async (kind: "users" | "subscriptions") => {
      const csv =
        kind === "users" ? await api.exportUsersCsv() : await api.exportSubscriptionsCsv();
      await Share.share({ message: csv, title: `${kind}.csv` });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "dışa aktarılamadı"),
  });

  const g = q.data;
  return (
    <ConsoleShell title="Büyüme" sub={`son ${days} gün`}>
      <ScrollView className="flex-1 px-5" contentContainerClassName="pt-4 pb-12">
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Zaman aralığı"
          className="flex-row gap-2 mb-4"
        >
          {RANGES.map((d) => {
            const on = d === days;
            return (
              <Pressable
                key={d}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${d} gün`}
                onPress={() => setDays(d)}
                className={`rounded-full px-4 py-2 min-h-11 justify-center ${on ? "bg-accent" : "border border-line"}`}
              >
                <Text
                  className="text-[11px] uppercase tracking-wider"
                  style={{ color: on ? "#FFFFFF" : "#475569" }}
                >
                  {d} gün
                </Text>
              </Pressable>
            );
          })}
        </View>

        {q.isLoading ? <Loading /> : null}
        {q.error ? <ErrText e={q.error} /> : null}
        {g ? (
          <>
            <View className="flex-row flex-wrap gap-2.5">
              <Stat n={g.totalUsers} l="toplam kullanıcı" />
              <Stat n={g.newUsersInRange} l="yeni kayıt" tone="accent" sub={`son ${days} gün`} />
              <Stat
                n={Math.round(g.mrrCents / 100)}
                l="MRR ($)"
                tone="pos"
                sub={money(g.mrrCents)}
              />
              <Stat n={g.churn.canceled} l="toplam iptal" sub="tüm zamanlar" />
            </View>

            {/* Kayıt trendi */}
            {g.signups.length >= 2 ? (
              <View className="bg-panel border border-line rounded-xl p-4 mt-3">
                <Text className="text-muted text-[10px] uppercase tracking-widest mb-2">
                  günlük yeni kayıt · son {days} gün
                </Text>
                <AreaChart
                  points={g.signups.map((s) => s.count)}
                  dates={g.signups.map((s) => s.date)}
                  unit="kayıt"
                />
              </View>
            ) : null}

            {/* Dönüşüm hunisi */}
            <View className="bg-panel border border-line rounded-xl p-4 mt-3">
              <Text className="text-muted text-[10px] uppercase tracking-widest mb-3">
                ücretsiz → pro dönüşümü
              </Text>
              <View className="flex-row items-center gap-5">
                <Donut pro={g.funnel.pro} free={g.funnel.free} />
                <View className="gap-2">
                  <LegendRow color="#6366F1" label={`Pro · ${g.funnel.pro}`} />
                  <LegendRow color={theme.colors.line} label={`Ücretsiz · ${g.funnel.free}`} />
                  <Text className="text-muted text-xs mt-1">
                    %{g.funnel.conversionRate} dönüşüm
                  </Text>
                </View>
              </View>
            </View>

            {/* CSV dışa aktarım */}
            <Text className="text-muted text-[10px] uppercase tracking-widest mt-6 mb-2">
              dışa aktar (CSV)
            </Text>
            <View className="flex-row flex-wrap gap-2">
              <ActBtn
                label="kullanıcılar"
                disabled={exportCsv.isPending}
                onPress={() => exportCsv.mutate("users")}
              />
              <ActBtn
                label="abonelikler"
                disabled={exportCsv.isPending}
                onPress={() => exportCsv.mutate("subscriptions")}
              />
            </View>

            <Text className="text-muted text-[11px] mt-4 leading-4">
              DÜRÜST NOT: MRR, huni ve "toplam iptal" anlık/birikimli (tüm zamanlar) değerlerdir;
              seçilen aralık YALNIZ kayıt trendini ve "yeni kayıt"ı filtreler. Geçmişe dönük
              MRR/churn zaman serisi tutulmuyor (abonelik geçmişi tablosu gerekir).
            </Text>
          </>
        ) : null}
      </ScrollView>
    </ConsoleShell>
  );
}
