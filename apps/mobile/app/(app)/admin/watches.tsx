import { ActBtn, ConsoleShell, ErrText, Loading } from "@/features/admin/ui";
import { type AdminWatch, api } from "@/lib/api";
import { qk } from "@/lib/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Alert, FlatList, Text, View } from "react-native";

export default function WatchesScreen(): ReactNode {
  const qc = useQueryClient();
  const router = useRouter();
  const q = useQuery({ queryKey: qk.adminWatches, queryFn: api.adminWatches });
  const done = (): void => {
    void qc.invalidateQueries({ queryKey: qk.adminWatches });
  };
  const setStatus = useMutation({
    mutationFn: (v: { id: string; s: "active" | "paused" }) => api.setWatchStatus(v.id, v.s),
    onSuccess: done,
  });
  const del = useMutation({ mutationFn: (id: string) => api.deleteWatch(id), onSuccess: done });
  const busy = setStatus.isPending || del.isPending;

  return (
    <ConsoleShell title="Watcher'lar" sub="tüm izlemeler">
      {q.isLoading ? <Loading /> : null}
      {q.error ? <ErrText e={q.error} /> : null}
      {q.data ? (
        <FlatList
          data={q.data}
          keyExtractor={(w) => w.id}
          contentContainerClassName="px-5 pt-4 pb-8"
          onRefresh={() => void q.refetch()}
          refreshing={q.isRefetching}
          ItemSeparatorComponent={() => <View className="h-3" />}
          ListEmptyComponent={<Text className="text-muted mt-6">watcher yok.</Text>}
          renderItem={({ item: w }: { item: AdminWatch }) => (
            <View className="bg-panel border border-line rounded-xl p-4">
              <Text className="text-text text-sm" numberOfLines={2}>
                {w.rawIntent}
              </Text>
              <Text className="text-muted text-xs mt-1" numberOfLines={1}>
                {w.userEmail ?? w.userId} · her {w.frequencyMinutes} dk ·{" "}
                {w.status === "active" ? "aktif" : "duraklatıldı"}
              </Text>
              <View className="flex-row flex-wrap gap-2 mt-3">
                <ActBtn
                  label="araştırma"
                  tone="solid"
                  onPress={() => router.push(`/watcher/${w.id}?admin=1`)}
                />
                <ActBtn
                  label={w.status === "active" ? "duraklat" : "aktifleştir"}
                  disabled={busy}
                  onPress={() =>
                    setStatus.mutate({ id: w.id, s: w.status === "active" ? "paused" : "active" })
                  }
                />
                <ActBtn
                  label="sil"
                  tone="danger"
                  disabled={busy}
                  onPress={() =>
                    Alert.alert("Watcher sil", "Bu watcher silinsin mi?", [
                      { text: "Vazgeç", style: "cancel" },
                      { text: "Sil", style: "destructive", onPress: () => del.mutate(w.id) },
                    ])
                  }
                />
              </View>
            </View>
          )}
        />
      ) : null}
    </ConsoleShell>
  );
}
