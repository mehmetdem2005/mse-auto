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

/* ─────────────────────────  Vurgu rengi (ADR-114)  ─────────────────────────
 * Kullanıcı uygulamanın vurgu rengini seçer. Her renk açık/koyu için ayrı
 * --accent/--accent2 üçlüsü + tema-bağımsız marka gradyanı taşır. Kontrast
 * disiplini varsayılan çividle AYNI: vurgu-metin açık zeminde ~AA, gradyan üstü
 * beyaz metin ~AA-large. Bu yüzden yalnız yeterince KOYU tonlar sunulur (sarı/
 * açık-yeşil dışlandı — beyaz dolgu/metin kontrastını bozardı; WCAG 2.2 AA). */
export const ACCENT_KEYS = ["indigo", "blue", "violet", "fuchsia", "rose"] as const;
export type AccentKey = (typeof ACCENT_KEYS)[number];

interface AccentDef {
  /** [--accent, --accent2] RGB üçlüsü — açık tema. */
  light: readonly [string, string];
  /** [--accent, --accent2] RGB üçlüsü — koyu tema. */
  dark: readonly [string, string];
  /** Marka gradyanı (FAB / birincil buton) — her temada aynı, üstünde beyaz metin. */
  brand: readonly [string, string];
  /** Hero başlık gradyanı (üç duraklı — derinlik). */
  hero: readonly [string, string, string];
  /** Seçicideki örnek nokta rengi. */
  swatch: string;
}

const ACCENTS: Record<AccentKey, AccentDef> = {
  indigo: {
    light: ["99 102 241", "139 92 246"],
    dark: ["129 140 248", "167 139 250"],
    brand: ["#6366F1", "#7C3AED"],
    hero: ["#6366F1", "#7C3AED", "#4F46E5"],
    swatch: "#6366F1",
  },
  blue: {
    light: ["37 99 235", "79 70 229"],
    dark: ["96 165 250", "129 140 248"],
    brand: ["#2563EB", "#4F46E5"],
    hero: ["#2563EB", "#4F46E5", "#1D4ED8"],
    swatch: "#2563EB",
  },
  violet: {
    light: ["124 58 237", "147 51 234"],
    dark: ["167 139 250", "192 132 252"],
    brand: ["#7C3AED", "#9333EA"],
    hero: ["#7C3AED", "#9333EA", "#6D28D9"],
    swatch: "#7C3AED",
  },
  fuchsia: {
    light: ["192 38 211", "162 28 175"],
    dark: ["217 70 239", "232 121 249"],
    brand: ["#C026D3", "#A21CAF"],
    hero: ["#C026D3", "#A21CAF", "#86198F"],
    swatch: "#C026D3",
  },
  rose: {
    light: ["225 29 72", "219 39 119"],
    dark: ["244 63 94", "251 113 133"],
    brand: ["#E11D48", "#BE123C"],
    hero: ["#E11D48", "#BE123C", "#9F1239"],
    swatch: "#E11D48",
  },
};

/** Vurgu rengini palete uygula → CSS değişkeni + hex türetimi tek kaynaktan. */
function paletteWithAccent(scheme: ResolvedScheme, accent: AccentKey): Palette {
  const base = scheme === "dark" ? DARK : LIGHT;
  const a = ACCENTS[accent][scheme];
  return { ...base, "--accent": a[0], "--accent2": a[1] };
}

/** Seçici UI'si için renk listesi (key + örnek nokta). */
export const ACCENT_SWATCHES = ACCENT_KEYS.map((key) => ({ key, color: ACCENTS[key].swatch }));

/**
 * Hareket tercihi (ADR-114): system = işletim sistemini izle · full = animasyonlar
 * AÇIK (sistem azaltsa bile) · reduced = uygulama içi AZALT. `useReduceMotion` bunu
 * sistem değeriyle birleştirir (erişilebilirlik, WCAG 2.2 / prefers-reduced-motion).
 */
export type MotionPref = "system" | "full" | "reduced";

const STORAGE_KEY = "whenly.theme";
const ACCENT_STORAGE_KEY = "whenly.accent";
const MOTION_STORAGE_KEY = "whenly.motion";

interface ThemeStore {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  accent: AccentKey;
  setAccent: (a: AccentKey) => void;
  motion: MotionPref;
  setMotion: (m: MotionPref) => void;
}
export const useThemeStore = create<ThemeStore>((set) => ({
  mode: "system",
  setMode: (mode) => {
    set({ mode });
    void AsyncStorage.setItem(STORAGE_KEY, mode);
  },
  accent: "indigo",
  setAccent: (accent) => {
    set({ accent });
    void AsyncStorage.setItem(ACCENT_STORAGE_KEY, accent);
  },
  motion: "system",
  setMotion: (motion) => {
    set({ motion });
    void AsyncStorage.setItem(MOTION_STORAGE_KEY, motion);
  },
}));
// Kalıcı tercihleri yükle
void AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
  if (saved === "light" || saved === "dark" || saved === "system") {
    useThemeStore.setState({ mode: saved });
  }
});
void AsyncStorage.getItem(ACCENT_STORAGE_KEY).then((saved) => {
  if (saved && (ACCENT_KEYS as readonly string[]).includes(saved)) {
    useThemeStore.setState({ accent: saved as AccentKey });
  }
});
void AsyncStorage.getItem(MOTION_STORAGE_KEY).then((saved) => {
  if (saved === "system" || saved === "full" || saved === "reduced") {
    useThemeStore.setState({ motion: saved });
  }
});

/** Aktif şema + stil-prop'ları (ikon rengi vb.) için çözülmüş hex paleti. */
export function useTheme() {
  const mode = useThemeStore((s) => s.mode);
  const accent = useThemeStore((s) => s.accent);
  const system = useColorScheme();
  const scheme: ResolvedScheme = mode === "system" ? (system === "dark" ? "dark" : "light") : mode;
  const dark = scheme === "dark";
  // Vurgu rengi (ADR-114): seçilen accent palete enjekte edilir → hem CSS değişkenleri
  // (className) hem stil-prop hex'leri hem marka gradyanı TEK kaynaktan tutarlı döner.
  const palette = paletteWithAccent(scheme, accent);
  const hex = resolveHex(palette);
  return {
    mode,
    accent,
    scheme,
    dark,
    /** Kök sarmalayıcıya verilecek CSS değişkenleri (seçilen vurgu rengi dahil). */
    cssVars: vars(palette),
    /** Seçilen vurgu rengine bağlı marka gradyanları (hero / FAB / birincil buton). */
    gradient: { brand: ACCENTS[accent].brand, hero: ACCENTS[accent].hero },
    /** style/color prop'ları için hex değerler (className alamayan yerler). */
    colors: {
      ...hex,
      /** İkincil ikon tonu — koyuda muted2, açıkta muted (okunurluk dengesi). */
      mutedIcon: dark ? HEX.dark.muted2 : HEX.light.muted,
      placeholder: dark ? "#64748B" : "#94A3B8",
    },
  };
}
