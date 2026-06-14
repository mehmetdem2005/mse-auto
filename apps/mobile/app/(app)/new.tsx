import { EnterItem } from "@/components/motion";
import { Btn, Card } from "@/components/ui";
import { GradientHero, PrimaryButton } from "@/components/ui";
import { type AlarmChannel, DEFAULT_ALARM_CONFIG } from "@/lib/alarm-config";
import { ALARM_CATEGORIES, ALARM_SOUNDS } from "@/lib/alarm-sounds";
import { type AssistMessage, type AssistReply, api } from "@/lib/api";
import { setCachedEntitlements } from "@/lib/entitlements-cache";
import { haptic } from "@/lib/haptics";
import { qk } from "@/lib/query";
import { useReduceMotion } from "@/lib/reduce-motion";
import { persistSound, useSoundPreview } from "@/lib/sound-preview";
import { useTheme } from "@/theme";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import {
  CheckCircle2,
  FileMusic,
  Globe,
  Landmark,
  Newspaper,
  Pause,
  Play,
  Radar,
  Search,
  Send,
  ShoppingBag,
  Sparkles,
  Users2,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

const FREQ = [1, 15, 60, 360, 720, 1440];
// FSM: çok adımlı sihirbaz (design-standards §5 — çok adımlı akış açık durumlarla).
// 1. adım artık AI sohbeti: asistan muğlak isteği soruyla netleştirir (ADR-035).
// (ADR-094: cihaz-içi "kişisel filtre" adımı kaldırıldı — amacı belirsiz/karmaşıktı.)
const STEPS = [
  { key: "intent", titleK: "wizard.titles.intent", shortK: "wizard.steps.intent" },
  { key: "source", titleK: "wizard.titles.source", shortK: "wizard.steps.source" },
  { key: "frequency", titleK: "wizard.titles.freq", shortK: "wizard.steps.freq" },
  { key: "alert", titleK: "wizard.titles.alert", shortK: "wizard.steps.alert" },
  { key: "review", titleK: "wizard.titles.review", shortK: "wizard.steps.review" },
] as const;

const FREQ_KEYS: Record<number, { n: string; d: string }> = {
  1: { n: "wizard.freqNames.f1", d: "wizard.freqDescs.f1" },
  15: { n: "wizard.freqNames.f15", d: "wizard.freqDescs.f15" },
  60: { n: "wizard.freqNames.f60", d: "wizard.freqDescs.f60" },
  360: { n: "wizard.freqNames.f360", d: "wizard.freqDescs.f360" },
  720: { n: "wizard.freqNames.f720", d: "wizard.freqDescs.f720" },
  1440: { n: "wizard.freqNames.f1440", d: "wizard.freqDescs.f1440" },
};

/** Önerilen sıklığı plan sınırına ve seçeneklere oturt. */
function snapFreq(suggested: number, minAllowed: number): number {
  const pool = FREQ.filter((f) => f >= minAllowed);
  const opts = pool.length > 0 ? pool : FREQ;
  return opts.reduce((best, f) =>
    Math.abs(f - suggested) < Math.abs(best - suggested) ? f : best,
  );
}

function labelFreq(m: number): string {
  if (m >= 1440) return "24h";
  if (m >= 60) return `${m / 60}h`;
  return `${m}m`;
}

/** Sürüklenen dakikayı büyüklüğüne göre "düzgün" değere yuvarlar (plan min'i altına inmez). */
function niceMinutes(m: number, min: number): number {
  let v: number;
  if (m < 60) v = Math.round(m / 5) * 5;
  else if (m < 360) v = Math.round(m / 15) * 15;
  else if (m < 720) v = Math.round(m / 30) * 30;
  else v = Math.round(m / 60) * 60;
  return Math.min(1440, Math.max(min, v || min));
}

/**
 * ADR-110: kontrol sıklığı için kaydırma çubuğu (PanResponder yerine RN responder olayları
 * → web + native aynı). LOG ölçek: düşük (sık) uçta ince, yüksek uçta kaba çözünürlük.
 * Plan min'i (free 60dk) altına inmez. a11y: adjustable + artır/azalt aksiyonları.
 */
function FreqSlider({
  value,
  min,
  onChange,
  color,
  trackColor,
}: {
  value: number;
  min: number;
  onChange: (m: number) => void;
  color: string;
  trackColor: string;
}) {
  const [w, setW] = useState(0);
  const max = 1440;
  const ratio = Math.log(max / min) || 1;
  const toMinutes = (p: number): number =>
    niceMinutes(min * Math.exp(ratio * Math.min(1, Math.max(0, p))), min);
  const pos = Math.log(Math.max(value, min) / min) / ratio; // 0..1
  const handle = (x: number): void => {
    if (w > 0) onChange(toMinutes(x / w));
  };
  const step = (dir: 1 | -1): void => onChange(toMinutes(pos + dir * 0.06));
  return (
    <View className="mb-4">
      <View className="flex-row items-end justify-between mb-2">
        <Text className="text-accent text-2xl font-extrabold">{labelFreq(value)}</Text>
        <Text className="text-muted text-[11px]">her {value} dk</Text>
      </View>
      <View
        accessibilityRole="adjustable"
        accessibilityLabel="Kontrol sıklığı"
        accessibilityValue={{ min, max, now: value }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(e) => step(e.nativeEvent.actionName === "increment" ? 1 : -1)}
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => handle(e.nativeEvent.locationX)}
        onResponderMove={(e) => handle(e.nativeEvent.locationX)}
        className="h-11 justify-center"
      >
        <View className="h-1.5 rounded-full" style={{ backgroundColor: trackColor }}>
          <View
            className="h-1.5 rounded-full"
            style={{ width: `${Math.round(pos * 100)}%`, backgroundColor: color }}
          />
        </View>
        <View
          style={{
            position: "absolute",
            left: w > 0 ? Math.max(0, Math.min(w - 22, pos * w - 11)) : 0,
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: "#FFFFFF",
            borderWidth: 2,
            borderColor: color,
          }}
        />
      </View>
      <View className="flex-row justify-between mt-1">
        <Text className="text-muted2 text-[10px]">{labelFreq(min)}</Text>
        <Text className="text-muted2 text-[10px]">24h</Text>
      </View>
    </View>
  );
}

const ALERT_LABEL: Record<AlarmChannel, string> = {
  silent: "wizard.alertSilent",
  notify: "wizard.alertNotify",
  alarm: "wizard.alertAlarm",
};

const chip = (active: boolean): string =>
  `px-3 py-2 rounded-lg border ${active ? "border-accent bg-accent/10" : "border-line"}`;

/**
 * Asistan metnini sadeleştir (kullanıcı geri bildirimi): bazı modeller madde işareti
 * "-", "*", "•" üretip RN Text'te ham "-" olarak görünüyordu. Satır başı liste
 * işaretlerini + fazla boş satırı temizle. Sohbet GEÇMİŞİ değişmez; yalnız gösterim.
 */
function cleanAssistant(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/^\s*[-*•]\s+/, "").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function NewWatcher() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const reduce = useReduceMotion();
  const [step, setStep] = useState(0);
  const [rawIntent, setRawIntent] = useState("");
  const [freq, setFreq] = useState(60);
  const [sourcePref, setSourcePref] = useState<"auto" | "news" | "official" | "web">("auto");
  // Sonar derin tarama (ADR-089) — varsayılan kapalı.
  const [deepScan, setDeepScan] = useState(false);
  // Sonuç bulununca otomatik durdur (ADR-092) — varsayılan AÇIK: gereksiz tarama biter.
  const [stopAfterHit, setStopAfterHit] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // AI sohbeti (1. adım): geçmiş + taslak + netleşmiş niyet.
  const [messages, setMessages] = useState<AssistMessage[]>([
    { role: "assistant", content: t("wizard.greeting") },
  ]);
  const [draft, setDraft] = useState("");
  const [readyIntent, setReadyIntent] = useState<string | null>(null);
  const [plan, setPlan] = useState<AssistReply | null>(null);
  const [assistDown, setAssistDown] = useState(false); // asistan hatasında elle-devam yolu açılır
  const chatScroll = useRef<ScrollView>(null);

  const [alarmChannel, setAlarmChannel] = useState<AlarmChannel>(DEFAULT_ALARM_CONFIG.channel);
  const [soundId, setSoundId] = useState(DEFAULT_ALARM_CONFIG.soundId);
  const [soundCat, setSoundCat] = useState<string>(ALARM_CATEGORIES[0]);
  // Cihazdan seçilen özel ses (ADR-083) — yereldedir, sunucuya gitmez.
  const [customSound, setCustomSound] = useState<{ uri: string; name: string } | null>(null);
  const preview = useSoundPreview();

  /** Cihaz dosya seçiciden bir ses dosyası al → özel ses + anında önizle. */
  async function pickCustomSound() {
    const res = await DocumentPicker.getDocumentAsync({
      type: "audio/*",
      copyToCacheDirectory: true,
    });
    const file = res.assets?.[0];
    if (!file) return;
    haptic.light();
    setCustomSound({ uri: file.uri, name: file.name });
    preview.playUri(file.uri);
  }
  const { data: sub } = useQuery({ queryKey: qk.subscription, queryFn: api.subscription });
  const canAlarm = sub?.entitlements.alarmChannel ?? false;
  const canAllSounds = sub?.entitlements.allSounds ?? false;
  useEffect(() => {
    if (!sub) return;
    void setCachedEntitlements({
      alarmChannel: sub.entitlements.alarmChannel,
      allSounds: sub.entitlements.allSounds,
    });
  }, [sub]);
  // Adım değişince/ekrandan çıkınca önizlemeyi durdur (sızıntı/çakışma olmasın).
  // preview.stop stabil useCallback → yalnız [step]/mount'a bağlamak kasıtlı.
  // biome-ignore lint/correctness/useExhaustiveDependencies: stop stabil; adım değişiminde çalışmalı
  useEffect(() => {
    if (STEPS[step]?.key !== "alert") preview.stop();
  }, [step]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: yalnız unmount temizliği
  useEffect(() => () => preview.stop(), []);
  // Yeni mesaj gelince sona kaydır (web'de onContentSizeChange tek başına güvenilmez;
  // küçük gecikme → son balon giriş kutusunun ARKASINDA kalmaz — kullanıcı geri bildirimi).
  useEffect(() => {
    if (step !== 0 || messages.length <= 1) return;
    const id = setTimeout(() => chatScroll.current?.scrollToEnd({ animated: !reduce }), 80);
    return () => clearTimeout(id);
  }, [messages.length, step, reduce]);

  const minFreq = sub?.limits.minFrequencyMinutes ?? 60;
  const assist = useMutation({
    // Dile-uyum (ADR-093): asistan kullanıcının ARAYÜZ dilinde yazar.
    mutationFn: (history: AssistMessage[]) => api.assistChat(history.slice(-40), i18n.language),
    onSuccess: (r) => {
      setAssistDown(false);
      setMessages((m) => [...m, { role: "assistant", content: r.message }]);
      if (r.ready && r.intent) {
        setReadyIntent(r.intent);
        setRawIntent(r.intent);
        setPlan(r); // ADR-110: arama planını sakla (sorgu/yöntem/fizibilite)
        if (r.frequencyMinutes) setFreq(snapFreq(r.frequencyMinutes, minFreq));
      } else {
        setReadyIntent(null);
        setPlan(null);
      }
    },
    onError: () => {
      setAssistDown(true);
      setMessages((m) => [...m, { role: "assistant", content: t("wizard.assistError") }]);
    },
  });

  /** Asistan erişilemezse son kullanıcı mesajını niyet olarak kabul et (elle devam). */
  function useDraftAsIntent() {
    const last =
      [...messages]
        .reverse()
        .find((m) => m.role === "user")
        ?.content.trim() ?? "";
    if (last.length < 3) return;
    setReadyIntent(last);
    setRawIntent(last);
    setAssistDown(false);
    setMessages((m) => [
      ...m,
      { role: "assistant", content: t("wizard.intentAccepted", { intent: last }) },
    ]);
  }

  function sendChat() {
    const text = draft.trim();
    if (!text || assist.isPending) return;
    const next: AssistMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setDraft("");
    assist.mutate(next);
  }

  const mutation = useMutation({
    mutationFn: () => api.createWatcher(rawIntent.trim(), freq, sourcePref, deepScan, stopAfterHit),
    onSuccess: async (watch) => {
      haptic.success();
      preview.stop();
      await persistSound(watch.id, alarmChannel, soundId, customSound);
      await qc.invalidateQueries({ queryKey: qk.watchers });
      await qc.invalidateQueries({ queryKey: qk.subscription });
      router.replace("/");
    },
    onError: (e) => setErr(e instanceof Error ? e.message : "oluşturulamadı"),
  });

  /** FSM geçiş kuralı: mevcut adım geçerli mi? (yalnız niyet adımı engelleyebilir) */
  function stepValid(i: number): boolean {
    if (i === 0) return readyIntent !== null && rawIntent.trim().length >= 3;
    return true;
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function next() {
    setErr(null);
    if (!stepValid(step)) {
      setErr(t("wizard.needIntent"));
      return;
    }
    if (isLast) {
      mutation.mutate();
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  function back() {
    setErr(null);
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <View className="flex-1 bg-ink">
      <GradientHero title={t(current.titleK)} subtitle={`${step + 1} / ${STEPS.length}`} back />
      {/* Numaralı adım göstergesi (maket: 1-2-3-4-5 bağlantılı) */}
      <View
        className="mx-5 -mt-10 bg-panel border border-line rounded-2xl px-4 py-3"
        // Gölge YALNIZ native'de: web'de (mobil Chrome) gradyan+kaydırma sınırına
        // binen kartın box-shadow katmanı kompozit yırtılması (cızırtı bandı)
        // üretiyordu (ADR-099). Kenarlık kartı web'de zaten tanımlar.
        style={Platform.select({
          native: {
            shadowColor: "#0F172A",
            shadowOpacity: 0.06,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 2,
          },
          default: {},
        })}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 1, max: STEPS.length, now: step + 1 }}
        accessibilityLabel={`${step + 1} / ${STEPS.length}: ${t(current.titleK)}`}
      >
        <View className="flex-row items-center">
          {STEPS.map((st, i) => (
            <View key={st.key} className="flex-row items-center flex-1">
              <View
                className={`w-7 h-7 rounded-full items-center justify-center ${
                  i < step ? "bg-accent" : i === step ? "bg-accent" : "bg-panel border border-line"
                }`}
              >
                <Text
                  className="text-[11px] font-bold"
                  style={{ color: i <= step ? colors.onAccent : colors.muted2 }}
                >
                  {i + 1}
                </Text>
              </View>
              {i < STEPS.length - 1 ? (
                <View className={`flex-1 h-0.5 mx-1 ${i < step ? "bg-accent" : "bg-line"}`} />
              ) : null}
            </View>
          ))}
        </View>
        {/* Maket: her dairenin altında kısa adım etiketi */}
        <View className="flex-row mt-1.5">
          {STEPS.map((st, i) => (
            <Text
              key={st.key}
              className={`flex-1 text-[9px] ${i === step ? "text-accent font-semibold" : "text-muted"}`}
            >
              {t(st.shortK)}
            </Text>
          ))}
        </View>
      </View>

      <ScrollView
        ref={chatScroll}
        // ADR-108 (cızırtı kök-neden): bu ScrollView ŞEFFAF ayrı bir kompozit katman;
        // hemen üstündeki GradientHero (LinearGradient) GPU katmanının BAYAT dokusu
        // Android Chrome'da şeffaf piksellerden sızıyordu (mor yırtık bantlar). Çözüm:
        // (1) OPAK zemin (bg-ink) → derleyici katmanı düz boyar, sızıntı kalmaz;
        // (2) web'de backfaceVisibility:hidden → katmanı kendi kararlı GPU dokusuna sahiplendirir
        // (translateZ(0) muadili; RN-Web'de geçerli stil). Chromium #727182 sınıfı kompozit hatası.
        className="flex-1 px-5 pt-5 bg-ink"
        style={Platform.OS === "web" ? { backfaceVisibility: "hidden" } : undefined}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => {
          // İlk karşılama + öneriler ÜSTTE tam görünsün: yalnız gerçek sohbet başlayınca
          // (1'den fazla mesaj) sona kaydır — aksi halde ilk mesaj yukarı kayıp kırpılıyordu.
          if (step === 0 && messages.length > 1) {
            chatScroll.current?.scrollToEnd({ animated: !reduce });
          }
        }}
      >
        {err ? <Text className="text-neg text-xs mb-3">{err}</Text> : null}

        {/* 1) Niyet — AI sohbeti (Gemini tarzı): muğlaksa asistan soruyla netleştirir */}
        {current.key === "intent" ? (
          <View accessibilityLabel={t("wizard.chatA11y")}>
            {messages.map((m, i) => {
              // Asistan balonunda ham madde-işaretlerini ("- ") gösterme (kullanıcı geri bildirimi).
              const body = m.role === "user" ? m.content : cleanAssistant(m.content);
              return (
                <EnterItem
                  // Sohbet geçmişi yalnız sona eklenir → indeks anahtarı kararlı.
                  key={`${i}-${m.role}`}
                  index={0}
                  className={`max-w-[85%] rounded-2xl px-4 py-3 mb-2.5 ${
                    m.role === "user"
                      ? "self-end bg-accent rounded-br-md"
                      : "self-start bg-panel border border-line rounded-bl-md"
                  }`}
                >
                  <Text
                    accessibilityRole="text"
                    accessibilityLabel={`${m.role === "user" ? t("wizard.you") : t("wizard.assistantRole")}: ${body}`}
                    className={m.role === "user" ? "text-onAccent text-sm" : "text-text text-sm"}
                  >
                    {body}
                  </Text>
                </EnterItem>
              );
            })}
            {assist.isPending ? (
              <View className="self-start bg-panel border border-line rounded-2xl rounded-bl-md px-4 py-3 mb-2.5">
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            ) : null}
            {assistDown && messages.some((m) => m.role === "user") ? (
              <Pressable
                onPress={useDraftAsIntent}
                accessibilityRole="button"
                accessibilityLabel={t("wizard.useMyText")}
                className="self-start border border-accent rounded-full px-4 py-3 mb-2.5 min-h-[44px] justify-center"
              >
                <Text className="text-accent text-xs font-semibold uppercase tracking-wider">
                  {t("wizard.useMyText")}
                </Text>
              </Pressable>
            ) : null}
            {readyIntent ? (
              <View className="bg-accent/10 border border-accent rounded-2xl px-4 py-3 mt-1">
                <Text className="text-accent text-[10px] uppercase tracking-widest mb-1">
                  {t("wizard.ready")}
                </Text>
                <Text className="text-text text-sm">{readyIntent}</Text>
                <Text className="text-muted text-[11px] mt-1">
                  {t("wizard.readyHint", { freq: labelFreq(freq) })}
                </Text>
              </View>
            ) : null}
            {/* ADR-110: asistanın arama planı — sorgu / yöntemler / fizibilite ("böyle iyi mi?") */}
            {plan?.ready &&
            (plan.searchQuery || plan.feasibility || (plan.searchMethods?.length ?? 0) > 0) ? (
              <View className="bg-panel border border-line rounded-2xl px-4 py-3 mt-2">
                <View className="flex-row items-center gap-2 mb-2">
                  <Search size={14} color={colors.accent} />
                  <Text className="text-muted text-[10px] uppercase tracking-widest">
                    {t("wizard.planTitle")}
                  </Text>
                </View>
                {plan.searchQuery ? (
                  <Text className="text-text text-sm font-medium" numberOfLines={3}>
                    “{plan.searchQuery}”
                  </Text>
                ) : null}
                {(plan.searchMethods?.length ?? 0) > 0 ? (
                  <View className="flex-row flex-wrap gap-1.5 mt-2">
                    {plan.searchMethods?.map((m) => (
                      <View key={m} className="bg-ink border border-line rounded-full px-2.5 py-1">
                        <Text className="text-muted text-[11px]">{m}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                {plan.feasibility ? (
                  <Text className="text-muted text-[11px] leading-4 mt-2">{plan.feasibility}</Text>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* 2) Kaynak tercihi (ADR-050 — aramanın sırasını gerçekten değiştirir) */}
        {current.key === "source" ? (
          <>
            <Text className="text-muted text-sm mb-3">{t("wizard.sourceHint")}</Text>
            <View className="flex-row flex-wrap gap-2">
              {(
                [
                  ["auto", t("wizard.srcAuto"), Sparkles, t("wizard.srcAutoD")],
                  ["official", t("wizard.srcOfficial"), Landmark, t("wizard.srcOfficialD")],
                  ["news", t("wizard.srcNews"), Newspaper, t("wizard.srcNewsD")],
                  ["web", t("wizard.srcWeb"), Globe, t("wizard.srcWebD")],
                ] as const
              ).map(([v, l, Icon, d]) => {
                const sel = sourcePref === v;
                return (
                  <Pressable
                    key={v}
                    onPress={() => setSourcePref(v)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: sel }}
                    accessibilityLabel={`${l} — ${d}`}
                    className={`w-[47%] rounded-xl border px-3 py-3 min-h-[72px] ${
                      sel ? "border-accent bg-accent/10" : "border-line bg-panel"
                    }`}
                  >
                    <Icon size={18} color={sel ? colors.accent : colors.mutedIcon} />
                    <Text
                      className={`text-sm font-semibold mt-1.5 ${sel ? "text-accent" : "text-text"}`}
                    >
                      {l}
                    </Text>
                    <Text className="text-muted text-[10px] mt-0.5">{d}</Text>
                  </Pressable>
                );
              })}
              {(
                [
                  [t("wizard.srcSocial"), Users2],
                  [t("wizard.srcShop"), ShoppingBag],
                ] as const
              ).map(([l, Icon]) => (
                <View
                  key={l}
                  className="w-[47%] rounded-xl border border-line bg-panel px-3 py-3 min-h-[72px] opacity-45"
                >
                  <Icon size={18} color={colors.muted2} />
                  <Text className="text-text text-sm font-semibold mt-1.5">{l}</Text>
                  <Text className="text-muted text-[10px] mt-0.5">{t("common.soon")}</Text>
                </View>
              ))}
            </View>

            {/* Sonar derin tarama (ADR-089): güven bandından bağımsız çok-turlu doğrulama. */}
            <View className="mt-3 flex-row items-center gap-3 rounded-xl border border-line bg-panel px-4 py-3.5">
              <View className="w-9 h-9 rounded-xl bg-accent/10 items-center justify-center shrink-0">
                <Radar size={18} color={colors.accent} />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-text text-sm font-semibold" numberOfLines={1}>
                  {t("wizard.sonar")}
                </Text>
                <Text className="text-muted text-caption mt-0.5" numberOfLines={2}>
                  {t("wizard.sonarHint")}
                </Text>
              </View>
              <Switch
                value={deepScan}
                onValueChange={setDeepScan}
                trackColor={{ false: colors.line, true: colors.accent }}
                thumbColor="#FFFFFF"
                accessibilityLabel={t("wizard.sonar")}
              />
            </View>
          </>
        ) : null}

        {/* 3) Sıklık */}
        {current.key === "frequency" ? (
          <>
            <Text className="text-muted text-sm mb-3">{t("wizard.freqHint")}</Text>
            {/* Sonuç bulununca durdur (ADR-092): varsayılan AÇIK — bulunca nöbet biter. */}
            <View className="mb-3 flex-row items-center gap-3 rounded-xl border border-line bg-panel px-4 py-3.5">
              <View className="w-9 h-9 rounded-xl bg-accent/10 items-center justify-center shrink-0">
                <CheckCircle2 size={18} color={colors.accent} />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-text text-sm font-semibold" numberOfLines={1}>
                  {t("wizard.stopAfterHit")}
                </Text>
                <Text className="text-muted text-caption mt-0.5" numberOfLines={2}>
                  {t("wizard.stopAfterHitHint")}
                </Text>
              </View>
              <Switch
                value={stopAfterHit}
                onValueChange={setStopAfterHit}
                trackColor={{ false: colors.line, true: colors.accent }}
                thumbColor="#FFFFFF"
                accessibilityLabel={t("wizard.stopAfterHit")}
              />
            </View>
            {/* ADR-110: kaydırarak istediğin sıklığı ayarla (plan min'i altına inmez) */}
            <FreqSlider
              value={freq}
              min={minFreq}
              onChange={setFreq}
              color={colors.accent}
              trackColor={colors.line}
            />
            <Text className="text-muted2 text-[11px] mb-2">veya hazır bir aralık seç:</Text>
            <View className="flex-row flex-wrap gap-2">
              {FREQ.map((f) => {
                const meta = FREQ_KEYS[f];
                const locked = f < minFreq; // plan sınırı (free: 60 dk altı kilitli)
                const sel = freq === f;
                return (
                  <Pressable
                    key={f}
                    disabled={locked}
                    onPress={() => setFreq(f)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: sel, disabled: locked }}
                    accessibilityLabel={`${meta ? t(meta.n) : labelFreq(f)} — ${meta ? t(meta.d) : ""}${locked ? " (Pro)" : ""}`}
                    className={`w-[31%] rounded-xl border px-3 py-3 min-h-[64px] ${
                      sel ? "border-accent bg-accent/10" : "border-line bg-panel"
                    } ${locked ? "opacity-45" : ""}`}
                  >
                    <Text className={`text-sm font-semibold ${sel ? "text-accent" : "text-text"}`}>
                      {meta ? t(meta.n) : labelFreq(f)}
                    </Text>
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <Text className="text-muted text-[10px]">{meta ? t(meta.d) : ""}</Text>
                      {locked ? (
                        <Text className="text-accent text-[9px] font-bold">PRO</Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        {/* 4) Uyarı şekli */}
        {current.key === "alert" ? (
          <>
            <View className="flex-row flex-wrap gap-2 mb-2">
              {(["silent", "notify", "alarm"] as const).map((v) => {
                const locked = v === "alarm" && !canAlarm;
                let txt = "text-muted text-sm";
                if (locked) txt = "text-muted text-sm opacity-50";
                else if (alarmChannel === v) txt = "text-accent text-sm";
                return (
                  <Pressable
                    key={v}
                    disabled={locked}
                    onPress={locked ? undefined : () => setAlarmChannel(v)}
                    className={chip(alarmChannel === v)}
                    accessibilityRole="button"
                  >
                    <Text className={txt}>
                      {locked ? `${t(ALERT_LABEL[v])} (Pro)` : t(ALERT_LABEL[v])}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {!canAlarm ? (
              <Text className="text-muted text-[11px] mb-3">{t("wizard.alarmPro")}</Text>
            ) : null}
            {/* Maket: ek bildirim yöntemleri — entegrasyon hazır olana dek 'yakında' */}
            <View className="mt-3 border border-line rounded-xl overflow-hidden">
              {(["email", "whatsapp", "telegram"] as const).map((ch) => (
                <View
                  key={ch}
                  className="flex-row items-center justify-between px-4 py-3 border-b border-line opacity-50"
                >
                  <Text className="text-text text-sm">{t(`channels.${ch}`)}</Text>
                  <Text className="text-muted text-overline font-semibold uppercase">
                    {t("common.soon")}
                  </Text>
                </View>
              ))}
            </View>
            {alarmChannel === "alarm" ? (
              <View className="mt-1">
                <View className="flex-row flex-wrap gap-2 mb-2">
                  {ALARM_CATEGORIES.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => setSoundCat(c)}
                      className={chip(soundCat === c)}
                      accessibilityRole="button"
                    >
                      <Text
                        className={
                          soundCat === c ? "text-accent text-[11px]" : "text-muted text-[11px]"
                        }
                      >
                        {c}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View className="border border-line rounded-xl overflow-hidden">
                  {ALARM_SOUNDS.filter((s) => s.category === soundCat).map((s) => {
                    const locked = !canAllSounds && s.id !== DEFAULT_ALARM_CONFIG.soundId;
                    const sel = soundId === s.id && !customSound;
                    const playing = preview.playingId === s.id;
                    let cls = "text-text text-xs flex-1";
                    if (locked) cls = "text-muted text-xs opacity-50 flex-1";
                    else if (sel) cls = "text-accent text-xs flex-1 font-semibold";
                    return (
                      <View
                        key={s.id}
                        className={`flex-row items-center px-3 border-b border-line ${sel ? "bg-accent/10" : ""}`}
                      >
                        {/* Seç (satıra dokun) */}
                        <Pressable
                          disabled={locked}
                          onPress={
                            locked
                              ? undefined
                              : () => {
                                  setSoundId(s.id);
                                  setCustomSound(null);
                                  preview.play(s.id);
                                }
                          }
                          accessibilityRole="button"
                          accessibilityState={{ selected: sel, disabled: locked }}
                          accessibilityLabel={locked ? `${s.name} (Pro)` : s.name}
                          className="flex-1 flex-row items-center py-2.5 min-h-[44px]"
                        >
                          <Text className={cls} numberOfLines={1}>
                            {sel ? "• " : ""}
                            {locked ? `${s.name} (Pro)` : s.name}
                          </Text>
                        </Pressable>
                        {/* Önizle/Durdur (dinle) */}
                        {!locked ? (
                          <Pressable
                            onPress={() => (playing ? preview.stop() : preview.play(s.id))}
                            accessibilityRole="button"
                            accessibilityLabel={t(
                              playing ? "wizard.soundStop" : "wizard.soundPlay",
                              {
                                name: s.name,
                              },
                            )}
                            className="w-11 h-11 items-center justify-center"
                          >
                            {playing ? (
                              <Pause size={16} color={colors.accent} />
                            ) : (
                              <Play size={16} color={colors.muted2} />
                            )}
                          </Pressable>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
                {!canAllSounds ? (
                  <Text className="text-muted text-[10px] mt-1">{t("wizard.allSoundsPro")}</Text>
                ) : null}

                {/* Cihazdan kendi sesini seç (ADR-083) — Pro'da açık */}
                {canAllSounds ? (
                  <Pressable
                    onPress={() => void pickCustomSound()}
                    accessibilityRole="button"
                    accessibilityLabel={t("wizard.soundCustomPick")}
                    className="flex-row items-center gap-2 mt-2.5 border border-accent/40 bg-accent/5 rounded-xl px-3.5 py-3 min-h-[44px] active:bg-accent/15"
                  >
                    <FileMusic size={16} color={colors.accent} />
                    <Text className="text-accent text-xs font-semibold flex-1" numberOfLines={1}>
                      {customSound ? customSound.name : t("wizard.soundCustomPick")}
                    </Text>
                    {customSound ? (
                      <Pressable
                        onPress={() =>
                          preview.playingId === "custom"
                            ? preview.stop()
                            : preview.playUri(customSound.uri)
                        }
                        accessibilityRole="button"
                        accessibilityLabel={t(
                          preview.playingId === "custom" ? "wizard.soundStop" : "wizard.soundPlay",
                          { name: customSound.name },
                        )}
                        className="w-9 h-9 items-center justify-center"
                      >
                        {preview.playingId === "custom" ? (
                          <Pause size={15} color={colors.accent} />
                        ) : (
                          <Play size={15} color={colors.accent} />
                        )}
                      </Pressable>
                    ) : null}
                  </Pressable>
                ) : null}
                <Text className="text-muted text-[10px] mt-2">{t("wizard.soundNote")}</Text>
              </View>
            ) : null}
          </>
        ) : null}

        {/* 5) Özet */}
        {current.key === "review" ? (
          <Card>
            <ReviewRow label={t("wizard.rIntent")} value={rawIntent.trim() || "—"} />
            <ReviewRow
              label={t("wizard.rSource")}
              value={
                {
                  auto: t("wizard.srcAuto"),
                  official: t("wizard.srcOfficial"),
                  news: t("wizard.srcNews"),
                  web: t("wizard.srcWeb"),
                }[sourcePref]
              }
            />
            <ReviewRow label={t("wizard.rFreq")} value={labelFreq(freq)} />
            <ReviewRow label={t("wizard.rAlert")} value={t(ALERT_LABEL[alarmChannel])} last />
            <Text className="text-muted text-[11px] mt-4">{t("wizard.rNote")}</Text>
          </Card>
        ) : null}

        <View className="h-24" />
      </ScrollView>

      {/* Sohbet girişi (yalnız 1. adımda, alt navigasyonun üstünde) */}
      {current.key === "intent" ? (
        <View className="flex-row items-end gap-2 px-5 pt-3 border-t border-line bg-ink">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            multiline
            placeholder={t("wizard.chatPlaceholder")}
            placeholderTextColor={colors.placeholder}
            accessibilityLabel={t("wizard.chatA11y")}
            onSubmitEditing={sendChat}
            blurOnSubmit
            className="flex-1 bg-panel border border-line rounded-2xl px-4 py-3 text-text text-sm max-h-28"
            style={{ textAlignVertical: "top" }}
            maxLength={2000}
          />
          {draft.length > 0 ? (
            <Text className="text-muted text-[9px] absolute right-20 bottom-1.5">
              {draft.length}/2000
            </Text>
          ) : null}
          <Pressable
            onPress={sendChat}
            disabled={!draft.trim() || assist.isPending}
            accessibilityRole="button"
            accessibilityLabel={t("wizard.sendA11y")}
            className={`rounded-full w-12 h-12 min-h-[44px] items-center justify-center ${
              !draft.trim() || assist.isPending ? "bg-line" : "bg-accent"
            }`}
          >
            <Send
              size={18}
              color={!draft.trim() || assist.isPending ? colors.mutedIcon : colors.onAccent}
            />
          </Pressable>
        </View>
      ) : null}

      {/* Sabit alt navigasyon */}
      <View className="flex-row gap-3 px-5 py-4 border-t border-line bg-ink">
        {step > 0 ? (
          <View className="flex-1">
            <Btn tone="ghost" onPress={back} disabled={mutation.isPending}>
              <Text className="text-text font-semibold uppercase tracking-wider text-xs">
                {t("common.back")}
              </Text>
            </Btn>
          </View>
        ) : null}
        <View className="flex-[2]">
          <PrimaryButton
            label={isLast ? t("common.create") : t("common.continue")}
            busy={mutation.isPending}
            onPress={next}
          />
        </View>
      </View>
    </View>
  );
}

function ReviewRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View
      className={`flex-row items-start justify-between py-2.5 ${last ? "" : "border-b border-line"}`}
    >
      <Text className="text-muted text-xs uppercase tracking-wider mr-3">{label}</Text>
      <Text className="text-text text-sm flex-1 text-right" numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}
