import { EnterItem } from "@/components/motion";
import { Card, EmptyState, GradientHero, HeroOverlap } from "@/components/ui";
import { useAnnouncements, useMarkAnnouncementsSeen } from "@/lib/announcements";
import type { Announcement, AnnouncementKind } from "@/lib/api";
import { useTheme } from "@/theme";
import {
  AlertTriangle,
  Info,
  type LucideIcon,
  Megaphone,
  Pin,
  Sparkles,
  Tag,
} from "lucide-react-native";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Image, Linking, Pressable, Text, View } from "react-native";

const KIND_META: Record<
  AnnouncementKind,
  { Icon: LucideIcon; tone: "accent" | "pos" | "neg" | "warn"; color: string }
> = {
  info: { Icon: Info, tone: "accent", color: "#6366F1" },
  update: { Icon: Sparkles, tone: "pos", color: "#16A34A" },
  promo: { Icon: Tag, tone: "accent", color: "#8B5CF6" },
  warning: { Icon: AlertTriangle, tone: "warn", color: "#B45309" },
};

export default function AnnouncementsScreen() {
  const { t } = useTranslation();
  const q = useAnnouncements();
  const markSeen = useMarkAnnouncementsSeen();

  // Ekran açıldığında (veliste yüklendiğinde) okundu damgala → zil rozeti sıfırlanır.
  // biome-ignore lint/correctness/useExhaustiveDependencies: yalnız veri geldiğinde bir kez.
  useEffect(() => {
    if (q.data) markSeen();
  }, [q.data]);

  return (
    <View className="flex-1 bg-ink">
      <GradientHero title={t("announcements.title")} back />
      <HeroOverlap>
        <FlatList
          data={q.data ?? []}
          keyExtractor={(a) => a.id}
          contentContainerClassName="px-5 pt-5 pb-10"
          onRefresh={() => void q.refetch()}
          refreshing={q.isRefetching}
          ItemSeparatorComponent={() => <View className="h-3.5" />}
          ListEmptyComponent={
            q.isLoading ? null : (
              <EmptyState
                title={t("announcements.empty")}
                hint={t("announcements.emptyHint")}
                Icon={Megaphone}
              />
            )
          }
          renderItem={({ item, index }) => (
            <EnterItem index={index}>
              <AnnouncementCard a={item} pinnedLabel={t("announcements.pinned")} />
            </EnterItem>
          )}
        />
      </HeroOverlap>
    </View>
  );
}

function AnnouncementCard({ a, pinnedLabel }: { a: Announcement; pinnedLabel: string }) {
  const theme = useTheme();
  const meta = KIND_META[a.kind];
  const date = new Date(a.createdAt).toLocaleDateString();
  return (
    <Card>
      {a.imageUrl ? (
        <Image
          source={{ uri: a.imageUrl }}
          accessibilityIgnoresInvertColors
          accessibilityLabel={a.title}
          resizeMode="cover"
          style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: 12, marginBottom: 12 }}
        />
      ) : null}
      <View className="flex-row items-center gap-2 mb-2">
        <View
          className="w-7 h-7 rounded-lg items-center justify-center"
          style={{ backgroundColor: `${meta.color}1A` }}
        >
          <meta.Icon size={15} color={meta.color} />
        </View>
        {a.pinned ? (
          <View className="flex-row items-center gap-1">
            <Pin size={11} color={theme.colors.accent} />
            <Text className="text-accent text-[10px] font-bold uppercase tracking-wider">
              {pinnedLabel}
            </Text>
          </View>
        ) : null}
        <Text className="text-muted2 text-[11px] ml-auto">{date}</Text>
      </View>
      <Text className="text-text text-base font-bold leading-5">{a.title}</Text>
      <Text className="text-muted text-sm mt-1.5 leading-5">{a.body}</Text>
      {a.ctaLabel && a.ctaUrl ? (
        <Pressable
          onPress={() => a.ctaUrl && void Linking.openURL(a.ctaUrl)}
          accessibilityRole="link"
          accessibilityLabel={a.ctaLabel}
          className="self-start mt-3 rounded-full bg-accent px-4 min-h-[40px] justify-center active:opacity-80"
        >
          <Text className="text-white text-sm font-semibold">{a.ctaLabel}</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}
