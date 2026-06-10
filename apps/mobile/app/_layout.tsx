import "../global.css";
import { registerBackgroundNotifications } from "@/lib/background-notifications";
import { queryClient } from "@/lib/query";
import { initAuth, useAuth } from "@/stores/auth";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const ready = useAuth((s) => s.ready);
  const isSignedIn = useAuth((s) => s.session !== null);

  useEffect(() => initAuth(), []);
  useEffect(() => {
    void registerBackgroundNotifications();
  }, []);

  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
          <Stack.Protected guard={isSignedIn}>
            <Stack.Screen name="(app)" />
            <Stack.Screen
              name="watcher/[id]"
              options={{
                headerShown: true,
                title: "Araştırma",
                headerStyle: { backgroundColor: "#FFFFFF" },
                headerTintColor: "#0F172A",
                headerShadowVisible: false,
                // M3 shared-axis benzeri yatay geçiş (detaya giriş)
                animation: "slide_from_right",
              }}
            />
          </Stack.Protected>
          <Stack.Protected guard={!isSignedIn}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
