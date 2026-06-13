import { ConsoleShell, ErrText, Loading, day } from "@/features/admin/ui";
import { api } from "@/lib/api";
import { qk } from "@/lib/query";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronRight, Search } from "lucide-react-native";
import { type ReactNode, useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";

// ADR-101: arama + tek-dokunuş drill-down. Aksiyonlar kullanıcı DETAY ekranında.
export default function UsersScreen(): ReactNode {
  const router = useRouter();
  const [q, setQ] = useState("");
  const list = useQuery({ queryKey: qk.adminUsers, queryFn: api.adminUsers });

  const filtered = useMemo(() => {
    const rows = list.data ?? [];
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (u) => (u.email ?? "").toLowerCase().includes(needle) || u.id.includes(needle),
    );
  }, [list.data, q]);

  return (
    <ConsoleShell title="Kullanıcılar" sub={list.data ? `${list.data.length} kayıt` : undefined}>
      {list.isLoading ? <Loading /> : null}
      {list.error ? <ErrText e={list.error} /> : null}
      {list.data ? (
        <FlatList
          data={filtered}
          keyExtractor={(u) => u.id}
          contentContainerClassName="px-5 pt-3 pb-8"
          keyboardShouldPersistTaps="handled"
          onRefresh={() => void list.refetch()}
          refreshing={list.isRefetching}
          ItemSeparatorComponent={() => <View className="h-2.5" />}
          ListHeaderComponent={
            <View className="flex-row items-center gap-2 bg-panel border border-line rounded-xl px-3 mb-3">
              <Search size={16} color="#94A3B8" />
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="E-posta ara…"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Kullanıcı ara"
                className="flex-1 py-3 text-text text-sm"
              />
            </View>
          }
          ListEmptyComponent={
            <Text className="text-muted mt-6">{q ? "eşleşme yok." : "kullanıcı yok."}</Text>
          }
          renderItem={({ item: u }) => (
            <Pressable
              onPress={() => router.push(`/admin/user/${u.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`${u.email ?? u.id} detayı`}
              className="bg-panel border border-line rounded-xl p-4 active:bg-panel2"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-full bg-accent/10 items-center justify-center">
                  <Text className="text-accent text-sm font-bold">
                    {(u.email ?? "?").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-text text-sm" numberOfLines={1}>
                    {u.email ?? "(e-posta yok)"}
                  </Text>
                  <Text className="text-muted text-xs mt-0.5">
                    {u.plan.toUpperCase()} · {u.watchCount} watcher · {day(u.createdAt)}
                    {u.isAdmin ? " · ADMIN" : ""}
                  </Text>
                </View>
                <ChevronRight size={16} color="#94A3B8" />
              </View>
            </Pressable>
          )}
        />
      ) : null}
    </ConsoleShell>
  );
}
