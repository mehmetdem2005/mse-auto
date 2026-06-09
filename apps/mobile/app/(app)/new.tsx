import { Btn, Field } from "@/components/ui";
import type { PersonalCriterion } from "@/domain/personal";
import { type AlarmChannel, DEFAULT_ALARM_CONFIG, setAlarmConfig } from "@/lib/alarm-config";
import { ALARM_CATEGORIES, ALARM_SOUNDS } from "@/lib/alarm-sounds";
import { api } from "@/lib/api";
import { setCriterion } from "@/lib/criteria-store";
import { setCachedEntitlements } from "@/lib/entitlements-cache";
import { qk } from "@/lib/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";

const FREQ = [60, 180, 360, 720, 1440];
type FilterType = "none" | "geo" | "numeric" | "keyword";

function labelFreq(m: number): string {
  if (m >= 1440) return "günlük";
  if (m >= 60) return `${m / 60} saat`;
  return `${m} dk`;
}

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
  const [rawIntent, setRawIntent] = useState("");
  const [freq, setFreq] = useState(60);
  const [err, setErr] = useState<string | null>(null);

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

  return (
    <ScrollView className="flex-1 bg-ink px-5 pt-4" keyboardShouldPersistTaps="handled">
      <Text className="text-muted text-xs mb-4">
        Doğal dille yaz — örn. "iPhone 17 fiyatı düşünce", "İzmir'de deprem olunca".
      </Text>
      {err ? <Text className="text-neg text-xs mb-3">{err}</Text> : null}
      <Field label="ne izlensin?">
        <TextInput
          value={rawIntent}
          onChangeText={setRawIntent}
          multiline
          placeholder="…"
          placeholderTextColor="#94A3B8"
          className="bg-panel border border-line rounded-lg px-3 py-3 text-text min-h-[88px]"
          style={{ textAlignVertical: "top" }}
        />
      </Field>

      <Text className="text-muted text-[10px] tracking-widest uppercase mb-2">kontrol sıklığı</Text>
      <View className="flex-row flex-wrap gap-2 mb-5">
        {FREQ.map((f) => (
          <Pressable key={f} onPress={() => setFreq(f)} className={chip(freq === f)}>
            <Text className={freq === f ? "text-accent text-xs" : "text-muted text-xs"}>
              {labelFreq(f)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="text-muted text-[10px] tracking-widest uppercase mb-1">
        kişisel filtre · cihazda kalır
      </Text>
      <Text className="text-muted text-[11px] mb-2">
        İsteğe bağlı. Kriterin cihazından çıkmaz; sunucu yalnız kamusal olayı yollar, eşleşmeyi
        telefonun yapar.
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
          let txt = "text-muted text-xs";
          if (locked) txt = "text-muted text-xs opacity-50";
          else if (filterType === v) txt = "text-accent text-xs";
          return (
            <Pressable
              key={v}
              disabled={locked}
              onPress={locked ? undefined : () => setFilterType(v)}
              className={chip(filterType === v)}
            >
              <Text className={txt}>{locked ? `${l} 🔒` : l}</Text>
            </Pressable>
          );
        })}
      </View>
      {!canPersonal ? (
        <Text className="text-muted text-[10px] mb-3">🔒 Kişisel filtre Pro planında.</Text>
      ) : null}

      {filterType === "geo" ? (
        <View className="gap-2 mb-5">
          <View className="flex-row gap-2">
            <CInput value={geoLat} onChangeText={setGeoLat} placeholder="enlem" />
            <CInput value={geoLng} onChangeText={setGeoLng} placeholder="boylam" />
            <CInput value={geoRadius} onChangeText={setGeoRadius} placeholder="km" />
          </View>
        </View>
      ) : null}

      {filterType === "numeric" ? (
        <View className="gap-2 mb-5">
          <View className="flex-row gap-2">
            {(["below", "above"] as const).map((d) => (
              <Pressable key={d} onPress={() => setNumDir(d)} className={chip(numDir === d)}>
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
        <View className="mb-5">
          <CInput
            value={keywords}
            onChangeText={setKeywords}
            placeholder="virgülle: zam, indirim"
            numeric={false}
          />
        </View>
      ) : null}

      <Text className="text-muted text-[10px] tracking-widest uppercase mb-2">uyarı şekli</Text>
      <View className="flex-row flex-wrap gap-2 mb-2">
        {(
          [
            ["silent", "sessiz"],
            ["notify", "bildirim"],
            ["alarm", "alarm"],
          ] as const
        ).map(([v, l]) => {
          const locked = v === "alarm" && !canAlarm;
          let txt = "text-muted text-xs";
          if (locked) txt = "text-muted text-xs opacity-50";
          else if (alarmChannel === v) txt = "text-accent text-xs";
          return (
            <Pressable
              key={v}
              disabled={locked}
              onPress={locked ? undefined : () => setAlarmChannel(v)}
              className={chip(alarmChannel === v)}
            >
              <Text className={txt}>{locked ? `${l} 🔒` : l}</Text>
            </Pressable>
          );
        })}
      </View>
      {!canAlarm ? (
        <Text className="text-muted text-[10px] mb-3">🔒 Alarm ve özel sesler Pro planında.</Text>
      ) : null}
      {alarmChannel === "alarm" ? (
        <View className="mb-5">
          <View className="flex-row flex-wrap gap-2 mb-2">
            {ALARM_CATEGORIES.map((c) => (
              <Pressable key={c} onPress={() => setSoundCat(c)} className={chip(soundCat === c)}>
                <Text
                  className={soundCat === c ? "text-accent text-[11px]" : "text-muted text-[11px]"}
                >
                  {c}
                </Text>
              </Pressable>
            ))}
          </View>
          <View className="border border-line rounded-lg overflow-hidden">
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

      <Btn
        onPress={() => {
          setErr(null);
          const criterion = buildCriterion();
          if (filterType !== "none" && criterion === null) {
            setErr("filtre alanları geçersiz");
            return;
          }
          mutation.mutate(criterion);
        }}
        disabled={mutation.isPending || rawIntent.trim().length < 3}
      >
        {mutation.isPending ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className="text-white font-semibold uppercase tracking-wider text-xs">oluştur</Text>
        )}
      </Btn>
      <Text className="text-muted text-[11px] mt-4">
        Ücretsiz planda 3 watcher ve en sık 60 dk sınırı vardır.
      </Text>
    </ScrollView>
  );
}
