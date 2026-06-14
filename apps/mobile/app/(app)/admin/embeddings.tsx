import { toast } from "@/components/feedback";
import { ConsoleShell, ErrText, Loading } from "@/features/admin/ui";
import { type EmbeddingModel, api } from "@/lib/api";
import { useTheme } from "@/theme";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, Check, TriangleAlert } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

/**
 * Global gömme (embedding) sağlayıcısı (ADR-127) — RAG bilgi tabanı bu modelle vektörlenir.
 * Groq embedding sunmaz; Gemini text-embedding-004 ÜCRETSİZ kota ile varsayılan, OpenAI alternatif.
 * Anahtarı olmayan sağlayıcı seçilemez (dürüst kilit; backend aynı kuralı 400 ile uygular).
 */
export default function EmbeddingsScreen(): ReactNode {
  const theme = useTheme();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["adminEmbeddings"], queryFn: api.adminEmbeddings });
  const save = useMutation({
    mutationFn: (id: string) => api.setAdminEmbeddings(id),
    onSuccess: (cfg) => {
      qc.setQueryData(["adminEmbeddings"], cfg);
      toast.success("Gömme sağlayıcı güncellendi");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "kaydedilemedi"),
  });

  return (
    <ConsoleShell title="Gömme (RAG)" sub="embedding sağlayıcı">
      {q.isLoading ? <Loading /> : null}
      {q.error ? <ErrText e={q.error} /> : null}
      {q.data ? (
        <ScrollView className="flex-1" contentContainerClassName="px-5 pt-4 pb-10">
          <Text className="text-muted text-xs leading-5 mb-3">
            RAG bilgi tabanı metinleri bu modelle vektöre çevrilir. Groq embedding sunmaz; Gemini
            text-embedding-004 ÜCRETSİZ kota ile gelir. Tüm modeller 768 boyuta normalize edilir —
            sağlayıcı değişimi depolama-uyumlu, ama farklı vektör uzayları olduğundan veri varken
            değişimde yeniden-gömme gerekir.
          </Text>

          {!q.data.persisted && q.data.active ? (
            <View className="flex-row items-start gap-2.5 bg-warn/10 border border-warn/30 rounded-xl px-3 py-2.5 mb-3">
              <TriangleAlert size={15} color="#B45309" style={{ marginTop: 1 }} />
              <Text className="text-warn text-xs flex-1 leading-4">
                Kalıcı ayar deposu canlıda değilse seçim bellekte; deploy/yeniden başlatmada
                varsayılana döner.
              </Text>
            </View>
          ) : null}

          {q.data.models.map((m: EmbeddingModel) => {
            const active = q.data?.active === m.id;
            const disabled = !m.available || save.isPending;
            return (
              <Pressable
                key={m.id}
                onPress={() => !active && save.mutate(m.id)}
                disabled={disabled}
                accessibilityRole="radio"
                accessibilityState={{ selected: active, disabled }}
                accessibilityLabel={`${m.label}${active ? ", seçili" : ""}${m.available ? "" : ", anahtar tanımsız"}`}
                className={`flex-row items-center gap-3 rounded-2xl border p-4 mb-2.5 min-h-[64px] ${
                  active ? "border-accent bg-accent/5" : "border-line bg-panel active:bg-panel2"
                } ${m.available ? "" : "opacity-50"}`}
              >
                <View
                  className={`w-9 h-9 rounded-xl items-center justify-center ${active ? "bg-accent" : "bg-accent/10"}`}
                >
                  <Boxes size={17} color={active ? theme.colors.onAccent : theme.colors.accent} />
                </View>
                <View className="flex-1 min-w-0">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-text text-[15px] font-semibold">{m.label}</Text>
                    <Text className="text-muted2 text-[10px] uppercase tracking-wider">
                      {m.provider} · {m.dimensions}d
                    </Text>
                  </View>
                  <Text className="text-muted text-xs mt-0.5">{m.note}</Text>
                  {!m.available ? (
                    <Text className="text-warn text-[11px] mt-0.5">
                      {m.provider === "gemini" ? "GEMINI_API_KEY" : "OPENAI_API_KEY"} tanımlı değil
                      — Render ortamına eklenince seçilebilir.
                    </Text>
                  ) : null}
                </View>
                {active ? <Check size={18} color={theme.colors.accent} /> : null}
              </Pressable>
            );
          })}

          <Text className="text-muted text-[11px] mt-2 leading-4">
            Not: Gömme yalnız RAG aktifken (pgvector migration + bu sağlayıcı) kullanılır; şimdilik
            seçim hazır bekler.
          </Text>
        </ScrollView>
      ) : null}
    </ConsoleShell>
  );
}
