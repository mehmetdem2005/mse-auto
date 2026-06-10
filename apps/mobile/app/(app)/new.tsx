import { Btn, Card } from "@/components/ui";
import type { PersonalCriterion } from "@/domain/personal";
import { type AlarmChannel, DEFAULT_ALARM_CONFIG, setAlarmConfig } from "@/lib/alarm-config";
import { ALARM_CATEGORIES, ALARM_SOUNDS } from "@/lib/alarm-sounds";
import { type AssistMessage, api } from "@/lib/api";
import { setCriterion } from "@/lib/criteria-store";
import { setCachedEntitlements } from "@/lib/entitlements-cache";
import { qk } from "@/lib/query";
import { useReduceMotion } from "@/lib/reduce-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";

const FREQ = [60, 180, 360, 720, 1440];
type FilterType = "none" | "geo" | "numeric" | "keyword";

// FSM: çok adımlı sihirbaz (design-standards §5 — çok adımlı akış açık durumlarla).
// 1. adım artık AI sohbeti: asistan muğlak isteği soruyla netleştirir (ADR-035).
const STEPS = [
  { key: "intent", title: "Ne izlensin?" },
  { key: "frequency", title: "Ne sıklıkla kontrol edilsin?" },
  { key: "filter", title: "Kişisel filtre" },
  { key: "alert", title: "Nasıl haber verilsin?" },
  { key: "review", title: "Özet ve onay" },
] as const;

const GREETING: AssistMessage = {
  role: "assistant",
  content:
    "Merhaba! Ne olduğunda sana haber vereyim? Doğal dille anlat — genel kalırsa netleştirmek için soru soracağım. Örn. “iPhone 17 fiyatı 50.000 TL altına inince”.",
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
  if (m >= 1440) return "günlük";
  if (m >= 60) return `${m / 60} saat`;
  return `${m} dk`;
}

const ALERT_LABEL: Record<AlarmChannel, string> = {
  silent: "Sessiz",
  notify: "Bildirim",
  alarm: "Alarm",
};

const chip = (active: boolean): string =>
  `px-3 py-2 rounded-lg border ${active ? "border-accent bg-accent/10" : "border-line"}`;

function CInput(props: {
  value: string;
  onChangeText: (s: string) => void;
  placeholder: string;
  numeric?: boolean;
}) {
  return (
    <TextInput
      value={props.value}
      onChangeText={props.onChangeText}
      placeholder={props.placeholder}
      placeholderTextColor="#94A3B8"
      keyboardType={props.numeric === false ? "default" : "numeric"}
      className="flex-1 bg-panel border border-line rounded-lg px-3 py-2 text-text"
    />
  );
}

export default function NewWatcher() {
  const router = useRouter();
  const qc = useQueryClient();
  const reduce = useReduceMotion();
  const [step, setStep] = useState(0);
  const [rawIntent, setRawIntent] = useState("");
  const [freq, setFreq] = useState(60);
  const [err, setErr] = useState<string | null>(null);

  // AI sohbeti (1. adım): geçmiş + taslak + netleşmiş niyet.
  const [messages, setMessages] = useState<AssistMessage[]>([GREETING]);
  const [draft, setDraft] = useState("");
  const [readyIntent, setReadyIntent] = useState<string | null>(null);
  const [assistDown, setAssistDown] = useState(false); // asistan hatasında elle-devam yolu açılır
  const chatScroll = useRef<ScrollView>(null);

  // Kişisel filtre (ADR-015): CİHAZDA kalır, sunucuya gönderilmez.
  const [filterType, setFilterType] = useState<FilterType>("none");
  const [geoLat, setGeoLat] = useState("");
  const [geoLng, setGeoLng] = useState("");
  const [geoRadius, setGeoRadius] = useState("");
  const [numDir, setNumDir] = useState<"below" | "above">("below");
  const [numThreshold, setNumThreshold] = useState("");
  const [numCurrency, setNumCurrency] = useState("");
  const [keywords, setKeywords] = useState("");
  const [alarmChannel, setAlarmChannel] = useState<AlarmChannel>(DEFAULT_ALARM_CONFIG.channel);
  const [soundId, setSoundId] = useState(DEFAULT_ALARM_CONFIG.soundId);
  const [soundCat, setSoundCat] = useState(ALARM_CATEGORIES[0] ?? "Klasik");
  const { data: sub } = useQuery({ queryKey: qk.subscription, queryFn: api.subscription });
  const canAlarm = sub?.entitlements.alarmChannel ?? false;
  const canPersonal = sub?.entitlements.personalFilters ?? false;
  const canAllSounds = sub?.entitlements.allSounds ?? false;
  useEffect(() => {
    if (!sub) return;
    void setCachedEntitlements({
      alarmChannel: sub.entitlements.alarmChannel,
      allSounds: sub.entitlements.allSounds,
      personalFilters: sub.entitlements.personalFilters,
    });
  }, [sub]);

  const minFreq = sub?.limits.minFrequencyMinutes ?? 60;
  const assist = useMutation({
    mutationFn: (history: AssistMessage[]) => api.assistChat(history.slice(-40)),
    onSuccess: (r) => {
      setAssistDown(false);
      setMessages((m) => [...m, { role: "assistant", content: r.message }]);
      if (r.ready && r.intent) {
        setReadyIntent(r.intent);
        setRawIntent(r.intent);
        if (r.frequencyMinutes) setFreq(snapFreq(r.frequencyMinutes, minFreq));
      } else {
        setReadyIntent(null);
      }
    },
    onError: (e) => {
      setAssistDown(true);
      const msg = e instanceof Error && e.message ? e.message : "Bir sorun oluştu";
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `${msg} — tekrar dene ya da yazdığını doğrudan kullan.` },
      ]);
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
      { role: "assistant", content: `Tamam, şunu izleyeceğim: “${last}”. “Devam” ile sürdür.` },
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

  function buildCriterion(): PersonalCriterion | null {
    if (filterType === "geo") {
      if (geoLat.trim() === "" || geoLng.trim() === "" || geoRadius.trim() === "") return null;
      const lat = Number(geoLat);
      const lng = Number(geoLng);
      const r = Number(geoRadius);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(r) || r <= 0)
        return null;
      return { kind: "geo_radius", lat, lng, radiusKm: r };
    }
    if (filterType === "numeric") {
      if (numThreshold.trim() === "") return null;
      const t = Number(numThreshold);
      if (!Number.isFinite(t)) return null;
      const cur = numCurrency.trim().toLowerCase();
      if (numDir === "below") {
        return cur
          ? { kind: "numeric_below", threshold: t, currency: cur }
          : { kind: "numeric_below", threshold: t };
      }
      return cur
        ? { kind: "numeric_above", threshold: t, currency: cur }
        : { kind: "numeric_above", threshold: t };
    }
    if (filterType === "keyword") {
      const arr = keywords
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (arr.length === 0) return null;
      return { kind: "keyword", anyOf: arr };
    }
    return null;
  }

  function filterSummary(): string {
    if (filterType === "none") return "Yok";
    if (filterType === "geo") return `Konum ${geoLat}, ${geoLng} · ${geoRadius} km içi`;
    if (filterType === "numeric") {
      return `${numDir === "below" ? "≤" : "≥"} ${numThreshold}${numCurrency ? ` ${numCurrency}` : ""}`;
    }
    return `Kelime: ${keywords}`;
  }

  const mutation = useMutation({
    mutationFn: (_criterion: PersonalCriterion | null) => api.createWatcher(rawIntent.trim(), freq),
    onSuccess: async (watch, criterion) => {
      if (criterion) await setCriterion(watch.id, criterion);
      await setAlarmConfig(watch.id, { channel: alarmChannel, soundId });
      await qc.invalidateQueries({ queryKey: qk.watchers });
      await qc.invalidateQueries({ queryKey: qk.subscription });
      router.replace("/");
    },
    onError: (e) => setErr(e instanceof Error ? e.message : "oluşturulamadı"),
  });

  /** FSM geçiş kuralı: mevcut adım geçerli mi? */
  function stepValid(i: number): boolean {
    if (i === 0) return readyIntent !== null && rawIntent.trim().length >= 3;
    if (i === 2) return filterType === "none" || buildCriterion() !== null;
    return true;
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function next() {
    setErr(null);
    if (!stepValid(step)) {
      setErr(step === 0 ? "Önce asistanla niyeti netleştir." : "Filtre alanları geçersiz.");
      return;
    }
    if (isLast) {
      mutation.mutate(buildCriterion());
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
      {/* İlerleme */}
      <View className="px-5 pt-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-muted text-[11px] uppercase tracking-widest">
            adım {step + 1}/{STEPS.length}
          </Text>
          <Text className="text-muted text-[11px]">{current.title}</Text>
        </View>
        <View
          className="h-1.5 bg-line rounded-full overflow-hidden"
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 1, max: STEPS.length, now: step + 1 }}
        >
          <View
            className="h-full bg-accent rounded-full"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </View>
      </View>

      <ScrollView
        ref={chatScroll}
        className="flex-1 px-5 pt-5"
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => {
          if (step === 0) chatScroll.current?.scrollToEnd({ animated: !reduce });
        }}
      >
        <Text className="text-text text-xl font-bold mb-4">{current.title}</Text>
        {err ? <Text className="text-neg text-xs mb-3">{err}</Text> : null}

        {/* 1) Niyet — AI sohbeti (Gemini tarzı): muğlaksa asistan soruyla netleştirir */}
        {current.key === "intent" ? (
          <View accessibilityLabel="Asistan sohbeti">
            {messages.map((m, i) => (
              <View
                // Sohbet geçmişi yalnız sona eklenir → indeks anahtarı kararlı.
                key={`${i}-${m.role}`}
                className={`max-w-[85%] rounded-2xl px-4 py-3 mb-2.5 ${
                  m.role === "user"
                    ? "self-end bg-accent rounded-br-md"
                    : "self-start bg-panel border border-line rounded-bl-md"
                }`}
                accessibilityRole="text"
                accessibilityLabel={`${m.role === "user" ? "Sen" : "Asistan"}: ${m.content}`}
              >
                <Text className={m.role === "user" ? "text-white text-sm" : "text-text text-sm"}>
                  {m.content}
                </Text>
              </View>
            ))}
            {assist.isPending ? (
              <View className="self-start bg-panel border border-line rounded-2xl rounded-bl-md px-4 py-3 mb-2.5">
                <ActivityIndicator size="small" color="#6366F1" />
              </View>
            ) : null}
            {assistDown && messages.some((m) => m.role === "user") ? (
              <Pressable
                onPress={useDraftAsIntent}
                accessibilityRole="button"
                accessibilityLabel="Yazdığımı niyet olarak kullan"
                className="self-start border border-accent rounded-full px-4 py-3 mb-2.5 min-h-[44px] justify-center"
              >
                <Text className="text-accent text-xs font-semibold uppercase tracking-wider">
                  yazdığımı niyet olarak kullan
                </Text>
              </Pressable>
            ) : null}
            {readyIntent ? (
              <View className="bg-accent/10 border border-accent rounded-2xl px-4 py-3 mt-1">
                <Text className="text-accent text-[10px] uppercase tracking-widest mb-1">
                  izlemeye hazır
                </Text>
                <Text className="text-text text-sm">{readyIntent}</Text>
                <Text className="text-muted text-[11px] mt-1">
                  Önerilen sıklık: {labelFreq(freq)} · “Devam” ile sürdür ya da yazmaya devam et.
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* 2) Sıklık */}
        {current.key === "frequency" ? (
          <>
            <Text className="text-muted text-sm mb-3">
              Daha sık kontrol daha hızlı haber demektir (ücretsiz planda en sık 60 dk).
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {FREQ.map((f) => (
                <Pressable
                  key={f}
                  onPress={() => setFreq(f)}
                  className={chip(freq === f)}
                  accessibilityRole="button"
                >
                  <Text className={freq === f ? "text-accent text-sm" : "text-muted text-sm"}>
                    {labelFreq(f)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        {/* 3) Kişisel filtre */}
        {current.key === "filter" ? (
          <>
            <Text className="text-muted text-sm mb-3">
              İsteğe bağlı. Kriterin cihazından çıkmaz; sunucu yalnız kamusal olayı yollar,
              eşleşmeyi telefonun yapar.
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-2">
              {(
                [
                  ["none", "yok"],
                  ["geo", "konum"],
                  ["numeric", "sayı/fiyat"],
                  ["keyword", "kelime"],
                ] as const
              ).map(([v, l]) => {
                const locked = v !== "none" && !canPersonal;
                let txt = "text-muted text-sm";
                if (locked) txt = "text-muted text-sm opacity-50";
                else if (filterType === v) txt = "text-accent text-sm";
                return (
                  <Pressable
                    key={v}
                    disabled={locked}
                    onPress={locked ? undefined : () => setFilterType(v)}
                    className={chip(filterType === v)}
                    accessibilityRole="button"
                  >
                    <Text className={txt}>{locked ? `${l} 🔒` : l}</Text>
                  </Pressable>
                );
              })}
            </View>
            {!canPersonal ? (
              <Text className="text-muted text-[11px] mb-3">🔒 Kişisel filtre Pro planında.</Text>
            ) : null}

            {filterType === "geo" ? (
              <View className="flex-row gap-2 mt-2">
                <CInput value={geoLat} onChangeText={setGeoLat} placeholder="enlem" />
                <CInput value={geoLng} onChangeText={setGeoLng} placeholder="boylam" />
                <CInput value={geoRadius} onChangeText={setGeoRadius} placeholder="km" />
              </View>
            ) : null}

            {filterType === "numeric" ? (
              <View className="gap-2 mt-2">
                <View className="flex-row gap-2">
                  {(["below", "above"] as const).map((d) => (
                    <Pressable
                      key={d}
                      onPress={() => setNumDir(d)}
                      className={chip(numDir === d)}
                      accessibilityRole="button"
                    >
                      <Text className={numDir === d ? "text-accent text-xs" : "text-muted text-xs"}>
                        {d === "below" ? "altına inince" : "üstüne çıkınca"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View className="flex-row gap-2">
                  <CInput value={numThreshold} onChangeText={setNumThreshold} placeholder="eşik" />
                  <CInput
                    value={numCurrency}
                    onChangeText={setNumCurrency}
                    placeholder="birim (ops.)"
                    numeric={false}
                  />
                </View>
              </View>
            ) : null}

            {filterType === "keyword" ? (
              <View className="mt-2">
                <CInput
                  value={keywords}
                  onChangeText={setKeywords}
                  placeholder="virgülle: zam, indirim"
                  numeric={false}
                />
              </View>
            ) : null}
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
                    <Text className={txt}>{locked ? `${ALERT_LABEL[v]} 🔒` : ALERT_LABEL[v]}</Text>
                  </Pressable>
                );
              })}
            </View>
            {!canAlarm ? (
              <Text className="text-muted text-[11px] mb-3">
                🔒 Alarm ve özel sesler Pro planında.
              </Text>
            ) : null}
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
                    const sel = soundId === s.id;
                    let cls = "text-text text-xs";
                    if (locked) cls = "text-muted text-xs opacity-50";
                    else if (sel) cls = "text-accent text-xs";
                    return (
                      <Pressable
                        key={s.id}
                        disabled={locked}
                        onPress={locked ? undefined : () => setSoundId(s.id)}
                        className={`px-3 py-2 border-b border-line ${sel ? "bg-accent/10" : ""}`}
                        accessibilityRole="button"
                      >
                        <Text className={cls}>
                          {sel ? "✓ " : ""}
                          {locked ? `${s.name} 🔒` : s.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {!canAllSounds ? (
                  <Text className="text-muted text-[10px] mt-1">🔒 Tüm sesler Pro planında.</Text>
                ) : null}
                <Text className="text-muted text-[10px] mt-2">
                  Önizleme/çalma EAS derlemesinde. 100 ses assets/sounds içinde.
                </Text>
              </View>
            ) : null}
          </>
        ) : null}

        {/* 5) Özet */}
        {current.key === "review" ? (
          <Card>
            <ReviewRow label="ne izlensin" value={rawIntent.trim() || "—"} />
            <ReviewRow label="sıklık" value={labelFreq(freq)} />
            <ReviewRow label="kişisel filtre" value={filterSummary()} />
            <ReviewRow label="uyarı" value={ALERT_LABEL[alarmChannel]} last />
            <Text className="text-muted text-[11px] mt-4">
              Ücretsiz planda 3 watcher ve en sık 60 dk sınırı vardır.
            </Text>
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
            placeholder="Mesaj yaz…"
            placeholderTextColor="#94A3B8"
            accessibilityLabel="Asistana mesaj yaz"
            onSubmitEditing={sendChat}
            blurOnSubmit
            className="flex-1 bg-panel border border-line rounded-2xl px-4 py-3 text-text text-sm max-h-28"
            style={{ textAlignVertical: "top" }}
          />
          <Pressable
            onPress={sendChat}
            disabled={!draft.trim() || assist.isPending}
            accessibilityRole="button"
            accessibilityLabel="Gönder"
            className={`rounded-full px-5 py-3 min-h-[44px] justify-center ${
              !draft.trim() || assist.isPending ? "bg-line" : "bg-accent"
            }`}
          >
            <Text
              className={`text-xs font-semibold uppercase tracking-wider ${
                !draft.trim() || assist.isPending ? "text-muted" : "text-white"
              }`}
            >
              gönder
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* Sabit alt navigasyon */}
      <View className="flex-row gap-3 px-5 py-4 border-t border-line bg-ink">
        {step > 0 ? (
          <View className="flex-1">
            <Btn tone="ghost" onPress={back} disabled={mutation.isPending}>
              <Text className="text-text font-semibold uppercase tracking-wider text-xs">geri</Text>
            </Btn>
          </View>
        ) : null}
        <View className="flex-[2]">
          <Btn onPress={next} disabled={mutation.isPending}>
            {mutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-semibold uppercase tracking-wider text-xs">
                {isLast ? "oluştur" : "devam"}
              </Text>
            )}
          </Btn>
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
