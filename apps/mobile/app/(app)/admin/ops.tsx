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
  // ADR-142: API doğrudan successRate (0-100, terminal yoksa null) + failed verir.
  const byStatus = (k: string): number =>
    o?.deliveries.byStatus.find((s) => s.key === k)?.count ?? 0;
  const succeeded = byStatus("sent") + byStatus("delivered");
  const failed = o?.deliveries.failed ?? 0;
  const rate = o?.deliveries.successRate ?? null;
  const rateTone =
    rate === null
      ? { text: "text-muted", bg: "bg-line" }
      : rate >= 95
        ? { text: "text-pos", bg: "bg-pos" }
        : rate >= 80
          ? { text: "text-warn", bg: "bg-warn" }
          : { text: "text-neg", bg: "bg-neg" };

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
            {/* ADR-142: başarı oranı baş gösterge (terminal teslimatlar; pending hariç). */}
            <View className="bg-panel border border-line rounded-2xl p-4 mb-2.5">
              <View className="flex-row items-baseline justify-between mb-2">
                <Text className="text-muted text-[11px] uppercase tracking-widest">
                  başarı oranı
                </Text>
                <Text className={`text-2xl font-extrabold ${rateTone.text}`}>
                  {rate !== null ? `%${rate}` : "—"}
                </Text>
              </View>
              <View
                className="h-2 bg-line rounded-full overflow-hidden"
                accessibilityRole="progressbar"
                accessibilityLabel="Teslimat başarı oranı"
                accessibilityValue={{ min: 0, max: 100, now: rate ?? 0 }}
              >
                <View
                  className={`h-full rounded-full ${rateTone.bg}`}
                  style={{ width: `${rate ?? 0}%` }}
                />
              </View>
              <Text className="text-muted text-[11px] mt-2">
                {rate !== null
                  ? `${succeeded} başarılı · ${failed} başarısız (tamamlanan teslimatlar)`
                  : "Henüz tamamlanmış teslimat yok."}
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-2.5">
              <Stat n={o.deliveries.total} l="teslimat" />
              <Stat n={succeeded} l="başarılı" tone="pos" />
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

            {/* ADR-146: kanal-bazlı sağlık — hangi kanal bozuk (push/telegram/whatsapp/email ayrı). */}
            {o.deliveries.channelHealth.length > 0 ? (
              <View className="mt-4">
                <Text className="text-muted text-[10px] uppercase tracking-widest mb-2">
                  kanal sağlığı
                </Text>
                <View className="bg-panel border border-line rounded-2xl overflow-hidden">
                  {o.deliveries.channelHealth.map((ch, i) => {
                    const r = ch.successRate;
                    const tone =
                      r === null
                        ? "text-muted"
                        : r >= 95
                          ? "text-pos"
                          : r >= 80
                            ? "text-warn"
                            : "text-neg";
                    return (
                      <View
                        key={ch.channel}
                        className={`flex-row items-center justify-between px-4 py-3 ${i > 0 ? "border-t border-line" : ""}`}
                      >
                        <View className="flex-1 min-w-0">
                          <Text className="text-text text-sm font-medium capitalize">
                            {ch.channel}
                          </Text>
                          <Text className="text-muted text-[11px] mt-0.5">
                            {ch.total} teslimat · {ch.failed} başarısız
                          </Text>
                        </View>
                        <Text className={`text-base font-bold ${tone}`}>
                          {r !== null ? `%${r}` : "—"}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}

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
