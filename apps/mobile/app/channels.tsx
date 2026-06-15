// Ek bildirim kanalları (ADR-084): Telegram / E-posta / WhatsApp — hesap düzeyi.
// Push her zaman açıktır; bunlar EK kanallardır. Yalnız paylaşılan watcher'larda
// sunucu-tarafı gönderilir (kişisel filtreler cihazda değerlendiğinden).
import { toast } from "@/components/feedback";
import { Btn, GradientHero, HeroOverlap, SkeletonCard } from "@/components/ui";
import { type ChannelKind, type UserChannels, api } from "@/lib/api";
import { qk } from "@/lib/query";
import { BRAND, useTheme } from "@/theme";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Mail, MessageCircle, Phone, Send } from "lucide-react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";

export default function Channels() {
  const { t } = useTranslation();
  const theme = useTheme();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: qk.channels, queryFn: api.channels });
  // Admin'in açtığı kanallar (ADR-107) — kapalıysa kart kilitlenir + uyarı gösterilir.
  const cfg = useQuery({ queryKey: ["appConfig"], queryFn: api.appConfig });
  const avail = cfg.data?.channels;
  const configured = cfg.data?.channelsConfigured;
  // ADR-152: kanal kullanılamıyorsa NEDEN'i dürüstçe ayır — sunucuda kimlik bilgisi yok mu
  // ("henüz hazır değil") yoksa admin mi kapattı. Sessiz başarısızlık yerine net mesaj.
  function channelState(kind: ChannelKind): { available: boolean; disabledText: string } {
    const available = avail ? avail[kind] : true;
    const unconfigured = configured ? !configured[kind] : false;
    return {
      available,
      disabledText: unconfigured ? t("channels.notReady") : t("channels.disabledByAdmin"),
    };
  }

  const [tg, setTg] = useState("");
  const [email, setEmail] = useState("");
  const [wa, setWa] = useState("");
  const [enabled, setEnabled] = useState<Set<ChannelKind>>(new Set());

  // Sunucu verisi gelince formu doldur (tek sefer; react-query cache kaynak).
  useEffect(() => {
    if (!q.data) return;
    setTg(q.data.telegramChatId ?? "");
    setEmail(q.data.email ?? "");
    setWa(q.data.whatsappTo ?? "");
    setEnabled(new Set(q.data.enabled));
  }, [q.data]);

  const save = useMutation({
    mutationFn: (body: UserChannels) => api.setChannels(body),
    onSuccess: (data) => {
      qc.setQueryData(qk.channels, data);
      toast.success(t("channels.saved"));
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : t("channels.saveFail")),
  });

  function toggle(kind: ChannelKind, on: boolean) {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (on) next.add(kind);
      else next.delete(kind);
      return next;
    });
  }

  function onSave() {
    save.mutate({
      telegramChatId: tg.trim() || null,
      email: email.trim() || null,
      whatsappTo: wa.trim() || null,
      enabled: [...enabled],
    });
  }

  // ADR-153: tek-dokunuş Telegram bağlama — sunucudan derin bağlantı al, Telegram'ı aç. Kullanıcı
  // bota /start'a basınca webhook chat_id'yi otomatik bağlar (chat kimliğiyle elle uğraşmak yok).
  async function connectTelegram() {
    try {
      const { url } = await api.linkTelegram();
      if (url) await Linking.openURL(url);
      else toast.error(t("channels.notReady"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("channels.saveFail"));
    }
  }

  if (q.isLoading) {
    return (
      <View className="flex-1 bg-ink">
        <GradientHero title={t("channels.title")} back />
        <View className="px-5 pt-5">
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-ink">
      <GradientHero title={t("channels.title")} back />
      <HeroOverlap>
        <ScrollView className="flex-1 px-5" contentContainerClassName="pt-5 pb-12">
          <Text className="text-muted text-[13px] leading-5 mb-4">{t("channels.intro")}</Text>

          <ChannelCard
            Icon={MessageCircle}
            tint={BRAND.telegram}
            title={t("channels.telegram")}
            note={t("channels.telegramNote")}
            on={enabled.has("telegram")}
            onToggle={(v) => toggle("telegram", v)}
            value={tg}
            onChange={setTg}
            placeholder={t("channels.telegramPlaceholder")}
            keyboardType="default"
            onConnect={connectTelegram}
            connectLabel={t("channels.telegramConnect")}
            {...channelState("telegram")}
          />
          <ChannelCard
            Icon={Mail}
            tint={theme.colors.pos}
            title={t("channels.email")}
            note={t("channels.emailNote")}
            on={enabled.has("email")}
            onToggle={(v) => toggle("email", v)}
            value={email}
            onChange={setEmail}
            placeholder={t("channels.emailPlaceholder")}
            keyboardType="email-address"
            {...channelState("email")}
          />
          <ChannelCard
            Icon={Phone}
            tint={BRAND.whatsapp}
            title={t("channels.whatsapp")}
            note={t("channels.whatsappNote")}
            on={enabled.has("whatsapp")}
            onToggle={(v) => toggle("whatsapp", v)}
            value={wa}
            onChange={setWa}
            placeholder={t("channels.whatsappPlaceholder")}
            keyboardType="phone-pad"
            {...channelState("whatsapp")}
          />

          <Text className="text-muted text-[11px] leading-4 mt-1 mb-4">
            {t("channels.privacy")}
          </Text>

          <Btn onPress={onSave} disabled={save.isPending}>
            <Text className="text-onAccent text-[13px] font-semibold">{t("common.save")}</Text>
          </Btn>
        </ScrollView>
      </HeroOverlap>
    </View>
  );
}

function ChannelCard({
  Icon,
  tint,
  title,
  note,
  on,
  onToggle,
  value,
  onChange,
  placeholder,
  keyboardType,
  available = true,
  disabledText,
  onConnect,
  connectLabel,
}: {
  Icon: typeof Mail;
  tint: string;
  title: string;
  note: string;
  on: boolean;
  onToggle: (v: boolean) => void;
  value: string;
  onChange: (s: string) => void;
  placeholder: string;
  keyboardType: "default" | "email-address" | "phone-pad";
  /** Admin bu kanalı açtı mı (ADR-107) — false ise kart kilitli + uyarı. */
  available?: boolean;
  disabledText?: string;
  /** ADR-153: tek-dokunuş bağlama eylemi (yalnız Telegram kartında); available iken gösterilir. */
  onConnect?: () => void;
  connectLabel?: string;
}) {
  const theme = useTheme();
  return (
    <View
      className={`bg-panel border border-line rounded-2xl p-4 mb-3 ${available ? "" : "opacity-90"}`}
    >
      <View className="flex-row items-center gap-3">
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: `${tint}1A` }}
        >
          <Icon size={18} color={tint} />
        </View>
        <Text className="text-text text-sm font-semibold flex-1">{title}</Text>
        <Switch
          value={available && on}
          onValueChange={onToggle}
          disabled={!available}
          trackColor={{ false: theme.colors.line, true: theme.colors.accent }}
          thumbColor="#FFFFFF"
          accessibilityLabel={title}
        />
      </View>
      {!available ? (
        <View className="flex-row items-center gap-2 bg-warn/10 border border-warn/30 rounded-xl px-3 py-2.5 mt-3">
          <Lock size={13} color="#B45309" />
          <Text className="text-warn text-[11px] flex-1 leading-4">{disabledText}</Text>
        </View>
      ) : on ? (
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.placeholder}
          autoCapitalize="none"
          keyboardType={keyboardType}
          className="bg-ink border border-line rounded-xl px-3 py-3 text-text text-sm mt-3"
        />
      ) : null}
      <Text className="text-muted text-[11px] leading-4 mt-2">{note}</Text>
      {available && onConnect && connectLabel ? (
        <Pressable
          onPress={onConnect}
          accessibilityRole="button"
          accessibilityLabel={connectLabel}
          className="flex-row items-center justify-center gap-2 bg-accent/10 border border-accent/30 rounded-xl px-3 py-3 mt-3 min-h-[44px] active:opacity-80"
        >
          <Send size={14} color={theme.colors.accent} />
          <Text className="text-accent text-[13px] font-semibold">{connectLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
