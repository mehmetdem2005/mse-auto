// Tema katmanı (ADR-063): açık/koyu paletler CSS değişkeni olarak —
// tüm token sınıfları (bg-ink, text-text, border-line…) otomatik uyum sağlar.
// Mod: system (varsayılan) | light | dark — AsyncStorage'da kalıcı.
// TEK KAYNAK: style-prop hex paleti aşağıdaki RGB üçlülerinden TÜRETİLİR (çift bakım yok).
import AsyncStorage from "@react-native-async-storage/async-storage";
import { vars } from "nativewind";
import { useColorScheme } from "react-native";
import { create } from "zustand";

/** RGB üçlüleri — tailwind `rgb(var(--x) / <alpha>)` biçimiyle uyumlu (opaklık varyantları çalışır). */
const LIGHT = {
  "--ink": "245 247 251", // #F5F7FB zemin
  "--panel": "255 255 255",
  "--panel2": "238 242 248",
  "--line": "226 232 240",
  "--accent": "99 102 241",
  "--accent2": "139 92 246",
  "--text": "15 23 42",
  "--muted": "71 85 105",
  "--muted2": "100 116 139",
  "--pos": "22 163 74",
  "--neg": "220 38 38",
  "--warn": "180 83 9", // amber-700 — açık zeminde ≥4.5:1 kontrast
} as const;

const DARK = {
  "--ink": "11 18 32", // #0B1220 zemin
  "--panel": "21 30 50", // #151E32 kart
  "--panel2": "31 42 68",
  "--line": "43 58 87",
  "--accent": "129 140 248", // indigo-400 — koyuda daha okunur
  "--accent2": "167 139 250",
  "--text": "241 245 249",
  "--muted": "168 182 201", // koyu zeminde 7:1'e yakın
  "--muted2": "148 163 184",
  "--pos": "74 222 128",
  "--neg": "248 113 113",
  "--warn": "251 191 36", // amber-400 — koyu zeminde okunur
} as const;

type Palette = Record<keyof typeof LIGHT, string>;

function tripleToHex(triple: string): string {
  const hex = triple
    .split(" ")
    .map((n) => Number(n).toString(16).padStart(2, "0").toUpperCase())
    .join("");
  return `#${hex}`;
}

function resolveHex(palette: Palette) {
  return {
    ink: tripleToHex(palette["--ink"]),
    panel: tripleToHex(palette["--panel"]),
    panel2: tripleToHex(palette["--panel2"]),
    line: tripleToHex(palette["--line"]),
    text: tripleToHex(palette["--text"]),
    muted: tripleToHex(palette["--muted"]),
    muted2: tripleToHex(palette["--muted2"]),
    accent: tripleToHex(palette["--accent"]),
    accent2: tripleToHex(palette["--accent2"]),
    pos: tripleToHex(palette["--pos"]),
    neg: tripleToHex(palette["--neg"]),
    warn: tripleToHex(palette["--warn"]),
  };
}

const HEX = { light: resolveHex(LIGHT), dark: resolveHex(DARK) } as const;

/** Marka gradyanları — bileşen içine ham hex gömülmez, tek kaynak burası. */
export const GRADIENT = {
  /** Birincil marka gradyanı (FAB, birincil buton, boş-durum madalyonu). */
  brand: ["#6366F1", "#7C3AED"],
  /** Hero başlık gradyanı (üç duraklı — derinlik hissi, tüm sekmelerde aynı). */
  hero: ["#6366F1", "#7C3AED", "#4F46E5"],
} as const;

/** Gradyan üstü içerik HER temada beyaz (kontrast gradyana göre sabitlenmiş). */
export const ON_GRADIENT = "#FFFFFF";
/** Accent dolgu üstü içerik — her temada beyaz (aktif pill/step/switch içi). */
export const ON_ACCENT = "#FFFFFF";

/** Üçüncü-taraf marka renkleri (kanal ikonları) — tema token'ı DEĞİL, sabit kimlik. */
export const BRAND = { telegram: "#229ED9", whatsapp: "#25D366" } as const;

/** Yükseltilmiş yüzey gölgeleri (elevation ölçeği) — tüm kartlar aynı kaynaktan. */
export const SHADOW = {
  shadowColor: "#0F172A",
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;
export const SHADOW_LG = {
  shadowColor: "#0F172A",
  shadowOpacity: 0.1,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 10 },
  elevation: 6,
} as const;

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedScheme = "light" | "dark";

const STORAGE_KEY = "whenly.theme";

interface ThemeStore {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
}
export const useThemeStore = create<ThemeStore>((set) => ({
  mode: "system",
  setMode: (mode) => {
    set({ mode });
    void AsyncStorage.setItem(STORAGE_KEY, mode);
  },
}));
// Kalıcı tercihi yükle
void AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
  if (saved === "light" || saved === "dark" || saved === "system") {
    useThemeStore.setState({ mode: saved });
  }
});

/** Aktif şema + stil-prop'ları (ikon rengi vb.) için çözülmüş hex paleti. */
export function useTheme() {
  const mode = useThemeStore((s) => s.mode);
  const system = useColorScheme();
  const scheme: ResolvedScheme = mode === "system" ? (system === "dark" ? "dark" : "light") : mode;
  const dark = scheme === "dark";
  const hex = dark ? HEX.dark : HEX.light;
  return {
    mode,
    scheme,
    dark,
    /** Kök sarmalayıcıya verilecek CSS değişkenleri. */
    cssVars: vars(dark ? DARK : LIGHT),
    /** style/color prop'ları için hex değerler (className alamayan yerler). */
    colors: {
      ...hex,
      /** İkincil ikon tonu — koyuda muted2, açıkta muted (okunurluk dengesi). */
      mutedIcon: dark ? HEX.dark.muted2 : HEX.light.muted,
      placeholder: dark ? "#64748B" : "#94A3B8",
    },
  };
}
