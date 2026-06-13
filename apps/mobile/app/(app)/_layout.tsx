import { api } from "@/lib/api";
import { configureNotificationHandler, registerForegroundListener } from "@/lib/notifications";
import { qk } from "@/lib/query";
import { useTheme } from "@/theme";
import { useQuery } from "@tanstack/react-query";
import { Tabs } from "expo-router";
import { Bell, type LucideIcon, Settings, Sparkles, Star } from "lucide-react-native";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";

// M3 bottom-nav: aktif öğede pill (secondary-container) gösterge + vektör ikon.
function TabIcon({ Icon, color, focused }: { Icon: LucideIcon; color: string; focused: boolean }) {
  return (
    <View
      style={{
        width: 56,
        height: 30,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: focused ? "rgba(99,102,241,0.16)" : "transparent",
      }}
    >
      <Icon size={19} color={color} strokeWidth={focused ? 2.4 : 2} />
    </View>
  );
}

export default function AppLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  useEffect(() => {
    configureNotificationHandler();
    return registerForegroundListener();
  }, []);
  // /me erken yüklenir (ana ekrandaki konsol girişi + admin guard'ı bu cache'i kullanır).
  const { isLoading } = useQuery({ queryKey: qk.me, queryFn: api.me });
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.ink, justifyContent: "center" }}>
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }
  return (
    <Tabs
      // Native header tüm sekmelerde kapalı — GradientHero kabuk görevini üstlenir (ADR-054/058).
      screenOptions={{
        sceneStyle: { backgroundColor: theme.colors.ink },
        tabBarStyle: {
          backgroundColor: theme.colors.panel,
          borderTopColor: theme.colors.line,
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.mutedIcon,
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          headerShown: false,
          title: t("tabs.feed"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={Sparkles} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          title: t("tabs.watchers"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={Bell} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="new"
        // "Yeni" birincil eylem → FAB ile (M3). Sekme gizli, rota /new'den erişilir.
        options={{ href: null, headerShown: false }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          headerShown: false,
          title: t("tabs.subscription"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={Star} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          headerShown: false,
          title: t("tabs.settings"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={Settings} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        // Whenly Console (ADR-095): admin sekmelerden çıktı — kendi Stack'inde "ayrı
        // site"; girişi ana ekranın sağ altındaki konsol düğmesi. Sekme her zaman gizli.
        name="admin"
        options={{ href: null, headerShown: false }}
      />
    </Tabs>
  );
}
