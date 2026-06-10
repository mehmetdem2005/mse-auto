// Destek & İletişim (ADR-044): e-posta, sorun bildir, canlı destek talepleri.
import { EnterItem } from "@/components/motion";
import { Badge, Btn, Card, SectionLabel } from "@/components/ui";
import { type SupportTicket, api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronRight, Mail, MessageCircle } from "lucide-react-native";
import { useState } from "react";
import { Linking, Pressable, ScrollView, Text, TextInput, View } from "react-native";

const CONTACT_EMAIL = "mehmetdem782100@gmail.com";

function when(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR");
}

export default function Support() {
  const router = useRouter();
  const qc = useQueryClient();
  const [problem, setProblem] = useState("");
  const [sentProblem, setSentProblem] = useState(false);
  const tickets = useQuery({ queryKey: ["support"], queryFn: api.supportTickets });

  const report = useMutation({
    mutationFn: () => api.createSupport("problem", problem.trim()),
    onSuccess: () => {
      setSentProblem(true);
      setProblem("");
      void qc.invalidateQueries({ queryKey: ["support"] });
    },
  });
  const startLive = useMutation({
    mutationFn: () => api.createSupport("live", "Merhaba, canlı desteğe ihtiyacım var."),
    onSuccess: (t) => {
      void qc.invalidateQueries({ queryKey: ["support"] });
      router.push(`/support/${t.id}`);
    },
  });

  const live = (tickets.data ?? []).filter((t) => t.kind === "live");
  const problems = (tickets.data ?? []).filter((t) => t.kind === "problem");

  return (
    <ScrollView className="flex-1 bg-ink px-5" contentContainerClassName="pt-4 pb-10">
      {/* İletişim */}
      <SectionLabel>iletişim</SectionLabel>
      <Card
        onPress={() => void Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
        accessibilityLabel={`E-posta gönder: ${CONTACT_EMAIL}`}
      >
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-accent/10 items-center justify-center">
            <Mail size={18} color="#6366F1" />
          </View>
          <View className="flex-1">
            <Text className="text-text text-sm font-semibold">E-posta</Text>
            <Text className="text-muted text-xs mt-0.5">{CONTACT_EMAIL}</Text>
          </View>
          <ChevronRight size={16} color="#475569" />
        </View>
      </Card>

      {/* Canlı destek */}
      <View className="h-5" />
      <SectionLabel>canlı destek</SectionLabel>
      <Card>
        <View className="flex-row items-center gap-3 mb-3">
          <View className="w-10 h-10 rounded-full bg-pos/10 items-center justify-center">
            <MessageCircle size={18} color="#16A34A" />
          </View>
          <Text className="text-muted text-xs flex-1">
            Talep açtığında yöneticiye anında bildirim gider; buradan yazışırsın.
          </Text>
        </View>
        <Btn onPress={() => startLive.mutate()} disabled={startLive.isPending}>
          <Text className="text-white text-[13px] font-semibold">
            {startLive.isPending ? "Açılıyor…" : "Canlı destek başlat"}
          </Text>
        </Btn>
      </Card>
      {live.map((t, i) => (
        <EnterItem key={t.id} index={i} className="mt-2.5">
          <TicketRow t={t} onPress={() => router.push(`/support/${t.id}`)} />
        </EnterItem>
      ))}

      {/* Sorun bildir */}
      <View className="h-5" />
      <SectionLabel>sorun bildir</SectionLabel>
      <Card>
        {sentProblem ? (
          <Text className="text-pos text-sm">
            Bildirimin alındı, teşekkürler. Gerekirse e-postandan dönüş yapılır.
          </Text>
        ) : (
          <>
            <TextInput
              value={problem}
              onChangeText={setProblem}
              multiline
              placeholder="Sorunu kısaca anlat — ne yaptın, ne bekledin, ne oldu?"
              placeholderTextColor="#94A3B8"
              accessibilityLabel="Sorun açıklaması"
              className="bg-ink border border-line rounded-xl px-3 py-3 text-text text-sm min-h-[88px]"
              style={{ textAlignVertical: "top" }}
            />
            {report.error ? (
              <Text className="text-neg text-xs mt-2">
                {report.error instanceof Error ? report.error.message : "gönderilemedi"}
              </Text>
            ) : null}
            <View className="mt-3">
              <Btn
                onPress={() => report.mutate()}
                disabled={report.isPending || problem.trim().length < 3}
              >
                <Text className="text-white text-[13px] font-semibold">
                  {report.isPending ? "Gönderiliyor…" : "Gönder"}
                </Text>
              </Btn>
            </View>
          </>
        )}
      </Card>
      {problems.map((t, i) => (
        <EnterItem key={t.id} index={i} className="mt-2.5">
          <TicketRow t={t} onPress={() => router.push(`/support/${t.id}`)} />
        </EnterItem>
      ))}
    </ScrollView>
  );
}

function TicketRow({ t, onPress }: { t: SupportTicket; onPress: () => void }) {
  const open = t.status === "open";
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Destek talebi, ${open ? "açık" : "kapalı"}, ${when(t.createdAt)}`}
      className="bg-panel border border-line rounded-xl px-4 py-3 min-h-[44px] active:bg-panel2"
    >
      <View className="flex-row items-center gap-2">
        <Badge tone={open ? "pos" : "muted"}>{open ? "açık" : "kapalı"}</Badge>
        <Text className="text-muted text-[11px] ml-auto">{when(t.createdAt)}</Text>
        <ChevronRight size={14} color="#475569" />
      </View>
      {t.lastMessage ? (
        <Text className="text-text text-sm mt-1.5" numberOfLines={1}>
          {t.lastMessage}
        </Text>
      ) : null}
    </Pressable>
  );
}
