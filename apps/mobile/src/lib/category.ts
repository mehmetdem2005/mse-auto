// Niyet metninden deterministik kategori ikonu + rengi (görsel kimlik; ADR-045/049).
import { Activity, GraduationCap, type LucideIcon, Tag, Target, Ticket } from "lucide-react-native";

export interface Category {
  Icon: LucideIcon;
  tint: string;
  bg: string;
}

/**
 * Niyetten türetilen önem (severity) — afet/acil konular "Uyarı", diğer
 * tespitler "Tespit". Uydurma değil: konunun doğasından (ADR-051).
 */
export interface Severity {
  kind: "warning" | "detection";
  label: string;
  tone: "warn" | "pos";
}
export function severityOf(intent: string): Severity {
  const t = intent.toLowerCase();
  if (/deprem|yangın|sel|afet|fırtına|acil|kaza|patlama/.test(t))
    return { kind: "warning", label: "Uyarı", tone: "warn" };
  return { kind: "detection", label: "Tespit", tone: "pos" };
}

export function categoryOf(intent: string): Category {
  const t = intent.toLowerCase();
  if (/deprem|yangın|sel|afet|fırtına/.test(t))
    return { Icon: Activity, tint: "#D97706", bg: "bg-amber-500/10" };
  if (/fiyat|indirim|zam|ücret|stok/.test(t))
    return { Icon: Tag, tint: "#7C3AED", bg: "bg-accent2/10" };
  if (/sınav|yks|kpss|lgs|ales|sonuç|tercih/.test(t))
    return { Icon: GraduationCap, tint: "#16A34A", bg: "bg-pos/10" };
  if (/bilet|konser|maç|etkinlik/.test(t))
    return { Icon: Ticket, tint: "#DB2777", bg: "bg-pink-500/10" };
  return { Icon: Target, tint: "#6366F1", bg: "bg-accent/10" };
}
