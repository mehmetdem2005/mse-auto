// Abonelik — maket düzeni (hero plan kartı + kullanım barı + faturalama), gerçek veri.
import { EnterItem } from "@/components/motion";
import { Badge, Btn } from "@/components/ui";
import { GradientHero, HeroOverlap, SkeletonCard } from "@/components/ui";
import { api } from "@/lib/api";
import { qk } from "@/lib/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Crown, FileText, Gauge, Music, SlidersHorizontal } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";

function money(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function Row({ k, v, tone }: { k: string; v: string; tone?: "pos" | "neg" }) {
  return (
    <View className="flex-row justify-between items-center py-3 border-b border-line">
      <Text className="text-muted text-xs">{k}</Text>
      {tone ? (
        <Badge tone={tone}>{v}</Badge>
      ) : (
        <Text className="text-text text-xs font-medium">{v}</Text>
      )}
    </View>
  );
}

export default function SubscriptionScreen() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const sub = useQuery({ queryKey: qk.subscription, queryFn: api.subscription });
  const plans = useQuery({ queryKey: qk.plans, queryFn: api.plans });

  const cancel = useMutation({
    mutationFn: () => api.cancel(),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.subscription }),
  });

  if (sub.isLoading) {
    return (
      <View className="flex-1 bg-ink">
        <GradientHero title={t("tabs.subscription")} />
        <HeroOverlap>
          <View className="px-5 pt-5">
            <SkeletonCard />
            <SkeletonCard />
          </View>
        </HeroOverlap>
      </View>
    );
  }
  const s = sub.data;
  const d = s?.subscription ?? null;
  const isPro = s?.plan === "pro";
  const used = s?.usage.activeWatches ?? 0;
  const max = s?.limits.maxActiveWatches ?? 1;
  const pct = Math.min(100, Math.round((used / Math.max(1, max)) * 100));

  return (
    <View className="flex-1 bg-ink">
      <GradientHero
        title={t("tabs.subscription")}
        subtitle={isPro ? t("sub.proName") : t("sub.freeName")}
      />
      <HeroOverlap>
        <ScrollView className="flex-1 px-5" contentContainerClassName="pt-5 pb-10">
          {/* Hero plan kartı */}
          <EnterItem index={0}>
            <View
              className={`rounded-2xl p-5 border ${
                isPro ? "bg-accent/10 border-accent/30" : "bg-panel border-line"
              }`}
              style={{
                shadowColor: "#6366F1",
                shadowOpacity: isPro ? 0.15 : 0.05,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
                elevation: 3,
              }}
            >
              <View className="flex-row items-center justify-between">
                <Badge tone="accent">{t("sub.currentPlan")}</Badge>
                <View
                  className={`w-12 h-12 rounded-2xl items-center justify-center ${
                    isPro ? "bg-accent" : "bg-panel2"
                  }`}
                >
                  <Crown size={22} color={isPro ? "#FFFFFF" : "#94A3B8"} />
                </View>
              </View>
              <Text
                className="text-4xl font-extrabold mt-1"
                style={{ color: isPro ? "#6366F1" : "#0F172A" }}
              >
                {isPro ? "PRO" : "FREE"}
              </Text>
              <Text className="text-muted text-xs mt-0.5">
                {isPro ? t("sub.proName") : t("sub.freeName")}
              </Text>

              {/* Gerçek haklar */}
              {s ? (
                <View className="flex-row flex-wrap gap-2 mt-4">
                  <Feature
                    Icon={Gauge}
                    label={t("sub.minFreq", { n: s.limits.minFrequencyMinutes })}
                  />
                  <Feature
                    Icon={BellRing}
                    label={s.entitlements.alarmChannel ? t("sub.alarmOn") : t("sub.alarmPro")}
                    on={s.entitlements.alarmChannel}
                  />
                  <Feature
                    Icon={Music}
                    label={s.entitlements.allSounds ? t("sub.soundsOn") : t("sub.soundsPro")}
                    on={s.entitlements.allSounds}
                  />
                  <Feature
                    Icon={SlidersHorizontal}
                    label={
                      s.entitlements.personalFilters ? t("sub.filtersOn") : t("sub.filtersPro")
                    }
                    on={s.entitlements.personalFilters}
                  />
                </View>
              ) : null}

              {/* Kullanım barı */}
              <View className="mt-5">
                <View className="flex-row justify-between mb-1.5">
                  <Text className="text-muted text-[11px]">{t("sub.usage")}</Text>
                  <Text className="text-text text-[11px] font-semibold">
                    {used} / {max}
                  </Text>
                </View>
                <View
                  className="h-2 bg-line rounded-full overflow-hidden"
                  accessibilityRole="progressbar"
                  accessibilityValue={{ min: 0, max, now: used }}
                >
                  <View className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                </View>
              </View>
            </View>
          </EnterItem>

          {/* Birincil CTA (maket: Planı Yükselt) — ödeme kapalıyken dürüst uyarı */}
          {!isPro ? (
            <View className="mt-4">
              <Btn onPress={() => Alert.alert(t("sub.upgrade"), t("sub.upgradeMsg"))}>
                <Text className="text-white text-[14px] font-semibold">{t("sub.upgrade")}</Text>
              </Btn>
            </View>
          ) : null}

          {/* Faturalama (gerçek abonelik varsa) */}
          {d ? (
            <EnterItem index={1} className="mt-4">
              <View className="bg-panel border border-line rounded-2xl p-5">
                <Text className="text-muted text-[10px] tracking-widest uppercase mb-1">
                  {t("sub.billing")}
                </Text>
                <Row
                  k={t("sub.period")}
                  v={d.interval === "month" ? t("sub.monthly") : t("sub.yearly")}
                />
                <Row k={t("sub.amount")} v={money(d.amountCents, d.currency)} />
                <Row
                  k={t("sub.status")}
                  v={
                    d.status === "active"
                      ? d.cancelAtPeriodEnd
                        ? t("sub.stPeriodEnd")
                        : t("sub.stActive")
                      : t("sub.stCancel")
                  }
                  tone={d.status === "active" && !d.cancelAtPeriodEnd ? "pos" : "neg"}
                />
                <Row
                  k={t("sub.renewal")}
                  v={new Date(d.currentPeriodEnd).toLocaleDateString(i18n.language)}
                />
                {d.status === "active" && !d.cancelAtPeriodEnd ? (
                  <View className="mt-4">
                    <Btn tone="danger" onPress={() => cancel.mutate()} disabled={cancel.isPending}>
                      <Text className="text-neg text-[13px] font-semibold">
                        Dönem sonunda iptal et
                      </Text>
                    </Btn>
                  </View>
                ) : null}
              </View>
            </EnterItem>
          ) : (
            <EnterItem index={1} className="mt-4">
              <View className="bg-panel border border-line rounded-2xl p-5">
                <Text className="text-muted text-[10px] tracking-widest uppercase mb-2">
                  {t("sub.plans")}
                </Text>
                <Text className="text-muted text-xs mb-3">{t("sub.plansNote")}</Text>
                {plans.data?.prices.map((p) => (
                  <View
                    key={`${p.plan}-${p.interval}`}
                    className="flex-row items-center justify-between border border-line rounded-xl p-4 mb-2"
                  >
                    <View>
                      <Text className="text-accent text-sm font-semibold uppercase">
                        {p.plan} · {p.interval === "month" ? "Aylık" : "Yıllık"}
                      </Text>
                      <Text className="text-muted text-xs mt-0.5">
                        {money(p.amountCents, p.currency)} /{" "}
                        {p.interval === "month" ? t("sub.perMonth") : t("sub.perYear")}
                      </Text>
                    </View>
                    <Badge tone="muted">{t("common.soon")}</Badge>
                  </View>
                ))}
              </View>
            </EnterItem>
          )}
          {/* Fatura geçmişi (maket) — gerçek fatura oluştukça burada listelenir */}
          <EnterItem index={2} className="mt-4">
            <View className="bg-panel border border-line rounded-2xl p-5">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-muted text-[10px] tracking-widest uppercase">
                  fatura geçmişi
                </Text>
              </View>
              <View className="items-center py-6">
                <View className="w-11 h-11 rounded-full bg-panel2 items-center justify-center mb-3">
                  <FileText size={18} color="#475569" />
                </View>
                <Text className="text-text text-sm font-medium">{t("sub.invoicesEmpty")}</Text>
                <Text className="text-muted text-xs text-center mt-1">{t("sub.invoicesHint")}</Text>
              </View>
            </View>
          </EnterItem>
        </ScrollView>
      </HeroOverlap>
    </View>
  );
}

function Feature({ Icon, label, on = true }: { Icon: typeof Crown; label: string; on?: boolean }) {
  return (
    <View
      className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${
        on ? "bg-pos/10" : "bg-panel2"
      }`}
    >
      <Icon size={12} color={on ? "#16A34A" : "#94A3B8"} />
      <Text className={`text-[11px] font-medium ${on ? "text-pos" : "text-muted"}`}>{label}</Text>
    </View>
  );
}
