import { TRAFFIC_COLORS, TopList, TrafficBars } from "@/features/admin/charts";
import { ConsoleShell, ErrText, LegendRow, Loading, Stat } from "@/features/admin/ui";
import { type TrafficBreakdown, api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

// Site + uygulama edinim sinyali (ADR-091) — kimliksiz beacon'lardan DİNAMİK.
export default function TrafficScreen(): ReactNode {
  const [days, setDays] = useState(30);
  const [seg, setSeg] = useState<"site" | "app">("site");
  const q = useQuery({
    queryKey: ["adminTraffic", days],
    queryFn: () => api.adminTraffic(days),
  });
  const d = q.data;
  const empty = d ? d.site.total === 0 && d.app.total === 0 : true;
  const active = d ? (seg === "site" ? d.site : d.app) : null;
  return (
    <ConsoleShell title="Trafik" sub="edinim sinyali">
      {q.isLoading ? <Loading /> : null}
      {q.error ? <ErrText e={q.error} /> : null}
      {d ? (
        <ScrollView className="flex-1 px-5" contentContainerClassName="pt-4 pb-8">
          <View className="flex-row gap-1.5 mb-3">
            {[7, 30, 90].map((n) => (
              <Pressable
                key={n}
                onPress={() => setDays(n)}
                accessibilityRole="button"
                accessibilityState={{ selected: days === n }}
                className={`rounded-lg px-3 py-2 min-h-11 justify-center ${days === n ? "bg-accent" : "border border-line"}`}
              >
                <Text
                  className="text-[11px] uppercase tracking-wider"
                  style={{ color: days === n ? "#FFFFFF" : "#64748B" }}
                >
                  {n} gün
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="flex-row flex-wrap gap-2.5">
            <Stat n={d.site.total} l="site ziyareti" tone="accent" sub="tanıtım sitesi" />
            <Stat n={d.app.total} l="uygulama açılışı" tone="pos" sub="web + Android" />
          </View>

          <View className="bg-panel border border-line rounded-xl p-4 mt-3">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-muted text-[10px] uppercase tracking-widest">
                günlük trafik · son {days} gün
              </Text>
              <View className="flex-row items-center gap-3">
                <LegendRow color={TRAFFIC_COLORS.site} label="Site" />
                <LegendRow color={TRAFFIC_COLORS.app} label="Uygulama" />
              </View>
            </View>
            {empty ? (
              <Text className="text-muted text-xs py-6 text-center">
                Henüz trafik sinyali yok — site ve uygulama ziyaret edildikçe burada birikir.
              </Text>
            ) : (
              <TrafficBars days={d.days} />
            )}
          </View>

          {/* Site / Uygulama kırılımı — ayrı ayrı (kullanıcı isteği) */}
          <View className="flex-row gap-1.5 mt-5 mb-1">
            {(
              [
                ["site", "Site kaynakları"],
                ["app", "Uygulama kaynakları"],
              ] as const
            ).map(([v, l]) => (
              <Pressable
                key={v}
                onPress={() => setSeg(v)}
                accessibilityRole="button"
                accessibilityState={{ selected: seg === v }}
                className={`rounded-lg px-3 py-2 min-h-11 justify-center ${seg === v ? "bg-accent" : "border border-line"}`}
              >
                <Text
                  className="text-[11px] uppercase tracking-wider"
                  style={{ color: seg === v ? "#FFFFFF" : "#64748B" }}
                >
                  {l}
                </Text>
              </Pressable>
            ))}
          </View>
          {active && active.total === 0 ? (
            <Text className="text-muted text-xs mt-3">Bu kaynak için henüz veri yok.</Text>
          ) : active ? (
            <Breakdown b={active} kind={seg} />
          ) : null}
          <Text className="text-muted text-[10px] mt-4">
            Kimliksiz sinyal: IP, kullanıcı kimliği ve tam URL saklanmaz; yalnız yönlendiren alan
            adı, utm etiketi, sayfa yolu, dil ve platform sayılır (ADR-091).
          </Text>
        </ScrollView>
      ) : null}
    </ConsoleShell>
  );
}

function Breakdown({ b, kind }: { b: TrafficBreakdown; kind: "site" | "app" }): ReactNode {
  return (
    <>
      <TopList title="nereden geldi · yönlendiren" items={b.refs} total={b.total} />
      <TopList title="kampanya · utm_source" items={b.utms} total={b.total} />
      {kind === "site" ? (
        <TopList title="en çok gezilen sayfalar" items={b.paths} total={b.total} />
      ) : null}
      {kind === "app" ? <TopList title="platform" items={b.platforms} total={b.total} /> : null}
      <TopList title="dil" items={b.langs} total={b.total} />
    </>
  );
}
