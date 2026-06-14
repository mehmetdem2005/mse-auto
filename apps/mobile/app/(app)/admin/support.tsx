import { ActBtn, ConsoleShell, ErrText, Loading, day } from "@/features/admin/ui";
import { type AdminSupportTicket, api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from "react-native";

// Destek (ADR-044) — talep listesi + canlı yanıt dizgesi.
export default function SupportScreen(): ReactNode {
  const [selected, setSelected] = useState<AdminSupportTicket | null>(null);
  const q = useQuery({
    queryKey: ["adminSupport"],
    queryFn: api.adminSupport,
    refetchInterval: 10000, // yeni talepler için kısa aralıklı yoklama
  });
  const rows = q.data ?? [];
  const openCount = rows.filter((t) => t.status === "open").length;
  return (
    <ConsoleShell title="Destek" sub={`${openCount} açık`}>
      {q.isLoading ? <Loading /> : null}
      {q.error ? <ErrText e={q.error} /> : null}
      {!q.isLoading && !q.error && selected ? (
        <Thread
          ticket={selected}
          onBack={() => {
            setSelected(null);
            void q.refetch();
          }}
        />
      ) : null}
      {!q.isLoading && !q.error && !selected ? (
        <FlatList
          data={rows}
          keyExtractor={(t) => t.id}
          contentContainerClassName="px-5 pt-4 pb-8"
          onRefresh={() => void q.refetch()}
          refreshing={q.isRefetching}
          ItemSeparatorComponent={() => <View className="h-3" />}
          ListEmptyComponent={<Text className="text-muted mt-6">destek talebi yok.</Text>}
          renderItem={({ item: t }) => (
            <Pressable
              onPress={() => setSelected(t)}
              accessibilityRole="button"
              accessibilityLabel={`Destek talebi: ${t.userEmail ?? t.userId}, ${t.status === "open" ? "açık" : "kapalı"}`}
              className="bg-panel border border-line rounded-xl p-4 active:bg-panel2"
            >
              <View className="flex-row items-center gap-2">
                <Text
                  className="text-[11px] font-semibold"
                  style={{ color: t.status === "open" ? "#16A34A" : "#64748B" }}
                >
                  {t.status === "open" ? "AÇIK" : "kapalı"}
                </Text>
                <Text className="text-muted text-[11px]">
                  {t.kind === "live" ? "canlı" : "sorun"}
                </Text>
                <Text className="text-muted text-[11px] ml-auto">{day(t.createdAt)}</Text>
              </View>
              <Text className="text-text text-sm mt-1" numberOfLines={1}>
                {t.userEmail ?? t.userId}
              </Text>
              {t.lastMessage ? (
                <Text className="text-muted text-xs mt-1" numberOfLines={2}>
                  {t.lastMessage}
                </Text>
              ) : null}
            </Pressable>
          )}
        />
      ) : null}
    </ConsoleShell>
  );
}

function Thread({ ticket, onBack }: { ticket: AdminSupportTicket; onBack: () => void }): ReactNode {
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const q = useQuery({
    queryKey: ["adminSupportThread", ticket.id],
    queryFn: () => api.adminSupportMessages(ticket.id),
    refetchInterval: 5000,
  });
  const reply = useMutation({
    mutationFn: (body: string) => api.adminSupportReply(ticket.id, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["adminSupportThread", ticket.id] }),
  });
  const close = useMutation({
    mutationFn: () => api.adminSupportClose(ticket.id),
    onSuccess: onBack,
  });

  return (
    <View className="flex-1">
      <View className="flex-row items-center gap-2 px-5 pt-3 pb-2">
        <ActBtn label="geri" onPress={onBack} />
        <Text className="text-text text-sm flex-1" numberOfLines={1}>
          {ticket.userEmail ?? ticket.userId}
        </Text>
        {ticket.status === "open" ? (
          <ActBtn
            label="kapat"
            tone="danger"
            disabled={close.isPending}
            onPress={() => close.mutate()}
          />
        ) : null}
      </View>
      <ScrollView className="flex-1 px-5">
        {(q.data ?? []).map((m) => (
          <View
            key={m.id}
            className={`max-w-[85%] rounded-2xl px-4 py-3 mb-2.5 ${
              m.sender === "admin"
                ? "self-end bg-accent rounded-br-md"
                : "self-start bg-panel border border-line rounded-bl-md"
            }`}
          >
            <Text className={m.sender === "admin" ? "text-onAccent text-sm" : "text-text text-sm"}>
              {m.body}
            </Text>
          </View>
        ))}
        <View className="h-4" />
      </ScrollView>
      <View className="flex-row items-end gap-2 px-5 py-3 border-t border-line">
        <TextInput
          value={draft}
          onChangeText={setDraft}
          multiline
          placeholder="Yanıt yaz…"
          placeholderTextColor="#94A3B8"
          accessibilityLabel="Destek yanıtı yaz"
          className="flex-1 bg-panel border border-line rounded-2xl px-4 py-3 text-text text-sm max-h-28"
        />
        <ActBtn
          label="gönder"
          tone="solid"
          disabled={!draft.trim() || reply.isPending}
          onPress={() => {
            const t = draft.trim();
            if (t) {
              setDraft("");
              reply.mutate(t);
            }
          }}
        />
      </View>
    </View>
  );
}
