import { Badge, Card, EmptyState, Fab, FactChips } from "@/components/ui";
import { type FeedItem, type FeedbackVerdict, api } from "@/lib/api";
import { qk } from "@/lib/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  const qc = useQueryClient();
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: qk.feed,
    queryFn: api.feed,
  });

  /** Cache'i optimistik yamala (okundu damgala) — refetch beklemeden. */
  function patch(fn: (it: FeedItem) => FeedItem) {
    qc.setQueryData<FeedItem[]>(qk.feed, (old) => (old ? old.map(fn) : old));
  }

  const markRead = useMutation({
    mutationFn: (deliveryId: string) => api.markFeedRead(deliveryId),
    onMutate: (deliveryId) => {
      const now = new Date().toISOString();
      patch((it) => (it.deliveryId === deliveryId && !it.readAt ? { ...it, readAt: now } : it));
    },
  });
  const markAll = useMutation({
    mutationFn: () => api.markAllFeedRead(),
    onMutate: () => {
      const now = new Date().toISOString();
      patch((it) => (it.readAt ? it : { ...it, readAt: now }));
    },
  });

  function open(item: FeedItem) {
    if (!item.readAt) markRead.mutate(item.deliveryId);
    router.push(`/watcher/${item.watchId}`);
  }

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

  const list = data ?? [];
  const unread = list.filter((it) => !it.readAt).length;

  return (
    <View className="flex-1 bg-ink">
      <FlatList
        data={list}
        keyExtractor={(it) => it.deliveryId}
        contentContainerClassName="px-5 pt-3 pb-10"
        onRefresh={() => void refetch()}
        refreshing={isRefetching}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListHeaderComponent={
          list.length > 0 ? (
            <View className="flex-row items-center mb-3">
              <Text className="text-muted text-[11px] uppercase tracking-widest">
                {unread > 0 ? `${unread} yeni tespit` : "tümü okundu"}
              </Text>
              {unread > 0 ? (
                <Pressable
                  onPress={() => markAll.mutate()}
                  className="ml-auto min-h-[44px] justify-center px-2 active:opacity-60"
                  accessibilityRole="button"
                  accessibilityLabel="Tüm tespitleri okundu yap"
                >
                  <Text className="text-accent text-xs font-semibold">tümünü okundu yap</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            title="Henüz tespit yok"
            hint="Watcher'ların bir şey yakaladığında burada görünür."
          />
        }
        renderItem={({ item }) => (
          <FeedCard
            item={item}
            onOpen={() => open(item)}
            onVote={() => markRead.mutate(item.deliveryId)}
          />
        )}
      />
      <Fab accessibilityLabel="Yeni watcher oluştur" onPress={() => router.push("/new")} />
    </View>
  );
}

function FeedCard({
  item,
  onOpen,
  onVote,
}: { item: FeedItem; onOpen: () => void; onVote: () => void }) {
  const [voted, setVoted] = useState<FeedbackVerdict | null>(null);
  const isUnread = !item.readAt;
  const mutation = useMutation({
    mutationFn: (verdict: FeedbackVerdict) => api.feedback(item.eventId, verdict),
    onMutate: (verdict) => {
      setVoted(verdict);
      onVote(); // geri bildirim = görüldü
    },
    onError: () => setVoted(null),
  });

  return (
    <Card accent={isUnread} onPress={onOpen}>
      <View className="flex-row items-center gap-2 mb-1.5">
        <View className={`w-2 h-2 rounded-full ${isUnread ? "bg-accent" : "bg-line"}`} />
        <Text
          className={`text-[13px] flex-1 ${isUnread ? "text-text font-bold" : "text-muted font-medium"}`}
          numberOfLines={1}
        >
          {item.watchIntent || "Watcher"}
        </Text>
        {isUnread ? <Badge tone="accent">yeni</Badge> : null}
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
            <Vote glyph="👍" label="Doğru" onPress={() => mutation.mutate("correct")} />
            <View className="w-2" />
            <Vote glyph="👎" label="Yanlış" onPress={() => mutation.mutate("incorrect")} />
          </>
        )}
        <View className="ml-auto">
          <Badge tone="muted">{item.status}</Badge>
        </View>
      </View>
    </Card>
  );
}

function Vote({ glyph, label, onPress }: { glyph: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      // HIG dokunma hedefi ≥44pt
      className="w-11 h-11 rounded-full bg-panel2 items-center justify-center active:opacity-60"
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text className="text-base" accessibilityElementsHidden importantForAccessibility="no">
        {glyph}
      </Text>
    </Pressable>
  );
}
