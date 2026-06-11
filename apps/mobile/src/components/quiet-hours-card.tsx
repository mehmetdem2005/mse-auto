// Sessiz saatler kartı (ADR-085) — cihaz-yerel tercih. Pencere içinde bildirimler
// sessiz banner'a iner (ses/alarm yok, tray'de görünür). Saat seçimi stepper ile
// (native time-picker bağımlılığı yok → web+native ortak, ≥44pt dokunma).
import { type QuietHours, getQuietHours, setQuietHours } from "@/lib/quiet-hours";
import { useTheme } from "@/theme";
import { Minus, MoonStar, Plus } from "lucide-react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Switch, Text, View } from "react-native";

const ACCENT = "#6366F1";
const wrap = (n: number): number => ((n % 24) + 24) % 24;
const fmt = (h: number): string => `${String(h).padStart(2, "0")}:00`;

export function QuietHoursCard() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [qh, setQh] = useState<QuietHours | null>(null);

  useEffect(() => {
    void getQuietHours().then(setQh);
  }, []);

  function update(next: QuietHours) {
    setQh(next);
    void setQuietHours(next);
  }

  if (!qh) return null;

  return (
    <View className="bg-panel border border-line rounded-xl p-5 mb-4">
      <View className="flex-row items-center gap-3">
        <View className="w-10 h-10 rounded-full bg-accent/10 items-center justify-center">
          <MoonStar size={18} color={ACCENT} />
        </View>
        <View className="flex-1">
          <Text className="text-text text-sm font-semibold">{t("quiet.title")}</Text>
          <Text className="text-muted text-xs mt-0.5">{t("quiet.sub")}</Text>
        </View>
        <Switch
          value={qh.enabled}
          onValueChange={(v) => update({ ...qh, enabled: v })}
          trackColor={{ false: theme.colors.line, true: ACCENT }}
          thumbColor="#FFFFFF"
          accessibilityLabel={t("quiet.title")}
        />
      </View>

      {qh.enabled ? (
        <View className="flex-row gap-3 mt-4">
          <HourStepper
            label={t("quiet.start")}
            value={qh.startHour}
            onChange={(h) => update({ ...qh, startHour: h })}
          />
          <HourStepper
            label={t("quiet.end")}
            value={qh.endHour}
            onChange={(h) => update({ ...qh, endHour: h })}
          />
        </View>
      ) : null}
    </View>
  );
}

function HourStepper({
  label,
  value,
  onChange,
}: { label: string; value: number; onChange: (h: number) => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <View className="flex-1 bg-ink border border-line rounded-xl p-3 items-center">
      <Text className="text-muted text-[10px] uppercase tracking-wider mb-2">{label}</Text>
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={() => onChange(wrap(value - 1))}
          accessibilityRole="button"
          accessibilityLabel={t("quiet.decA11y", { label })}
          className="w-11 h-11 rounded-full bg-panel border border-line items-center justify-center active:opacity-60"
        >
          <Minus size={16} color={theme.colors.text} />
        </Pressable>
        <Text
          className="text-text text-lg font-bold w-14 text-center"
          accessibilityLiveRegion="polite"
        >
          {fmt(value)}
        </Text>
        <Pressable
          onPress={() => onChange(wrap(value + 1))}
          accessibilityRole="button"
          accessibilityLabel={t("quiet.incA11y", { label })}
          className="w-11 h-11 rounded-full bg-panel border border-line items-center justify-center active:opacity-60"
        >
          <Plus size={16} color={theme.colors.text} />
        </Pressable>
      </View>
    </View>
  );
}
