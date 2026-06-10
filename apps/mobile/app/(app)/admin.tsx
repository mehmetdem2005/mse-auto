import { GradientHero, HeroOverlap } from "@/components/ui";
// NOT (ADR-053): Admin konsolu yalnız işletmeciye görünür — bilinçli olarak
// i18n kapsamı dışında (TR). Kullanıcı yüzeyleri 11 dilde.
import {
  type AdminSubscription,
  type AdminSupportTicket,
  type AdminTimeseriesPoint,
  type AdminUser,
  type AdminWatch,
  type BillingInterval,
  type Plans,
  api,
} from "@/lib/api";
import { qk } from "@/lib/query";
import { useReduceMotion } from "@/lib/reduce-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

type Tab = "analytics" | "stats" | "users" | "watches" | "subs" | "support" | "system";
const TABS: { id: Tab; label: string }[] = [
  { id: "analytics", label: "Analitik" },
  { id: "stats", label: "İstatistik" },
  { id: "users", label: "Kullanıcılar" },
  { id: "watches", label: "Watcher'lar" },
  { id: "subs", label: "Abonelik" },
  { id: "support", label: "Destek" },
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
  return <Skeleton rows={4} />;
}

/** M3 skeleton (shimmer/pulse) yükleme — reduce-motion'da sabit. */
function Skeleton({ rows = 3 }: { rows?: number }): ReactNode {
  const reduce = useReduceMotion();
  const opacity = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, opacity]);
  return (
    <View className="px-5 mt-4">
      {Array.from({ length: rows }, (_, i) => i).map((i) => (
        <Animated.View
          key={i}
          style={{ opacity: reduce ? 0.6 : opacity }}
          className="h-16 bg-panel2 rounded-2xl mb-3"
        />
      ))}
    </View>
  );
}

/** Tamsayıyı yumuşakça sayar (reduce-motion'da anında). */
function useCountUp(target: number, reduce: boolean): number {
  const [val, setVal] = useState(reduce ? target : 0);
  useEffect(() => {
    if (reduce || target <= 0) {
      setVal(target);
      return;
    }
    const dur = 700;
    const t0 = Date.now();
    let raf = 0;
    const tick = (): void => {
      const p = Math.min(1, (Date.now() - t0) / dur);
      setVal(Math.round(target * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reduce]);
  return val;
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
  const color = tone === "solid" ? "#FFFFFF" : tone === "danger" ? "#DC2626" : "#0F172A";
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
      <GradientHero title="Admin" subtitle="Whenly işletme konsolu" />
      <HeroOverlap>
        <View className="flex-row flex-wrap gap-1.5 px-5 pt-4 pb-3">
          {TABS.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              className={`rounded-lg px-3 py-2 ${t.id === tab ? "bg-accent" : "border border-line"}`}
            >
              <Text
                className="text-[11px] uppercase tracking-wider"
                style={{ color: t.id === tab ? "#FFFFFF" : "#64748B" }}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
        {tab === "analytics" ? <AnalyticsTab /> : null}
        {tab === "stats" ? <StatsTab /> : null}
        {tab === "users" ? <UsersTab /> : null}
        {tab === "watches" ? <WatchesTab /> : null}
        {tab === "subs" ? <SubsTab /> : null}
        {tab === "support" ? <SupportTab /> : null}
        {tab === "system" ? <SystemTab /> : null}
      </HeroOverlap>
    </View>
  );
}

// ----------------------------- Analitik + Fiyat -----------------------------

function AnalyticsTab(): ReactNode {
  const stats = useQuery({ queryKey: ["adminStats"], queryFn: api.adminStats });
  const prices = useQuery({ queryKey: ["adminPrices"], queryFn: api.adminPrices });
  const series = useQuery({
    queryKey: ["adminTimeseries", 30],
    queryFn: () => api.adminTimeseries(30),
  });
  if (stats.isLoading) return <Loading />;
  if (stats.error) return <ErrText e={stats.error} />;
  const s = stats.data;
  if (!s) return null;
  return (
    <ScrollView className="flex-1 px-5" contentContainerClassName="pb-8">
      <View className="flex-row flex-wrap gap-2.5">
        <Stat n={s.totalUsers} l="kullanıcı" />
        <Stat n={s.proUsers} l="pro abone" tone="accent" />
        <Stat n={s.freeUsers} l="ücretsiz" />
        <Stat n={s.activeWatchers} l="aktif watcher" tone="pos" />
      </View>
      <View className="bg-panel border border-line rounded-xl p-4 mt-3">
        <Text className="text-muted text-[10px] uppercase tracking-widest">MRR · aylık gelir</Text>
        <Text className="text-pos text-3xl font-extrabold mt-1">{money(s.mrrCents)}</Text>
        <Text className="text-muted text-xs mt-1">
          {money(s.mrrCents * 12)} / yıl · {s.subscriptionsByInterval.month} aylık ·{" "}
          {s.subscriptionsByInterval.year} yıllık
        </Text>
      </View>

      {/* Son 30 gün — gerçek tespit zaman serisinden alan grafiği (maket MRR slotu) */}
      {series.data && series.data.totals.checkRuns > 0 ? (
        <View className="bg-panel border border-line rounded-xl p-4 mt-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-muted text-[10px] uppercase tracking-widest">
              tespitler · son 30 gün
            </Text>
            <Text className="text-accent text-xs font-bold">
              {series.data.totals.detections} tespit
            </Text>
          </View>
          <AreaChart points={series.data.points.map((p) => p.detections)} />
        </View>
      ) : null}

      {/* Plan dağılımı — gerçek free/pro sayılarından donut */}
      <View className="bg-panel border border-line rounded-xl p-4 mt-3">
        <Text className="text-muted text-[10px] uppercase tracking-widest mb-3">plan dağılımı</Text>
        <View className="flex-row items-center gap-5">
          <Donut pro={s.proUsers} free={s.freeUsers} />
          <View className="gap-2">
            <LegendRow color="#6366F1" label={`Pro · ${s.proUsers}`} />
            <LegendRow color="#E2E8F0" label={`Ücretsiz · ${s.freeUsers}`} />
          </View>
        </View>
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
          placeholderTextColor="#94A3B8"
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

// ----------------------------- İstatistik & Grafik -----------------------------

const RANGES: { d: number; label: string }[] = [
  { d: 7, label: "7 gün" },
  { d: 14, label: "14 gün" },
  { d: 30, label: "30 gün" },
];

type SeriesKey = "checkRuns" | "detections" | "deliveries";
type Series = { key: SeriesKey; color: string; label: string };

const C = {
  checks: "#C7D2FE", // indigo-200 (arka plan: toplam kontrol)
  detect: "#6366F1", // accent (tespitler — kontrollerin alt kümesi)
  deliver: "#16A34A", // pos (teslimatlar)
} as const;

function StatsTab(): ReactNode {
  const [days, setDays] = useState(14);
  const q = useQuery({
    queryKey: ["adminTimeseries", days],
    queryFn: () => api.adminTimeseries(days),
  });

  return (
    <ScrollView className="flex-1 px-5" contentContainerClassName="pb-10">
      {/* Aralık seçici */}
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Zaman aralığı"
        className="flex-row gap-2 mt-1 mb-4"
      >
        {RANGES.map((r) => {
          const on = r.d === days;
          return (
            <Pressable
              key={r.d}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={r.label}
              onPress={() => setDays(r.d)}
              className={`rounded-full px-4 py-2 ${on ? "bg-accent" : "border border-line"}`}
            >
              <Text
                className="text-[11px] uppercase tracking-wider"
                style={{ color: on ? "#FFFFFF" : "#475569" }}
              >
                {r.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {q.isLoading ? <Skeleton rows={3} /> : null}
      {q.error ? <ErrText e={q.error} /> : null}
      {q.data ? <StatsBody data={q.data} /> : null}
    </ScrollView>
  );
}

function StatsBody({
  data,
}: {
  data: {
    points: AdminTimeseriesPoint[];
    totals: { checkRuns: number; detections: number; deliveries: number };
  };
}): ReactNode {
  const { points, totals } = data;
  const rate = totals.checkRuns > 0 ? Math.round((totals.detections / totals.checkRuns) * 100) : 0;
  // Delta (maket +% çipleri) — GERÇEK seriden: bugün vs dün
  const today = points[points.length - 1];
  const yesterday = points[points.length - 2];
  const delta = (a?: number, b?: number): string | undefined => {
    if (a === undefined || b === undefined) return undefined;
    const d = a - b;
    return d === 0 ? "dünle aynı" : d > 0 ? `dünden +${d}` : `dünden ${d}`;
  };

  return (
    <View>
      {/* Toplam kartları */}
      <View className="flex-row flex-wrap gap-2.5">
        <Stat
          n={totals.checkRuns}
          l="kontrol"
          tone="accent"
          sub={delta(today?.checkRuns, yesterday?.checkRuns)}
        />
        <Stat
          n={totals.detections}
          l="tespit"
          tone="pos"
          sub={delta(today?.detections, yesterday?.detections) ?? `%${rate} tespit oranı`}
        />
        <Stat
          n={totals.deliveries}
          l="teslimat"
          sub={delta(today?.deliveries, yesterday?.deliveries)}
        />
      </View>

      {/* Kontroller & Tespitler — bindirmeli sütun grafik */}
      <Text className="text-muted text-[10px] uppercase tracking-widest mt-6 mb-2">
        kontroller & tespitler / gün
      </Text>
      <View
        className="bg-panel border border-line rounded-2xl p-4"
        style={{
          shadowColor: "#0F172A",
          shadowOpacity: 0.05,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
          elevation: 1,
        }}
      >
        <BarChart
          key={`cr-${points.length}`}
          points={points}
          series={[
            { key: "checkRuns", color: C.checks, label: "Kontrol" },
            { key: "detections", color: C.detect, label: "Tespit" },
          ]}
        />
        <Legend
          items={[
            { color: C.checks, label: "Kontrol" },
            { color: C.detect, label: "Tespit" },
          ]}
        />
      </View>

      {/* Teslimatlar */}
      <Text className="text-muted text-[10px] uppercase tracking-widest mt-6 mb-2">
        teslimatlar / gün
      </Text>
      <View
        className="bg-panel border border-line rounded-2xl p-4"
        style={{
          shadowColor: "#0F172A",
          shadowOpacity: 0.05,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
          elevation: 1,
        }}
      >
        <BarChart
          key={`dl-${points.length}`}
          points={points}
          series={[{ key: "deliveries", color: C.deliver, label: "Teslimat" }]}
        />
      </View>

      {totals.checkRuns === 0 ? (
        <Text className="text-muted text-[11px] mt-3">
          Bu aralıkta henüz kayıt yok. Watcher'lar çalıştıkça grafik dolacaktır.
        </Text>
      ) : null}
    </View>
  );
}

/** Material 3 sütun grafik — RN View'leri; bindirmeli seriler (tespit ⊆ kontrol). */
function BarChart({
  points,
  series,
  height = 132,
}: {
  points: AdminTimeseriesPoint[];
  series: Series[];
  height?: number;
}): ReactNode {
  const reduce = useReduceMotion();
  const anim = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) {
      anim.setValue(1);
      return;
    }
    anim.setValue(0);
    const a = Animated.timing(anim, { toValue: 1, duration: 650, useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [reduce, anim]);

  const max = Math.max(1, ...points.flatMap((p) => series.map((s) => p[s.key])));
  // Eksen yoğunluğunu seyrelt: en çok ~7 etiket göster.
  const step = Math.max(1, Math.ceil(points.length / 7));

  return (
    <View>
      <Text className="text-muted text-[10px] mb-2">en yüksek: {max.toLocaleString("tr-TR")}</Text>
      <View className="flex-row items-end" style={{ height }}>
        {points.map((p) => {
          const a11y = `${dayShort(p.date)}: ${p.checkRuns} kontrol, ${p.detections} tespit, ${p.deliveries} teslimat`;
          return (
            <View
              key={p.date}
              accessibilityLabel={a11y}
              className="flex-1 items-center justify-end"
              style={{ height }}
            >
              <View style={{ height, width: "100%", justifyContent: "flex-end" }}>
                {series.map((s) => {
                  const target = (p[s.key] / max) * height;
                  const h = anim.interpolate({ inputRange: [0, 1], outputRange: [0, target] });
                  return (
                    <Animated.View
                      key={s.key}
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: "16%",
                        right: "16%",
                        height: h,
                        backgroundColor: s.color,
                        borderTopLeftRadius: 4,
                        borderTopRightRadius: 4,
                      }}
                    />
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
      {/* X ekseni etiketleri (seyrek) */}
      <View className="flex-row mt-1.5">
        {points.map((p, i) => (
          <View key={p.date} className="flex-1 items-center">
            <Text className="text-muted2 text-[9px]">{i % step === 0 ? dayShort(p.date) : ""}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Legend({ items }: { items: { color: string; label: string }[] }): ReactNode {
  return (
    <View className="flex-row gap-4 mt-3">
      {items.map((it) => (
        <View key={it.label} className="flex-row items-center gap-1.5">
          <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: it.color }} />
          <Text className="text-muted text-[11px]">{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

/** "2026-06-09" → "9 Haz" (kısa, eksen etiketi). */
function dayShort(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", timeZone: "UTC" });
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
          <View className="flex-row items-center gap-3">
            <View className="w-9 h-9 rounded-full bg-accent/10 items-center justify-center">
              <Text className="text-accent text-sm font-bold">
                {(u.email ?? "?").charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text className="text-text text-sm flex-1" numberOfLines={1}>
              {u.email ?? "(e-posta yok)"}
            </Text>
          </View>
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

// ----------------------------- Destek (ADR-044) -----------------------------

function SupportTab(): ReactNode {
  const [selected, setSelected] = useState<AdminSupportTicket | null>(null);
  const q = useQuery({
    queryKey: ["adminSupport"],
    queryFn: api.adminSupport,
    refetchInterval: 10000, // yeni talepler için kısa aralıklı yoklama
  });
  if (q.isLoading) return <Loading />;
  if (q.error) return <ErrText e={q.error} />;
  if (selected) {
    return (
      <SupportThreadAdmin
        ticket={selected}
        onBack={() => {
          setSelected(null);
          void q.refetch();
        }}
      />
    );
  }
  const rows = q.data ?? [];
  const openCount = rows.filter((t) => t.status === "open").length;
  return (
    <FlatList
      data={rows}
      keyExtractor={(t) => t.id}
      contentContainerClassName="px-5 pb-8"
      onRefresh={() => void q.refetch()}
      refreshing={q.isRefetching}
      ItemSeparatorComponent={() => <View className="h-3" />}
      ListHeaderComponent={
        <Text className="text-muted text-[10px] uppercase tracking-widest mb-2">
          {openCount} açık talep
        </Text>
      }
      ListEmptyComponent={<Text className="text-muted mt-6">destek talebi yok.</Text>}
      renderItem={({ item: t }) => (
        <Pressable
          onPress={() => setSelected(t)}
          accessibilityRole="button"
          accessibilityLabel={`Destek talebi: ${t.userEmail ?? t.userId}, ${t.status === "open" ? "açık" : "kapalı"}`}
          className="bg-panel border border-line rounded-xl p-4 active:bg-panel2"
        >
          <View className="flex-row items-center gap-2">
            <Text
              className="text-[11px] font-semibold"
              style={{ color: t.status === "open" ? "#16A34A" : "#64748B" }}
            >
              {t.status === "open" ? "AÇIK" : "kapalı"}
            </Text>
            <Text className="text-muted text-[11px]">{t.kind === "live" ? "canlı" : "sorun"}</Text>
            <Text className="text-muted text-[11px] ml-auto">{day(t.createdAt)}</Text>
          </View>
          <Text className="text-text text-sm mt-1" numberOfLines={1}>
            {t.userEmail ?? t.userId}
          </Text>
          {t.lastMessage ? (
            <Text className="text-muted text-xs mt-1" numberOfLines={2}>
              {t.lastMessage}
            </Text>
          ) : null}
        </Pressable>
      )}
    />
  );
}

function SupportThreadAdmin({
  ticket,
  onBack,
}: { ticket: AdminSupportTicket; onBack: () => void }): ReactNode {
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const q = useQuery({
    queryKey: ["adminSupportThread", ticket.id],
    queryFn: () => api.adminSupportMessages(ticket.id),
    refetchInterval: 5000,
  });
  const reply = useMutation({
    mutationFn: (body: string) => api.adminSupportReply(ticket.id, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["adminSupportThread", ticket.id] }),
  });
  const close = useMutation({
    mutationFn: () => api.adminSupportClose(ticket.id),
    onSuccess: onBack,
  });

  return (
    <View className="flex-1">
      <View className="flex-row items-center gap-2 px-5 pb-2">
        <ActBtn label="geri" onPress={onBack} />
        <Text className="text-text text-sm flex-1" numberOfLines={1}>
          {ticket.userEmail ?? ticket.userId}
        </Text>
        {ticket.status === "open" ? (
          <ActBtn
            label="kapat"
            tone="danger"
            disabled={close.isPending}
            onPress={() => close.mutate()}
          />
        ) : null}
      </View>
      <ScrollView className="flex-1 px-5">
        {(q.data ?? []).map((m) => (
          <View
            key={m.id}
            className={`max-w-[85%] rounded-2xl px-4 py-3 mb-2.5 ${
              m.sender === "admin"
                ? "self-end bg-accent rounded-br-md"
                : "self-start bg-panel border border-line rounded-bl-md"
            }`}
          >
            <Text className={m.sender === "admin" ? "text-white text-sm" : "text-text text-sm"}>
              {m.body}
            </Text>
          </View>
        ))}
        <View className="h-4" />
      </ScrollView>
      <View className="flex-row items-end gap-2 px-5 py-3 border-t border-line">
        <TextInput
          value={draft}
          onChangeText={setDraft}
          multiline
          placeholder="Yanıt yaz…"
          placeholderTextColor="#94A3B8"
          accessibilityLabel="Destek yanıtı yaz"
          className="flex-1 bg-panel border border-line rounded-2xl px-4 py-3 text-text text-sm max-h-28"
        />
        <ActBtn
          label="gönder"
          tone="solid"
          disabled={!draft.trim() || reply.isPending}
          onPress={() => {
            const t = draft.trim();
            if (t) {
              setDraft("");
              reply.mutate(t);
            }
          }}
        />
      </View>
    </View>
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
              style={{ color: s.status === "active" ? "#16A34A" : "#64748B" }}
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

/** Alan grafiği (maket: MRR eğrisi slotu) — gerçek günlük seriden SVG path. */
function AreaChart({
  points,
  width = 300,
  height = 72,
}: {
  points: number[];
  width?: number;
  height?: number;
}): ReactNode {
  if (points.length < 2) return null;
  const max = Math.max(1, ...points);
  const stepX = width / (points.length - 1);
  const y = (v: number) => height - (v / max) * (height - 6) - 2;
  const line = points.map((v, i) => `${i === 0 ? "M" : "L"}${i * stepX},${y(v)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      <Path d={area} fill="#6366F1" opacity={0.12} />
      <Path d={line} stroke="#6366F1" strokeWidth={2} fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

/** Plan dağılımı donut'u — react-native-svg, gerçek sayılarla. */
function Donut({ pro, free }: { pro: number; free: number }): ReactNode {
  const total = Math.max(1, pro + free);
  const size = 92;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const proLen = (pro / total) * c;
  return (
    <View accessibilityLabel={`Plan dağılımı: ${pro} pro, ${free} ücretsiz`}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#E2E8F0"
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#6366F1"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${proLen} ${c - proLen}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View className="absolute inset-0 items-center justify-center">
        <Text className="text-text text-sm font-bold">%{Math.round((pro / total) * 100)}</Text>
        <Text className="text-muted text-[9px]">pro</Text>
      </View>
    </View>
  );
}

function LegendRow({ color, label }: { color: string; label: string }): ReactNode {
  return (
    <View className="flex-row items-center gap-2">
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
      <Text className="text-text text-xs">{label}</Text>
    </View>
  );
}

// ----------------------------- Sistem -----------------------------

function Stat({
  n,
  l,
  tone,
  sub,
}: { n: number; l: string; tone?: "accent" | "pos"; sub?: string }): ReactNode {
  const reduce = useReduceMotion();
  const shown = useCountUp(n, reduce);
  const color = tone === "accent" ? "text-accent" : tone === "pos" ? "text-pos" : "text-text";
  return (
    <View
      className="bg-panel border border-line rounded-2xl p-4 flex-1 min-w-[44%]"
      style={{
        shadowColor: "#0F172A",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 1,
      }}
    >
      <Text className={`${color} text-2xl font-extrabold`}>{shown.toLocaleString("tr-TR")}</Text>
      <Text className="text-muted text-[10px] uppercase tracking-widest mt-1">{l}</Text>
      {sub ? <Text className="text-muted text-[11px] mt-0.5">{sub}</Text> : null}
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
        <Stat n={s.counts.activeWatches} l="aktif watcher" tone="pos" />
        <Stat n={s.counts.subscriptions} l="abonelik" />
        <Stat n={s.counts.deliveries} l="teslimat" />
        <Stat n={s.counts.checkRuns} l="kontrol" tone="accent" />
      </View>

      <Text className="text-muted text-[10px] uppercase tracking-widest mt-6 mb-2">
        sistem sağlığı
      </Text>
      <View className="bg-panel border border-line rounded-xl p-4">
        {s.services.map((sv) => (
          <View
            key={sv.name}
            className="flex-row items-center justify-between py-2 border-b border-line"
          >
            <Text className="text-text text-xs">{sv.name}</Text>
            <View className={`px-2 py-1 rounded-full ${sv.ok ? "bg-pos/10" : "bg-neg/10"}`}>
              <Text
                className="text-[10px] font-semibold"
                style={{ color: sv.ok ? "#16A34A" : "#DC2626" }}
              >
                {sv.ok ? "Sağlıklı" : "Yapılandırılmadı"}
              </Text>
            </View>
          </View>
        ))}
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
