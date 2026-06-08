import { Btn } from "@/components/ui";
import { type BillingInterval, api } from "@/lib/api";
import { qk } from "@/lib/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

function money(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View className="flex-row justify-between py-2.5 border-b border-line">
      <Text className="text-muted text-xs">{k}</Text>
      <Text className="text-text text-xs">{v}</Text>
    </View>
  );
}

export default function SubscriptionScreen() {
  const qc = useQueryClient();
  const sub = useQuery({ queryKey: qk.subscription, queryFn: api.subscription });
  const plans = useQuery({ queryKey: qk.plans, queryFn: api.plans });

  const subscribe = useMutation({
    mutationFn: (interval: BillingInterval) => api.subscribe(interval),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.subscription }),
  });
  const cancel = useMutation({
    mutationFn: () => api.cancel(),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.subscription }),
  });

  if (sub.isLoading) {
    return (
      <View className="flex-1 bg-ink">
        <ActivityIndicator color="#ffb020" className="mt-10" />
      </View>
    );
  }
  const s = sub.data;
  const d = s?.subscription ?? null;

  return (
    <ScrollView className="flex-1 bg-ink px-5 pt-4">
      <View className="bg-panel border border-line rounded-xl p-5 mb-4">
        <Text className="text-muted text-[10px] tracking-widest uppercase mb-2">mevcut plan</Text>
        <Text
          className="text-3xl font-extrabold uppercase"
          style={{ color: s?.plan === "pro" ? "#ffb020" : "#828c9a" }}
        >
          {s?.plan ?? "—"}
        </Text>
        {s ? (
          <Text className="text-muted text-xs mt-2">
            {s.usage.activeWatches}/{s.limits.maxActiveWatches} watcher · en sık{" "}
            {s.limits.minFrequencyMinutes} dk
          </Text>
        ) : null}
      </View>

      {d ? (
        <View className="bg-panel border border-line rounded-xl p-5 mb-4">
          <Text className="text-muted text-[10px] tracking-widest uppercase mb-3">faturalama</Text>
          <Row k="dönem" v={d.interval === "month" ? "aylık" : "yıllık"} />
          <Row k="tutar" v={money(d.amountCents, d.currency)} />
          <Row
            k="durum"
            v={
              d.status === "active"
                ? d.cancelAtPeriodEnd
                  ? "dönem sonunda iptal"
                  : "aktif"
                : "iptal"
            }
          />
          <Row k="yenilenme" v={new Date(d.currentPeriodEnd).toLocaleDateString("tr-TR")} />
          {d.status === "active" && !d.cancelAtPeriodEnd ? (
            <View className="mt-3">
              <Btn tone="danger" onPress={() => cancel.mutate()} disabled={cancel.isPending}>
                <Text className="text-neg text-xs uppercase tracking-wider">
                  dönem sonunda iptal et
                </Text>
              </Btn>
            </View>
          ) : null}
        </View>
      ) : (
        <View className="mb-4">
          <Text className="text-muted text-[10px] tracking-widest uppercase mb-2">planlar</Text>
          {plans.data?.prices.map((p) => (
            <View
              key={`${p.plan}-${p.interval}`}
              className="flex-row items-center justify-between bg-panel border border-line rounded-xl p-4 mb-2"
            >
              <View>
                <Text className="text-accent text-sm uppercase">
                  {p.plan} · {p.interval === "month" ? "aylık" : "yıllık"}
                </Text>
                <Text className="text-muted text-xs mt-1">
                  {money(p.amountCents, p.currency)} / {p.interval === "month" ? "ay" : "yıl"}
                </Text>
              </View>
              <Btn onPress={() => subscribe.mutate(p.interval)} disabled={subscribe.isPending}>
                <Text className="text-ink text-xs font-semibold uppercase tracking-wider">
                  abone ol
                </Text>
              </Btn>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
