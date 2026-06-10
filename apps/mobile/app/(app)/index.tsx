import { Badge, Card, EmptyState, Fab } from "@/components/ui";
import { type Watch, api } from "@/lib/api";
import { qk } from "@/lib/query";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Text, View } from "react-native";

function labelFreq(m: number): string {
  if (m >= 1440) return `günde ${Math.round(m / 1440) === 1 ? "bir" : m / 1440} kez`;
  if (m >= 60) return `her ${m / 60} saatte`;
  return `her ${m} dk`;
}

export default function Watchers() {
  const router = useRouter();
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: qk.watchers,
    queryFn: api.watchers,
  });

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
            <WatchRow item={item} onPress={() => router.push(`/watcher/${item.id}`)} />
          )}
        />
      )}
      <Fab accessibilityLabel="Yeni watcher oluştur" onPress={() => router.push("/new")} />
    </View>
  );
}

function WatchRow({ item, onPress }: { item: Watch; onPress: () => void }) {
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
    </Card>
  );
}
