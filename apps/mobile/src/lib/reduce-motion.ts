import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Sistem "hareketi azalt" tercihini izler (WCAG 2.2 / prefers-reduced-motion karşılığı).
 * Açıksa animasyonlar (FAB bas-küçül, ekran geçişleri) devre dışı bırakılır.
 */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let on = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (on) setReduce(v);
    });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => {
      on = false;
      sub.remove();
    };
  }, []);
  return reduce;
}
