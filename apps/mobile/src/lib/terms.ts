import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

/**
 * Kullanıcı sözleşmesi onayı (ADR-157). `whenly.terms.v1` AsyncStorage bayrağı — kullanıcı koşulları
 * AÇIKÇA kabul edene dek uygulamaya GİRİLEMEZ (zorunlu kapı, layout düzeyinde). Web'de async-storage
 * localStorage'a düşer. Sürümlü anahtar (`.v1`): koşullar değişince `.v2` ile yeniden onay istenir.
 * Onboarding'in tersine: okuma HATASINDA güvenli taraf = GÖSTER (onay zorunlu), gizleme değil.
 */
const KEY = "whenly.terms.v1";

export function useTermsAccepted(): { loading: boolean; accepted: boolean; accept: () => void } {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => setOk(v === "1"))
      .catch(() => setOk(false)); // okunamazsa kapıyı GÖSTER (onay zorunlu kalsın)
  }, []);
  const accept = (): void => {
    setOk(true);
    void AsyncStorage.setItem(KEY, "1").catch(() => {});
  };
  return { loading: ok === null, accepted: ok === true, accept };
}
