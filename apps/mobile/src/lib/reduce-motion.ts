import { useThemeStore } from "@/theme";
import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * "Hareketi azalt" durumu (WCAG 2.2 / prefers-reduced-motion karşılığı).
 * Açıksa animasyonlar (FAB bas-küçül, ekran geçişleri, liste girişleri) devre dışı.
 *
 * Kaynak ÖNCELİĞİ (ADR-114): uygulama-içi tercih sistemi EZER →
 *   reduced → her zaman azalt · full → her zaman tam animasyon ·
 *   system → işletim sistemi tercihini izle (varsayılan).
 */
export function useReduceMotion(): boolean {
  const [system, setSystem] = useState(false);
  useEffect(() => {
    let on = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (on) setSystem(v);
    });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setSystem);
    return () => {
      on = false;
      sub.remove();
    };
  }, []);
  const pref = useThemeStore((s) => s.motion);
  return pref === "reduced" ? true : pref === "full" ? false : system;
}
