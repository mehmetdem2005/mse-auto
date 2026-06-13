import { ConsoleShell, ErrText, Loading } from "@/features/admin/ui";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";

// Eylem kodu → insan-okunur etiket (bilinmeyen kod ham gösterilir).
const ACTION_LABEL: Record<string, string> = {
  "user.ban": "Kullanıcı banlandı",
  "user.unban": "Ban kaldırıldı",
  "user.delete": "Hesap silindi",
  "user.gift_pro": "Pro hediye edildi",
  "user.cancel_sub": "Abonelik iptal edildi",
  "user.admin.grant": "Admin yetkisi verildi",
  "user.admin.revoke": "Admin yetkisi alındı",
  "broadcast.send": "Push yayını gönderildi",
  "broadcast.inactive": "Push yayını denendi (kanal pasif)",
};

const when = (iso: string): string =>
  new Date(iso).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });

// ADR-104: denetim günlüğü — değiştirilemez admin işlem kaydı (en yeni önce).
export default function AuditScreen(): ReactNode {
  const q = useQuery({ queryKey: ["adminAudit"], queryFn: api.adminAudit });
  return (
    <ConsoleShell title="Denetim Günlüğü" sub="son 200">
      <ScrollView className="flex-1" contentContainerClassName="px-5 pt-4 pb-12">
        {q.isLoading ? <Loading /> : null}
        {q.error ? <ErrText e={q.error} /> : null}
        {q.data?.length === 0 ? (
          <Text className="text-muted text-sm">Henüz denetim kaydı yok.</Text>
        ) : null}
        {q.data?.map((r) => (
          <View key={r.id} className="bg-panel border border-line rounded-xl p-3.5 mb-2">
            <View className="flex-row items-center justify-between gap-2">
              <Text className="text-text text-sm font-semibold flex-1 min-w-0" numberOfLines={1}>
                {ACTION_LABEL[r.action] ?? r.action}
              </Text>
              <Text className="text-muted2 text-[11px] shrink-0">{when(r.createdAt)}</Text>
            </View>
            <Text className="text-muted text-xs mt-1">
              {r.targetType}
              {r.targetId ? ` · ${r.targetId}` : ""} · admin: {r.actorId}
            </Text>
            {r.meta && Object.keys(r.meta).length > 0 ? (
              <Text className="text-muted2 text-[11px] mt-1" numberOfLines={2}>
                {Object.entries(r.meta)
                  .map(([k, v]) => `${k}: ${String(v)}`)
                  .join(" · ")}
              </Text>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </ConsoleShell>
  );
}
