// Yasal belge ekranı (ADR-079): Gizlilik Politikası / Kullanım Koşulları.
// Giriş öncesi de erişilebilir (login'deki bağlantılar) — Stack.Protected dışı.
import { GradientHero, HeroOverlap } from "@/components/ui";
import { type LegalDocId, getLegalDoc } from "@/legal";
import { useLocalSearchParams } from "expo-router";
import { Info } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";

export default function LegalScreen() {
  const { t, i18n } = useTranslation();
  // Bilinmeyen param gizlilik politikasına düşer (güvenli varsayılan).
  const params = useLocalSearchParams<{ doc: string }>();
  const id: LegalDocId = params.doc === "terms" ? "terms" : "privacy";
  const { doc, canonical } = getLegalDoc(id, i18n.language);

  return (
    <View className="flex-1 bg-ink">
      <GradientHero title={t(id === "terms" ? "legal.termsTitle" : "legal.privacyTitle")} back />
      <HeroOverlap>
        <ScrollView className="flex-1 px-5" contentContainerClassName="pt-5 pb-12">
          <Text className="text-muted text-[11px] mb-4">
            {t("legal.updated", { v: doc.version, date: doc.updated })}
          </Text>
          {!canonical ? (
            <View
              accessibilityRole="alert"
              className="flex-row items-start gap-2.5 bg-accent/10 border border-accent/30 rounded-xl px-4 py-3 mb-4"
            >
              <Info size={16} color="#6366F1" />
              <Text className="text-text text-xs flex-1 leading-4">{t("legal.noticeEn")}</Text>
            </View>
          ) : null}
          {doc.sections.map((s) => (
            <View key={s.h} className="mb-5">
              <Text accessibilityRole="header" className="text-text text-sm font-bold mb-1.5">
                {s.h}
              </Text>
              <Text className="text-muted text-[13px] leading-5">{s.p}</Text>
            </View>
          ))}
        </ScrollView>
      </HeroOverlap>
    </View>
  );
}
