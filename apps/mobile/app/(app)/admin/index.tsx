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
  Boxes,
  ChevronRight,
  Cpu,
  CreditCard,
  Gauge,
  LifeBuoy,
  LineChart,
  ListChecks,
  type LucideIcon,
  Mail,
  Megaphone,
  MessageCircle,
  ScrollText,
  Search,
  Send,
  Server,
  TrendingUp,
  Users,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

type AdminHref =
  | "/admin/analytics"
  | "/admin/growth"
  | "/admin/traffic"
  | "/admin/stats"
  | "/admin/ops"
  | "/admin/announcements"
  | "/admin/broadcast"
  | "/admin/audit"
  | "/admin/model"
  | "/admin/embeddings"
  | "/admin/channels"
  | "/admin/email-prompt"
  | "/admin/providers"
  | "/admin/search"
  | "/admin/users"
  | "/admin/watches"
  | "/admin/subs"
  | "/admin/plan-features"
  | "/admin/support"
  | "/admin/system";

interface AdminSection {
  href: AdminHref;
  Icon: LucideIcon;
  title: string;
  desc: string;
}

/**
 * Konsol bölümleri MANTIKSAL GRUPLARA ayrıldı (ADR-136) — eskiden 18 öğelik tek düz liste karışıktı.
 * Her grup bir başlık altında; tarama kolay, ilgili işler bir arada (design-standards: görsel hiyerarşi).
 */
const GROUPS: { label: string; items: AdminSection[] }[] = [
  {
    label: "Analitik & büyüme",
    items: [
      {
        href: "/admin/analytics",
        Icon: TrendingUp,
        title: "Analitik",
        desc: "Kullanıcı · MRR · plan",
      },
      {
        href: "/admin/growth",
        Icon: LineChart,
        title: "Büyüme",
        desc: "Kayıt trendi · huni · CSV",
      },
      { href: "/admin/traffic", Icon: Gauge, title: "Trafik", desc: "Site + uygulama edinimi" },
      {
        href: "/admin/stats",
        Icon: BarChart3,
        title: "İstatistik",
        desc: "Kontrol · tespit · teslim",
      },
    ],
  },
  {
    label: "Kullanıcılar & abonelik",
    items: [
      { href: "/admin/search", Icon: Search, title: "Ara", desc: "Kullanıcı · watcher · abonelik" },
      {
        href: "/admin/users",
        Icon: Users,
        title: "Kullanıcılar",
        desc: "Hesap & yetki · Pro hediye",
      },
      { href: "/admin/subs", Icon: CreditCard, title: "Abonelik", desc: "Tüm abonelikler & fiyat" },
      {
        href: "/admin/plan-features",
        Icon: ListChecks,
        title: "Plan Özellikleri",
        desc: "Madde madde · dile özel",
      },
      { href: "/admin/watches", Icon: Bell, title: "Watcher'lar", desc: "Tüm izlemeler" },
    ],
  },
  {
    label: "İçerik & iletişim",
    items: [
      {
        href: "/admin/announcements",
        Icon: Megaphone,
        title: "Duyurular",
        desc: "Çok-dilli duyuru & haber",
      },
      { href: "/admin/broadcast", Icon: Send, title: "Push Yayını", desc: "Segmente bildirim" },
      {
        href: "/admin/channels",
        Icon: MessageCircle,
        title: "Kanallar",
        desc: "Telegram · WhatsApp · e-posta",
      },
      {
        href: "/admin/email-prompt",
        Icon: Mail,
        title: "E-posta Metni",
        desc: "LLM besteci istemi",
      },
      { href: "/admin/support", Icon: LifeBuoy, title: "Destek", desc: "Talepler & canlı yanıt" },
    ],
  },
  {
    label: "Yapay zekâ",
    items: [
      { href: "/admin/model", Icon: Cpu, title: "Model", desc: "Global LLM seçimi" },
      { href: "/admin/embeddings", Icon: Boxes, title: "Gömme (RAG)", desc: "Embedding sağlayıcı" },
    ],
  },
  {
    label: "Sistem & denetim",
    items: [
      { href: "/admin/ops", Icon: Activity, title: "Operasyon", desc: "Sağlık · teslimat · token" },
      { href: "/admin/system", Icon: Server, title: "Sistem", desc: "Sağlık & son işler" },
      { href: "/admin/providers", Icon: Server, title: "Kaynaklar", desc: "API kullanım & kota" },
      { href: "/admin/audit", Icon: ScrollText, title: "Denetim", desc: "Admin işlem günlüğü" },
    ],
  },
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
          <View className="flex-row flex-wrap gap-2.5 mb-5">
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

        {GROUPS.map((g) => (
          <View key={g.label} className="mb-5">
            <Text className="text-muted text-[10px] uppercase tracking-widest mb-2">{g.label}</Text>
            <View className="gap-2.5">
              {g.items.map((sec, i) => (
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
          </View>
        ))}
      </ScrollView>
    </ConsoleShell>
  );
}
