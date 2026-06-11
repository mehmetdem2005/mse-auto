import "@/i18n";
import { ToastHost } from "@/components/feedback";
import "../global.css";
import { registerBackgroundNotifications } from "@/lib/background-notifications";
import { queryClient } from "@/lib/query";
import { useReduceMotion } from "@/lib/reduce-motion";
import { initAuth, useAuth } from "@/stores/auth";
import { useTheme } from "@/theme";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const ready = useAuth((s) => s.ready);
  const isSignedIn = useAuth((s) => s.session !== null);
  const reduce = useReduceMotion();
  const theme = useTheme();

  useEffect(() => initAuth(), []);
  useEffect(() => {
    void registerBackgroundNotifications();
  }, []);

  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        {/* Tema değişkenleri: tüm token sınıfları (bg-ink, text-text…) buradan çözülür */}
        <View style={[{ flex: 1, backgroundColor: theme.colors.ink }, theme.cssVars]}>
          <StatusBar style="light" /> {/* gradyan hero üstünde beyaz ikonlar (iki temada da) */}
          <Stack screenOptions={{ headerShown: false, animation: reduce ? "none" : "fade" }}>
            <Stack.Protected guard={isSignedIn}>
              <Stack.Screen name="(app)" />
              <Stack.Screen
                name="watcher/[id]"
                options={{ animation: reduce ? "none" : "slide_from_right" }}
              />
              <Stack.Screen
                name="support/index"
                options={{ animation: reduce ? "none" : "slide_from_right" }}
              />
              <Stack.Screen
                name="support/[id]"
                options={{ animation: reduce ? "none" : "slide_from_right" }}
              />
              <Stack.Screen
                name="channels"
                options={{ animation: reduce ? "none" : "slide_from_right" }}
              />
            </Stack.Protected>
            <Stack.Protected guard={!isSignedIn}>
              <Stack.Screen name="(auth)" />
            </Stack.Protected>
            {/* Yasal belgeler (ADR-079): giriş ÖNCESİ ve sonrası erişilebilir */}
            <Stack.Screen
              name="legal/[doc]"
              options={{ animation: reduce ? "none" : "slide_from_right" }}
            />
          </Stack>
          <ToastHost />
        </View>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
