import { api } from "@/lib/api";
import { qk } from "@/lib/query";
import { useTheme } from "@/theme";
import { useQuery } from "@tanstack/react-query";
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

/**
 * Whenly Console (ADR-095) — admin, sekmelerden çıkarılıp kendi Stack'inde
 * "ayrı yönetim sitesi" olarak yaşar; girişi ana ekranın sağ altındaki konsol
 * düğmesidir. Koruma: /me → isAdmin değilse ana ekrana yönlendirilir
 * (yetki kontrolünün aslı backend'dedir; bu yalnız UI kapısıdır).
 */
export default function AdminLayout() {
  const theme = useTheme();
  const { data: me, isLoading } = useQuery({ queryKey: qk.me, queryFn: api.me });
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.ink, justifyContent: "center" }}>
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }
  if (!me?.isAdmin) return <Redirect href="/" />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.ink },
      }}
    />
  );
}
