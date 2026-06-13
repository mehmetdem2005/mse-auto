import { EnterItem } from "@/components/motion";
import { ConsoleShell, Stat, money } from "@/features/admin/ui";
import { api } from "@/lib/api";
import { useTheme } from "@/theme";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  Activity,
  BarChart3,
  Bell,
  ChevronRight,
  Cpu,
  CreditCard,
  Gauge,
  LifeBuoy,
  LineChart,
  type LucideIcon,
  Megaphone,
  Server,
  TrendingUp,
  Users,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

/** Konsol bölümleri — her biri kendi ekranına gider ("site" içindeki sayfalar). */
const SECTIONS: {
  href:
    | "/admin/analytics"
    | "/admin/growth"
    | "/admin/traffic"
    | "/admin/stats"
    | "/admin/ops"
    | "/admin/announcements"
    | "/admin/model"
    | "/admin/providers"
    | "/admin/users"
    | "/admin/watches"
    | "/admin/subs"
    | "/admin/support"
    | "/admin/system";
  Icon: LucideIcon;
  title: string;
  desc: string;
}[] = [
  { href: "/admin/analytics", Icon: TrendingUp, title: "Analitik", desc: "Kullanıcı · MRR · plan" },
  { href: "/admin/growth", Icon: LineChart, title: "Büyüme", desc: "Kayıt trendi · huni · CSV" },
  { href: "/admin/traffic", Icon: Gauge, title: "Trafik", desc: "Site + uygulama edinimi" },
  { href: "/admin/stats", Icon: BarChart3, title: "İstatistik", desc: "Kontrol · tespit · teslim" },
  { href: "/admin/ops", Icon: Activity, title: "Operasyon", desc: "Sağlık · teslimat · token" },
  {
    href: "/admin/announcements",
    Icon: Megaphone,
    title: "Duyurular",
    desc: "Görselli duyuru oluştur",
  },
  { href: "/admin/model", Icon: Cpu, title: "Model", desc: "Global LLM seçimi" },
  { href: "/admin/providers", Icon: Server, title: "Kaynaklar", desc: "API kullanım & kota" },
  { href: "/admin/users", Icon: Users, title: "Kullanıcılar", desc: "Hesap & yetki yönetimi" },
  { href: "/admin/watches", Icon: Bell, title: "Watcher'lar", desc: "Tüm izlemeler" },
  { href: "/admin/subs", Icon: CreditCard, title: "Abonelik", desc: "Tüm abonelikler" },
  { href: "/admin/support", Icon: LifeBuoy, title: "Destek", desc: "Talepler & canlı yanıt" },
  { href: "/admin/system", Icon: Server, title: "Sistem", desc: "Sağlık & son işler" },
];

export default function ConsoleHome(): ReactNode {
  const theme = useTheme();
  const router = useRouter();
  const stats = useQuery({ queryKey: ["adminStats"], queryFn: api.adminStats });
  const support = useQuery({ queryKey: ["adminSupport"], queryFn: api.adminSupport });
  const openTickets = (support.data ?? []).filter((t) => t.status === "open").length;
  const s = stats.data;
  return (
    <ConsoleShell title="Genel bakış" root>
      <ScrollView className="flex-1" contentContainerClassName="px-5 pt-4 pb-10">
        {/* Nabız: en kritik 4 sayı — ayrıntı ilgili bölümde (progressive disclosure) */}
        {s ? (
          <View className="flex-row flex-wrap gap-2.5 mb-4">
            <Stat n={s.totalUsers} l="kullanıcı" />
            <Stat n={s.activeWatchers} l="aktif watcher" tone="pos" />
            <Stat
              n={Math.round(s.mrrCents / 100)}
              l="MRR ($)"
              tone="accent"
              sub={money(s.mrrCents)}
            />
            <Stat n={openTickets} l="açık destek" />
          </View>
        ) : null}

        <Text className="text-muted text-[10px] uppercase tracking-widest mb-2">bölümler</Text>
        <View className="flex-row flex-wrap gap-2.5">
          {SECTIONS.map((sec, i) => (
            <EnterItem key={sec.href} index={i}>
              <Pressable
                onPress={() => router.push(sec.href)}
                accessibilityRole="button"
                accessibilityLabel={`${sec.title}: ${sec.desc}`}
                className="bg-panel border border-line rounded-2xl p-4 active:bg-panel2 w-full"
                style={{ minHeight: 44 }}
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-9 h-9 rounded-xl bg-accent/10 items-center justify-center">
                    <sec.Icon size={17} color={theme.colors.accent} />
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="text-text text-[15px] font-semibold">{sec.title}</Text>
                    <Text className="text-muted text-xs mt-0.5" numberOfLines={1}>
                      {sec.desc}
                    </Text>
                  </View>
                  {sec.href === "/admin/support" && openTickets > 0 ? (
                    <View className="bg-neg/10 border border-neg/30 rounded-full px-2 py-0.5">
                      <Text className="text-neg text-[11px] font-bold">{openTickets}</Text>
                    </View>
                  ) : null}
                  <ChevronRight size={16} color={theme.colors.mutedIcon} />
                </View>
              </Pressable>
            </EnterItem>
          ))}
        </View>
      </ScrollView>
    </ConsoleShell>
  );
}
