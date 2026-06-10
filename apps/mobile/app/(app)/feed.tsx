import { EnterItem } from "@/components/motion";
import { Badge, Card, EmptyState, Fab, FactChips } from "@/components/ui";
import { type FeedItem, type FeedbackVerdict, api } from "@/lib/api";
import { categoryOf, severityOf } from "@/lib/category";
import { qk } from "@/lib/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  BellRing,
  Eye,
  type LucideIcon,
  Radar,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";

const ACCENT = "#6366F1";

type Filter = "all" | "detection" | "warning" | "unread";
const FILTER_IDS: Filter[] = ["all", "detection", "warning", "unread"];
const FILTER_KEYS: Record<Filter, string> = {
  all: "feed.filterAll",
  detection: "feed.filterDetections",
  warning: "feed.filterWarnings",
  unread: "feed.filterUnread",
};

/** Göreli zaman — aktif dilde (i18n). */
function useAgo(): (iso: string) => string {
  const { t, i18n } = useTranslation();
  return (iso: string) => {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return t("common.justNow");
    if (m < 60) return t("common.minAgo", { n: m });
    const h = Math.floor(m / 60);
    if (h < 24) return t("common.hourAgo", { n: h });
    const d = Math.floor(h / 24);
    if (d < 7) return t("common.dayAgo", { n: d });
    return new Date(iso).toLocaleDateString(i18n.language);
  };
}

/** Watcher başına TEK kart (ADR-037): tespitleri gruplanır, en yenisi gösterilir. */
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
  const { t } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: qk.feed,
    queryFn: api.feed,
  });
  const watchers = useQuery({ queryKey: qk.watchers, queryFn: api.watchers });
  const stats = useQuery({ queryKey: ["meStats"], queryFn: api.meStats });

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
  const groups = allGroups.filter((g) => {
    if (filter === "unread") return g.unreadIds.length > 0;
    if (filter === "warning") return severityOf(g.watchIntent).kind === "warning";
    if (filter === "detection") return severityOf(g.watchIntent).kind === "detection";
    return true;
  });

  return (
    <View className="flex-1 bg-ink">
      <FlatList
        data={groups}
        keyExtractor={(g) => g.watchId}
        contentContainerClassName="px-5 pt-4 pb-10"
        onRefresh={() => void refetch()}
        refreshing={isRefetching}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListHeaderComponent={
          <View>
            {/* Başlık bloğu (maket) */}
            <View className="flex-row items-center gap-2 mb-1">
              <Text className="text-text text-2xl font-extrabold">{t("feed.title")}</Text>
              <Sparkles size={18} color={ACCENT} />
            </View>
            <Text className="text-muted text-[13px] mb-4">{t("feed.subtitle")}</Text>

            {/* 4 özet kartı — 2x2 (gerçek veriden) */}
            <View className="flex-row gap-2.5 mb-2.5">
              <StatCard
                Icon={Eye}
                n={watchers.data?.length ?? 0}
                label={t("feed.statWatchers")}
                tint="#6366F1"
              />
              <StatCard
                Icon={Sparkles}
                n={detectionsToday}
                label={t("feed.statToday")}
                tint="#16A34A"
              />
            </View>
            <View className="flex-row gap-2.5 mb-4">
              <StatCard
                Icon={Radar}
                n={stats.data?.checks24h ?? 0}
                label={t("feed.statScans")}
                tint="#7C3AED"
              />
              <StatCard
                Icon={BellRing}
                n={list.length}
                label={t("feed.statNotifs")}
                tint="#D97706"
              />
            </View>

            {/* Segment filtre (maket) */}
            <View className="flex-row gap-2 mb-3" accessibilityRole="tablist">
              {FILTER_IDS.map((id) => {
                const on = filter === id;
                return (
                  <Pressable
                    key={id}
                    onPress={() => setFilter(id)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={t(FILTER_KEYS[id])}
                    className={`rounded-full px-3.5 py-2 min-h-[36px] justify-center ${
                      on ? "bg-accent" : "bg-panel border border-line"
                    }`}
                  >
                    <Text
                      className="text-[12px] font-semibold"
                      style={{ color: on ? "#FFFFFF" : "#475569" }}
                    >
                      {t(FILTER_KEYS[id])}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {unread > 0 ? (
              <View className="flex-row items-center mb-3">
                <Text className="text-muted text-[11px] uppercase tracking-widest">
                  {t("feed.newCount", { n: unread })}
                </Text>
                <Pressable
                  onPress={() => markAll.mutate()}
                  className="ml-auto min-h-[44px] justify-center px-2 active:opacity-60"
                  accessibilityRole="button"
                  accessibilityLabel={t("feed.markAllA11y")}
                >
                  <Text className="text-accent text-xs font-semibold">{t("feed.markAll")}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title={filter === "all" ? t("feed.emptyTitle") : t("feed.emptyFilterTitle")}
            hint={filter === "all" ? t("feed.emptyHint") : t("feed.emptyFilterHint")}
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
      <Fab accessibilityLabel={t("watchers.newFab")} onPress={() => router.push("/new")} />
    </View>
  );
}

function FeedCard({
  group,
  onOpen,
  onVote,
}: { group: FeedGroup; onOpen: () => void; onVote: () => void }) {
  const { t } = useTranslation();
  const ago = useAgo();
  const item = group.latest;
  const [voted, setVoted] = useState<FeedbackVerdict | null>(null);
  const isUnread = group.unreadIds.length > 0;
  const sev = severityOf(item.watchIntent);
  const mutation = useMutation({
    mutationFn: (verdict: FeedbackVerdict) => api.feedback(item.eventId, verdict),
    onMutate: (verdict) => {
      setVoted(verdict);
      onVote();
    },
    onError: () => setVoted(null),
  });

  return (
    <Card accent={isUnread} onPress={onOpen}>
      {/* Üst satır: avatar + watcher adı + severity rozeti + zaman */}
      <View className="flex-row items-center gap-2.5">
        <FeedAvatar intent={item.watchIntent} unread={isUnread} />
        <View className="flex-1">
          <Text
            className={`text-[14px] ${isUnread ? "text-text font-bold" : "text-text font-semibold"}`}
            numberOfLines={1}
          >
            {item.watchIntent || "Watcher"}
          </Text>
          <Text className="text-muted text-[11px] mt-0.5">{ago(item.detectedAt)}</Text>
        </View>
        <Badge tone={sev.tone}>
          {t(sev.kind === "warning" ? "feed.warning" : "feed.detection")}
        </Badge>
      </View>

      {/* Tespit açıklaması */}
      <Text className="text-text text-[15px] leading-5 mt-2.5">
        {item.description || t("feed.fallback")}
      </Text>

      <FactChips raw={item.facts} />

      {/* Alt satır: geri bildirim + grup sayacı */}
      <View className="flex-row items-center mt-3 pt-3 border-t border-line">
        {voted ? (
          <Text className="text-muted text-xs">
            {voted === "correct" ? t("feed.thanks") : t("feed.noted")}
          </Text>
        ) : (
          <>
            <Text className="text-muted text-xs mr-3">{t("feed.wasCorrect")}</Text>
            <Vote kind="up" label={t("feed.correct")} onPress={() => mutation.mutate("correct")} />
            <View className="w-2" />
            <Vote
              kind="down"
              label={t("feed.wrong")}
              onPress={() => mutation.mutate("incorrect")}
            />
          </>
        )}
        <View className="ml-auto">
          {group.count > 1 ? (
            <Badge tone="muted">{t("feed.groupCount", { n: group.count })}</Badge>
          ) : isUnread ? (
            <Badge tone="accent">{t("common.new")}</Badge>
          ) : null}
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

/** Maket stat kartı: renkli ikon dairesi + büyük sayı + etiket. */
function StatCard({
  Icon,
  n,
  label,
  tint,
}: { Icon: LucideIcon; n: number; label: string; tint: string }) {
  return (
    <View
      className="flex-1 bg-panel border border-line rounded-2xl p-3.5"
      style={{
        shadowColor: "#0F172A",
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      }}
    >
      <View
        className="w-8 h-8 rounded-full items-center justify-center mb-2"
        style={{ backgroundColor: `${tint}1A` }}
      >
        <Icon size={16} color={tint} />
      </View>
      <Text className="text-text text-2xl font-extrabold">{n}</Text>
      <Text className="text-muted text-[11px] mt-0.5">{label}</Text>
    </View>
  );
}

function FeedAvatar({ intent, unread }: { intent: string; unread: boolean }) {
  const cat = categoryOf(intent);
  return (
    <View className={`w-10 h-10 rounded-xl ${cat.bg} items-center justify-center`}>
      <cat.Icon size={18} color={cat.tint} />
      {unread ? (
        <View className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent border border-white" />
      ) : null}
    </View>
  );
}
