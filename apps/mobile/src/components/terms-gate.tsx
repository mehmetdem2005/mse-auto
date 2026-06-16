import { EnterItem } from "@/components/motion";
import { Btn } from "@/components/ui";
import { getLegalDoc } from "@/legal";
import { useTheme } from "@/theme";
import { useRouter } from "expo-router";
import { Check, ChevronRight, FileText, ShieldCheck } from "lucide-react-native";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

/**
 * Kullanıcı sözleşmesi kapısı (ADR-157) — giriş SONRASI, uygulamaya girmeden ÖNCE. Kullanıcı
 * Kullanım Koşulları + Gizlilik Politikası'nı AÇIKÇA kabul edene dek geçilemez (atla yok, kapatma yok).
 * Layout düzeyinde tüm uygulamanın (sekmeler dahil) yerine render edilir → gerçek zorunlu kapı.
 * 4 tasarım skill: design-standards (8pt, hiyerarşi, token) · web-design (lucide ikon, emoji yok) ·
 * ui-ux (tek net CTA, onay kutusu zorunlu, 44pt dokunma) · motion (EnterItem + reduce-motion).
 */
export function TermsGate({ onAccept }: { onAccept: () => void }): ReactNode {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const termsTitle = getLegalDoc("terms", i18n.language).doc.title;
  const privacyTitle = getLegalDoc("privacy", i18n.language).doc.title;

  return (
    <View className="flex-1 bg-ink" accessibilityViewIsModal>
      <ScrollView contentContainerClassName="px-7 pt-16 pb-6 grow">
        <EnterItem index={0}>
          <View className="items-center mb-7">
            <View className="w-20 h-20 rounded-3xl bg-accent/10 items-center justify-center mb-5">
              <ShieldCheck size={36} color={colors.accent} />
            </View>
            <Text className="text-text text-2xl font-extrabold text-center mb-2">
              {t("terms.gateTitle")}
            </Text>
            <Text className="text-muted text-[15px] leading-6 text-center">
              {t("terms.gateIntro")}
            </Text>
          </View>
        </EnterItem>

        <View className="gap-2.5">
          <DocLink label={termsTitle} onPress={() => router.push("/legal/terms")} />
          <DocLink label={privacyTitle} onPress={() => router.push("/legal/privacy")} />
        </View>
      </ScrollView>

      {/* Alt sabit alan: zorunlu onay kutusu + Kabul Et */}
      <View className="px-7 pb-12 pt-4 border-t border-line">
        <Pressable
          onPress={() => setChecked((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          accessibilityLabel={t("terms.readAndAccept")}
          className="flex-row items-start gap-3 mb-4 min-h-[44px]"
        >
          <View
            className={`w-6 h-6 rounded-md border-2 items-center justify-center mt-0.5 ${
              checked ? "bg-accent border-accent" : "border-line"
            }`}
          >
            {checked ? <Check size={16} color="#FFFFFF" strokeWidth={3} /> : null}
          </View>
          <Text className="text-text text-sm leading-5 flex-1">{t("terms.readAndAccept")}</Text>
        </Pressable>
        <Btn onPress={onAccept} disabled={!checked}>
          <Text className="text-onAccent text-[15px] font-semibold">{t("terms.acceptButton")}</Text>
        </Btn>
      </View>
    </View>
  );
}

function DocLink({ label, onPress }: { label: string; onPress: () => void }): ReactNode {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={label}
      className="flex-row items-center gap-3 bg-panel border border-line rounded-2xl px-4 py-3.5 min-h-[44px] active:opacity-80"
    >
      <FileText size={18} color={colors.accent} />
      <Text className="text-text text-sm font-medium flex-1">{label}</Text>
      <ChevronRight size={18} color={colors.mutedIcon} />
    </Pressable>
  );
}
