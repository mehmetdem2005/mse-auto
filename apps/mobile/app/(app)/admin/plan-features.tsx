import { toast } from "@/components/feedback";
import { ActBtn, ConsoleShell, ErrText, Loading } from "@/features/admin/ui";
import { SUPPORTED_LANGS } from "@/i18n";
import { api } from "@/lib/api";
import { useTheme } from "@/theme";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Crown, Plus, Sparkles, Trash2 } from "lucide-react-native";
import { type ReactNode, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

type Plan = "free" | "pro";
const MAX_BULLETS = 12;
const MAX_LEN = 120;

/**
 * ADR-139 — plan özellik-maddeleri yönetimi. Admin her plan için (free/pro) madde-madde özellik yazar;
 * DİLE ÖZEL (üstte dil seç). Boş bırakılan dil → kullanıcı uygulamada yerelleştirilmiş varsayılanı görür.
 * Depo: app_settings (migration YOK). Kaydetme plan+dil bazında (denetim günlüğüne yazılır).
 */
export default function AdminPlanFeaturesScreen(): ReactNode {
  const qc = useQueryClient();
  const [lang, setLang] = useState("tr");
  const q = useQuery({
    queryKey: ["adminPlanFeatures", lang],
    queryFn: () => api.adminPlanFeatures(lang),
  });

  const [free, setFree] = useState<string[]>([]);
  const [pro, setPro] = useState<string[]>([]);
  useEffect(() => {
    if (!q.data) return;
    setFree(q.data.free);
    setPro(q.data.pro);
  }, [q.data]);

  const save = useMutation({
    mutationFn: ({ plan, bullets }: { plan: Plan; bullets: string[] }) =>
      api.setPlanFeatures(
        plan,
        lang,
        bullets.map((b) => b.trim()).filter((b) => b.length > 0),
      ),
    onSuccess: (data) => {
      qc.setQueryData(["adminPlanFeatures", lang], data);
      setFree(data.free);
      setPro(data.pro);
      toast.success("Plan özellikleri kaydedildi");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "kaydedilemedi"),
  });

  return (
    <ConsoleShell title="Plan Özellikleri" sub="madde madde · dile özel">
      <ScrollView className="flex-1" contentContainerClassName="px-5 pt-4 pb-12">
        <Text className="text-muted text-[13px] leading-5 mb-4">
          Her plana abonelik ekranında görünecek özellikleri madde madde yaz. Maddeler{" "}
          <Text className="text-text font-semibold">seçili dile</Text> özeldir. Bir dili boş
          bırakırsan kullanıcı o dilde hazır (yerelleştirilmiş) varsayılan maddeleri görür.
        </Text>

        {/* Dil seçici (×11) */}
        <Text className="text-muted text-[10px] uppercase tracking-widest mb-1.5">
          düzenlenen dil
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-5">
          {SUPPORTED_LANGS.map((l) => {
            const on = lang === l.code;
            return (
              <Pressable
                key={l.code}
                onPress={() => setLang(l.code)}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`Dil: ${l.native}`}
                className="rounded-full px-3 py-2 min-h-[40px] justify-center border"
                style={{
                  borderColor: on ? "#6366F1" : "#2B3A57",
                  backgroundColor: on ? "#6366F11A" : "transparent",
                }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: on ? "#6366F1" : "#94A3B8" }}
                >
                  {l.native}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {q.isLoading ? <Loading /> : null}
        {q.error ? <ErrText e={q.error} /> : null}
        {q.data ? (
          <>
            <PlanEditor
              plan="free"
              title="FREE"
              Icon={Sparkles}
              bullets={free}
              onChange={setFree}
              onSave={() => save.mutate({ plan: "free", bullets: free })}
              saving={save.isPending}
            />
            <View className="h-4" />
            <PlanEditor
              plan="pro"
              title="PRO"
              Icon={Crown}
              bullets={pro}
              onChange={setPro}
              onSave={() => save.mutate({ plan: "pro", bullets: pro })}
              saving={save.isPending}
            />
          </>
        ) : null}
      </ScrollView>
    </ConsoleShell>
  );
}

function PlanEditor({
  title,
  Icon,
  bullets,
  onChange,
  onSave,
  saving,
}: {
  plan: Plan;
  title: string;
  Icon: typeof Crown;
  bullets: string[];
  onChange: (next: string[]) => void;
  onSave: () => void;
  saving: boolean;
}): ReactNode {
  const theme = useTheme();
  const setAt = (i: number, v: string) => onChange(bullets.map((b, j) => (j === i ? v : b)));
  const removeAt = (i: number) => onChange(bullets.filter((_, j) => j !== i));
  const add = () => onChange([...bullets, ""]);

  return (
    <View className="bg-panel border border-line rounded-2xl p-4">
      <View className="flex-row items-center gap-2 mb-3">
        <View className="w-8 h-8 rounded-xl bg-accent/10 items-center justify-center">
          <Icon size={16} color={theme.colors.accent} />
        </View>
        <Text className="text-text text-base font-bold">{title}</Text>
        <Text className="text-muted text-[11px]">
          {bullets.length}/{MAX_BULLETS} madde
        </Text>
      </View>

      <View className="gap-2">
        {bullets.map((b, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: sıralı, düzenlenebilir liste (kararlı kimlik yok)
          <View key={i} className="flex-row items-center gap-2">
            <TextInput
              value={b}
              onChangeText={(v) => setAt(i, v)}
              maxLength={MAX_LEN}
              placeholder={`Özellik ${i + 1}`}
              placeholderTextColor="#94A3B8"
              accessibilityLabel={`${title} özellik ${i + 1}`}
              className="flex-1 bg-ink border border-line rounded-xl px-3 py-2.5 text-text text-[13px]"
            />
            <Pressable
              onPress={() => removeAt(i)}
              accessibilityRole="button"
              accessibilityLabel={`Özellik ${i + 1} sil`}
              className="w-11 h-11 items-center justify-center rounded-xl bg-neg/10"
            >
              <Trash2 size={16} color={theme.colors.neg} />
            </Pressable>
          </View>
        ))}
      </View>

      {bullets.length === 0 ? (
        <Text className="text-muted2 text-[12px] mt-1">
          Madde yok — kullanıcı bu dilde varsayılan maddeleri görür.
        </Text>
      ) : null}

      <View className="flex-row gap-2 mt-3">
        <Pressable
          onPress={add}
          disabled={bullets.length >= MAX_BULLETS}
          accessibilityRole="button"
          accessibilityLabel="Madde ekle"
          className={`flex-row items-center gap-1.5 rounded-xl px-3 min-h-[44px] justify-center border border-line ${bullets.length >= MAX_BULLETS ? "opacity-40" : "active:bg-panel2"}`}
        >
          <Plus size={15} color={theme.colors.accent} />
          <Text className="text-accent text-[13px] font-semibold">Madde ekle</Text>
        </Pressable>
        <View className="flex-1">
          <ActBtn label="kaydet" tone="solid" disabled={saving} onPress={onSave} />
        </View>
      </View>
    </View>
  );
}
