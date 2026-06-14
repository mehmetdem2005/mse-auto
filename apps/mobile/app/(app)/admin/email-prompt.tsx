import { toast } from "@/components/feedback";
import { ActBtn, ConsoleShell, ErrText, Loading } from "@/features/admin/ui";
import { api } from "@/lib/api";
import { useTheme } from "@/theme";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";
import { ScrollView, Switch, Text, TextInput, View } from "react-native";

// ADR-109: e-posta LLM besteci istemi — "varsayılan" toggle açıkken kaliteli hazır
// istem kutuda görünür (salt-okunur); kapatınca admin kendi istemini yazar.
export default function AdminEmailPromptScreen(): ReactNode {
  const theme = useTheme();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["adminEmailPrompt"], queryFn: api.adminEmailPrompt });
  const [useDefault, setUseDefault] = useState(true);
  const [custom, setCustom] = useState("");
  useEffect(() => {
    if (!q.data) return;
    setUseDefault(q.data.useDefault);
    setCustom(q.data.useDefault ? "" : q.data.prompt);
  }, [q.data]);

  const save = useMutation({
    mutationFn: () => api.setAdminEmailPrompt({ useDefault, prompt: custom }),
    onSuccess: (data) => {
      qc.setQueryData(["adminEmailPrompt"], data);
      setUseDefault(data.useDefault);
      setCustom(data.useDefault ? "" : data.prompt);
      toast.success("E-posta istemi kaydedildi");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "kaydedilemedi"),
  });

  const canSave = !save.isPending && (useDefault || custom.trim().length >= 10);

  return (
    <ConsoleShell title="E-posta Metni" sub="LLM besteci">
      <ScrollView className="flex-1" contentContainerClassName="px-5 pt-4 pb-12">
        {q.isLoading ? <Loading /> : null}
        {q.error ? <ErrText e={q.error} /> : null}
        {q.data ? (
          <>
            <Text className="text-muted text-[13px] leading-5 mb-4">
              E-posta kanalıyla giden uyarılar, seçili LLM ile bu isteme göre profesyonel bir
              e-postaya dönüştürülür. Varsayılan istem hazır ve kalitelidir; istersen kendi istemini
              yaz. (Telegram/WhatsApp ham metin gönderir.)
            </Text>

            <View className="flex-row items-center justify-between bg-panel border border-line rounded-2xl p-4 mb-3">
              <View className="flex-1 min-w-0 pr-3">
                <Text className="text-text text-sm font-semibold">Varsayılan istemi kullan</Text>
                <Text className="text-muted text-[11px] mt-0.5">
                  {useDefault ? "Hazır kaliteli istem etkin." : "Kendi istemin etkin."}
                </Text>
              </View>
              <Switch
                value={useDefault}
                onValueChange={setUseDefault}
                trackColor={{ false: theme.colors.line, true: theme.colors.accent }}
                thumbColor="#FFFFFF"
                accessibilityLabel="Varsayılan istemi kullan"
              />
            </View>

            <Text className="text-muted text-[10px] uppercase tracking-widest mb-1.5">
              {useDefault ? "varsayılan istem (salt-okunur)" : "özel istem"}
            </Text>
            <TextInput
              value={useDefault ? q.data.defaultPrompt : custom}
              onChangeText={setCustom}
              editable={!useDefault}
              multiline
              placeholder="Sistem istemini yaz… (LLM'e verilecek)"
              placeholderTextColor="#94A3B8"
              accessibilityLabel="E-posta besteci istemi"
              className={`bg-ink border border-line rounded-xl px-3 py-3 text-text text-[13px] leading-5 min-h-[220px] ${useDefault ? "opacity-70" : ""}`}
              style={{ textAlignVertical: "top" }}
            />
            <Text className="text-muted2 text-[11px] mt-2 leading-4">
              İstem, LLM'e {'{"subject","body"}'} JSON döndürmesini söylemeli; aksi halde sistem ham
              metne düşer (e-posta yine gider).
            </Text>

            <View className="mt-4">
              <ActBtn
                label="kaydet"
                tone="solid"
                disabled={!canSave}
                onPress={() => save.mutate()}
              />
            </View>

            {!q.data.persisted ? (
              <Text className="text-warn text-[11px] mt-3 leading-4">
                Not: kalıcı ayar deposu hazır değil (app_settings) — değişiklik geçici olabilir.
              </Text>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </ConsoleShell>
  );
}
