// Dokunsal geri bildirim katmanı (ADR-062) — web'de sessizce no-op.
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const canHaptic = Platform.OS !== "web";

export const haptic = {
  /** Hafif tık — buton/seçim basışı. */
  light: () => {
    if (canHaptic) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  /** Orta vuruş — birincil eylem (FAB, oluştur). */
  medium: () => {
    if (canHaptic) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  /** Başarı bildirimi. */
  success: () => {
    if (canHaptic) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  /** Hata bildirimi. */
  error: () => {
    if (canHaptic) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
};
