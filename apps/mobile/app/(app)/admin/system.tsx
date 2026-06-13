import { ConsoleShell, ErrText, Loading, Stat, day } from "@/features/admin/ui";
import { api } from "@/lib/api";
import { qk } from "@/lib/query";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";

export default function SystemScreen(): ReactNode {
  const q = useQuery({ queryKey: qk.adminSystem, queryFn: api.adminSystem });
  const s = q.data;
  return (
    <ConsoleShell title="Sistem" sub="sağlık & işler">
      {q.isLoading ? <Loading /> : null}
      {q.error ? <ErrText e={q.error} /> : null}
      {s ? (
        <ScrollView className="flex-1 px-5" contentContainerClassName="pt-4 pb-8">
          <Text className="text-muted text-xs mb-3">
            backend: {s.backend} · {day(s.now)}
          </Text>
          <View className="flex-row flex-wrap gap-2.5">
            <Stat n={s.counts.users} l="kullanıcı" />
            <Stat n={s.counts.watches} l="watcher" />
            <Stat n={s.counts.activeWatches} l="aktif watcher" tone="pos" />
            <Stat n={s.counts.subscriptions} l="abonelik" />
            <Stat n={s.counts.deliveries} l="teslimat" />
            <Stat n={s.counts.checkRuns} l="kontrol" tone="accent" />
          </View>

          <Text className="text-muted text-[10px] uppercase tracking-widest mt-6 mb-2">
            sistem sağlığı
          </Text>
          <View className="bg-panel border border-line rounded-xl p-4">
            {s.services.map((sv) => (
              <View
                key={sv.name}
                className="flex-row items-center justify-between py-2 border-b border-line"
              >
                <Text className="text-text text-xs">{sv.name}</Text>
                <View className={`px-2 py-1 rounded-full ${sv.ok ? "bg-pos/10" : "bg-neg/10"}`}>
                  <Text
                    className="text-[10px] font-semibold"
                    style={{ color: sv.ok ? "#16A34A" : "#DC2626" }}
                  >
                    {sv.ok ? "Sağlıklı" : "Yapılandırılmadı"}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <Text className="text-muted text-[10px] uppercase tracking-widest mt-6 mb-2">
            son kontroller
          </Text>
          <View className="bg-panel border border-line rounded-xl p-4">
            {s.recentCheckRuns.length > 0 ? (
              s.recentCheckRuns.map((r) => (
                <View key={r.id} className="py-2 border-b border-line">
                  <Text className="text-text text-xs">
                    {r.decision ? "● tespit" : "○ yok"}
                    {r.confidence !== null ? ` (${Math.round(r.confidence * 100)}%)` : ""}
                  </Text>
                  <Text className="text-muted text-[11px] mt-0.5" numberOfLines={1}>
                    {day(r.ranAt)}
                    {r.summary ? ` · ${r.summary}` : ""}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-muted text-xs">kayıt yok.</Text>
            )}
          </View>

          <Text className="text-muted text-[10px] uppercase tracking-widest mt-6 mb-2">
            son teslimatlar
          </Text>
          <View className="bg-panel border border-line rounded-xl p-4">
            {s.recentDeliveries.length > 0 ? (
              s.recentDeliveries.map((d) => (
                <View key={d.id} className="py-2 border-b border-line">
                  <Text className="text-text text-xs">
                    {d.channel} · {d.status}
                  </Text>
                  <Text className="text-muted text-[11px] mt-0.5">
                    {d.sentAt ? day(d.sentAt) : "—"}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-muted text-xs">kayıt yok.</Text>
            )}
          </View>
        </ScrollView>
      ) : null}
    </ConsoleShell>
  );
}
