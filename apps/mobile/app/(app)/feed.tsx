import { MiniBars } from "@/components/charts";
import { EnterItem, PressScale } from "@/components/motion";
import {
  Badge,
  Card,
  EmptyState,
  Fab,
  FactChips,
  GradientHero,
  HeroOverlap,
  SkeletonCard,
  Vote,
} from "@/components/ui";
import { type FeedItem, type FeedbackVerdict, api } from "@/lib/api";
import { categoryOf, severityOf } from "@/lib/category";
import { haptic } from "@/lib/haptics";
import { qk } from "@/lib/query";
import { useAgo } from "@/lib/time";
import { useTheme } from "@/theme";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  BellRing,
  Eye,
  type LucideIcon,
  Radar,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";

type Filter = "all" | "detection" | "warning" | "unread";
const FILTER_IDS: Filter[] = ["all", "detection", "warning", "unread"];
const FILTER_KEYS: Record<Filter, string> = {
  all: "feed.filterAll",
  detection: "feed.filterDetections",
  warning: "feed.filterWarnings",
  unread: "feed.filterUnread",
};

/** Son 7 günün günlük tespit sayıları + kısa gün etiketleri (cihaz diline göre). */
function last7Days(list: FeedItem[], lang: string): { counts: number[]; labels: string[] } {
  const counts = new Array(7).fill(0);
  const labels: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayKeys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dayKeys.push(d.toDateString());
    labels.push(d.toLocaleDateString(lang, { weekday: "narrow" }));
  }
  for (const it of list) {
    const key = new Date(it.detectedAt).toDateString();
    const idx = dayKeys.indexOf(key);
    if (idx >= 0) counts[idx] += 1;
  }
  return { counts, labels };
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
  const { t, i18n } = useTranslation();
  const theme = useTheme();
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
      <View className="flex-1 bg-ink">
        <GradientHero title={t("feed.title")} subtitle={t("feed.subtitle")} />
        <HeroOverlap>
          <View className="px-5 pt-5">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        </HeroOverlap>
      </View>
    );
  }
  if (error) {
    return (
      <View className="flex-1 bg-ink">
        <GradientHero title={t("feed.title")} subtitle={t("feed.subtitle")} />
        <HeroOverlap>
          <Text className="text-neg px-5 pt-6">
            {error instanceof Error ? error.message : t("common.loadError")}
          </Text>
        </HeroOverlap>
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
      <GradientHero title={t("feed.title")} subtitle={t("feed.subtitle")} />
      <HeroOverlap>
        <FlatList
          data={groups}
          keyExtractor={(g) => g.watchId}
          contentContainerClassName="px-5 pt-5 pb-10"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={theme.colors.accent}
              colors={[...theme.gradient.brand]}
            />
          }
          ItemSeparatorComponent={() => <View className="h-3" />}
          ListHeaderComponent={
            <View>
              {/* 4 özet kartı — 2x2 (gerçek veriden) */}
              <View className="flex-row gap-2.5 mb-2.5">
                <StatCard
                  Icon={Eye}
                  n={watchers.data?.length ?? 0}
                  label={t("feed.statWatchers")}
                  tint={theme.colors.accent}
                />
                <StatCard
                  Icon={Sparkles}
                  n={detectionsToday}
                  label={t("feed.statToday")}
                  tint={theme.colors.pos}
                />
              </View>
              <View className="flex-row gap-2.5 mb-4">
                <StatCard
                  Icon={Radar}
                  n={stats.data?.checks24h ?? 0}
                  label={t("feed.statScans")}
                  tint={theme.colors.accent2}
                />
                <StatCard
                  Icon={BellRing}
                  n={list.length}
                  label={t("feed.statNotifs")}
                  tint={theme.colors.warn}
                />
              </View>

              {/* Son 7 gün aktivite grafiği (gerçek tespit verisinden) */}
              {list.length > 0 ? (
                <View className="bg-panel border border-line rounded-2xl p-4 mb-4">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-text text-[13px] font-semibold">
                      {t("feed.activity")}
                    </Text>
                    <Text className="text-muted text-[10px] uppercase tracking-wider">
                      {t("feed.last7days")}
                    </Text>
                  </View>
                  {(() => {
                    const { counts, labels } = last7Days(list, i18n.language);
                    return (
                      <MiniBars
                        data={counts}
                        labels={labels}
                        a11yLabel={t("feed.activityA11y", {
                          total: counts.reduce((a, b) => a + b, 0),
                        })}
                      />
                    );
                  })()}
                </View>
              ) : null}

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
                      className={`rounded-full px-3.5 py-2 min-h-11 justify-center ${
                        on ? "bg-accent" : "bg-panel border border-line"
                      }`}
                    >
                      <Text
                        className="text-[12px] font-semibold"
                        style={{ color: on ? theme.colors.onAccent : theme.colors.muted }}
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
                  <PressScale
                    onPress={() => {
                      haptic.light();
                      markAll.mutate();
                    }}
                    className="ml-auto min-h-[44px] justify-center px-2"
                    accessibilityRole="button"
                    accessibilityLabel={t("feed.markAllA11y")}
                  >
                    <Text className="text-accent text-xs font-semibold">{t("feed.markAll")}</Text>
                  </PressScale>
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
      </HeroOverlap>
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
  const { colors } = useTheme();
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

      {/* "Neden bu bildirim" (ADR-086): güven sinyali — şeffaflık */}
      {typeof item.confidence === "number" ? (
        <View className="flex-row items-center gap-1.5 mt-2" accessibilityRole="text">
          <ShieldCheck size={13} color={colors.pos} />
          <Text className="text-muted text-[11px] flex-1" numberOfLines={1}>
            {t("feed.why", { n: Math.round(item.confidence * 100) })}
          </Text>
        </View>
      ) : null}

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
      <Text className="text-text text-2xl font-extrabold" numberOfLines={1}>
        {n}
      </Text>
      <Text className="text-muted text-[11px] mt-0.5" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function FeedAvatar({ intent, unread }: { intent: string; unread: boolean }) {
  const cat = categoryOf(intent);
  return (
    <View className={`w-10 h-10 rounded-xl ${cat.bg} items-center justify-center`}>
      <cat.Icon size={18} color={cat.tint} />
      {unread ? (
        <View className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent border border-panel" />
      ) : null}
    </View>
  );
}
