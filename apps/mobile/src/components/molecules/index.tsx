// Molecules — atom + primitive bileşimleri (Atomic Design).
import { type EventFacts, parseEventFacts } from "@/domain/personal";
import { Eye, MapPin } from "lucide-react-native";
import type { ReactNode } from "react";
import { Linking, Pressable, Text, View } from "react-native";

export function Card({
  children,
  onPress,
  accent,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: () => void;
  accent?: boolean;
  accessibilityLabel?: string;
}) {
  const cls = `bg-panel border rounded-2xl p-4 ${accent ? "border-pos/40" : "border-line"}`;
  const shadow = {
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  } as const;
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={`${cls} active:opacity-70`}
        style={shadow}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View className={cls} style={shadow}>
      {children}
    </View>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <Text className="text-muted text-[10px] uppercase tracking-widest mb-2">{children}</Text>;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <View className="items-center py-16 px-6">
      <View className="w-14 h-14 rounded-full bg-panel2 items-center justify-center mb-4">
        <Eye size={24} color="#475569" />
      </View>
      <Text className="text-text text-base font-semibold text-center">{title}</Text>
      {hint ? <Text className="text-muted text-sm text-center mt-1.5">{hint}</Text> : null}
    </View>
  );
}

/** EventFacts'i okunur "olgu" rozetlerine çevirir; konum için haritada-aç bağlantısı. */
export function FactChips({ raw }: { raw: unknown }) {
  const facts = parseEventFacts(raw);
  if (!facts || (!facts.geo && facts.numeric === undefined && !facts.text)) return null;
  return (
    <View className="flex-row flex-wrap gap-2 mt-3">
      {facts.geo ? <GeoChip geo={facts.geo} /> : null}
      {facts.numeric !== undefined ? (
        <View className="bg-accent/10 px-3 py-2 rounded-lg flex-row items-center gap-1.5">
          <Text className="text-accent text-xs font-semibold">
            {facts.numericKind ? `${facts.numericKind}: ` : ""}
            {facts.numeric.toLocaleString("tr-TR")}
            {facts.currency ? ` ${facts.currency}` : ""}
          </Text>
        </View>
      ) : null}
      {facts.text ? (
        <View className="bg-panel2 px-3 py-2 rounded-lg">
          <Text className="text-muted text-xs" numberOfLines={1}>
            “{facts.text}”
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function GeoChip({ geo }: { geo: NonNullable<EventFacts["geo"]> }) {
  const open = () => {
    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${geo.lat},${geo.lng}`);
  };
  return (
    <Pressable
      onPress={open}
      // HIG dokunma hedefi
      className="bg-pos/10 px-3 py-2 min-h-[44px] rounded-lg flex-row items-center gap-1.5 active:opacity-70"
      accessibilityRole="link"
      accessibilityLabel={`Konumu haritada aç: ${geo.lat.toFixed(3)}, ${geo.lng.toFixed(3)}`}
    >
      <MapPin size={14} color="#16A34A" />
      <Text className="text-pos text-xs font-semibold">
        {geo.lat.toFixed(3)}, {geo.lng.toFixed(3)} · haritada aç
      </Text>
    </Pressable>
  );
}

/** İskelet yükleme — kart silüeti (algılanan performans; spinner yerine). */
export function SkeletonCard() {
  return (
    <View className="bg-panel border border-line rounded-2xl p-4 mb-3">
      <View className="flex-row items-center gap-2.5">
        <View className="w-10 h-10 rounded-xl bg-panel2" />
        <View className="flex-1 gap-2">
          <View className="h-3 rounded-full bg-panel2 w-3/5" />
          <View className="h-2.5 rounded-full bg-panel2 w-2/5" />
        </View>
      </View>
      <View className="h-3 rounded-full bg-panel2 mt-4 w-11/12" />
      <View className="h-3 rounded-full bg-panel2 mt-2 w-4/5" />
    </View>
  );
}
