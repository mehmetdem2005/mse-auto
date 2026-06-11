import { EnterItem, ExpandIn } from "@/components/motion";
import { Badge, Card, FactChips, SectionLabel } from "@/components/ui";
import { GradientHero, HeroOverlap, SkeletonCard, Vote } from "@/components/ui";
import { type CheckRunView, type DetectionEventView, type FeedbackVerdict, api } from "@/lib/api";
import { useTheme } from "@/theme";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import {
  ChevronDown,
  ChevronRight,
  RotateCw,
  Search,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react-native";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

function when(iso: string, lang = "tr"): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString(lang)} ${d.toLocaleTimeString(lang, {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default function WatcherDetail(): ReactNode {
  const { t } = useTranslation();
  const { id, admin } = useLocalSearchParams<{ id: string; admin?: string }>();
  const isAdmin = admin === "1";
  const q = useQuery({
    queryKey: ["timeline", id, isAdmin],
    queryFn: () => (isAdmin ? api.adminWatchTimeline(id) : api.watcherTimeline(id)),
    enabled: !!id,
  });

  if (q.isLoading) {
    return (
      <View className="flex-1 bg-ink">
        <GradientHero title={t("detail.title")} back />
        <HeroOverlap>
          <View className="px-5 pt-5">
            <SkeletonCard />
            <SkeletonCard />
          </View>
        </HeroOverlap>
      </View>
    );
  }
  if (q.error) {
    return (
      <View className="flex-1 bg-ink">
        <GradientHero title={t("detail.title")} back />
        <HeroOverlap>
          <Text className="text-neg px-5 pt-6">
            {q.error instanceof Error ? q.error.message : t("common.loadError")}
          </Text>
        </HeroOverlap>
      </View>
    );
  }

  const runs = q.data?.checkRuns ?? [];
  const events = q.data?.events ?? [];
  // Aynı olayın kopyaları (bastırma öncesi birikmiş) tek karta katlanır (ADR-038).
  const eventGroups = groupEvents(events);

  return (
    <View className="flex-1 bg-ink">
      <GradientHero title={t("detail.title")} back />
      <HeroOverlap>
        <ScrollView className="flex-1 px-5" contentContainerClassName="pt-5 pb-12">
          {/* Tespitler önce — en önemli sonuç */}
          <SectionLabel>
            {t("detail.detections")} ({eventGroups.length})
          </SectionLabel>
          {eventGroups.length > 0 ? (
            eventGroups.map((g, i) => (
              <EnterItem key={g.latest.id} index={i}>
                <EventCard e={g.latest} times={g.times} canVote={!isAdmin} />
              </EnterItem>
            ))
          ) : (
            <Card>
              <Text className="text-muted text-sm">{t("detail.noDetections")}</Text>
            </Card>
          )}

          <View className="h-5" />
          <SectionLabel>
            {t("detail.history")} ({runs.length})
          </SectionLabel>
          {runs.length > 0 ? (
            runs.map((r, i) => (
              <EnterItem key={r.id} index={i}>
                <RunCard r={r} />
              </EnterItem>
            ))
          ) : (
            <Text className="text-muted text-sm">{t("detail.noHistory")}</Text>
          )}
        </ScrollView>
      </HeroOverlap>
    </View>
  );
}

/** Aynı açıklamalı tespitleri tek grupta toplar (en yenisi gösterilir). */
interface EventGroup {
  latest: DetectionEventView;
  times: string[];
}
function groupEvents(events: DetectionEventView[]): EventGroup[] {
  const map = new Map<string, EventGroup>();
  for (const e of events) {
    // liste en-yeniden-eskiye gelir → ilk görülen en yenisidir
    const key = e.description.trim();
    const g = map.get(key);
    if (!g) map.set(key, { latest: e, times: [e.detectedAt] });
    else g.times.push(e.detectedAt);
  }
  return [...map.values()];
}

function EventCard({
  e,
  times,
  canVote,
}: { e: DetectionEventView; times: string[]; canVote: boolean }): ReactNode {
  const { t, i18n } = useTranslation();
  const [voted, setVoted] = useState<FeedbackVerdict | null>(null);
  const mutation = useMutation({
    mutationFn: (verdict: FeedbackVerdict) => api.feedback(e.id, verdict),
    onMutate: (verdict) => setVoted(verdict),
    onError: () => setVoted(null),
  });
  return (
    <View className="mb-3">
      <Card accent>
        <View className="flex-row items-center gap-2 mb-1.5">
          <Badge tone="pos">● {t("detail.detected")}</Badge>
          <Text className="text-muted text-[11px] ml-auto">
            {when(e.detectedAt, i18n.language)}
          </Text>
        </View>
        <Text className="text-text text-[15px] leading-5">{e.description}</Text>
        {times.length > 1 ? (
          <View className="flex-row items-center gap-1 mt-1.5">
            <RotateCw size={11} color="#475569" />
            <Text className="text-muted text-[11px]">
              {t("detail.repeatNote", {
                n: times.length,
                date: when(times[times.length - 1] ?? "", i18n.language),
              })}
            </Text>
          </View>
        ) : null}
        <FactChips raw={e.facts} />
        {canVote ? (
          <View className="flex-row items-center mt-3 pt-3 border-t border-line">
            {voted ? (
              <Text className="text-muted text-xs">
                {voted === "correct" ? t("feed.thanks") : t("feed.noted")}
              </Text>
            ) : (
              <>
                <Text className="text-muted text-xs mr-3">{t("feed.wasCorrect")}</Text>
                <Vote
                  kind="up"
                  label={t("feed.correct")}
                  onPress={() => mutation.mutate("correct")}
                />
                <View className="w-2" />
                <Vote
                  kind="down"
                  label={t("feed.wrong")}
                  onPress={() => mutation.mutate("incorrect")}
                />
              </>
            )}
          </View>
        ) : null}
      </Card>
    </View>
  );
}

/**
 * Tek kontrol çalışması — dokununca AI'nın arama + düşünme süreci açılır
 * (ADR-036: ne arandı, hangi sonuçlar görüldü, nasıl karar verildi).
 */
function RunCard({ r }: { r: CheckRunView }): ReactNode {
  const { t, i18n } = useTranslation();
  const runTheme = useTheme();
  const [open, setOpen] = useState(false);
  const hit = r.decision;
  return (
    <View className="mb-2.5">
      <Card>
        <Pressable
          onPress={() => setOpen((o) => !o)}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={t("detail.expandA11y", {
            date: when(r.ranAt, i18n.language),
            status: hit ? t("detail.detected") : t("detail.noChange"),
            action: open ? t("detail.hide") : t("detail.show"),
          })}
          className="min-h-[44px] justify-center"
        >
          <View className="flex-row items-center gap-2">
            <Text style={{ color: hit ? "#16A34A" : "#94A3B8" }}>{hit ? "●" : "○"}</Text>
            <Text className="text-text text-xs">
              {hit ? t("detail.detected") : t("detail.noChange")}
            </Text>
            {r.confidence !== null ? (
              <Text className="text-muted text-[11px]">
                · {t("detail.confidence", { n: Math.round(r.confidence * 100) })}
                {r.tokensUsed != null ? ` · ${r.tokensUsed} tok` : ""}
              </Text>
            ) : null}
            <Text className="text-muted text-[11px] ml-auto">{when(r.ranAt, i18n.language)}</Text>
            {open ? (
              <ChevronDown size={15} color="#475569" />
            ) : (
              <ChevronRight size={15} color="#475569" />
            )}
          </View>
        </Pressable>

        {open ? (
          <ExpandIn className="mt-2 pt-3 border-t border-line">
            {/* Gerçek LLM konuşması — kontrol anında saklanan girdi/çıktı dökümü (ADR-038) */}
            <Text className="text-muted text-[10px] uppercase tracking-widest mb-2">
              {t("detail.convo")} · {when(r.ranAt, i18n.language)}
            </Text>

            {/* 1) Modele giden istek (birebir: konu + gördüğü sonuçlar) */}
            <View className="self-start max-w-[94%] bg-panel2 rounded-2xl rounded-bl-md px-3.5 py-3 mb-2">
              <Text className="text-muted text-[10px] uppercase tracking-wider mb-1">
                {t("detail.toModel")}
              </Text>
              <View className="flex-row items-center gap-1.5">
                <Search size={12} color={runTheme.colors.text} />
                <Text className="text-text text-xs leading-5 flex-1">
                  {t("detail.watching", { q: r.searchQuery ?? "—" })}
                </Text>
              </View>
              {r.hits && r.hits.length > 0 ? (
                <View className="mt-2">
                  <Text className="text-muted text-[11px] mb-1">
                    {t("detail.results", { n: r.hits.length })}
                  </Text>
                  {r.hits.map((h, i) => (
                    <View key={`${r.id}-h${i}`} className="mb-1.5">
                      <Text className="text-text text-[11px] leading-4">
                        {i + 1}. {h.title} — {h.snippet}
                        {h.date ? ` (${h.date})` : ""}
                      </Text>
                      <Text className="text-muted text-[10px]" numberOfLines={1}>
                        {h.url}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="text-muted text-[11px] mt-1.5 italic">
                  {r.searchQuery
                    ? t("detail.noResultsList", { sum: r.summary ?? t("detail.noSummary") })
                    : t("detail.noResultsOld")}
                </Text>
              )}
            </View>

            {/* 2) Modelin tam yanıtı (karar + güven + tam gerekçe) */}
            <View className="self-start max-w-[94%] bg-accent/10 border border-accent/30 rounded-2xl rounded-bl-md px-3.5 py-3">
              <Text className="text-accent text-[10px] uppercase tracking-wider mb-1">
                {t("detail.decision")}
              </Text>
              <Text className="text-text text-xs font-semibold">
                {hit ? `● ${t("detail.hit")}` : `○ ${t("detail.miss")}`}
                {r.confidence !== null ? ` · güven %${Math.round(r.confidence * 100)}` : ""}
              </Text>
              {r.reasoning ? (
                <Text className="text-text text-xs leading-5 mt-1.5">{r.reasoning}</Text>
              ) : (
                <Text className="text-muted text-[11px] mt-1.5 italic">
                  {t("detail.noReasoning")}
                </Text>
              )}
            </View>
          </ExpandIn>
        ) : null}
      </Card>
    </View>
  );
}
