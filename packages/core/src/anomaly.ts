/**
 * Anomaly → reason → act — autonomous incident commander within a BOUNDED, ENFORCED action space. [v0.9]
 * Research lesson (Replit incident): a "code freeze" as stated intention is not a guardrail; broad
 * authority + untyped scope + no rollback = disaster. So the agent reasons freely about anomalies it was
 * never explicitly coded for, but may only pick from a TYPED safe-action list; irreversible/high-risk
 * actions are NEVER auto-executed (escalated to PR/human). Risk tiers + audit + kill switch enforce it.
 */
import { generate, MODELS } from "./gemini.js";
import { recordUsage } from "./budget.js";
import { supabase } from "./supabase.js";
import { alert } from "./alerts.js";
import { log } from "./logger.js";
import * as monitor from "./monitor.js";
import { can } from "./authz.js";

export type ActionRisk = "low" | "high";
export interface SafeAction { id: string; describe: string; risk: ActionRisk; }
export const ACTIONS: SafeAction[] = [
  { id: "pause_uploads", describe: "Yüklemeleri geçici durdur", risk: "low" },
  { id: "takedown_video", describe: "Videoyu private yap (geri alınabilir)", risk: "low" },
  { id: "adjust_strategy", describe: "Strateji/konu/stil notu güncelle", risk: "low" },
  { id: "open_fix_pr", describe: "Düzeltme PR'ı aç (CI kapısı)", risk: "low" },
  { id: "alert_only", describe: "Sadece uyar + gerekçe", risk: "low" },
  { id: "delete_data", describe: "Veri sil", risk: "high" },            // never auto
  { id: "change_infra", describe: "Altyapı/billing değiştir", risk: "high" }, // never auto
];
export const AUTO_ALLOWED = new Set(ACTIONS.filter((a) => a.risk === "low").map((a) => a.id));
export const isAutoAllowed = (action: string) => AUTO_ALLOWED.has(action);

const MANDATE =
  "Sen bu YouTube kanalının OTONOM operatörüsün; kanal senin sorumluluğunda ve tam yetkin var. " +
  "Anomalileri (kodumuzda yazmasak bile) kendin değerlendirip akıl yürüt; YALNIZCA izinli güvenli aksiyon listesinden seç. " +
  "Geri alınamaz/yüksek-riskli işleri ASLA kendin yapma — onları PR/insan için işaretle. Mantığını net yaz.";

export interface Anomaly { kind: string; detail: string; videoId?: string; severity: "warn" | "crit"; }

export async function detectAnomalies(): Promise<Anomaly[]> {
  const out: Anomaly[] = [];
  const signals = await monitor.gatherSignals();
  for (const s of signals) if (s.severity !== "info") out.push({ kind: s.kind, detail: s.detail, severity: s.severity === "crit" ? "crit" : "warn" });
  try {
    const { data: videos } = await supabase.from("analytics").select("*").order("snapshot_at", { ascending: false }).limit(3);
    for (const v of videos || []) {
      const ins = await monitor.analyzeComments(v.video_id).catch(() => null);
      if (ins && (ins.issues || []).some((i: string) => /telif|copyright|content ?id|strike|çalıntı/i.test(i)))
        out.push({ kind: "copyright_suspected", detail: `"${v.title}" yorumlarında telif/şikâyet sinyali`, videoId: v.video_id, severity: "crit" });
    }
  } catch {}
  return out;
}

const DECISION_SCHEMA = { type: "object", properties: { action: { type: "string" }, rationale: { type: "string" }, videoId: { type: "string" } }, required: ["action", "rationale"] };
export async function decide(a: Anomaly, gen = (async (x: any) => generate({ model: MODELS.reasoning, ...x }))): Promise<{ action: string; rationale: string; videoId?: string }> {
  try {
    const r = await gen({ system: `${MANDATE}\nİzinli aksiyonlar: ${ACTIONS.map((x) => `${x.id} (${x.risk})`).join(", ")}. SADECE JSON.`, prompt: `ANOMALİ: [${a.severity}] ${a.kind} — ${a.detail}${a.videoId ? ` (video ${a.videoId})` : ""}`, responseSchema: DECISION_SCHEMA, thinkingLevel: "high" });
    await recordUsage("reasoning", r.usage?.totalTokens || 1);
    const d = JSON.parse(r.text);
    return ACTIONS.some((x) => x.id === d.action) ? { ...d, videoId: d.videoId || a.videoId } : { action: "alert_only", rationale: d.rationale || "bilinmeyen aksiyon → sadece uyar", videoId: a.videoId };
  } catch { return { action: "alert_only", rationale: "karar hatası → güvenli varsayılan", videoId: a.videoId }; }
}

export async function act(d: { action: string; rationale: string; videoId?: string }): Promise<{ executed: boolean; note: string }> {
  if (!isAutoAllowed(d.action) || !can("incident_commander", `action:${d.action}`)) { await alert("warn", `Yetkisiz/yüksek-riskli aksiyon insan onayı bekliyor: ${d.action}`, d.rationale); return { executed: false, note: `denied/high-risk → escalated: ${d.action}` }; }
  try {
    if (d.action === "pause_uploads") { const { pause } = await import("./control.js"); await pause(`anomaly: ${d.rationale}`); }
    else if (d.action === "takedown_video" && d.videoId) { const { setVideoPrivacy } = await import("./youtube.js"); await setVideoPrivacy(d.videoId, "private"); }
    else if (d.action === "adjust_strategy") { const { remember } = await import("./memory.js"); await remember("strategy_note", d.rationale); }
    return { executed: true, note: `${d.action} yürütüldü` };
  } catch (e) { return { executed: false, note: `aksiyon hatası: ${String(e)}` }; }
}

export async function handleAnomaly(a: Anomaly) {
  const d = await decide(a);
  const res = await act(d);
  try { await supabase.from("incidents").insert({ kind: a.kind, detail: a.detail, video_id: a.videoId ?? null, action: d.action, rationale: d.rationale, executed: res.executed, created_at: new Date().toISOString() }); } catch {}
  log.info("anomaly handled", { kind: a.kind, action: d.action, executed: res.executed });
  return { anomaly: a, decision: d, result: res };
}
