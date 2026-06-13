import { ActBtn, ConsoleShell, ErrText, Loading, day } from "@/features/admin/ui";
import { type BillingInterval, api } from "@/lib/api";
import { qk } from "@/lib/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Alert, FlatList, Text, View } from "react-native";

export default function UsersScreen(): ReactNode {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: qk.adminUsers, queryFn: api.adminUsers });
  const done = (): void => {
    void qc.invalidateQueries({ queryKey: qk.adminUsers });
  };
  const setAdmin = useMutation({
    mutationFn: (v: { id: string; on: boolean }) => api.setUserAdmin(v.id, v.on),
    onSuccess: done,
  });
  const gift = useMutation({
    mutationFn: (v: { id: string; i: BillingInterval }) => api.giftPro(v.id, v.i),
    onSuccess: done,
  });
  const cancelSub = useMutation({
    mutationFn: (id: string) => api.cancelUserSub(id),
    onSuccess: done,
  });
  const del = useMutation({ mutationFn: (id: string) => api.deleteUser(id), onSuccess: done });
  const busy = setAdmin.isPending || gift.isPending || cancelSub.isPending || del.isPending;

  return (
    <ConsoleShell title="Kullanıcılar" sub="hesap & yetki">
      {q.isLoading ? <Loading /> : null}
      {q.error ? <ErrText e={q.error} /> : null}
      {q.data ? (
        <FlatList
          data={q.data}
          keyExtractor={(u) => u.id}
          contentContainerClassName="px-5 pt-4 pb-8"
          onRefresh={() => void q.refetch()}
          refreshing={q.isRefetching}
          ItemSeparatorComponent={() => <View className="h-3" />}
          ListEmptyComponent={<Text className="text-muted mt-6">kullanıcı yok.</Text>}
          renderItem={({ item: u }) => (
            <View className="bg-panel border border-line rounded-xl p-4">
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-full bg-accent/10 items-center justify-center">
                  <Text className="text-accent text-sm font-bold">
                    {(u.email ?? "?").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text className="text-text text-sm flex-1" numberOfLines={1}>
                  {u.email ?? "(e-posta yok)"}
                </Text>
              </View>
              <Text className="text-muted text-xs mt-1">
                {u.plan.toUpperCase()} · {u.watchCount} watcher · {day(u.createdAt)}
                {u.isAdmin ? " · ADMIN" : ""}
              </Text>
              <View className="flex-row flex-wrap gap-2 mt-3">
                <ActBtn
                  label={u.isAdmin ? "admin'i al" : "admin yap"}
                  disabled={busy}
                  onPress={() => setAdmin.mutate({ id: u.id, on: !u.isAdmin })}
                />
                <ActBtn
                  label="pro (ay)"
                  disabled={busy}
                  onPress={() => gift.mutate({ id: u.id, i: "month" })}
                />
                <ActBtn
                  label="pro (yıl)"
                  disabled={busy}
                  onPress={() => gift.mutate({ id: u.id, i: "year" })}
                />
                <ActBtn
                  label="abone iptal"
                  disabled={busy}
                  onPress={() => cancelSub.mutate(u.id)}
                />
                <ActBtn
                  label="sil"
                  tone="danger"
                  disabled={busy}
                  onPress={() =>
                    Alert.alert("Hesabı sil", `${u.email ?? u.id} kalıcı silinsin mi?`, [
                      { text: "Vazgeç", style: "cancel" },
                      { text: "Sil", style: "destructive", onPress: () => del.mutate(u.id) },
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
