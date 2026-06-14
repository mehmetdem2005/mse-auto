// AI kişiselleştirme (ADR-113): kullanıcı kendini tanıtır + ek dikkat yazar; niyet
// asistanının sistem istemine enjekte edilir (yalnız kendi çağrısına; PII zonu).
import { toast } from "@/components/feedback";
import { Btn, GradientHero, HeroOverlap, SkeletonCard } from "@/components/ui";
import { type UserAiProfile, api } from "@/lib/api";
import { qk } from "@/lib/query";
import { useTheme } from "@/theme";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, TextInput, View } from "react-native";

export default function AiProfile() {
  const { t } = useTranslation();
  const theme = useTheme();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: qk.aiProfile, queryFn: api.aiProfile });
  const [about, setAbout] = useState("");
  const [attention, setAttention] = useState("");
  useEffect(() => {
    if (!q.data) return;
    setAbout(q.data.about);
    setAttention(q.data.attention);
  }, [q.data]);

  const save = useMutation({
    mutationFn: (p: UserAiProfile) => api.setAiProfile(p),
    onSuccess: (data) => {
      qc.setQueryData(qk.aiProfile, data);
      toast.success(t("aiProfile.saved"));
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : t("common.loadError")),
  });

  if (q.isLoading) {
    return (
      <View className="flex-1 bg-ink">
        <GradientHero title={t("aiProfile.title")} back />
        <HeroOverlap>
          <View className="px-5 pt-5">
            <SkeletonCard />
          </View>
        </HeroOverlap>
      </View>
    );
  }

  const inputClass =
    "bg-panel border border-line rounded-2xl px-4 py-3.5 text-text text-sm leading-5 min-h-[112px] mt-1";

  return (
    <View className="flex-1 bg-ink">
      <GradientHero title={t("aiProfile.title")} back />
      <HeroOverlap>
        <ScrollView
          className="flex-1 px-5"
          contentContainerClassName="pt-5 pb-12"
          keyboardShouldPersistTaps="handled"
        >
          {/* Amaç bandı — vurgu renkli, ikonlu (ne işe yaradığı tek bakışta belli) */}
          <View className="flex-row gap-3 bg-accent/10 border border-accent/25 rounded-2xl p-4 mb-6">
            <View className="w-9 h-9 rounded-xl bg-accent/15 items-center justify-center shrink-0">
              <Sparkles size={18} color={theme.colors.accent} />
            </View>
            <Text className="text-text text-[13px] leading-5 flex-1">{t("aiProfile.intro")}</Text>
          </View>

          {/* Kendini tanıt */}
          <Text className="text-text text-sm font-semibold">{t("aiProfile.about")}</Text>
          <TextInput
            value={about}
            onChangeText={setAbout}
            multiline
            maxLength={2000}
            placeholder={t("aiProfile.aboutHint")}
            placeholderTextColor={theme.colors.placeholder}
            accessibilityLabel={t("aiProfile.about")}
            className={inputClass}
            style={{ textAlignVertical: "top" }}
          />
          <Text className="text-muted2 text-[10px] text-right mt-1 mb-5">{about.length}/2000</Text>

          {/* Ek dikkat */}
          <Text className="text-text text-sm font-semibold">{t("aiProfile.attention")}</Text>
          <TextInput
            value={attention}
            onChangeText={setAttention}
            multiline
            maxLength={2000}
            placeholder={t("aiProfile.attentionHint")}
            placeholderTextColor={theme.colors.placeholder}
            accessibilityLabel={t("aiProfile.attention")}
            className={inputClass}
            style={{ textAlignVertical: "top" }}
          />
          <Text className="text-muted2 text-[10px] text-right mt-1 mb-6">
            {attention.length}/2000
          </Text>

          <Btn onPress={() => save.mutate({ about, attention })} disabled={save.isPending}>
            <Text className="text-white text-[13px] font-semibold">{t("common.save")}</Text>
          </Btn>
        </ScrollView>
      </HeroOverlap>
    </View>
  );
}
