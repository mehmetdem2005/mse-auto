// Organisms — ekran-düzeyi imza parçalar (AAA görsel dil, ADR-054).
import { useReduceMotion } from "@/lib/reduce-motion";
import { GRADIENT, ON_GRADIENT } from "@/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft, Bell } from "lucide-react-native";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

/**
 * GradientHero — markanın imza başlığı: indigo→mor derinlikli gradyan,
 * W monogram + büyük başlık + alt metin + zil. İçerik hero'nun üstüne
 * -mt ile biner (yükseltilmiş yüzey hissi). Tüm sekmelerde tutarlı.
 */
export function GradientHero({
  title,
  subtitle,
  right,
  back,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  /** Yığın ekranı: sol başta geri oku (markanın önünde). */
  back?: boolean;
}) {
  const { t } = useTranslation();
  const reduce = useReduceMotion();
  const router = useRouter();
  return (
    <LinearGradient
      colors={GRADIENT.hero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        // Kompakt + EŞİT yükseklik (ADR-064): ekranın ~%18'i, yarısı değil.
        // Alt boşluk, içeriğin -mt-7 ile bineceği yuvarlak paneli hesaba katar.
        paddingTop: Platform.OS === "web" ? 16 : 48,
        paddingBottom: 40,
        paddingHorizontal: 20,
      }}
    >
      {/* Reanimated layout `entering` web'de GPU yırtılması üretir (motion.tsx notu) →
          native'e kıstırılır; web'de düz render. */}
      <Animated.View entering={reduce || Platform.OS === "web" ? undefined : FadeIn.duration(400)}>
        <View className="flex-row items-center">
          {back ? (
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel={t("common.back")}
              className="w-12 h-12 -ml-2 mr-1 rounded-full items-center justify-center active:bg-white/15"
            >
              <ArrowLeft size={22} color={ON_GRADIENT} />
            </Pressable>
          ) : null}
          <View
            className="w-9 h-9 rounded-xl bg-white/20 items-center justify-center"
            style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" }}
          >
            <Text className="text-white text-base font-extrabold">W</Text>
          </View>
          <Text className="text-white/90 text-body font-bold ml-2.5 tracking-tight">Whenly</Text>
          <View className="ml-auto">
            {right ?? (
              <Pressable
                onPress={() => router.push("/support")}
                accessibilityRole="button"
                accessibilityLabel={t("settings.supportTitle")}
                className="w-12 h-12 rounded-full bg-white/15 items-center justify-center active:bg-white/25"
              >
                <Bell size={19} color={ON_GRADIENT} />
              </Pressable>
            )}
          </View>
        </View>
        <Text
          className="text-white text-headline font-extrabold tracking-tight mt-3"
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-white/80 text-body-sm mt-0.5" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </Animated.View>
    </LinearGradient>
  );
}

/**
 * Hero'nun üstüne binen içerik "sheet"i — yuvarlak üst köşeler + açık zemin
 * gradyanı TEMİZ keser (mor şerit/uyumsuzluk biter). İçerik bu panelin içinde
 * kayar; gradyan her sayfada eşit yükseklikte görünür.
 */
export function HeroOverlap({ children }: { children: ReactNode }) {
  return <View className="flex-1 -mt-7 bg-ink rounded-t-[28px] overflow-hidden">{children}</View>;
}
