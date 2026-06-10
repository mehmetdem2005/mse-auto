// Canlı destek sohbeti (kullanıcı tarafı) — 5 sn'de bir yenilenir (ADR-044).
import { EnterItem } from "@/components/motion";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { Send } from "lucide-react-native";
import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";

function when(iso: string): string {
  return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

export default function SupportThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const scroll = useRef<ScrollView>(null);
  const q = useQuery({
    queryKey: ["support-thread", id],
    queryFn: () => api.supportMessages(id),
    enabled: !!id,
    refetchInterval: 5000, // canlı sohbet: kısa aralıklı yoklama
  });
  const send = useMutation({
    mutationFn: (body: string) => api.supportSend(id, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["support-thread", id] }),
  });

  function submit() {
    const text = draft.trim();
    if (!text || send.isPending) return;
    setDraft("");
    send.mutate(text);
  }

  if (q.isLoading) {
    return (
      <View className="flex-1 bg-ink justify-center">
        <ActivityIndicator color="#6366F1" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-ink">
      <ScrollView
        ref={scroll}
        className="flex-1 px-5 pt-4"
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
      >
        {(q.data ?? []).map((m, i) => (
          <EnterItem
            key={m.id}
            index={0}
            className={`max-w-[85%] rounded-2xl px-4 py-3 mb-2.5 ${
              m.sender === "user"
                ? "self-end bg-accent rounded-br-md"
                : "self-start bg-panel border border-line rounded-bl-md"
            }`}
          >
            <Text
              accessibilityLabel={`${m.sender === "user" ? "Sen" : "Destek"}: ${m.body}`}
              className={m.sender === "user" ? "text-white text-sm" : "text-text text-sm"}
            >
              {m.body}
            </Text>
            <Text
              className={`text-[10px] mt-1 ${m.sender === "user" ? "text-white/70" : "text-muted"}`}
            >
              {when(m.createdAt)}
            </Text>
          </EnterItem>
        ))}
        <View className="h-4" />
      </ScrollView>

      <View className="flex-row items-end gap-2 px-5 py-3 border-t border-line bg-ink">
        <TextInput
          value={draft}
          onChangeText={setDraft}
          multiline
          placeholder="Mesaj yaz…"
          placeholderTextColor="#94A3B8"
          accessibilityLabel="Destek mesajı yaz"
          className="flex-1 bg-panel border border-line rounded-2xl px-4 py-3 text-text text-sm max-h-28"
          style={{ textAlignVertical: "top" }}
        />
        <Pressable
          onPress={submit}
          disabled={!draft.trim() || send.isPending}
          accessibilityRole="button"
          accessibilityLabel="Gönder"
          className={`rounded-full w-12 h-12 min-h-[44px] items-center justify-center ${
            !draft.trim() || send.isPending ? "bg-line" : "bg-accent"
          }`}
        >
          <Send size={18} color={!draft.trim() || send.isPending ? "#475569" : "#FFFFFF"} />
        </Pressable>
      </View>
    </View>
  );
}
