// i18n çekirdeği (ADR-053): cihaz dili algılama + kalıcı kullanıcı seçimi.
// Desteklenen: tr (taban) + 10 büyük dil. Eksik anahtar → tr'ye düşer.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { ar } from "./locales/ar";
import { de } from "./locales/de";
import { en } from "./locales/en";
import { es } from "./locales/es";
import { fr } from "./locales/fr";
import { hi } from "./locales/hi";
import { ja } from "./locales/ja";
import { pt } from "./locales/pt";
import { ru } from "./locales/ru";
import { tr } from "./locales/tr";
import { zh } from "./locales/zh";

export const SUPPORTED_LANGS = [
  { code: "tr", native: "Türkçe" },
  { code: "en", native: "English" },
  { code: "es", native: "Español" },
  { code: "de", native: "Deutsch" },
  { code: "fr", native: "Français" },
  { code: "pt", native: "Português" },
  { code: "ru", native: "Русский" },
  { code: "ar", native: "العربية" },
  { code: "hi", native: "हिन्दी" },
  { code: "zh", native: "中文" },
  { code: "ja", native: "日本語" },
] as const;
export type LangCode = (typeof SUPPORTED_LANGS)[number]["code"];

const STORAGE_KEY = "whenly.lang";

function deviceLang(): LangCode {
  const code = getLocales()[0]?.languageCode ?? "tr";
  return (SUPPORTED_LANGS.some((l) => l.code === code) ? code : "en") as LangCode;
}

void i18n.use(initReactI18next).init({
  resources: {
    tr: { translation: tr },
    en: { translation: en },
    es: { translation: es },
    de: { translation: de },
    fr: { translation: fr },
    pt: { translation: pt },
    ru: { translation: ru },
    ar: { translation: ar },
    hi: { translation: hi },
    zh: { translation: zh },
    ja: { translation: ja },
  },
  lng: deviceLang(),
  fallbackLng: "tr",
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

// Kalıcı kullanıcı seçimi (varsa cihaz dilini ezer).
void AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
  if (saved && SUPPORTED_LANGS.some((l) => l.code === saved)) {
    void i18n.changeLanguage(saved);
  }
});

export async function setLanguage(code: LangCode): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, code);
  await i18n.changeLanguage(code);
}

/** Aktif dile uygun tarih formatı (tr-TR sabitinden kurtuluş). */
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(i18n.language);
}
export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" });
}

export default i18n;
