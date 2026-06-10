// Organisms — ekran-düzeyi imza parçalar (AAA görsel dil, ADR-054).
import { useReduceMotion } from "@/lib/reduce-motion";
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
      colors={["#6366F1", "#7C3AED", "#4F46E5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        // TÜM sayfalarda EŞİT yükseklik (compact kaldırıldı — morluk seviyesi tutarlı).
        // Alt boşluk, içeriğin -mt-7 ile bineceği yuvarlak paneli hesaba katar.
        paddingTop: Platform.OS === "web" ? 28 : 56,
        paddingBottom: 60,
        paddingHorizontal: 20,
      }}
    >
      <Animated.View entering={reduce ? undefined : FadeIn.duration(400)}>
        <View className="flex-row items-center">
          {back ? (
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel={t("common.back")}
              className="w-12 h-12 -ml-2 mr-1 rounded-full items-center justify-center active:bg-white/15"
            >
              <ArrowLeft size={22} color="#FFFFFF" />
            </Pressable>
          ) : null}
          <View
            className="w-9 h-9 rounded-xl bg-white/20 items-center justify-center"
            style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" }}
          >
            <Text className="text-white text-base font-extrabold">W</Text>
          </View>
          <Text className="text-white/90 text-[15px] font-bold ml-2.5 tracking-tight">Whenly</Text>
          <View className="ml-auto">
            {right ?? (
              <Pressable
                onPress={() => router.push("/support")}
                accessibilityRole="button"
                accessibilityLabel={t("settings.supportTitle")}
                className="w-12 h-12 rounded-full bg-white/15 items-center justify-center active:bg-white/25"
              >
                <Bell size={19} color="#FFFFFF" />
              </Pressable>
            )}
          </View>
        </View>
        <Text className="text-white text-[26px] font-extrabold tracking-tight mt-4">{title}</Text>
        {subtitle ? (
          <Text className="text-white/80 text-[13px] mt-1 leading-5">{subtitle}</Text>
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
