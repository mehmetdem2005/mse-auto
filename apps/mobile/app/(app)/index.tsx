import { EnterItem } from "@/components/motion";
import { Badge, Card, EmptyState, Fab, GradientHero, HeroOverlap } from "@/components/ui";
import { type Watch, api } from "@/lib/api";
import { categoryOf } from "@/lib/category";
import { qk } from "@/lib/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  ChevronRight,
  Globe,
  MoreVertical,
  Pause,
  Play,
  Search,
  Trash2,
} from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, Text, View } from "react-native";

function useLabelFreq(): (m: number) => string {
  const { t } = useTranslation();
  return (m: number) => {
    if (m >= 1440) return t("watchers.perDay");
    if (m >= 60) return t("watchers.perHours", { n: m / 60 });
    return t("watchers.perMin", { n: m });
  };
}

export default function Watchers() {
  const { t } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "active" | "paused">("all");
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: qk.watchers,
    queryFn: api.watchers,
  });
  const feed = useQuery({ queryKey: qk.feed, queryFn: api.feed });
  const unreadWatchIds = new Set((feed.data ?? []).filter((f) => !f.readAt).map((f) => f.watchId));

  const invalidate = (): void => {
    void qc.invalidateQueries({ queryKey: qk.watchers });
    void qc.invalidateQueries({ queryKey: qk.subscription });
  };
  const setStatus = useMutation({
    mutationFn: (v: { id: string; status: "active" | "paused" }) =>
      api.setMyWatchStatus(v.id, v.status),
    onSuccess: invalidate,
    onError: (e) =>
      Alert.alert(t("watchers.fail"), e instanceof Error ? e.message : t("common.loadError")),
  });
  const del = useMutation({
    mutationFn: (id: string) => api.deleteMyWatch(id),
    onSuccess: invalidate,
    onError: (e) =>
      Alert.alert(t("watchers.fail"), e instanceof Error ? e.message : t("common.loadError")),
  });

  function confirmDelete(w: Watch) {
    Alert.alert(t("watchers.deleteTitle"), t("watchers.deleteMsg", { intent: w.rawIntent }), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.delete"), style: "destructive", onPress: () => del.mutate(w.id) },
    ]);
  }

  const activeCount = (data ?? []).filter((w) => w.status === "active").length;
  return (
    <View className="flex-1 bg-ink">
      <GradientHero
        title={t("tabs.watchers")}
        subtitle={t("watchers.footer", { n: activeCount })}
      />
      <HeroOverlap>
        {isLoading ? (
          <ActivityIndicator color="#6366F1" className="mt-10" />
        ) : error ? (
          <Text className="text-neg mt-6 px-5">
            {error instanceof Error ? error.message : t("common.loadError")}
          </Text>
        ) : (
          <FlatList
            data={(data ?? []).filter((w) => filter === "all" || w.status === filter)}
            keyExtractor={(w) => w.id}
            contentContainerClassName="px-5 pb-10"
            ListHeaderComponent={
              (data ?? []).length > 0 ? (
                <View className="flex-row gap-2 mb-3" accessibilityRole="tablist">
                  {(
                    [
                      ["all", t("watchers.filterAll")],
                      ["active", t("watchers.filterActive")],
                      ["paused", t("watchers.filterPaused")],
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
              ) : null
            }
            onRefresh={() => void refetch()}
            refreshing={isRefetching}
            ItemSeparatorComponent={() => <View className="h-3" />}
            ListEmptyComponent={
              <EmptyState title={t("watchers.emptyTitle")} hint={t("watchers.emptyHint")} />
            }
            renderItem={({ item, index }) => (
              <EnterItem index={index}>
                <WatchRow
                  item={item}
                  hasAlert={unreadWatchIds.has(item.id)}
                  busy={setStatus.isPending || del.isPending}
                  onPress={() => router.push(`/watcher/${item.id}`)}
                  onToggle={() =>
                    setStatus.mutate({
                      id: item.id,
                      status: item.status === "active" ? "paused" : "active",
                    })
                  }
                  onDelete={() => confirmDelete(item)}
                />
              </EnterItem>
            )}
          />
        )}
      </HeroOverlap>
      <Fab accessibilityLabel={t("watchers.newFab")} onPress={() => router.push("/new")} />
    </View>
  );
}

function WatchRow({
  item,
  hasAlert,
  busy,
  onPress,
  onToggle,
  onDelete,
}: {
  item: Watch;
  hasAlert: boolean;
  busy: boolean;
  onPress: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const labelFreq = useLabelFreq();
  const [menu, setMenu] = useState(false);
  const active = item.status === "active";
  const cat = categoryOf(item.rawIntent);
  return (
    <Card onPress={onPress}>
      <View className="flex-row gap-3 items-start">
        <View className={`w-10 h-10 rounded-xl ${cat.bg} items-center justify-center`}>
          <cat.Icon size={18} color={cat.tint} />
        </View>
        <Text className="text-text text-base font-medium leading-5 flex-1" numberOfLines={2}>
          {item.rawIntent}
        </Text>
        {/* Kebab menü (maket) */}
        <Pressable
          onPress={() => setMenu(true)}
          accessibilityRole="button"
          accessibilityLabel={t("watchers.menuA11y")}
          className="w-11 h-11 -mr-2 -mt-1 items-center justify-center rounded-full active:bg-panel2"
        >
          <MoreVertical size={18} color="#475569" />
        </Pressable>
      </View>
      <Modal transparent visible={menu} animationType="fade" onRequestClose={() => setMenu(false)}>
        <Pressable
          className="flex-1 bg-black/30 justify-center px-10"
          onPress={() => setMenu(false)}
          accessibilityLabel={t("common.close")}
        >
          <View className="bg-panel rounded-2xl overflow-hidden">
            <MenuItem
              Icon={Search}
              label={t("watchers.menuOpen")}
              onPress={() => {
                setMenu(false);
                onPress();
              }}
            />
            <MenuItem
              Icon={active ? Pause : Play}
              label={active ? t("watchers.pause") : t("watchers.resume")}
              disabled={busy}
              onPress={() => {
                setMenu(false);
                onToggle();
              }}
            />
            <MenuItem
              Icon={Trash2}
              label={t("common.delete")}
              tone="danger"
              disabled={busy}
              onPress={() => {
                setMenu(false);
                onDelete();
              }}
            />
          </View>
        </Pressable>
      </Modal>
      <View className="flex-row items-center gap-2 mt-3">
        <Badge tone={active ? "pos" : "muted"}>
          {active ? t("common.active") : t("common.paused")}
        </Badge>
        {hasAlert ? <Badge tone="neg">{t("watchers.alert")}</Badge> : null}
        <Badge tone="accent">
          {item.archetype === "shared" ? t("watchers.shared") : t("watchers.personal")}
        </Badge>
        <Text className="text-muted text-xs">{labelFreq(item.frequencyMinutes)}</Text>
        {item.authorityDomain ? (
          <View className="flex-row items-center gap-1">
            <Globe size={11} color="#475569" />
            <Text className="text-muted text-xs" numberOfLines={1}>
              {item.authorityDomain}
            </Text>
          </View>
        ) : null}
        <View className="flex-row items-center ml-auto">
          <Text className="text-muted text-xs">{t("watchers.research")}</Text>
          <ChevronRight size={14} color="#475569" />
        </View>
      </View>
    </Card>
  );
}

function MenuItem({
  Icon,
  label,
  onPress,
  tone,
  disabled,
}: {
  Icon: typeof Search;
  label: string;
  onPress: () => void;
  tone?: "danger";
  disabled?: boolean;
}) {
  const color = tone === "danger" ? "#DC2626" : "#0F172A";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="menuitem"
      accessibilityLabel={label}
      className={`flex-row items-center gap-3 px-5 min-h-[52px] border-b border-line active:bg-panel2 ${
        disabled ? "opacity-40" : ""
      }`}
    >
      <Icon size={17} color={color} />
      <Text className="text-[15px] font-medium" style={{ color }}>
        {label}
      </Text>
    </Pressable>
  );
}
