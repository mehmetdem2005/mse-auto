// AI kişiselleştirme (ADR-113): kullanıcı kendini tanıtır + ek dikkat yazar; niyet
// asistanının sistem istemine enjekte edilir (yalnız kendi çağrısına; PII zonu).
import { toast } from "@/components/feedback";
import { Btn, GradientHero, HeroOverlap, SkeletonCard } from "@/components/ui";
import { type UserAiProfile, api } from "@/lib/api";
import { qk } from "@/lib/query";
import { useTheme } from "@/theme";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
        <View className="px-5 pt-5">
          <SkeletonCard />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-ink">
      <GradientHero title={t("aiProfile.title")} back />
      <HeroOverlap>
        <ScrollView className="flex-1 px-5" contentContainerClassName="pt-5 pb-12">
          <Text className="text-muted text-[13px] leading-5 mb-4">{t("aiProfile.intro")}</Text>

          <Text className="text-muted text-xs mb-1.5">{t("aiProfile.about")}</Text>
          <TextInput
            value={about}
            onChangeText={setAbout}
            multiline
            maxLength={2000}
            placeholder={t("aiProfile.aboutHint")}
            placeholderTextColor={theme.colors.placeholder}
            accessibilityLabel={t("aiProfile.about")}
            className="bg-panel border border-line rounded-xl px-3 py-3 text-text text-[14px] leading-5 min-h-[120px] mb-4"
            style={{ textAlignVertical: "top" }}
          />

          <Text className="text-muted text-xs mb-1.5">{t("aiProfile.attention")}</Text>
          <TextInput
            value={attention}
            onChangeText={setAttention}
            multiline
            maxLength={2000}
            placeholder={t("aiProfile.attentionHint")}
            placeholderTextColor={theme.colors.placeholder}
            accessibilityLabel={t("aiProfile.attention")}
            className="bg-panel border border-line rounded-xl px-3 py-3 text-text text-[14px] leading-5 min-h-[100px] mb-4"
            style={{ textAlignVertical: "top" }}
          />

          <Btn onPress={() => save.mutate({ about, attention })} disabled={save.isPending}>
            <Text className="text-white text-[13px] font-semibold">{t("common.save")}</Text>
          </Btn>
        </ScrollView>
      </HeroOverlap>
    </View>
  );
}
