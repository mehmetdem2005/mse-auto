import { toast } from "@/components/feedback";
import { ActBtn, ConsoleShell, ErrText, Loading } from "@/features/admin/ui";
import { type PlanEntitlement, api } from "@/lib/api";
import { useTheme } from "@/theme";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";
import { ScrollView, Switch, Text, TextInput, View } from "react-native";

// ADR-160: admin-yapılandırılır plan limitleri — kod/redeploy gerekmeden Free/Pro yetkilerini değiştir.
const PLANS = [
  { key: "free" as const, label: "Ücretsiz (Free)" },
  { key: "pro" as const, label: "Pro" },
];

export default function AdminPlanEntitlementsScreen(): ReactNode {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["adminPlanEntitlements"], queryFn: api.adminPlanEntitlements });
  const save = useMutation({
    mutationFn: (v: { plan: "free" | "pro"; ent: PlanEntitlement }) =>
      api.setAdminPlanEntitlements(v.plan, v.ent),
    onSuccess: (data) => {
      qc.setQueryData(["adminPlanEntitlements"], data);
      toast.success("Plan limitleri güncellendi");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "kaydedilemedi"),
  });

  return (
    <ConsoleShell title="Plan Limitleri" sub="watcher · sıklık · alarm">
      <ScrollView className="flex-1" contentContainerClassName="px-5 pt-4 pb-12">
        {q.isLoading ? <Loading /> : null}
        {q.error ? <ErrText e={q.error} /> : null}
        {q.data ? (
          <>
            <Text className="text-muted text-[13px] leading-5 mb-4">
              Plan limitlerini buradan değiştir — kod veya yeniden-dağıtım gerekmez. Kaydedince
              anında tüm kullanıcılara uygulanır: aktif watcher limiti, en sık kontrol süresi, alarm
              ve tüm-sesler hakkı.
            </Text>
            {PLANS.map((p) => (
              <PlanCard
                key={p.key}
                label={p.label}
                value={q.data[p.key]}
                busy={save.isPending}
                onSave={(ent) => save.mutate({ plan: p.key, ent })}
              />
            ))}
          </>
        ) : null}
      </ScrollView>
    </ConsoleShell>
  );
}

function PlanCard({
  label,
  value,
  busy,
  onSave,
}: {
  label: string;
  value: PlanEntitlement;
  busy: boolean;
  onSave: (ent: PlanEntitlement) => void;
}): ReactNode {
  const theme = useTheme();
  const [maxW, setMaxW] = useState(String(value.maxActiveWatches));
  const [minF, setMinF] = useState(String(value.minFrequencyMinutes));
  const [alarm, setAlarm] = useState(value.alarmChannel);
  const [allSounds, setAllSounds] = useState(value.allSounds);
  // Sunucu verisi gelince/değişince formu eşle.
  useEffect(() => {
    setMaxW(String(value.maxActiveWatches));
    setMinF(String(value.minFrequencyMinutes));
    setAlarm(value.alarmChannel);
    setAllSounds(value.allSounds);
  }, [value]);

  function handleSave(): void {
    const mw = Number.parseInt(maxW, 10);
    const mf = Number.parseInt(minF, 10);
    if (!Number.isFinite(mw) || mw < 1 || !Number.isFinite(mf) || mf < 1) {
      toast.error("Watcher limiti ve sıklık en az 1 olmalı");
      return;
    }
    onSave({ maxActiveWatches: mw, minFrequencyMinutes: mf, alarmChannel: alarm, allSounds });
  }

  return (
    <View className="bg-panel border border-line rounded-2xl p-4 mb-3">
      <Text className="text-text text-sm font-semibold mb-3">{label}</Text>
      <NumRow label="Aktif watcher limiti" value={maxW} onChange={setMaxW} />
      <NumRow label="En sık kontrol (dakika)" value={minF} onChange={setMinF} />
      <SwitchRow
        label="Alarm (yüksek sesli uyarı)"
        value={alarm}
        onChange={setAlarm}
        tint={theme.colors.accent}
        track={theme.colors.line}
      />
      <SwitchRow
        label="Tüm sesler (100 alarm sesi)"
        value={allSounds}
        onChange={setAllSounds}
        tint={theme.colors.accent}
        track={theme.colors.line}
      />
      <View className="mt-2">
        <ActBtn label="Kaydet" tone="solid" disabled={busy} onPress={handleSave} />
      </View>
    </View>
  );
}

function NumRow({
  label,
  value,
  onChange,
}: { label: string; value: string; onChange: (s: string) => void }): ReactNode {
  const theme = useTheme();
  return (
    <View className="flex-row items-center justify-between mb-3 min-h-[44px]">
      <Text className="text-text text-[13px] flex-1 pr-3">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="number-pad"
        accessibilityLabel={label}
        placeholderTextColor={theme.colors.placeholder}
        className="bg-ink border border-line rounded-xl px-3 py-2.5 text-text text-sm w-24 text-right"
      />
    </View>
  );
}

function SwitchRow({
  label,
  value,
  onChange,
  tint,
  track,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  tint: string;
  track: string;
}): ReactNode {
  return (
    <View className="flex-row items-center justify-between mb-3 min-h-[44px]">
      <Text className="text-text text-[13px] flex-1 pr-3">{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: track, true: tint }}
        thumbColor="#FFFFFF"
        accessibilityLabel={label}
      />
    </View>
  );
}
