import { Badge, Card, EmptyState, FactChips } from "@/components/ui";
import { type FeedItem, type FeedbackVerdict, api } from "@/lib/api";
import { qk } from "@/lib/query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";

const ACCENT = "#6366F1";

/** Göreli zaman: "az önce", "3 sa önce", tam tarih. */
function ago(iso: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "az önce";
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} gün önce`;
  return new Date(iso).toLocaleDateString("tr-TR");
}

export default function Feed() {
  const router = useRouter();
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: qk.feed,
    queryFn: api.feed,
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-ink justify-center">
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }
  if (error) {
    return (
      <View className="flex-1 bg-ink px-5 pt-6">
        <Text className="text-neg">{error instanceof Error ? error.message : "yüklenemedi"}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-ink">
      <FlatList
        data={data ?? []}
        keyExtractor={(it) => it.deliveryId}
        contentContainerClassName="px-5 pt-3 pb-10"
        onRefresh={() => void refetch()}
        refreshing={isRefetching}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={
          <EmptyState
            title="Henüz tespit yok"
            hint="Watcher'ların bir şey yakaladığında burada görünür."
          />
        }
        renderItem={({ item }) => (
          <FeedCard item={item} onOpen={() => router.push(`/watcher/${item.watchId}`)} />
        )}
      />
    </View>
  );
}

function FeedCard({ item, onOpen }: { item: FeedItem; onOpen: () => void }) {
  const [voted, setVoted] = useState<FeedbackVerdict | null>(null);
  const mutation = useMutation({
    mutationFn: (verdict: FeedbackVerdict) => api.feedback(item.eventId, verdict),
    onMutate: (verdict) => setVoted(verdict),
    onError: () => setVoted(null),
  });

  return (
    <Card accent onPress={onOpen}>
      <View className="flex-row items-center gap-2 mb-1.5">
        <View className="w-2 h-2 rounded-full bg-pos" />
        <Text className="text-text text-[13px] font-semibold flex-1" numberOfLines={1}>
          {item.watchIntent || "Watcher"}
        </Text>
        <Text className="text-muted text-[11px]">{ago(item.detectedAt)}</Text>
      </View>

      <Text className="text-text text-[15px] leading-5">
        {item.description || "Bir tespit oldu."}
      </Text>

      <FactChips raw={item.facts} />

      <View className="flex-row items-center mt-3 pt-3 border-t border-line">
        {voted ? (
          <Text className="text-muted text-xs">
            {voted === "correct" ? "👍 Teşekkürler!" : "👎 Not edildi, geliştireceğiz."}
          </Text>
        ) : (
          <>
            <Text className="text-muted text-xs mr-3">Doğru muydu?</Text>
            <Vote glyph="👍" onPress={() => mutation.mutate("correct")} />
            <View className="w-2" />
            <Vote glyph="👎" onPress={() => mutation.mutate("incorrect")} />
          </>
        )}
        <View className="ml-auto">
          <Badge tone="muted">{item.status}</Badge>
        </View>
      </View>
    </Card>
  );
}

function Vote({ glyph, onPress }: { glyph: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      className="w-9 h-9 rounded-full bg-panel2 items-center justify-center active:opacity-60"
      accessibilityRole="button"
    >
      <Text className="text-base">{glyph}</Text>
    </Pressable>
  );
}
