// Geri bildirim katmanı (ADR-062): tasarlanmış toast — çirkin native Alert yerine.
// Kullanım: toast.error("mesaj") / toast.success("mesaj") — her yerden çağrılabilir.
import { AlertCircle, CheckCircle2, Info } from "lucide-react-native";
import { useEffect } from "react";
import { Platform, Text, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { create } from "zustand";

type ToastKind = "success" | "error" | "info";
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}
interface ToastState {
  items: ToastItem[];
  push: (kind: ToastKind, message: string) => void;
  remove: (id: number) => void;
}

let nextId = 1;
const useToastStore = create<ToastState>((set) => ({
  items: [],
  push: (kind, message) =>
    set((s) => ({ items: [...s.items.slice(-2), { id: nextId++, kind, message }] })),
  remove: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

/** Her yerden çağrılabilir API (hook gerekmez). */
export const toast = {
  success: (m: string) => useToastStore.getState().push("success", m),
  error: (m: string) => useToastStore.getState().push("error", m),
  info: (m: string) => useToastStore.getState().push("info", m),
};

const KIND: Record<ToastKind, { Icon: typeof Info; fg: string; bg: string; border: string }> = {
  success: { Icon: CheckCircle2, fg: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" },
  error: { Icon: AlertCircle, fg: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  info: { Icon: Info, fg: "#6366F1", bg: "#EEF2FF", border: "#C7D2FE" },
};

function ToastCard({ item }: { item: ToastItem }) {
  const remove = useToastStore((s) => s.remove);
  const y = useSharedValue(60);
  const o = useSharedValue(0);
  useEffect(() => {
    y.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) });
    o.value = withTiming(1, { duration: 240 });
    // 3.2 sn sonra kendiliğinden kaybol
    o.value = withDelay(
      3200,
      withTiming(0, { duration: 220 }, (done) => {
        if (done) runOnJS(remove)(item.id);
      }),
    );
    y.value = withDelay(3200, withTiming(24, { duration: 220 }));
  }, [item.id, remove, y, o]);
  const style = useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [{ translateY: y.value }],
  }));
  const k = KIND[item.kind];
  return (
    <Animated.View
      style={[
        style,
        {
          backgroundColor: k.bg,
          borderColor: k.border,
          borderWidth: 1,
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          shadowColor: "#0F172A",
          shadowOpacity: 0.12,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
          marginTop: 8,
        },
      ]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <k.Icon size={18} color={k.fg} />
      <Text
        style={{ color: "#0F172A", fontSize: 13, fontWeight: "500", flex: 1 }}
        numberOfLines={3}
      >
        {item.message}
      </Text>
    </Animated.View>
  );
}

/** Kök layout'a bir kez eklenir; toast'ları sekme çubuğunun üstünde gösterir. */
export function ToastHost() {
  const items = useToastStore((s) => s.items);
  if (items.length === 0) return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: Platform.OS === "web" ? 84 : 96,
        zIndex: 9999,
      }}
    >
      {items.map((it) => (
        <ToastCard key={it.id} item={it} />
      ))}
    </View>
  );
}
