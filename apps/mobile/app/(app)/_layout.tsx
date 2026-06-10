import { api } from "@/lib/api";
import { configureNotificationHandler, registerForegroundListener } from "@/lib/notifications";
import { qk } from "@/lib/query";
import { useQuery } from "@tanstack/react-query";
import { Tabs } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";

// M3 bottom-nav: aktif öğede pill (secondary-container) gösterge.
function TabIcon({ glyph, color, focused }: { glyph: string; color: string; focused: boolean }) {
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
      <Text style={{ color, fontSize: 18 }}>{glyph}</Text>
    </View>
  );
}

export default function AppLayout() {
  useEffect(() => {
    configureNotificationHandler();
    return registerForegroundListener();
  }, []);
  // /me yüklenene dek Tabs'ı render etme: expo-router sekme görünürlüğünü ilk
  // render'da belirler; href'i sonradan null→görünür çevirmek sekmeyi geri
  // getirmez. Bu yüzden isAdmin'i ilk render'dan ÖNCE biliyoruz.
  const { data: me, isLoading } = useQuery({ queryKey: qk.me, queryFn: api.me });
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F5F7FB", justifyContent: "center" }}>
        <ActivityIndicator color="#6366F1" />
      </View>
    );
  }
  const isAdmin = me?.isAdmin ?? false;
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#FFFFFF" },
        headerTitleStyle: { color: "#0F172A", fontWeight: "700" },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: "#F5F7FB" },
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E2E8F0",
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarActiveTintColor: "#6366F1",
        tabBarInactiveTintColor: "#64748B",
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: "Akış",
          tabBarIcon: ({ color, focused }) => <TabIcon glyph="✦" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Watcher'lar",
          tabBarIcon: ({ color, focused }) => <TabIcon glyph="◉" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="new"
        // "Yeni" birincil eylem → FAB ile (M3). Sekme gizli, rota /new'den erişilir.
        options={{ href: null }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          title: "Abonelik",
          tabBarIcon: ({ color, focused }) => <TabIcon glyph="★" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ayarlar",
          tabBarIcon: ({ color, focused }) => <TabIcon glyph="⚙" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, focused }) => <TabIcon glyph="⛨" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
