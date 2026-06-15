// ADR-133: Stripe checkout iptal dönüş sayfası (cancel_url = APP_URL/billing/cancel).
import { Btn } from "@/components/ui";
import { useTheme } from "@/theme";
import { useRouter } from "expo-router";
import { XCircle } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

export default function BillingCancel() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View className="flex-1 bg-ink items-center justify-center px-8">
      <View className="w-16 h-16 rounded-full bg-panel2 items-center justify-center mb-5">
        <XCircle size={32} color={colors.muted2} />
      </View>
      <Text className="text-text text-xl font-extrabold text-center">
        {t("billing.cancelTitle")}
      </Text>
      <Text className="text-muted text-sm text-center mt-2 leading-5">
        {t("billing.cancelBody")}
      </Text>
      <View className="mt-6 w-full max-w-[320px]">
        <Btn onPress={() => router.replace("/subscription")}>
          <Text className="text-onAccent text-[14px] font-semibold">{t("billing.toApp")}</Text>
        </Btn>
      </View>
    </View>
  );
}
