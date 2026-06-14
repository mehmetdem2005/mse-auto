// Görünüm ayarları (ADR-114): tema (sistem/açık/koyu) + VURGU RENGİ seçimi +
// HAREKET tercihi (sistem/tam/azalt). Tüm seçimler anında tüm uygulamaya uygulanır
// (useTheme → CSS değişkenleri + marka gradyanı tek kaynaktan) ve AsyncStorage'da kalıcıdır.
// Ekranın tepesindeki hero + önizleme kartı canlı önizleme görevi görür.
import { Badge, GradientHero, HeroOverlap, PrimaryButton } from "@/components/ui";
import { haptic } from "@/lib/haptics";
import {
  ACCENT_SWATCHES,
  type AccentKey,
  type MotionPref,
  type ThemeMode,
  useTheme,
  useThemeStore,
} from "@/theme";
import {
  Check,
  type LucideIcon,
  MonitorSmartphone,
  Moon,
  Sparkles,
  Sun,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

/** Segment (radio) satırı — tema ve hareket için tek-seçim kontrolü. */
function SegRow<T extends string>({
  value,
  options,
  onSelect,
}: {
  value: T;
  options: { key: T; label: string; Icon?: LucideIcon }[];
  onSelect: (k: T) => void;
}) {
  const theme = useTheme();
  return (
    <View className="flex-row bg-panel2 rounded-xl p-1 gap-1" accessibilityRole="radiogroup">
      {options.map((o) => {
        const sel = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => {
              haptic.light();
              onSelect(o.key);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: sel }}
            accessibilityLabel={o.label}
            className={`flex-1 flex-row items-center justify-center gap-1.5 min-h-[40px] rounded-lg ${sel ? "bg-accent/20" : ""}`}
          >
            {o.Icon ? (
              <o.Icon size={15} color={sel ? theme.colors.accent : theme.colors.mutedIcon} />
            ) : null}
            <Text className={`text-[13px] ${sel ? "text-accent font-semibold" : "text-muted"}`}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function Appearance() {
  const { t } = useTranslation();
  const theme = useTheme();
  const mode = useThemeStore((s) => s.mode);
  const accent = useThemeStore((s) => s.accent);
  const motion = useThemeStore((s) => s.motion);
  const setMode = useThemeStore((s) => s.setMode);
  const setAccent = useThemeStore((s) => s.setAccent);
  const setMotion = useThemeStore((s) => s.setMotion);

  // Renk adları sözlüğü — i18n anahtarları literal (tip-güvenli; dinamik şablon yok).
  const accentName: Record<AccentKey, string> = {
    indigo: t("appearance.accentIndigo"),
    blue: t("appearance.accentBlue"),
    violet: t("appearance.accentViolet"),
    fuchsia: t("appearance.accentFuchsia"),
    rose: t("appearance.accentRose"),
  };

  const themeOptions: { key: ThemeMode; label: string; Icon: LucideIcon }[] = [
    { key: "system", label: t("settings.themeSystem"), Icon: MonitorSmartphone },
    { key: "light", label: t("settings.themeLight"), Icon: Sun },
    { key: "dark", label: t("settings.themeDark"), Icon: Moon },
  ];
  const motionOptions: { key: MotionPref; label: string }[] = [
    { key: "system", label: t("settings.themeSystem") },
    { key: "full", label: t("appearance.motionFull") },
    { key: "reduced", label: t("appearance.motionReduced") },
  ];

  return (
    <View className="flex-1 bg-ink">
      {/* Hero, seçilen vurgu rengini canlı kullanır → değiştirince anında görünür. */}
      <GradientHero title={t("appearance.title")} back />
      <HeroOverlap>
        <ScrollView className="flex-1 px-5" contentContainerClassName="pt-5 pb-12">
          <Text className="text-muted text-[13px] leading-5 mb-5">{t("appearance.intro")}</Text>

          {/* Canlı önizleme — vurgu rengine bağlı tüm yüzeyler tek kartta. */}
          <View className="bg-panel border border-line rounded-2xl p-5 mb-6">
            <Text className="text-muted text-overline uppercase mb-3">
              {t("appearance.preview")}
            </Text>
            <View className="flex-row items-center gap-3 mb-4">
              <View className="w-11 h-11 rounded-full bg-accent items-center justify-center">
                <Sparkles size={18} color={theme.colors.onAccent} />
              </View>
              <View className="flex-1">
                <Text className="text-text text-sm font-semibold">Whenly</Text>
                <Text className="text-accent text-xs mt-0.5 font-medium">{accentName[accent]}</Text>
              </View>
              <Badge tone="accent">{t("appearance.previewBadge")}</Badge>
            </View>
            <PrimaryButton label={t("appearance.previewBtn")} onPress={() => haptic.light()} />
          </View>

          {/* Tema */}
          <Text className="text-muted text-overline uppercase mb-2">{t("appearance.theme")}</Text>
          <View className="mb-6">
            <SegRow value={mode} options={themeOptions} onSelect={setMode} />
          </View>

          {/* Vurgu rengi */}
          <Text className="text-muted text-overline uppercase mb-2">{t("appearance.accent")}</Text>
          <View className="bg-panel border border-line rounded-2xl p-5 mb-2">
            <View className="flex-row items-center justify-between">
              {ACCENT_SWATCHES.map(({ key, color }) => {
                const sel = key === accent;
                return (
                  <Pressable
                    key={key}
                    onPress={() => {
                      haptic.light();
                      setAccent(key);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: sel }}
                    accessibilityLabel={accentName[key]}
                    className="p-0.5 rounded-full"
                    style={{ borderWidth: 2, borderColor: sel ? theme.colors.text : "transparent" }}
                  >
                    <View
                      className="w-11 h-11 rounded-full items-center justify-center"
                      style={{ backgroundColor: color }}
                    >
                      {sel ? <Check size={20} color="#FFFFFF" strokeWidth={3} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <Text className="text-muted text-xs leading-5 mb-6">{t("appearance.accentHint")}</Text>

          {/* Hareket */}
          <Text className="text-muted text-overline uppercase mb-2">{t("appearance.motion")}</Text>
          <SegRow value={motion} options={motionOptions} onSelect={setMotion} />
          <Text className="text-muted text-xs leading-5 mt-2">{t("appearance.motionHint")}</Text>
        </ScrollView>
      </HeroOverlap>
    </View>
  );
}
