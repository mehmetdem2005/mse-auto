import { Alert, Platform } from "react-native";

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Onay düğmesi yıkıcı eylem mi (kırmızı; native stil) — varsayılan false. */
  destructive?: boolean;
}

/**
 * Çapraz-platform onay (ADR-155). React Native `Alert.alert`'in düğme callback'leri
 * react-native-web'de ÇALIŞMAZ — web'de aksiyon düğmeleri render edilmediğinden onay/silme
 * callback'i HİÇ tetiklenmez (mobil-web'de "Sil/Onayla" tuşları sessizce ölür). Bu yardımcı
 * web'de tarayıcının `window.confirm`'ini, native'de `Alert.alert`'i kullanır.
 * @returns kullanıcı onayladıysa true.
 */
export function confirmAsync(opts: ConfirmOptions): Promise<boolean> {
  if (Platform.OS === "web") {
    const text = opts.message ? `${opts.title}\n\n${opts.message}` : opts.title;
    return Promise.resolve(typeof window !== "undefined" && window.confirm(text));
  }
  return new Promise<boolean>((resolve) => {
    Alert.alert(opts.title, opts.message, [
      { text: opts.cancelLabel, style: "cancel", onPress: () => resolve(false) },
      {
        text: opts.confirmLabel,
        style: opts.destructive ? "destructive" : "default",
        onPress: () => resolve(true),
      },
    ]);
  });
}
