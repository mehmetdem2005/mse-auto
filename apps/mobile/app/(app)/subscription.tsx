// Abonelik — maket düzeni (hero plan kartı + kullanım barı + faturalama), gerçek veri.
import { toast } from "@/components/feedback";
import { EnterItem } from "@/components/motion";
import { Badge, Btn } from "@/components/ui";
import { GradientHero, HeroOverlap, SkeletonCard } from "@/components/ui";
import { type BillingInterval, api } from "@/lib/api";
import { qk } from "@/lib/query";
import { useTheme } from "@/theme";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import { BellRing, Check, ChevronRight, Crown, FileText, Gauge, Music } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

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
  const theme = useTheme();
  const qc = useQueryClient();
  const sub = useQuery({ queryKey: qk.subscription, queryFn: api.subscription });
  const plans = useQuery({ queryKey: qk.plans, queryFn: api.plans });
  // ADR-139: plan özellik-maddeleri (admin-yazılı, dile-özel). Boşsa yerelleştirilmiş i18n varsayılanı.
  const features = useQuery({
    queryKey: [...qk.planFeatures, i18n.language],
    queryFn: () => api.planFeatures(i18n.language),
  });

  const cancel = useMutation({
    mutationFn: () => api.cancel(),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.subscription }),
  });

  // ADR-133: gerçek Stripe ödeme akışı — checkout URL'ini al, tarayıcıda/WebBrowser'da aç.
  // Web'de success_url (/billing/success) geri döner; native'de tarayıcı kapanınca aboneliği yenile.
  const checkout = useMutation({
    mutationFn: (interval: BillingInterval) => api.checkout(interval),
    onSuccess: async ({ url }) => {
      await WebBrowser.openBrowserAsync(url);
      qc.invalidateQueries({ queryKey: qk.subscription });
    },
    onError: () => toast.error(t("sub.checkoutError")),
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

  // ADR-139: madde listesi = admin-yazılı (API, dile-özel) varsa o; yoksa yerelleştirilmiş varsayılan.
  const defaultFree = [
    t("sub.featFreeWatches"),
    t("sub.featFreeFreq"),
    t("sub.featFreeChannels"),
    t("sub.featFreeAssistant"),
  ];
  const defaultPro = [
    t("sub.featProWatches"),
    t("sub.featProFreq"),
    t("sub.featProAlarm"),
    t("sub.featProSounds"),
    t("sub.featProChannels"),
    t("sub.featProSupport"),
  ];
  const freeBullets = features.data?.free.length ? features.data.free : defaultFree;
  const proBullets = features.data?.pro.length ? features.data.pro : defaultPro;

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
                shadowColor: theme.colors.accent,
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
                  <Crown size={22} color={isPro ? theme.colors.onAccent : theme.colors.muted2} />
                </View>
              </View>
              <Text
                className="text-4xl font-extrabold mt-1"
                style={{ color: isPro ? theme.colors.accent : theme.colors.text }}
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

          {/* Birincil CTA (maket: Planı Yükselt) — gerçek Stripe checkout (ADR-133); varsayılan aylık. */}
          {!isPro ? (
            <View className="mt-4">
              <Btn onPress={() => checkout.mutate("month")} disabled={checkout.isPending}>
                <Text className="text-onAccent text-[14px] font-semibold">
                  {checkout.isPending ? t("sub.checkoutLoading") : t("sub.upgrade")}
                </Text>
              </Btn>
            </View>
          ) : null}

          {/* ADR-139 — Plan karşılaştırma kartları: free vs pro, madde-madde özellikler (şık). */}
          <EnterItem index={1} className="mt-6">
            <Text className="text-muted text-[10px] tracking-widest uppercase mb-3 px-1">
              {t("sub.compare")}
            </Text>
            <View className="gap-3">
              <PlanCompareCard
                name={t("sub.freeName")}
                tier="FREE"
                bullets={freeBullets}
                active={!isPro}
                highlight={false}
              />
              <PlanCompareCard
                name={t("sub.proName")}
                tier="PRO"
                bullets={proBullets}
                active={isPro}
                highlight={!isPro}
              />
            </View>
          </EnterItem>

          {/* Faturalama (gerçek abonelik varsa) */}
          {d ? (
            <EnterItem index={2} className="mt-4">
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
                        {t("sub.cancelBtn")}
                      </Text>
                    </Btn>
                  </View>
                ) : null}
              </View>
            </EnterItem>
          ) : (
            <EnterItem index={2} className="mt-4">
              <View className="bg-panel border border-line rounded-2xl p-5">
                <Text className="text-muted text-[10px] tracking-widest uppercase mb-2">
                  {t("sub.plans")}
                </Text>
                {plans.data?.prices.map((p) => (
                  // ADR-133: Pro değilken plan satırı dokunulabilir → o aralıkla Stripe checkout.
                  <Pressable
                    key={`${p.plan}-${p.interval}`}
                    onPress={() => !isPro && checkout.mutate(p.interval)}
                    disabled={isPro || checkout.isPending}
                    accessibilityRole="button"
                    accessibilityLabel={`${p.plan} ${p.interval === "month" ? t("sub.monthly") : t("sub.yearly")} — ${t("sub.upgrade")}`}
                    className="flex-row items-center justify-between border border-line rounded-xl p-4 mb-2 min-h-[44px]"
                  >
                    <View>
                      <Text className="text-accent text-sm font-semibold uppercase">
                        {p.plan} · {p.interval === "month" ? t("sub.monthly") : t("sub.yearly")}
                      </Text>
                      <Text className="text-muted text-xs mt-0.5">
                        {money(p.amountCents, p.currency)} /{" "}
                        {p.interval === "month" ? t("sub.perMonth") : t("sub.perYear")}
                      </Text>
                    </View>
                    {isPro ? (
                      <Badge tone="muted">{t("common.soon")}</Badge>
                    ) : (
                      <ChevronRight size={18} color={theme.colors.accent} />
                    )}
                  </Pressable>
                ))}
              </View>
            </EnterItem>
          )}
          {/* Fatura geçmişi (maket) — gerçek fatura oluştukça burada listelenir */}
          <EnterItem index={3} className="mt-4">
            <View className="bg-panel border border-line rounded-2xl p-5">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-muted text-[10px] tracking-widest uppercase">
                  {t("sub.invoices")}
                </Text>
              </View>
              <View className="items-center py-6">
                <View className="w-11 h-11 rounded-full bg-panel2 items-center justify-center mb-3">
                  <FileText size={18} color={theme.colors.mutedIcon} />
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
  const { colors } = useTheme();
  return (
    <View
      className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${
        on ? "bg-pos/10" : "bg-panel2"
      }`}
    >
      <Icon size={12} color={on ? colors.pos : colors.muted2} />
      <Text className={`text-[11px] font-medium ${on ? "text-pos" : "text-muted"}`}>{label}</Text>
    </View>
  );
}

// ADR-139 — plan karşılaştırma kartı: madde-madde özellikler (lucide Check ikonları, 8pt aralık).
// `highlight` (free kullanıcıya Pro) → accent vurgu; `active` → mevcut plan rozeti.
function PlanCompareCard({
  name,
  tier,
  bullets,
  active,
  highlight,
}: {
  name: string;
  tier: "FREE" | "PRO";
  bullets: string[];
  active: boolean;
  highlight: boolean;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isPro = tier === "PRO";
  const accent = highlight || (active && isPro);
  return (
    <View
      className={`rounded-2xl p-5 border ${accent ? "bg-accent/[0.06] border-accent/40" : "bg-panel border-line"}`}
      style={
        accent
          ? {
              shadowColor: colors.accent,
              shadowOpacity: 0.12,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 6 },
              elevation: 2,
            }
          : undefined
      }
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          {isPro ? <Crown size={18} color={colors.accent} /> : null}
          <Text
            className="text-xl font-extrabold"
            style={{ color: isPro ? colors.accent : colors.text }}
          >
            {tier}
          </Text>
          <Text className="text-muted text-xs">{name}</Text>
        </View>
        {active ? (
          <Badge tone="accent">{t("sub.currentPlan")}</Badge>
        ) : highlight ? (
          <Badge tone="accent">{t("sub.recommended")}</Badge>
        ) : null}
      </View>
      <View className="gap-2.5">
        {bullets.map((b, i) => (
          <View key={`${tier}-${i}-${b}`} className="flex-row items-start gap-2.5">
            <View
              className={`w-5 h-5 rounded-full items-center justify-center mt-0.5 ${accent ? "bg-accent/15" : "bg-pos/10"}`}
            >
              <Check size={12} color={accent ? colors.accent : colors.pos} />
            </View>
            <Text className="text-text text-[13px] leading-5 flex-1">{b}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
