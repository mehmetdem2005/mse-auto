import { Badge, Card, FactChips, SectionLabel } from "@/components/ui";
import { type CheckRunView, type DetectionEventView, type FeedbackVerdict, api } from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { type ReactNode, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

function when(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("tr-TR")} ${d.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default function WatcherDetail(): ReactNode {
  const { id, admin } = useLocalSearchParams<{ id: string; admin?: string }>();
  const isAdmin = admin === "1";
  const q = useQuery({
    queryKey: ["timeline", id, isAdmin],
    queryFn: () => (isAdmin ? api.adminWatchTimeline(id) : api.watcherTimeline(id)),
    enabled: !!id,
  });

  if (q.isLoading) {
    return (
      <View className="flex-1 bg-ink justify-center">
        <ActivityIndicator color="#6366F1" />
      </View>
    );
  }
  if (q.error) {
    return (
      <View className="flex-1 bg-ink px-5 pt-6">
        <Text className="text-neg">
          {q.error instanceof Error ? q.error.message : "yüklenemedi"}
        </Text>
      </View>
    );
  }

  const runs = q.data?.checkRuns ?? [];
  const events = q.data?.events ?? [];

  return (
    <ScrollView className="flex-1 bg-ink px-5" contentContainerClassName="pt-4 pb-10">
      {/* Tespitler önce — en önemli sonuç */}
      <SectionLabel>tespitler ({events.length})</SectionLabel>
      {events.length > 0 ? (
        events.map((e) => <EventCard key={e.id} e={e} canVote={!isAdmin} />)
      ) : (
        <Card>
          <Text className="text-muted text-sm">Henüz bir tespit yok. İzleme sürüyor.</Text>
        </Card>
      )}

      <View className="h-5" />
      <SectionLabel>kontrol geçmişi ({runs.length})</SectionLabel>
      {runs.length > 0 ? (
        runs.map((r) => <RunCard key={r.id} r={r} />)
      ) : (
        <Text className="text-muted text-sm">Henüz kontrol çalışması yok.</Text>
      )}
    </ScrollView>
  );
}

function EventCard({ e, canVote }: { e: DetectionEventView; canVote: boolean }): ReactNode {
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
          <Badge tone="pos">● tespit</Badge>
          <Text className="text-muted text-[11px] ml-auto">{when(e.detectedAt)}</Text>
        </View>
        <Text className="text-text text-[15px] leading-5">{e.description}</Text>
        <FactChips raw={e.facts} />
        {canVote ? (
          <View className="flex-row items-center mt-3 pt-3 border-t border-line">
            {voted ? (
              <Text className="text-muted text-xs">
                {voted === "correct" ? "👍 Teşekkürler!" : "👎 Not edildi."}
              </Text>
            ) : (
              <>
                <Text className="text-muted text-xs mr-3">Doğru muydu?</Text>
                <Vote glyph="👍" onPress={() => mutation.mutate("correct")} />
                <View className="w-2" />
                <Vote glyph="👎" onPress={() => mutation.mutate("incorrect")} />
              </>
            )}
          </View>
        ) : null}
      </Card>
    </View>
  );
}

function Vote({ glyph, onPress }: { glyph: string; onPress: () => void }): ReactNode {
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

function RunCard({ r }: { r: CheckRunView }): ReactNode {
  const hit = r.decision;
  return (
    <View className="mb-2.5">
      <Card>
        <View className="flex-row items-center gap-2">
          <Text style={{ color: hit ? "#16A34A" : "#94A3B8" }}>{hit ? "●" : "○"}</Text>
          <Text className="text-text text-xs">{hit ? "tespit var" : "değişiklik yok"}</Text>
          {r.confidence !== null ? (
            <Text className="text-muted text-[11px]">
              · %{Math.round(r.confidence * 100)} güven
            </Text>
          ) : null}
          <Text className="text-muted text-[11px] ml-auto">{when(r.ranAt)}</Text>
        </View>
        {r.summary ? <Text className="text-muted text-xs mt-2">{r.summary}</Text> : null}
        {r.reasoning ? (
          <Text className="text-muted text-[11px] mt-1.5 italic">{r.reasoning}</Text>
        ) : null}
      </Card>
    </View>
  );
}
