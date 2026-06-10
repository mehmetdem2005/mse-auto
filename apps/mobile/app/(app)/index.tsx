import { Badge, Card, EmptyState, Fab } from "@/components/ui";
import { type Watch, api } from "@/lib/api";
import { qk } from "@/lib/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from "react-native";

function labelFreq(m: number): string {
  if (m >= 1440) return `günde ${Math.round(m / 1440) === 1 ? "bir" : m / 1440} kez`;
  if (m >= 60) return `her ${m / 60} saatte`;
  return `her ${m} dk`;
}

export default function Watchers() {
  const router = useRouter();
  const qc = useQueryClient();
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
          data={data ?? []}
          keyExtractor={(w) => w.id}
          onRefresh={() => void refetch()}
          refreshing={isRefetching}
          ItemSeparatorComponent={() => <View className="h-3" />}
          ListEmptyComponent={
            <EmptyState
              title="Henüz watcher yok"
              hint="Sağ alttaki ＋ butonundan ilk izleyicini oluştur."
            />
          }
          renderItem={({ item }) => (
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
  return (
    <Card onPress={onPress}>
      <Text className="text-text text-base font-medium leading-5" numberOfLines={2}>
        {item.rawIntent}
      </Text>
      <View className="flex-row items-center gap-2 mt-3">
        <Badge tone={active ? "pos" : "muted"}>{active ? "● aktif" : "❚❚ duraklatıldı"}</Badge>
        <Badge tone="accent">{item.archetype === "shared" ? "paylaşılan" : "kişisel"}</Badge>
        <Text className="text-muted text-xs">{labelFreq(item.frequencyMinutes)}</Text>
        <Text className="text-muted text-xs ml-auto">araştırma ›</Text>
      </View>

      {/* Duraklat/Sürdür + Sil (HIG ≥44pt) */}
      <View className="flex-row gap-2 mt-3 pt-3 border-t border-line">
        <Pressable
          onPress={onToggle}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={active ? "Watcher'ı duraklat" : "Watcher'ı sürdür"}
          className={`flex-1 min-h-[44px] justify-center items-center rounded-xl border ${
            busy ? "opacity-40 border-line" : "border-line"
          }`}
        >
          <Text className="text-text text-xs font-semibold uppercase tracking-wider">
            {active ? "❚❚ duraklat" : "▶ sürdür"}
          </Text>
        </Pressable>
        <Pressable
          onPress={onDelete}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Watcher'ı sil"
          className={`flex-1 min-h-[44px] justify-center items-center rounded-xl border border-neg ${
            busy ? "opacity-40" : ""
          }`}
        >
          <Text className="text-neg text-xs font-semibold uppercase tracking-wider">sil</Text>
        </Pressable>
      </View>
    </Card>
  );
}
