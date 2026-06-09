import { type EventFacts, parseEventFacts } from "@/domain/personal";
import type { ReactNode } from "react";
import { Linking, Pressable, Text, View } from "react-native";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="mb-3.5">
      <Text className="text-muted text-[10px] tracking-widest uppercase mb-2">{label}</Text>
      {children}
    </View>
  );
}

export function Btn({
  children,
  onPress,
  disabled,
  tone = "solid",
}: {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  tone?: "solid" | "ghost" | "danger";
}) {
  const cls =
    tone === "solid" ? "bg-accent" : tone === "danger" ? "border border-neg" : "border border-line";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`rounded-xl px-4 py-3.5 items-center ${cls} ${disabled ? "opacity-50" : ""}`}
      accessibilityRole="button"
    >
      {children}
    </Pressable>
  );
}

/** Beyaz zeminli, yumuşak gölgeli kart (aydınlık tema). */
export function Card({
  children,
  onPress,
  accent,
}: {
  children: ReactNode;
  onPress?: () => void;
  accent?: boolean;
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
      <Pressable onPress={onPress} className={`${cls} active:opacity-70`} style={shadow}>
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

type BadgeTone = "pos" | "neg" | "muted" | "accent";
const BADGE: Record<BadgeTone, string> = {
  pos: "bg-pos/10 text-pos",
  neg: "bg-neg/10 text-neg",
  muted: "bg-panel2 text-muted",
  accent: "bg-accent/10 text-accent",
};

export function Badge({ tone = "muted", children }: { tone?: BadgeTone; children: ReactNode }) {
  const [bg, fg] = BADGE[tone].split(" ");
  return (
    <View className={`${bg} px-2.5 py-1 rounded-full self-start`}>
      <Text className={`${fg} text-[11px] font-medium`}>{children}</Text>
    </View>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <View className="items-center py-16 px-6">
      <View className="w-14 h-14 rounded-full bg-panel2 items-center justify-center mb-4">
        <Text className="text-2xl">👀</Text>
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
        <View className="bg-accent/10 px-3 py-1.5 rounded-lg flex-row items-center gap-1.5">
          <Text className="text-accent text-xs font-semibold">
            {facts.numericKind ? `${facts.numericKind}: ` : ""}
            {facts.numeric.toLocaleString("tr-TR")}
            {facts.currency ? ` ${facts.currency}` : ""}
          </Text>
        </View>
      ) : null}
      {facts.text ? (
        <View className="bg-panel2 px-3 py-1.5 rounded-lg">
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
      className="bg-pos/10 px-3 py-1.5 rounded-lg flex-row items-center gap-1.5 active:opacity-70"
      accessibilityRole="link"
    >
      <Text className="text-pos text-xs font-semibold">
        📍 {geo.lat.toFixed(3)}, {geo.lng.toFixed(3)} · haritada aç
      </Text>
    </Pressable>
  );
}
