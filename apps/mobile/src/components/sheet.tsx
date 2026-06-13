// Alt-sayfa (bottom sheet) katmanı (ADR-062/065): ekran-ortası Modal yerine
// alttan kayan, tutamaçlı, yuvarlak köşeli yüzey. Kritik stiller INLINE +
// temaya bağlı — RN Modal portalında NativeWind className uygulanmadığı için
// (web'de arka plan/radius kaybolur ve liste sayfaya taşardı). ADR-065 düzeltmesi.
import { useReduceMotion } from "@/lib/reduce-motion";
import { useTheme } from "@/theme";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, Modal, Platform, Pressable, ScrollView, View } from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";

export function BottomSheet({
  visible,
  onClose,
  children,
  maxHeightPct = 70,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Yüzde olarak azami yükseklik (varsayılan %70). */
  maxHeightPct?: number;
}) {
  const { t } = useTranslation();
  const reduce = useReduceMotion();
  const theme = useTheme();
  const maxH = Math.round((Dimensions.get("window").height * maxHeightPct) / 100);
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      {/* Karartma + panel — INLINE stiller (className Modal portalında uygulanmaz) */}
      <Pressable
        onPress={onClose}
        accessibilityLabel={t("common.close")}
        // cssVars: Modal portal kök tema-sarmalayıcının DIŞINDA render olur →
        // içerikteki bg-panel/text-text/border-line token'ları yeniden tanımlanır.
        style={[
          { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
          theme.cssVars,
        ]}
      >
        <SheetSurface reduce={reduce}>
          {/* İç basışlar kapanmayı tetiklemesin */}
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View
              style={{
                backgroundColor: theme.colors.panel,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingBottom: 32,
                maxHeight: maxH,
                shadowColor: "#0F172A",
                shadowOpacity: 0.18,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: -6 },
                elevation: 16,
              }}
            >
              {/* Tutamaç */}
              <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
                <View
                  style={{
                    width: 40,
                    height: 5,
                    borderRadius: 999,
                    backgroundColor: theme.colors.line,
                  }}
                />
              </View>
              <ScrollView bounces={false}>{children}</ScrollView>
            </View>
          </Pressable>
        </SheetSurface>
      </Pressable>
    </Modal>
  );
}

/**
 * Panel sarmalayıcı: native'de alttan kayan reanimated yüzey; web'de DÜZ View
 * (reanimated layout animasyonu mobil Chrome'da GPU tile cızırtısı üretiyor —
 * ADR-099). Modal'ın animationType="fade"'i web'de yine de yumuşak giriş verir.
 */
function SheetSurface({ reduce, children }: { reduce: boolean; children: ReactNode }): ReactNode {
  if (Platform.OS === "web") return <View>{children}</View>;
  return (
    <Animated.View
      entering={reduce ? undefined : SlideInDown.springify().damping(20).stiffness(220)}
      exiting={reduce ? undefined : SlideOutDown.duration(180)}
    >
      {children}
    </Animated.View>
  );
}
