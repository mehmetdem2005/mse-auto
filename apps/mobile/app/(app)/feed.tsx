import { EnterItem } from "@/components/motion";
import { Badge, Card, EmptyState, Fab, FactChips } from "@/components/ui";
import { type FeedItem, type FeedbackVerdict, api } from "@/lib/api";
import { qk } from "@/lib/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { BellRing, Eye, Inbox, ThumbsDown, ThumbsUp } from "lucide-react-native";
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

/**
 * Watcher başına TEK kart (ADR-037): aynı watcher'ın tespitleri gruplanır —
 * en yenisi gösterilir, gerisi "×N" sayacına katlanır. Kalabalık biter.
 */
interface FeedGroup {
  watchId: string;
  watchIntent: string;
  latest: FeedItem;
  count: number;
  unreadIds: string[];
}

function groupFeed(list: FeedItem[]): FeedGroup[] {
  const groups = new Map<string, FeedGroup>();
  for (const it of list) {
    // liste en-yeniden-eskiye gelir → ilk görülen, grubun en yenisidir
    const g = groups.get(it.watchId);
    if (!g) {
      groups.set(it.watchId, {
        watchId: it.watchId,
        watchIntent: it.watchIntent,
        latest: it,
        count: 1,
        unreadIds: it.readAt ? [] : [it.deliveryId],
      });
    } else {
      g.count += 1;
      if (!it.readAt) g.unreadIds.push(it.deliveryId);
    }
  }
  return [...groups.values()];
}

export default function Feed() {
  const router = useRouter();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: qk.feed,
    queryFn: api.feed,
  });
  const watchers = useQuery({ queryKey: qk.watchers, queryFn: api.watchers });

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
  const markGroup = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => api.markFeedRead(id))),
    onMutate: (ids) => {
      const now = new Date().toISOString();
      const set = new Set(ids);
      patch((it) => (set.has(it.deliveryId) && !it.readAt ? { ...it, readAt: now } : it));
    },
  });
  const markAll = useMutation({
    mutationFn: () => api.markAllFeedRead(),
    onMutate: () => {
      const now = new Date().toISOString();
      patch((it) => (it.readAt ? it : { ...it, readAt: now }));
    },
  });

  function open(g: FeedGroup) {
    if (g.unreadIds.length > 0) markGroup.mutate(g.unreadIds);
    router.push(`/watcher/${g.watchId}`);
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
  const today = new Date().toDateString();
  const detectionsToday = list.filter(
    (it) => new Date(it.detectedAt).toDateString() === today,
  ).length;
  const allGroups = groupFeed(list);
  const groups = filter === "unread" ? allGroups.filter((g) => g.unreadIds.length > 0) : allGroups;

  return (
    <View className="flex-1 bg-ink">
      <FlatList
        data={groups}
        keyExtractor={(g) => g.watchId}
        contentContainerClassName="px-5 pt-3 pb-10"
        onRefresh={() => void refetch()}
        refreshing={isRefetching}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListHeaderComponent={
          list.length > 0 ? (
            <View>
              {/* Özet kartları (gerçek veriden) */}
              <View className="flex-row gap-2 mb-3">
                <MiniStat
                  Icon={Eye}
                  n={watchers.data?.length ?? 0}
                  label="watcher"
                  tint="#6366F1"
                />
                <MiniStat Icon={Inbox} n={detectionsToday} label="bugün tespit" tint="#16A34A" />
                <MiniStat Icon={BellRing} n={unread} label="okunmamış" tint="#D97706" />
              </View>
              {/* Filtre çipleri */}
              <View className="flex-row gap-2 mb-3" accessibilityRole="tablist">
                {(
                  [
                    ["all", "Tümü"],
                    ["unread", "Okunmamış"],
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
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            title="Henüz tespit yok"
            hint="Watcher'ların bir şey yakaladığında burada görünür."
          />
        }
        renderItem={({ item: g, index }) => (
          <EnterItem index={index}>
            <FeedCard
              group={g}
              onOpen={() => open(g)}
              onVote={() => markRead.mutate(g.latest.deliveryId)}
            />
          </EnterItem>
        )}
      />
      <Fab accessibilityLabel="Yeni watcher oluştur" onPress={() => router.push("/new")} />
    </View>
  );
}

function FeedCard({
  group,
  onOpen,
  onVote,
}: { group: FeedGroup; onOpen: () => void; onVote: () => void }) {
  const item = group.latest;
  const [voted, setVoted] = useState<FeedbackVerdict | null>(null);
  const isUnread = group.unreadIds.length > 0;
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
        {isUnread ? (
          <Badge tone="accent">
            {group.unreadIds.length > 1 ? `${group.unreadIds.length} yeni` : "yeni"}
          </Badge>
        ) : null}
        <Text className="text-muted text-[11px]">{ago(item.detectedAt)}</Text>
      </View>

      <Text className="text-text text-[15px] leading-5">
        {item.description || "Bir tespit oldu."}
      </Text>

      <FactChips raw={item.facts} />

      <View className="flex-row items-center mt-3 pt-3 border-t border-line">
        {voted ? (
          <Text className="text-muted text-xs">
            {voted === "correct" ? "Teşekkürler!" : "Not edildi, geliştireceğiz."}
          </Text>
        ) : (
          <>
            <Text className="text-muted text-xs mr-3">Doğru muydu?</Text>
            <Vote kind="up" label="Doğru" onPress={() => mutation.mutate("correct")} />
            <View className="w-2" />
            <Vote kind="down" label="Yanlış" onPress={() => mutation.mutate("incorrect")} />
          </>
        )}
        <View className="ml-auto">
          {group.count > 1 ? (
            <Badge tone="muted">{`toplam ${group.count} tespit`}</Badge>
          ) : (
            <Badge tone="muted">{item.status}</Badge>
          )}
        </View>
      </View>
    </Card>
  );
}

function Vote({
  kind,
  label,
  onPress,
}: { kind: "up" | "down"; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      // HIG dokunma hedefi ≥44pt; vektör ikon (emoji yasak)
      className="w-11 h-11 rounded-full bg-panel2 items-center justify-center active:opacity-60"
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {kind === "up" ? (
        <ThumbsUp size={18} color="#16A34A" />
      ) : (
        <ThumbsDown size={18} color="#475569" />
      )}
    </Pressable>
  );
}

function MiniStat({
  Icon,
  n,
  label,
  tint,
}: { Icon: typeof Eye; n: number; label: string; tint: string }) {
  return (
    <View className="flex-1 bg-panel border border-line rounded-xl px-3 py-2.5">
      <View className="flex-row items-center gap-1.5">
        <Icon size={13} color={tint} />
        <Text className="text-text text-base font-bold">{n}</Text>
      </View>
      <Text className="text-muted text-[10px] mt-0.5">{label}</Text>
    </View>
  );
}
