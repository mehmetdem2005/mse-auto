import { TopList } from "@/features/admin/charts";
import { ConsoleShell, ErrText, Loading, Stat } from "@/features/admin/ui";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const RANGES = [1, 7, 30];

// ADR-102: tek ekranda işleyiş sağlığı — kontrol/tespit/token + teslimat başarı/hata.
export default function OpsScreen(): ReactNode {
  const [days, setDays] = useState(7);
  const q = useQuery({ queryKey: ["adminOps", days], queryFn: () => api.adminOps(days) });
  const o = q.data;
  const delivered = o?.deliveries.byStatus.find((s) => s.key === "sent")?.count ?? 0;
  const failed = o?.deliveries.byStatus.find((s) => s.key === "failed")?.count ?? 0;

  return (
    <ConsoleShell title="Operasyon" sub={`son ${days} gün`}>
      <ScrollView className="flex-1 px-5" contentContainerClassName="pt-4 pb-10">
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
        {o ? (
          <>
            <Text className="text-muted text-[10px] uppercase tracking-widest mb-2">
              tarama motoru
            </Text>
            <View className="flex-row flex-wrap gap-2.5">
              <Stat n={o.checks.total} l="kontrol" tone="accent" />
              <Stat
                n={o.checks.detections}
                l="tespit"
                tone="pos"
                sub={`%${o.checks.detectionRate} oran`}
              />
              <Stat
                n={o.checks.avgConfidence !== null ? Math.round(o.checks.avgConfidence * 100) : 0}
                l="ort. güven %"
              />
              <Stat n={o.checks.tokensUsed} l="token" sub="LLM maliyeti" />
            </View>

            <Text className="text-muted text-[10px] uppercase tracking-widest mt-6 mb-2">
              teslimat sağlığı
            </Text>
            <View className="flex-row flex-wrap gap-2.5">
              <Stat n={o.deliveries.total} l="teslimat" />
              <Stat n={delivered} l="başarılı" tone="pos" />
              <Stat n={failed} l="başarısız" />
            </View>
            {failed > 0 ? (
              <View className="bg-neg/10 border border-neg/30 rounded-xl px-3 py-2.5 mt-3">
                <Text className="text-neg text-xs">
                  {failed} teslimat başarısız — kanal ayarlarını/anahtarlarını kontrol et.
                </Text>
              </View>
            ) : null}

            <TopList
              title="durum kırılımı"
              items={o.deliveries.byStatus}
              total={o.deliveries.total}
            />
            <TopList
              title="kanal kırılımı"
              items={o.deliveries.byChannel}
              total={o.deliveries.total}
            />

            {o.checks.total === 0 ? (
              <Text className="text-muted text-[11px] mt-4">
                Bu aralıkta kayıt yok. Watcher'lar çalıştıkça veriler dolacaktır.
              </Text>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </ConsoleShell>
  );
}
