// Organisms — ekran-düzeyi imza parçalar (AAA görsel dil, ADR-054).
import { useUnreadAnnouncements } from "@/lib/announcements";
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
  const inner = (
    <>
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
        <View className="ml-auto">{right ?? <NotificationBell />}</View>
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
    </>
  );
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
        // ADR-108: web'de gradyanı kendi kararlı GPU katmanına sahiplendir → bitişik
        // şeffaf kaydırma katmanına BAYAT doku sızıntısını (cızırtı) keser.
        ...(Platform.OS === "web" ? { backfaceVisibility: "hidden" as const } : {}),
      }}
    >
      {/* Web'de reanimated katmanı KURMADAN düz View — Animated.View animasyonsuz da
          olsa web'de GPU tile rasterizasyonunu bozup cızırtı üretiyordu (ADR-099).
          Native'de imza FadeIn korunur. */}
      {Platform.OS === "web" ? (
        <View>{inner}</View>
      ) : (
        <Animated.View entering={reduce ? undefined : FadeIn.duration(400)}>{inner}</Animated.View>
      )}
    </LinearGradient>
  );
}

/**
 * Bildirim zili (ADR-100) — Duyurular ekranına gider; okunmamış varsa kırmızı nokta.
 * GradientHero'nun varsayılan sağ aksiyonu; istenirse `right` ile ezilir.
 */
function NotificationBell(): ReactNode {
  const { t } = useTranslation();
  const router = useRouter();
  const unread = useUnreadAnnouncements();
  return (
    <Pressable
      onPress={() => router.push("/announcements")}
      accessibilityRole="button"
      accessibilityLabel={
        unread > 0 ? `${t("announcements.title")} (${unread})` : t("announcements.title")
      }
      className="w-12 h-12 rounded-full bg-white/15 items-center justify-center active:bg-white/25"
    >
      <Bell size={19} color={ON_GRADIENT} />
      {unread > 0 ? (
        <View
          className="absolute rounded-full bg-neg"
          style={{
            top: 9,
            right: 9,
            width: 10,
            height: 10,
            borderWidth: 1.5,
            borderColor: "#FFFFFF",
          }}
        />
      ) : null}
    </Pressable>
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
