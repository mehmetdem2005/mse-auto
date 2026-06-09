import { api } from "@/lib/api";
import { configureNotificationHandler, registerForegroundListener } from "@/lib/notifications";
import { qk } from "@/lib/query";
import { useQuery } from "@tanstack/react-query";
import { Tabs } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";

function Icon({ glyph, color }: { glyph: string; color: string }) {
  return <Text style={{ color, fontSize: 16 }}>{glyph}</Text>;
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
      <View style={{ flex: 1, backgroundColor: "#0a0c10", justifyContent: "center" }}>
        <ActivityIndicator color="#ffb020" />
      </View>
    );
  }
  const isAdmin = me?.isAdmin ?? false;
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#0a0c10" },
        headerTitleStyle: { color: "#e7eaef" },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: "#0a0c10" },
        tabBarStyle: { backgroundColor: "#0a0c10", borderTopColor: "#242a33" },
        tabBarActiveTintColor: "#ffb020",
        tabBarInactiveTintColor: "#828c9a",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Watcher'lar",
          tabBarIcon: ({ color }) => <Icon glyph="◉" color={color} />,
        }}
      />
      <Tabs.Screen
        name="new"
        options={{ title: "Yeni", tabBarIcon: ({ color }) => <Icon glyph="＋" color={color} /> }}
      />
      <Tabs.Screen
        name="subscription"
        options={{ title: "Abonelik", tabBarIcon: ({ color }) => <Icon glyph="★" color={color} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: "Ayarlar", tabBarIcon: ({ color }) => <Icon glyph="⚙" color={color} /> }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          // Yalnız adminlere görünür; değilse sekme gizli ve rota erişilemez.
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color }) => <Icon glyph="⛨" color={color} />,
        }}
      />
    </Tabs>
  );
}
