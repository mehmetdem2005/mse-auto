import { toast } from "@/components/feedback";
import { ActBtn, ConsoleShell, ErrText, Loading, Stat, day, money } from "@/features/admin/ui";
import { type BillingInterval, api } from "@/lib/api";
import { qk } from "@/lib/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Bell,
  CreditCard,
  LifeBuoy,
  Mail,
  MessageCircle,
  Send,
  Smartphone,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { Alert, ScrollView, Text, View } from "react-native";

export default function UserDetailScreen(): ReactNode {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = String(id);
  const router = useRouter();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["adminUser", userId],
    queryFn: () => api.adminUserDetail(userId),
  });

  const refresh = (): void => {
    void qc.invalidateQueries({ queryKey: ["adminUser", userId] });
    void qc.invalidateQueries({ queryKey: qk.adminUsers });
  };
  const setAdmin = useMutation({
    mutationFn: (on: boolean) => api.setUserAdmin(userId, on),
    onSuccess: () => {
      refresh();
      toast.success("Yetki güncellendi");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "olmadı"),
  });
  const gift = useMutation({
    mutationFn: (i: BillingInterval) => api.giftPro(userId, i),
    onSuccess: () => {
      refresh();
      toast.success("Pro hediye edildi");
    },
  });
  const cancelSub = useMutation({
    mutationFn: () => api.cancelUserSub(userId),
    onSuccess: () => {
      refresh();
      toast.success("Abonelik iptal edildi");
    },
  });
  const del = useMutation({
    mutationFn: () => api.deleteUser(userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.adminUsers });
      toast.success("Hesap silindi");
      router.back();
    },
  });
  const busy = setAdmin.isPending || gift.isPending || cancelSub.isPending || del.isPending;

  const u = q.data;
  return (
    <ConsoleShell title="Kullanıcı" sub={u?.plan.toUpperCase()}>
      {q.isLoading ? <Loading /> : null}
      {q.error ? <ErrText e={q.error} /> : null}
      {u ? (
        <ScrollView className="flex-1" contentContainerClassName="px-5 pt-4 pb-12">
          {/* Kimlik */}
          <View className="flex-row items-center gap-3 mb-4">
            <View className="w-12 h-12 rounded-full bg-accent/10 items-center justify-center">
              <Text className="text-accent text-lg font-bold">
                {(u.email ?? "?").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-text text-base font-semibold" numberOfLines={1}>
                {u.email ?? "(e-posta yok)"}
              </Text>
              <Text className="text-muted text-xs mt-0.5">
                Katıldı {day(u.createdAt)}
                {u.isAdmin ? " · ADMIN" : ""}
              </Text>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-2.5">
            <Stat n={u.watchCount} l="watcher" tone="accent" />
            <Stat n={u.devices.length} l="cihaz" />
            <Stat n={u.support.open} l="açık destek" />
          </View>

          {/* Abonelik */}
          <Section icon={CreditCard} title="Abonelik">
            {u.subscription ? (
              <Text className="text-muted text-sm leading-5">
                {u.subscription.plan.toUpperCase()} ·{" "}
                {u.subscription.interval
                  ? u.subscription.interval === "month"
                    ? "aylık"
                    : "yıllık"
                  : "—"}{" "}
                ·{" "}
                {u.subscription.amountCents !== null
                  ? money(u.subscription.amountCents, u.subscription.currency)
                  : "—"}{" "}
                · {u.subscription.status === "active" ? "aktif" : "iptal"}
                {u.subscription.cancelAtPeriodEnd ? " · dönem sonu iptal" : ""}
                {u.subscription.currentPeriodEnd
                  ? ` · ${day(u.subscription.currentPeriodEnd)}`
                  : ""}
              </Text>
            ) : (
              <Text className="text-muted text-sm">Aboneliği yok (ücretsiz).</Text>
            )}
          </Section>

          {/* Kanallar */}
          <Section icon={Bell} title="Bildirim kanalları">
            {u.channels && u.channels.enabled.length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {u.channels.telegram ? <Chip icon={Send} label="Telegram" /> : null}
                {u.channels.email ? <Chip icon={Mail} label="E-posta" /> : null}
                {u.channels.whatsapp ? <Chip icon={MessageCircle} label="WhatsApp" /> : null}
              </View>
            ) : (
              <Text className="text-muted text-sm">Ek kanal ayarlanmamış (yalnız push).</Text>
            )}
          </Section>

          {/* Cihazlar */}
          <Section icon={Smartphone} title="Cihazlar">
            {u.devices.length > 0 ? (
              u.devices.map((d) => (
                <Text key={d.id} className="text-muted text-sm py-0.5">
                  {d.platform} · {day(d.createdAt)}
                </Text>
              ))
            ) : (
              <Text className="text-muted text-sm">Kayıtlı cihaz yok.</Text>
            )}
          </Section>

          {/* Watcher'lar */}
          <Section icon={Bell} title={`Watcher'lar (${u.watches.length})`}>
            {u.watches.length > 0 ? (
              u.watches.slice(0, 20).map((w) => (
                <View key={w.id} className="py-1.5 border-b border-line">
                  <Text className="text-text text-sm" numberOfLines={2}>
                    {w.rawIntent}
                  </Text>
                  <Text className="text-muted text-xs mt-0.5">
                    her {w.frequencyMinutes} dk · {w.status === "active" ? "aktif" : "duraklatıldı"}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-muted text-sm">Watcher yok.</Text>
            )}
          </Section>

          {/* Destek */}
          <Section icon={LifeBuoy} title="Destek">
            <Text className="text-muted text-sm">
              {u.support.total} talep · {u.support.open} açık
            </Text>
          </Section>

          {/* Aksiyonlar */}
          <Text className="text-muted text-[10px] uppercase tracking-widest mt-6 mb-2">
            işlemler
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <ActBtn
              label={u.isAdmin ? "admin'i al" : "admin yap"}
              disabled={busy}
              onPress={() => setAdmin.mutate(!u.isAdmin)}
            />
            <ActBtn label="pro (ay)" disabled={busy} onPress={() => gift.mutate("month")} />
            <ActBtn label="pro (yıl)" disabled={busy} onPress={() => gift.mutate("year")} />
            <ActBtn label="abone iptal" disabled={busy} onPress={() => cancelSub.mutate()} />
            <ActBtn
              label="hesabı sil"
              tone="danger"
              disabled={busy}
              onPress={() =>
                Alert.alert("Hesabı sil", `${u.email ?? userId} kalıcı silinsin mi?`, [
                  { text: "Vazgeç", style: "cancel" },
                  { text: "Sil", style: "destructive", onPress: () => del.mutate() },
                ])
              }
            />
          </View>
        </ScrollView>
      ) : null}
    </ConsoleShell>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: { icon: typeof Bell; title: string; children: ReactNode }): ReactNode {
  return (
    <View className="bg-panel border border-line rounded-xl p-4 mt-3">
      <View className="flex-row items-center gap-2 mb-2">
        <Icon size={14} color="#818CF8" />
        <Text className="text-muted text-[10px] uppercase tracking-widest">{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Chip({ icon: Icon, label }: { icon: typeof Bell; label: string }): ReactNode {
  return (
    <View className="flex-row items-center gap-1.5 bg-ink border border-line rounded-full px-3 py-1.5">
      <Icon size={13} color="#16A34A" />
      <Text className="text-text text-xs font-medium">{label}</Text>
    </View>
  );
}
