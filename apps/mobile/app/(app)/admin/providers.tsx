import { ConsoleShell, ErrText, Loading } from "@/features/admin/ui";
import { type ProviderUsage, api } from "@/lib/api";
import { useTheme } from "@/theme";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, KeyRound } from "lucide-react-native";
import type { ReactNode } from "react";
import { Linking, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";

/**
 * Kaynaklar (ADR-095) — Supabase/Render/Vercel/DeepSeek/Groq hesaplarının GERÇEK
 * kullanım verisi: her kart sağlayıcının kendi API'sinden çekilir. Token tanımsızsa
 * kart bunu dürüstçe söyler ve hangi env'in ekleneceğini gösterir — uydurma metrik yok.
 */
export default function ProvidersScreen(): ReactNode {
  const q = useQuery({
    queryKey: ["adminProviders"],
    queryFn: api.adminProviders,
    staleTime: 60_000, // her kart 5 dış istek — gereksiz yeniden çekme olmasın
  });
  return (
    <ConsoleShell title="Kaynaklar" sub="API kullanım & kota">
      {q.isLoading ? <Loading /> : null}
      {q.error ? <ErrText e={q.error} /> : null}
      {q.data ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pt-4 pb-10"
          refreshControl={
            <RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} />
          }
        >
          <Text className="text-muted text-xs leading-5 mb-3">
            Veriler sağlayıcıların kendi API'lerinden canlı çekilir. Token tanımlı değilse kart gri
            kalır ve eksik ortam değişkenini söyler — buradaki hiçbir sayı tahmin değildir.
          </Text>
          {q.data.providers.map((p) => (
            <ProviderCard key={p.id} p={p} />
          ))}
        </ScrollView>
      ) : null}
    </ConsoleShell>
  );
}

function ProviderCard({ p }: { p: ProviderUsage }): ReactNode {
  const theme = useTheme();
  const tone = !p.configured
    ? { label: "token yok", cls: "bg-panel2", txt: theme.colors.muted2 }
    : p.ok
      ? { label: "canlı", cls: "bg-pos/10", txt: "#16A34A" }
      : { label: "hata", cls: "bg-neg/10", txt: "#DC2626" };
  return (
    <View
      className={`bg-panel border border-line rounded-2xl p-4 mb-2.5 ${p.configured ? "" : "opacity-70"}`}
    >
      <View className="flex-row items-center gap-2.5">
        <Text className="text-text text-[15px] font-semibold flex-1">{p.name}</Text>
        <View className={`px-2 py-0.5 rounded-full ${tone.cls}`}>
          <Text
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: tone.txt }}
          >
            {tone.label}
          </Text>
        </View>
        {p.consoleUrl ? (
          <Pressable
            onPress={() => void Linking.openURL(p.consoleUrl)}
            accessibilityRole="link"
            accessibilityLabel={`${p.name} konsolunu aç`}
            className="w-11 h-11 -mr-2 items-center justify-center rounded-full active:bg-panel2"
          >
            <ExternalLink size={16} color={theme.colors.mutedIcon} />
          </Pressable>
        ) : null}
      </View>

      {!p.configured ? (
        <View className="flex-row items-center gap-2 mt-2">
          <KeyRound size={13} color={theme.colors.mutedIcon} />
          <Text className="text-muted text-xs flex-1">{p.error}</Text>
        </View>
      ) : null}
      {p.configured && p.error ? <Text className="text-neg text-xs mt-2">{p.error}</Text> : null}

      {p.metrics.length > 0 ? (
        <View className="mt-2">
          {p.metrics.map((m) => (
            <View
              key={`${m.label}-${m.value}`}
              className="flex-row items-baseline justify-between py-1.5 border-b border-line"
            >
              <Text className="text-muted text-xs flex-1 min-w-0" numberOfLines={1}>
                {m.label}
              </Text>
              <Text className="text-text text-sm font-semibold">
                {m.value}
                {m.limit ? <Text className="text-muted2 text-[11px]"> {m.limit}</Text> : null}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      <Text className="text-muted2 text-[10px] mt-2">
        çekildi: {new Date(p.fetchedAt).toLocaleTimeString("tr-TR")}
      </Text>
    </View>
  );
}
