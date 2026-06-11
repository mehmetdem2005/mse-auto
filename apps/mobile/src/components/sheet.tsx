// Alt-sayfa (bottom sheet) katmanı (ADR-062): ekran-ortası Modal yerine
// alttan kayan, tutamaçlı, yuvarlak köşeli yüzey — premium mobil dili.
import { useReduceMotion } from "@/lib/reduce-motion";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, View } from "react-native";
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
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 bg-black/40 justify-end"
        onPress={onClose}
        accessibilityLabel={t("common.close")}
      >
        <Animated.View
          entering={reduce ? undefined : SlideInDown.springify().damping(20).stiffness(220)}
          exiting={reduce ? undefined : SlideOutDown.duration(180)}
        >
          {/* İç basışlar kapanmayı tetiklemesin */}
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View
              className="bg-panel rounded-t-[24px] pb-8"
              style={{ maxHeight: `${maxHeightPct}%` as never }}
            >
              {/* Tutamaç */}
              <View className="items-center pt-3 pb-1">
                <View className="w-10 h-1.5 rounded-full bg-line" />
              </View>
              <ScrollView bounces={false}>{children}</ScrollView>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
