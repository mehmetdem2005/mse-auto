import { EnterItem } from "@/components/motion";
import { Badge, Card, EmptyState, Fab } from "@/components/ui";
import { type Watch, api } from "@/lib/api";
import { qk } from "@/lib/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  Activity,
  ChevronRight,
  GraduationCap,
  type LucideIcon,
  Pause,
  Play,
  Tag,
  Target,
  Ticket,
  Trash2,
} from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from "react-native";

/** Niyet metninden deterministik kategori ikonu + rengi (görsel kimlik). */
function categoryOf(intent: string): { Icon: LucideIcon; tint: string; bg: string } {
  const t = intent.toLowerCase();
  if (/deprem|yangın|sel|afet|fırtına/.test(t))
    return { Icon: Activity, tint: "#D97706", bg: "bg-amber-500/10" };
  if (/fiyat|indirim|zam|ücret|stok/.test(t))
    return { Icon: Tag, tint: "#7C3AED", bg: "bg-accent2/10" };
  if (/sınav|yks|kpss|lgs|ales|sonuç|tercih/.test(t))
    return { Icon: GraduationCap, tint: "#16A34A", bg: "bg-pos/10" };
  if (/bilet|konser|maç|etkinlik/.test(t))
    return { Icon: Ticket, tint: "#DB2777", bg: "bg-pink-500/10" };
  return { Icon: Target, tint: "#6366F1", bg: "bg-accent/10" };
}

function labelFreq(m: number): string {
  if (m >= 1440) return `günde ${Math.round(m / 1440) === 1 ? "bir" : m / 1440} kez`;
  if (m >= 60) return `her ${m / 60} saatte`;
  return `her ${m} dk`;
}

export default function Watchers() {
  const router = useRouter();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "active" | "paused">("all");
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: qk.watchers,
    queryFn: api.watchers,
  });

  const invalidate = (): void => {
    void qc.invalidateQueries({ queryKey: qk.watchers });
    void qc.invalidateQueries({ queryKey: qk.subscription });
  };
  const setStatus = useMutation({
    mutationFn: (v: { id: string; status: "active" | "paused" }) =>
      api.setMyWatchStatus(v.id, v.status),
    onSuccess: invalidate,
    onError: (e) => Alert.alert("Olmadı", e instanceof Error ? e.message : "değiştirilemedi"),
  });
  const del = useMutation({
    mutationFn: (id: string) => api.deleteMyWatch(id),
    onSuccess: invalidate,
    onError: (e) => Alert.alert("Olmadı", e instanceof Error ? e.message : "silinemedi"),
  });

  function confirmDelete(w: Watch) {
    Alert.alert("Watcher'ı sil", `"${w.rawIntent}" kalıcı olarak silinsin mi?`, [
      { text: "Vazgeç", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: () => del.mutate(w.id) },
    ]);
  }

  return (
    <View className="flex-1 bg-ink px-5 pt-4">
      {isLoading ? (
        <ActivityIndicator color="#6366F1" className="mt-10" />
      ) : error ? (
        <Text className="text-neg mt-6">
          {error instanceof Error ? error.message : "yüklenemedi"}
        </Text>
      ) : (
        <FlatList
          data={(data ?? []).filter((w) => filter === "all" || w.status === filter)}
          keyExtractor={(w) => w.id}
          ListHeaderComponent={
            (data ?? []).length > 0 ? (
              <View className="flex-row gap-2 mb-3" accessibilityRole="tablist">
                {(
                  [
                    ["all", "Tümü"],
                    ["active", "Aktif"],
                    ["paused", "Duraklatıldı"],
                  ] as const
                ).map(([v, l]) => (
                  <Pressable
                    key={v}
                    onPress={() => setFilter(v)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: filter === v }}
                    className={`rounded-full px-4 py-2 min-h-[36px] ${
                      filter === v ? "bg-accent" : "bg-panel border border-line"
                    }`}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: filter === v ? "#FFFFFF" : "#475569" }}
                    >
                      {l}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null
          }
          ListFooterComponent={
            (data ?? []).length > 0 ? (
              <Text className="text-muted text-[11px] text-center mt-4">
                {(data ?? []).filter((w) => w.status === "active").length} watcher aktif · tüm
                gelişmeleri takip ediyoruz
              </Text>
            ) : null
          }
          onRefresh={() => void refetch()}
          refreshing={isRefetching}
          ItemSeparatorComponent={() => <View className="h-3" />}
          ListEmptyComponent={
            <EmptyState
              title="Henüz watcher yok"
              hint="Sağ alttaki artı butonundan ilk izleyicini oluştur."
            />
          }
          renderItem={({ item, index }) => (
            <EnterItem index={index}>
              <WatchRow
                item={item}
                busy={setStatus.isPending || del.isPending}
                onPress={() => router.push(`/watcher/${item.id}`)}
                onToggle={() =>
                  setStatus.mutate({
                    id: item.id,
                    status: item.status === "active" ? "paused" : "active",
                  })
                }
                onDelete={() => confirmDelete(item)}
              />
            </EnterItem>
          )}
        />
      )}
      <Fab accessibilityLabel="Yeni watcher oluştur" onPress={() => router.push("/new")} />
    </View>
  );
}

function WatchRow({
  item,
  busy,
  onPress,
  onToggle,
  onDelete,
}: {
  item: Watch;
  busy: boolean;
  onPress: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const active = item.status === "active";
  const cat = categoryOf(item.rawIntent);
  return (
    <Card onPress={onPress}>
      <View className="flex-row gap-3">
        <View className={`w-10 h-10 rounded-xl ${cat.bg} items-center justify-center`}>
          <cat.Icon size={18} color={cat.tint} />
        </View>
        <Text className="text-text text-base font-medium leading-5 flex-1" numberOfLines={2}>
          {item.rawIntent}
        </Text>
      </View>
      <View className="flex-row items-center gap-2 mt-3">
        <Badge tone={active ? "pos" : "muted"}>{active ? "aktif" : "duraklatıldı"}</Badge>
        <Badge tone="accent">{item.archetype === "shared" ? "paylaşılan" : "kişisel"}</Badge>
        <Text className="text-muted text-xs">{labelFreq(item.frequencyMinutes)}</Text>
        <View className="flex-row items-center ml-auto">
          <Text className="text-muted text-xs">araştırma</Text>
          <ChevronRight size={14} color="#475569" />
        </View>
      </View>

      {/* Duraklat/Sürdür + Sil (HIG ≥44pt; vektör ikon + metin) */}
      <View className="flex-row gap-2 mt-3 pt-3 border-t border-line">
        <Pressable
          onPress={onToggle}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={active ? "Watcher'ı duraklat" : "Watcher'ı sürdür"}
          className={`flex-1 min-h-[44px] flex-row gap-1.5 justify-center items-center rounded-xl border border-line active:bg-panel2 ${
            busy ? "opacity-40" : ""
          }`}
        >
          {active ? <Pause size={15} color="#0F172A" /> : <Play size={15} color="#0F172A" />}
          <Text className="text-text text-[13px] font-semibold">
            {active ? "Duraklat" : "Sürdür"}
          </Text>
        </Pressable>
        <Pressable
          onPress={onDelete}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Watcher'ı sil"
          className={`flex-1 min-h-[44px] flex-row gap-1.5 justify-center items-center rounded-xl border border-neg/40 active:bg-neg/5 ${
            busy ? "opacity-40" : ""
          }`}
        >
          <Trash2 size={15} color="#DC2626" />
          <Text className="text-neg text-[13px] font-semibold">Sil</Text>
        </Pressable>
      </View>
    </Card>
  );
}
