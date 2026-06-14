// Destek & İletişim (ADR-044): e-posta, sorun bildir, canlı destek talepleri.
import { EnterItem } from "@/components/motion";
import { Badge, Btn, Card, SectionLabel } from "@/components/ui";
import { GradientHero, HeroOverlap } from "@/components/ui";
import { type SupportTicket, api } from "@/lib/api";
import { useTheme } from "@/theme";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronRight, Mail, MessageCircle } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, Pressable, ScrollView, Text, TextInput, View } from "react-native";

const CONTACT_EMAIL = "mehmetdem782100@gmail.com";

function when(iso: string, lang: string): string {
  return new Date(iso).toLocaleDateString(lang);
}

export default function Support() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const [problem, setProblem] = useState("");
  const [sentProblem, setSentProblem] = useState(false);
  const tickets = useQuery({ queryKey: ["support"], queryFn: api.supportTickets });

  const report = useMutation({
    mutationFn: () => api.createSupport("problem", problem.trim()),
    onSuccess: () => {
      setSentProblem(true);
      setProblem("");
      void qc.invalidateQueries({ queryKey: ["support"] });
    },
  });
  const startLive = useMutation({
    mutationFn: () => api.createSupport("live", t("support.liveFirstMsg")),
    onSuccess: (t) => {
      void qc.invalidateQueries({ queryKey: ["support"] });
      router.push(`/support/${t.id}`);
    },
  });

  const live = (tickets.data ?? []).filter((t) => t.kind === "live");
  const problems = (tickets.data ?? []).filter((t) => t.kind === "problem");

  return (
    <View className="flex-1 bg-ink">
      <GradientHero title={t("support.title")} back />
      <HeroOverlap>
        <ScrollView className="flex-1 px-5" contentContainerClassName="pt-5 pb-12">
          {/* İletişim */}
          <SectionLabel>{t("support.contact")}</SectionLabel>
          <Card
            onPress={() => void Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
            accessibilityLabel={t("support.emailA11y", { mail: CONTACT_EMAIL })}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-accent/10 items-center justify-center">
                <Mail size={18} color="#6366F1" />
              </View>
              <View className="flex-1">
                <Text className="text-text text-sm font-semibold">{t("support.emailTitle")}</Text>
                <Text className="text-muted text-xs mt-0.5">{CONTACT_EMAIL}</Text>
              </View>
              <ChevronRight size={16} color={theme.colors.mutedIcon} />
            </View>
          </Card>

          {/* Canlı destek */}
          <View className="h-5" />
          <SectionLabel>{t("support.live")}</SectionLabel>
          <Card>
            <View className="flex-row items-center gap-3 mb-3">
              <View className="w-10 h-10 rounded-full bg-pos/10 items-center justify-center">
                <MessageCircle size={18} color="#16A34A" />
              </View>
              <Text className="text-muted text-xs flex-1">{t("support.liveHint")}</Text>
            </View>
            <Btn onPress={() => startLive.mutate()} disabled={startLive.isPending}>
              <Text className="text-onAccent text-[13px] font-semibold">
                {startLive.isPending ? t("support.liveOpening") : t("support.liveStart")}
              </Text>
            </Btn>
          </Card>
          {live.map((tk, i) => (
            <EnterItem key={tk.id} index={i} className="mt-2.5">
              <TicketRow t={tk} onPress={() => router.push(`/support/${tk.id}`)} />
            </EnterItem>
          ))}

          {/* Sorun bildir */}
          <View className="h-5" />
          <SectionLabel>{t("support.report")}</SectionLabel>
          <Card>
            {sentProblem ? (
              <Text className="text-pos text-sm">{t("support.reportSent")}</Text>
            ) : (
              <>
                <TextInput
                  value={problem}
                  onChangeText={setProblem}
                  multiline
                  placeholder={t("support.reportPlaceholder")}
                  placeholderTextColor="#94A3B8"
                  accessibilityLabel={t("support.reportA11y")}
                  className="bg-ink border border-line rounded-xl px-3 py-3 text-text text-sm min-h-[88px]"
                  style={{ textAlignVertical: "top" }}
                />
                {report.error ? (
                  <Text className="text-neg text-xs mt-2">
                    {report.error instanceof Error ? report.error.message : t("support.sendFail")}
                  </Text>
                ) : null}
                <View className="mt-3">
                  <Btn
                    onPress={() => report.mutate()}
                    disabled={report.isPending || problem.trim().length < 3}
                  >
                    <Text className="text-onAccent text-[13px] font-semibold">
                      {report.isPending ? t("support.sending") : t("common.send")}
                    </Text>
                  </Btn>
                </View>
              </>
            )}
          </Card>
          {problems.map((tk, i) => (
            <EnterItem key={tk.id} index={i} className="mt-2.5">
              <TicketRow t={tk} onPress={() => router.push(`/support/${tk.id}`)} />
            </EnterItem>
          ))}
        </ScrollView>
      </HeroOverlap>
    </View>
  );
}

function TicketRow({ t: tk, onPress }: { t: SupportTicket; onPress: () => void }) {
  const tTheme = useTheme();
  const { t, i18n } = useTranslation();
  const open = tk.status === "open";
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t("support.ticketA11y", {
        status: open ? t("common.open") : t("common.closed"),
        date: when(tk.createdAt, i18n.language),
      })}
      className="bg-panel border border-line rounded-xl px-4 py-3 min-h-[44px] active:bg-panel2"
    >
      <View className="flex-row items-center gap-2">
        <Badge tone={open ? "pos" : "muted"}>{open ? t("common.open") : t("common.closed")}</Badge>
        <Text className="text-muted text-[11px] ml-auto">{when(tk.createdAt, i18n.language)}</Text>
        <ChevronRight size={14} color={tTheme.colors.mutedIcon} />
      </View>
      {tk.lastMessage ? (
        <Text className="text-text text-sm mt-1.5" numberOfLines={1}>
          {tk.lastMessage}
        </Text>
      ) : null}
    </Pressable>
  );
}
