import {
  type AdminSubscription,
  type AdminUser,
  type AdminWatch,
  type BillingInterval,
  type Plans,
  api,
} from "@/lib/api";
import { qk } from "@/lib/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { type ReactNode, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

type Tab = "analytics" | "users" | "watches" | "subs" | "system";
const TABS: { id: Tab; label: string }[] = [
  { id: "analytics", label: "Analitik" },
  { id: "users", label: "Kullanıcılar" },
  { id: "watches", label: "Watcher'lar" },
  { id: "subs", label: "Abonelik" },
  { id: "system", label: "Sistem" },
];

function money(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}
const day = (iso: string): string => new Date(iso).toLocaleDateString("tr-TR");

function Loading(): ReactNode {
  return <ActivityIndicator color="#ffb020" className="mt-10" />;
}
function ErrText({ e }: { e: unknown }): ReactNode {
  return (
    <Text className="text-neg px-5 mt-6">{e instanceof Error ? e.message : "yüklenemedi"}</Text>
  );
}

function ActBtn({
  label,
  onPress,
  tone = "ghost",
  disabled,
}: {
  label: string;
  onPress: () => void;
  tone?: "solid" | "ghost" | "danger";
  disabled?: boolean;
}): ReactNode {
  const wrap =
    tone === "solid" ? "bg-accent" : tone === "danger" ? "border border-neg" : "border border-line";
  const color = tone === "solid" ? "#1a1205" : tone === "danger" ? "#e5614d" : "#e7eaef";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`rounded-md px-2.5 py-1.5 ${wrap} ${disabled ? "opacity-40" : ""}`}
    >
      <Text className="text-[10px] uppercase tracking-wider" style={{ color }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function AdminScreen(): ReactNode {
  const [tab, setTab] = useState<Tab>("analytics");
  return (
    <View className="flex-1 bg-ink">
      <View className="flex-row flex-wrap gap-1.5 px-5 pt-4 pb-3">
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setTab(t.id)}
            className={`rounded-lg px-3 py-2 ${t.id === tab ? "bg-accent" : "border border-line"}`}
          >
            <Text
              className="text-[11px] uppercase tracking-wider"
              style={{ color: t.id === tab ? "#1a1205" : "#828c9a" }}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {tab === "analytics" ? <AnalyticsTab /> : null}
      {tab === "users" ? <UsersTab /> : null}
      {tab === "watches" ? <WatchesTab /> : null}
      {tab === "subs" ? <SubsTab /> : null}
      {tab === "system" ? <SystemTab /> : null}
    </View>
  );
}

// ----------------------------- Analitik + Fiyat -----------------------------

function AnalyticsTab(): ReactNode {
  const stats = useQuery({ queryKey: ["adminStats"], queryFn: api.adminStats });
  const prices = useQuery({ queryKey: ["adminPrices"], queryFn: api.adminPrices });
  if (stats.isLoading) return <Loading />;
  if (stats.error) return <ErrText e={stats.error} />;
  const s = stats.data;
  if (!s) return null;
  return (
    <ScrollView className="flex-1 px-5" contentContainerClassName="pb-8">
      <View className="flex-row flex-wrap gap-2.5">
        <Stat n={s.totalUsers} l="kullanıcı" />
        <Stat n={s.proUsers} l="pro abone" />
        <Stat n={s.freeUsers} l="ücretsiz" />
        <Stat n={s.activeWatchers} l="aktif watcher" />
      </View>
      <View className="bg-panel border border-line rounded-xl p-4 mt-3">
        <Text className="text-muted text-[10px] uppercase tracking-widest">MRR · aylık gelir</Text>
        <Text className="text-pos text-3xl font-extrabold mt-1">{money(s.mrrCents)}</Text>
        <Text className="text-muted text-xs mt-1">
          {money(s.mrrCents * 12)} / yıl · {s.subscriptionsByInterval.month} aylık ·{" "}
          {s.subscriptionsByInterval.year} yıllık
        </Text>
      </View>

      <Text className="text-muted text-[10px] uppercase tracking-widest mt-6 mb-2">
        fiyatlandırma
      </Text>
      <PriceEditor interval="month" prices={prices.data} onSaved={() => prices.refetch()} />
      <PriceEditor interval="year" prices={prices.data} onSaved={() => prices.refetch()} />
      <Text className="text-muted text-[11px] mt-2">
        Fiyat değişimi yalnız yeni satın alma/yenilemeler için geçerlidir; mevcut aboneler dönem
        sonuna dek eski fiyattan devam eder.
      </Text>
    </ScrollView>
  );
}

function PriceEditor({
  interval,
  prices,
  onSaved,
}: {
  interval: BillingInterval;
  prices: Plans | undefined;
  onSaved: () => void;
}): ReactNode {
  const current = prices?.prices.find((p) => p.interval === interval) ?? null;
  const [val, setVal] = useState("");
  useEffect(() => {
    if (current) setVal((current.amountCents / 100).toString());
  }, [current]);
  const save = useMutation({
    mutationFn: () =>
      api.setPrice(interval, Math.round(Number(val) * 100), current?.currency ?? "usd"),
    onSuccess: onSaved,
  });
  return (
    <View className="bg-panel border border-line rounded-xl p-4 mb-2.5">
      <Text className="text-text text-sm uppercase mb-2">
        pro · {interval === "month" ? "aylık" : "yıllık"}
      </Text>
      <View className="flex-row items-center gap-2">
        <TextInput
          value={val}
          onChangeText={setVal}
          keyboardType="decimal-pad"
          placeholder="4.99"
          placeholderTextColor="#5c6470"
          className="flex-1 bg-ink border border-line rounded-lg px-3 py-2 text-text"
        />
        <ActBtn
          label="kaydet"
          tone="solid"
          disabled={save.isPending || !val}
          onPress={() => save.mutate()}
        />
      </View>
      <Text className="text-muted text-xs mt-2">
        şu an: {current ? money(current.amountCents, current.currency) : "—"}
      </Text>
    </View>
  );
}

// ----------------------------- Kullanıcılar -----------------------------

function UsersTab(): ReactNode {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: qk.adminUsers, queryFn: api.adminUsers });
  const done = (): void => {
    void qc.invalidateQueries({ queryKey: qk.adminUsers });
  };
  const setAdmin = useMutation({
    mutationFn: (v: { id: string; on: boolean }) => api.setUserAdmin(v.id, v.on),
    onSuccess: done,
  });
  const gift = useMutation({
    mutationFn: (v: { id: string; i: BillingInterval }) => api.giftPro(v.id, v.i),
    onSuccess: done,
  });
  const cancelSub = useMutation({
    mutationFn: (id: string) => api.cancelUserSub(id),
    onSuccess: done,
  });
  const del = useMutation({ mutationFn: (id: string) => api.deleteUser(id), onSuccess: done });
  const busy = setAdmin.isPending || gift.isPending || cancelSub.isPending || del.isPending;

  if (q.isLoading) return <Loading />;
  if (q.error) return <ErrText e={q.error} />;

  return (
    <FlatList
      data={q.data ?? []}
      keyExtractor={(u) => u.id}
      contentContainerClassName="px-5 pb-8"
      onRefresh={() => void q.refetch()}
      refreshing={q.isRefetching}
      ItemSeparatorComponent={() => <View className="h-3" />}
      ListEmptyComponent={<Text className="text-muted mt-6">kullanıcı yok.</Text>}
      renderItem={({ item: u }) => (
        <View className="bg-panel border border-line rounded-xl p-4">
          <Text className="text-text text-sm" numberOfLines={1}>
            {u.email ?? "(e-posta yok)"}
          </Text>
          <Text className="text-muted text-xs mt-1">
            {u.plan.toUpperCase()} · {u.watchCount} watcher · {day(u.createdAt)}
            {u.isAdmin ? " · ADMIN" : ""}
          </Text>
          <View className="flex-row flex-wrap gap-2 mt-3">
            <ActBtn
              label={u.isAdmin ? "admin'i al" : "admin yap"}
              disabled={busy}
              onPress={() => setAdmin.mutate({ id: u.id, on: !u.isAdmin })}
            />
            <ActBtn
              label="pro (ay)"
              disabled={busy}
              onPress={() => gift.mutate({ id: u.id, i: "month" })}
            />
            <ActBtn
              label="pro (yıl)"
              disabled={busy}
              onPress={() => gift.mutate({ id: u.id, i: "year" })}
            />
            <ActBtn label="abone iptal" disabled={busy} onPress={() => cancelSub.mutate(u.id)} />
            <ActBtn
              label="sil"
              tone="danger"
              disabled={busy}
              onPress={() =>
                Alert.alert("Hesabı sil", `${u.email ?? u.id} kalıcı silinsin mi?`, [
                  { text: "Vazgeç", style: "cancel" },
                  { text: "Sil", style: "destructive", onPress: () => del.mutate(u.id) },
                ])
              }
            />
          </View>
        </View>
      )}
    />
  );
}

// ----------------------------- Watcher'lar -----------------------------

function WatchesTab(): ReactNode {
  const qc = useQueryClient();
  const router = useRouter();
  const q = useQuery({ queryKey: qk.adminWatches, queryFn: api.adminWatches });
  const done = (): void => {
    void qc.invalidateQueries({ queryKey: qk.adminWatches });
  };
  const setStatus = useMutation({
    mutationFn: (v: { id: string; s: "active" | "paused" }) => api.setWatchStatus(v.id, v.s),
    onSuccess: done,
  });
  const del = useMutation({ mutationFn: (id: string) => api.deleteWatch(id), onSuccess: done });
  const busy = setStatus.isPending || del.isPending;

  if (q.isLoading) return <Loading />;
  if (q.error) return <ErrText e={q.error} />;

  return (
    <FlatList
      data={q.data ?? []}
      keyExtractor={(w) => w.id}
      contentContainerClassName="px-5 pb-8"
      onRefresh={() => void q.refetch()}
      refreshing={q.isRefetching}
      ItemSeparatorComponent={() => <View className="h-3" />}
      ListEmptyComponent={<Text className="text-muted mt-6">watcher yok.</Text>}
      renderItem={({ item: w }: { item: AdminWatch }) => (
        <View className="bg-panel border border-line rounded-xl p-4">
          <Text className="text-text text-sm" numberOfLines={2}>
            {w.rawIntent}
          </Text>
          <Text className="text-muted text-xs mt-1" numberOfLines={1}>
            {w.userEmail ?? w.userId} · her {w.frequencyMinutes} dk ·{" "}
            {w.status === "active" ? "aktif" : "duraklatıldı"}
          </Text>
          <View className="flex-row flex-wrap gap-2 mt-3">
            <ActBtn
              label="araştırma"
              tone="solid"
              onPress={() => router.push(`/watcher/${w.id}?admin=1`)}
            />
            <ActBtn
              label={w.status === "active" ? "duraklat" : "aktifleştir"}
              disabled={busy}
              onPress={() =>
                setStatus.mutate({ id: w.id, s: w.status === "active" ? "paused" : "active" })
              }
            />
            <ActBtn
              label="sil"
              tone="danger"
              disabled={busy}
              onPress={() =>
                Alert.alert("Watcher sil", "Bu watcher silinsin mi?", [
                  { text: "Vazgeç", style: "cancel" },
                  { text: "Sil", style: "destructive", onPress: () => del.mutate(w.id) },
                ])
              }
            />
          </View>
        </View>
      )}
    />
  );
}

// ----------------------------- Abonelikler -----------------------------

function SubsTab(): ReactNode {
  const q = useQuery({ queryKey: qk.adminSubscriptions, queryFn: api.adminSubscriptions });
  if (q.isLoading) return <Loading />;
  if (q.error) return <ErrText e={q.error} />;
  return (
    <FlatList
      data={q.data ?? []}
      keyExtractor={(s) => s.userId}
      contentContainerClassName="px-5 pb-8"
      onRefresh={() => void q.refetch()}
      refreshing={q.isRefetching}
      ItemSeparatorComponent={() => <View className="h-3" />}
      ListEmptyComponent={<Text className="text-muted mt-6">abonelik yok.</Text>}
      renderItem={({ item: s }: { item: AdminSubscription }) => (
        <View className="bg-panel border border-line rounded-xl p-4">
          <View className="flex-row justify-between">
            <Text className="text-text text-sm" numberOfLines={1}>
              {s.userEmail ?? s.userId}
            </Text>
            <Text
              className="text-xs"
              style={{ color: s.status === "active" ? "#46c99a" : "#828c9a" }}
            >
              {s.status === "active" ? "aktif" : "iptal"}
            </Text>
          </View>
          <Text className="text-muted text-xs mt-1">
            {s.plan.toUpperCase()} ·{" "}
            {s.interval ? (s.interval === "month" ? "aylık" : "yıllık") : "—"} ·{" "}
            {s.amountCents !== null ? money(s.amountCents, s.currency) : "—"}
            {s.cancelAtPeriodEnd ? " · dönem sonu iptal" : ""}
            {s.currentPeriodEnd ? ` · ${day(s.currentPeriodEnd)}` : ""}
          </Text>
        </View>
      )}
    />
  );
}

// ----------------------------- Sistem -----------------------------

function Stat({ n, l }: { n: number; l: string }): ReactNode {
  return (
    <View className="bg-panel border border-line rounded-xl p-4 flex-1 min-w-[44%]">
      <Text className="text-text text-2xl font-extrabold">{n}</Text>
      <Text className="text-muted text-[10px] uppercase tracking-widest mt-1">{l}</Text>
    </View>
  );
}

function SystemTab(): ReactNode {
  const q = useQuery({ queryKey: qk.adminSystem, queryFn: api.adminSystem });
  if (q.isLoading) return <Loading />;
  if (q.error) return <ErrText e={q.error} />;
  const s = q.data;
  if (!s) return null;
  return (
    <ScrollView className="flex-1 px-5" contentContainerClassName="pb-8">
      <Text className="text-muted text-xs mb-3">
        backend: {s.backend} · {day(s.now)}
      </Text>
      <View className="flex-row flex-wrap gap-2.5">
        <Stat n={s.counts.users} l="kullanıcı" />
        <Stat n={s.counts.watches} l="watcher" />
        <Stat n={s.counts.activeWatches} l="aktif watcher" />
        <Stat n={s.counts.subscriptions} l="abonelik" />
        <Stat n={s.counts.deliveries} l="teslimat" />
        <Stat n={s.counts.checkRuns} l="kontrol" />
      </View>

      <Text className="text-muted text-[10px] uppercase tracking-widest mt-6 mb-2">
        son kontroller
      </Text>
      <View className="bg-panel border border-line rounded-xl p-4">
        {s.recentCheckRuns.length > 0 ? (
          s.recentCheckRuns.map((r) => (
            <View key={r.id} className="py-2 border-b border-line">
              <Text className="text-text text-xs">
                {r.decision ? "● tespit" : "○ yok"}
                {r.confidence !== null ? ` (${Math.round(r.confidence * 100)}%)` : ""}
              </Text>
              <Text className="text-muted text-[11px] mt-0.5" numberOfLines={1}>
                {day(r.ranAt)}
                {r.summary ? ` · ${r.summary}` : ""}
              </Text>
            </View>
          ))
        ) : (
          <Text className="text-muted text-xs">kayıt yok.</Text>
        )}
      </View>

      <Text className="text-muted text-[10px] uppercase tracking-widest mt-6 mb-2">
        son teslimatlar
      </Text>
      <View className="bg-panel border border-line rounded-xl p-4">
        {s.recentDeliveries.length > 0 ? (
          s.recentDeliveries.map((d) => (
            <View key={d.id} className="py-2 border-b border-line">
              <Text className="text-text text-xs">
                {d.channel} · {d.status}
              </Text>
              <Text className="text-muted text-[11px] mt-0.5">
                {d.sentAt ? day(d.sentAt) : "—"}
              </Text>
            </View>
          ))
        ) : (
          <Text className="text-muted text-xs">kayıt yok.</Text>
        )}
      </View>
    </ScrollView>
  );
}
