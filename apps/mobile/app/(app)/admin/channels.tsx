import { toast } from "@/components/feedback";
import { ConsoleShell, ErrText, Loading } from "@/features/admin/ui";
import { type ChannelAvailability, api } from "@/lib/api";
import { useTheme } from "@/theme";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, MessageCircle, Send } from "lucide-react-native";
import { type ReactNode, useEffect, useState } from "react";
import { ScrollView, Switch, Text, View } from "react-native";

const ROWS: {
  key: keyof ChannelAvailability;
  Icon: typeof Mail;
  label: string;
  desc: string;
  tint: string;
}[] = [
  { key: "telegram", Icon: Send, label: "Telegram", desc: "Bot ile anlık mesaj", tint: "#229ED9" },
  {
    key: "whatsapp",
    Icon: MessageCircle,
    label: "WhatsApp",
    desc: "Meta Cloud API",
    tint: "#25D366",
  },
  { key: "email", Icon: Mail, label: "E-posta", desc: "Resend ile e-posta", tint: "#6366F1" },
];

// ADR-107: kanal aç/kapa — kapalı kanal hiç teslim edilmez + kullanıcıya "şu an kapalı" uyarısı.
export default function AdminChannelsScreen(): ReactNode {
  const theme = useTheme();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["adminChannelConfig"], queryFn: api.adminChannelConfig });
  const [cfg, setCfg] = useState<ChannelAvailability | null>(null);
  useEffect(() => {
    if (q.data) setCfg(q.data);
  }, [q.data]);

  const save = useMutation({
    mutationFn: (next: ChannelAvailability) => api.setAdminChannelConfig(next),
    onSuccess: (data) => {
      qc.setQueryData(["adminChannelConfig"], data);
      setCfg(data);
      toast.success("Kanal ayarı güncellendi");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "kaydedilemedi"),
  });

  const toggle = (key: keyof ChannelAvailability, on: boolean): void => {
    if (!cfg) return;
    const next = { ...cfg, [key]: on };
    setCfg(next);
    save.mutate(next);
  };

  return (
    <ConsoleShell title="Kanal Ayarları" sub="aç / kapat">
      <ScrollView className="flex-1" contentContainerClassName="px-5 pt-4 pb-12">
        {q.isLoading ? <Loading /> : null}
        {q.error ? <ErrText e={q.error} /> : null}
        {cfg ? (
          <>
            <Text className="text-muted text-[13px] leading-5 mb-4">
              Kapattığın kanal hiç teslim edilmez ve kullanıcılar ayar ekranında "şu an kapalı"
              uyarısı görür. FCM push her zaman açıktır (burada yer almaz).
            </Text>
            {ROWS.map((r) => (
              <View key={r.key} className="bg-panel border border-line rounded-2xl p-4 mb-3">
                <View className="flex-row items-center gap-3">
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${r.tint}1A` }}
                  >
                    <r.Icon size={18} color={r.tint} />
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="text-text text-sm font-semibold">{r.label}</Text>
                    <Text className="text-muted text-[11px] mt-0.5">{r.desc}</Text>
                  </View>
                  <Switch
                    value={cfg[r.key]}
                    onValueChange={(v) => toggle(r.key, v)}
                    disabled={save.isPending}
                    trackColor={{ false: theme.colors.line, true: theme.colors.accent }}
                    thumbColor="#FFFFFF"
                    accessibilityLabel={`${r.label} desteği`}
                  />
                </View>
                <Text
                  className="text-[11px] mt-2 font-semibold"
                  style={{ color: cfg[r.key] ? "#16A34A" : "#94A3B8" }}
                >
                  {cfg[r.key]
                    ? "AÇIK — kullanıcılar kullanabilir"
                    : "KAPALI — kullanıcılara 'şu an kapalı' gösterilir"}
                </Text>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </ConsoleShell>
  );
}
