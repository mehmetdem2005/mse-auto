import { EnterItem } from "@/components/motion";
import { Btn } from "@/components/ui";
import { useTheme } from "@/theme";
import { useRouter } from "expo-router";
import { BellRing, Telescope, Wand2 } from "lucide-react-native";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

/**
 * İlk-kullanım onboarding (ADR-147 / M8.1) — 3 adımlı değer/yönlendirme akışı; son adım kullanıcıyı
 * çekirdek eyleme (ilk izleme) yönlendirir. Tam-ekran overlay (ana ekran üzerine), bir kez gösterilir
 * (useOnboarded). design-standards (8pt, görsel hiyerarşi) · web-design (lucide vektör ikon, emoji yok)
 * · ui-ux (progressive disclosure, net CTA, 44pt dokunma) · motion (EnterItem + reduce-motion).
 */
const SLIDES = [
  { Icon: Telescope, title: "onboarding.s1Title", body: "onboarding.s1Body" },
  { Icon: Wand2, title: "onboarding.s2Title", body: "onboarding.s2Body" },
  { Icon: BellRing, title: "onboarding.s3Title", body: "onboarding.s3Body" },
] as const;

export function Onboarding({ onComplete }: { onComplete: () => void }): ReactNode {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const last = step === SLIDES.length - 1;
  const slide = SLIDES[step] ?? SLIDES[0];

  return (
    <View className="absolute inset-0 z-50 bg-ink" accessibilityViewIsModal>
      {/* Atla */}
      <View className="flex-row justify-end px-5 pt-12">
        <Pressable
          onPress={onComplete}
          accessibilityRole="button"
          accessibilityLabel={t("onboarding.skip")}
          className="min-h-[44px] px-3 justify-center"
        >
          <Text className="text-muted text-sm font-medium">{t("onboarding.skip")}</Text>
        </Pressable>
      </View>

      {/* İçerik — adım değişince yeniden-monte olur → giriş animasyonu (reduce-motion: anında) */}
      <View className="flex-1 items-center justify-center px-8">
        <EnterItem key={step} index={0}>
          <View className="items-center">
            <View className="w-20 h-20 rounded-3xl bg-accent/10 items-center justify-center mb-6">
              <slide.Icon size={36} color={colors.accent} />
            </View>
            <Text className="text-text text-2xl font-extrabold text-center mb-3">
              {t(slide.title)}
            </Text>
            <Text className="text-muted text-[15px] leading-6 text-center">{t(slide.body)}</Text>
          </View>
        </EnterItem>
      </View>

      {/* Adım noktaları + CTA */}
      <View className="px-8 pb-12">
        <View
          className="flex-row justify-center items-center gap-2 mb-6"
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 1, max: SLIDES.length, now: step + 1 }}
        >
          {SLIDES.map((s, i) => (
            <View
              key={s.title}
              className={`h-2 rounded-full ${i === step ? "w-6 bg-accent" : "w-2 bg-line"}`}
            />
          ))}
        </View>

        {last ? (
          <>
            <Btn
              onPress={() => {
                onComplete();
                router.push("/new");
              }}
            >
              <Text className="text-onAccent text-[15px] font-semibold">
                {t("onboarding.createFirst")}
              </Text>
            </Btn>
            <Pressable
              onPress={onComplete}
              accessibilityRole="button"
              accessibilityLabel={t("onboarding.later")}
              className="min-h-[44px] items-center justify-center mt-2"
            >
              <Text className="text-muted text-sm">{t("onboarding.later")}</Text>
            </Pressable>
          </>
        ) : (
          <Btn onPress={() => setStep(step + 1)}>
            <Text className="text-onAccent text-[15px] font-semibold">{t("onboarding.next")}</Text>
          </Btn>
        )}
      </View>
    </View>
  );
}
