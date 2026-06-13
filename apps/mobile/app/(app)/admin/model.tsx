import { toast } from "@/components/feedback";
import { ConsoleShell, ErrText, Loading } from "@/features/admin/ui";
import { type LlmModel, api } from "@/lib/api";
import { useTheme } from "@/theme";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Cpu, TriangleAlert } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

/**
 * Global LLM modeli (ADR-095) — burada seçilen model TÜM kullanıcıların
 * muhakeme + doğrulama + asistan çağrılarını sürer. Anahtarı olmayan sağlayıcının
 * modeli seçilemez (dürüst kilit); backend de aynı kuralı 400 ile uygular.
 */
export default function ModelScreen(): ReactNode {
  const theme = useTheme();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["adminModel"], queryFn: api.adminModel });
  const save = useMutation({
    mutationFn: (id: string) => api.setAdminModel(id),
    onSuccess: (cfg) => {
      qc.setQueryData(["adminModel"], cfg);
      toast.success("Model güncellendi — tüm kullanıcılar bu modelle çalışacak");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "kaydedilemedi"),
  });

  return (
    <ConsoleShell title="Model" sub="global LLM">
      {q.isLoading ? <Loading /> : null}
      {q.error ? <ErrText e={q.error} /> : null}
      {q.data ? (
        <ScrollView className="flex-1" contentContainerClassName="px-5 pt-4 pb-10">
          <Text className="text-muted text-xs leading-5 mb-3">
            Seçilen model üründeki TÜM yapay zekâ çağrılarını sürer: olay muhakemesi, bağımsız
            doğrulama ve kurulum asistanı. Değişiklik anında, yeniden başlatmasız uygulanır.
          </Text>

          {!q.data.persisted && q.data.active ? (
            <View className="flex-row items-start gap-2.5 bg-warn/10 border border-warn/30 rounded-xl px-3 py-2.5 mb-3">
              <TriangleAlert size={15} color="#B45309" style={{ marginTop: 1 }} />
              <Text className="text-warn text-xs flex-1 leading-4">
                Kalıcı ayar deposu henüz canlıda değil (migration 0014 bekliyor) — seçim şimdilik
                bellekte; deploy/yeniden başlatmada varsayılana döner.
              </Text>
            </View>
          ) : null}

          {q.data.models.map((m: LlmModel) => {
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
                  <Cpu size={17} color={active ? "#FFFFFF" : theme.colors.accent} />
                </View>
                <View className="flex-1 min-w-0">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-text text-[15px] font-semibold">{m.label}</Text>
                    <Text className="text-muted2 text-[10px] uppercase tracking-wider">
                      {m.provider}
                    </Text>
                  </View>
                  <Text className="text-muted text-xs mt-0.5">{m.note}</Text>
                  {!m.available ? (
                    <Text className="text-warn text-[11px] mt-0.5">
                      {m.provider === "groq" ? "GROQ_API_KEY" : "DEEPSEEK_API_KEY"} tanımlı değil —
                      Render ortamına eklenince seçilebilir.
                    </Text>
                  ) : null}
                </View>
                {active ? <Check size={18} color={theme.colors.accent} /> : null}
              </Pressable>
            );
          })}

          <Text className="text-muted text-[11px] mt-2 leading-4">
            Maliyet/dayanıklılık notu: model değişimi kontrol sıklığını değiştirmez; yalnız çağrı
            başına hız, derinlik ve token maliyeti değişir. Reasoner modunda token tüketimi belirgin
            yüksektir.
          </Text>
        </ScrollView>
      ) : null}
    </ConsoleShell>
  );
}
