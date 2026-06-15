// ADR-133: Stripe checkout dönüş sayfası (success_url = APP_URL/billing/success).
// Pro, sağlayıcının webhook'uyla ASENKRON verilir → burada aboneliği tazeleyip kullanıcıyı bilgilendiririz.
import { Btn } from "@/components/ui";
import { qk } from "@/lib/query";
import { useTheme } from "@/theme";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { CheckCircle2 } from "lucide-react-native";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

export default function BillingSuccess() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    // Webhook Pro'yu asenkron yazar; dönüşte aboneliği yeniden çek (birkaç saniye içinde yansır).
    qc.invalidateQueries({ queryKey: qk.subscription });
  }, [qc]);

  return (
    <View className="flex-1 bg-ink items-center justify-center px-8">
      <View className="w-16 h-16 rounded-full bg-pos/10 items-center justify-center mb-5">
        <CheckCircle2 size={32} color={colors.pos} />
      </View>
      <Text className="text-text text-xl font-extrabold text-center">
        {t("billing.successTitle")}
      </Text>
      <Text className="text-muted text-sm text-center mt-2 leading-5">
        {t("billing.successBody")}
      </Text>
      <View className="mt-6 w-full max-w-[320px]">
        <Btn onPress={() => router.replace("/subscription")}>
          <Text className="text-onAccent text-[14px] font-semibold">{t("billing.toApp")}</Text>
        </Btn>
      </View>
    </View>
  );
}
