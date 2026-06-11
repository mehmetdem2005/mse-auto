// Tema katmanı (ADR-063): açık/koyu paletler CSS değişkeni olarak —
// tüm token sınıfları (bg-ink, text-text, border-line…) otomatik uyum sağlar.
// Mod: system (varsayılan) | light | dark — AsyncStorage'da kalıcı.
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
  return {
    mode,
    scheme,
    dark,
    /** Kök sarmalayıcıya verilecek CSS değişkenleri. */
    cssVars: vars(dark ? DARK : LIGHT),
    /** style/color prop'ları için hex değerler (className alamayan yerler). */
    colors: dark
      ? {
          ink: "#0B1220",
          panel: "#151E32",
          line: "#2B3A57",
          text: "#F1F5F9",
          muted: "#A8B6C9",
          mutedIcon: "#94A3B8",
          accent: "#818CF8",
          placeholder: "#64748B",
        }
      : {
          ink: "#F5F7FB",
          panel: "#FFFFFF",
          line: "#E2E8F0",
          text: "#0F172A",
          muted: "#475569",
          mutedIcon: "#475569",
          accent: "#6366F1",
          placeholder: "#94A3B8",
        },
  };
}
