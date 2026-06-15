import { ConsoleShell, Empty, ErrText, Loading } from "@/features/admin/ui";
import { api } from "@/lib/api";
import { useTheme } from "@/theme";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronRight, Search, SearchX } from "lucide-react-native";
import { type ReactNode, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

/**
 * ADR-149 — admin global arama: tek kutudan kullanıcı/watcher/abonelik bul (destek/ops kolaylığı).
 * Debounce'lu (300ms), ≥2 karakter; kullanıcı/abonelik satırı → 360° detaya gider.
 */
export default function AdminSearchScreen(): ReactNode {
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(raw.trim()), 300);
    return () => clearTimeout(t);
  }, [raw]);
  const enabled = q.length >= 2;
  const res = useQuery({
    queryKey: ["adminSearch", q],
    queryFn: () => api.adminSearch(q),
    enabled,
  });
  const d = res.data;
  const empty =
    !!d && d.users.length === 0 && d.watches.length === 0 && d.subscriptions.length === 0;

  return (
    <ConsoleShell title="Ara" sub="kullanıcı · watcher · abonelik">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-4 pb-12"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center gap-2 bg-panel border border-line rounded-xl px-3 mb-4">
          <Search size={16} color="#94A3B8" />
          <TextInput
            value={raw}
            onChangeText={setRaw}
            placeholder="E-posta, niyet veya id…"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            accessibilityLabel="Admin arama"
            className="flex-1 py-3 text-text text-sm"
          />
        </View>

        {!enabled ? (
          <Text className="text-muted text-[13px] px-1">En az 2 karakter yaz.</Text>
        ) : null}
        {enabled && res.isLoading ? <Loading /> : null}
        {res.error ? <ErrText e={res.error} /> : null}
        {enabled && empty ? (
          <Empty Icon={SearchX} title="Eşleşme yok" hint={`"${q}" için sonuç bulunamadı.`} />
        ) : null}

        {d && !empty ? (
          <>
            {d.users.length > 0 ? (
              <Section title={`Kullanıcılar (${d.users.length})`}>
                {d.users.map((u) => (
                  <Row
                    key={u.id}
                    title={u.email ?? "(e-posta yok)"}
                    sub={`${u.plan.toUpperCase()} · ${u.watchCount} watcher`}
                    onPress={() => router.push(`/admin/user/${u.id}`)}
                  />
                ))}
              </Section>
            ) : null}
            {d.watches.length > 0 ? (
              <Section title={`Watcher'lar (${d.watches.length})`}>
                {d.watches.map((w) => (
                  <Row
                    key={w.id}
                    title={w.rawIntent}
                    sub={`${w.userEmail ?? w.userId} · ${w.status === "active" ? "aktif" : "duraklı"}`}
                  />
                ))}
              </Section>
            ) : null}
            {d.subscriptions.length > 0 ? (
              <Section title={`Abonelikler (${d.subscriptions.length})`}>
                {d.subscriptions.map((s) => (
                  <Row
                    key={s.userId}
                    title={s.userEmail ?? s.userId}
                    sub={`${s.plan.toUpperCase()} · ${s.status}`}
                    onPress={() => router.push(`/admin/user/${s.userId}`)}
                  />
                ))}
              </Section>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </ConsoleShell>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }): ReactNode {
  return (
    <View className="mb-5">
      <Text className="text-muted text-[10px] uppercase tracking-widest mb-2">{title}</Text>
      <View className="gap-2">{children}</View>
    </View>
  );
}

function Row({
  title,
  sub,
  onPress,
}: {
  title: string;
  sub: string;
  onPress?: () => void;
}): ReactNode {
  const theme = useTheme();
  const content = (
    <View className="flex-row items-center gap-2">
      <View className="flex-1 min-w-0">
        <Text className="text-text text-sm font-medium" numberOfLines={1}>
          {title}
        </Text>
        <Text className="text-muted text-xs mt-0.5" numberOfLines={1}>
          {sub}
        </Text>
      </View>
      {onPress ? <ChevronRight size={16} color={theme.colors.mutedIcon} /> : null}
    </View>
  );
  return onPress ? (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      className="bg-panel border border-line rounded-xl p-3.5 active:bg-panel2 min-h-[44px] justify-center"
    >
      {content}
    </Pressable>
  ) : (
    <View className="bg-panel border border-line rounded-xl p-3.5">{content}</View>
  );
}
