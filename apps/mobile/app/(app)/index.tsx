import { type Watch, api } from "@/lib/api";
import { qk } from "@/lib/query";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";

export default function Watchers() {
  const router = useRouter();
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: qk.watchers,
    queryFn: api.watchers,
  });

  return (
    <View className="flex-1 bg-ink px-5 pt-4">
      {isLoading ? (
        <ActivityIndicator color="#ffb020" className="mt-10" />
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
            <Text className="text-muted mt-6">Henüz watcher yok. "Yeni" sekmesinden ekle.</Text>
          }
          renderItem={({ item }) => (
            <WatchRow item={item} onPress={() => router.push(`/watcher/${item.id}`)} />
          )}
        />
      )}
    </View>
  );
}

function WatchRow({ item, onPress }: { item: Watch; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-panel border border-line rounded-xl p-4 active:opacity-70"
    >
      <Text className="text-text text-base" numberOfLines={2}>
        {item.rawIntent}
      </Text>
      <View className="flex-row items-center gap-3 mt-2">
        <Text className="text-muted text-xs">her {item.frequencyMinutes} dk</Text>
        <Text
          className="text-xs"
          style={{ color: item.status === "active" ? "#46c99a" : "#828c9a" }}
        >
          ● {item.status === "active" ? "aktif" : "duraklatıldı"}
        </Text>
        <Text className="text-muted text-xs">
          {item.archetype === "shared" ? "paylaşılan" : "kişisel"}
        </Text>
        <Text className="text-muted text-xs ml-auto">araştırma ›</Text>
      </View>
    </Pressable>
  );
}
