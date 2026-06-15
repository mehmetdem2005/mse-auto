import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

/**
 * İlk-kullanım onboarding durumu (ADR-147 / M8.1). `whenly.onboarded.v1` AsyncStorage bayrağı —
 * onboarding YALNIZ bir kez gösterilir. Web'de async-storage localStorage'a düşer (mobil-web uyumlu).
 * Sürümlü anahtar (`.v1`): ileride akış değişirse `.v2` ile tekrar gösterilebilir.
 */
const KEY = "whenly.onboarded.v1";

export function useOnboarded(): { loading: boolean; onboarded: boolean; complete: () => void } {
  // null = henüz okunmadı (yükleniyor); overlay yükleme bitene dek gösterilmez (yanıp-sönme yok).
  const [seen, setSeen] = useState<boolean | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => setSeen(v === "1"))
      .catch(() => setSeen(true)); // okunamazsa güvenli taraf: gösterme
  }, []);
  const complete = (): void => {
    setSeen(true);
    void AsyncStorage.setItem(KEY, "1").catch(() => {});
  };
  return { loading: seen === null, onboarded: seen === true, complete };
}
