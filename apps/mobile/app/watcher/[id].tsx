import { type CheckRunView, type DetectionEventView, api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import type { ReactNode } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

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
        <ActivityIndicator color="#ffb020" />
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
      <Text className="text-muted text-[10px] uppercase tracking-widest mb-2">
        tespitler ({events.length})
      </Text>
      {events.length > 0 ? (
        events.map((e) => <EventCard key={e.id} e={e} />)
      ) : (
        <View className="bg-panel border border-line rounded-xl p-4 mb-4">
          <Text className="text-muted text-sm">Henüz bir tespit yok. İzleme sürüyor.</Text>
        </View>
      )}

      <Text className="text-muted text-[10px] uppercase tracking-widest mt-4 mb-2">
        kontrol geçmişi ({runs.length})
      </Text>
      {runs.length > 0 ? (
        runs.map((r) => <RunCard key={r.id} r={r} />)
      ) : (
        <Text className="text-muted text-sm">Henüz kontrol çalışması yok.</Text>
      )}
    </ScrollView>
  );
}

function EventCard({ e }: { e: DetectionEventView }): ReactNode {
  return (
    <View className="bg-panel border rounded-xl p-4 mb-3" style={{ borderColor: "#46c99a55" }}>
      <View className="flex-row items-center gap-2 mb-1">
        <Text style={{ color: "#46c99a" }}>●</Text>
        <Text className="text-pos text-xs uppercase tracking-wider">tespit</Text>
        <Text className="text-muted text-[11px] ml-auto">{when(e.detectedAt)}</Text>
      </View>
      <Text className="text-text text-sm">{e.description}</Text>
    </View>
  );
}

function RunCard({ r }: { r: CheckRunView }): ReactNode {
  const hit = r.decision;
  return (
    <View className="bg-panel border border-line rounded-xl p-4 mb-2.5">
      <View className="flex-row items-center gap-2">
        <Text style={{ color: hit ? "#46c99a" : "#828c9a" }}>{hit ? "●" : "○"}</Text>
        <Text className="text-text text-xs">{hit ? "tespit var" : "değişiklik yok"}</Text>
        {r.confidence !== null ? (
          <Text className="text-muted text-[11px]">· %{Math.round(r.confidence * 100)} güven</Text>
        ) : null}
        <Text className="text-muted text-[11px] ml-auto">{when(r.ranAt)}</Text>
      </View>
      {r.summary ? <Text className="text-muted text-xs mt-2">{r.summary}</Text> : null}
      {r.reasoning ? (
        <Text className="text-muted text-[11px] mt-1.5 italic" style={{ color: "#5c6470" }}>
          {r.reasoning}
        </Text>
      ) : null}
    </View>
  );
}
