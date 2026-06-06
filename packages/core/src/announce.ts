/**
 * Announcements — the system tells you, in polished Turkish, what it did and WHY.  [v0.8]
 * ("Bize sadece söyle: yaptım, bu iyi — ve mantığını anlat.")
 */
import { generate, MODELS } from "./gemini.js";
import { recordUsage } from "./budget.js";
import { supabase } from "./supabase.js";
import { alert } from "./alerts.js";
import { log } from "./logger.js";

export async function announce(action: string, details: Record<string, unknown>, gen = (async (a: any) => generate({ model: MODELS.text, ...a }))): Promise<string> {
  let text = action;
  try {
    const r = await gen({ system: "Yaptığın otonom işi mükemmel, net bir üslupla Türkçe özetle: ne yaptın, neden uygun gördün, mantık yürütme şeklin ne. 3-5 cümle, abartısız.", prompt: `AKSİYON: ${action}\nDETAY: ${JSON.stringify(details).slice(0, 2000)}` });
    await recordUsage("text", r.usage?.totalTokens || 1);
    text = (r.text || "").trim() || action;
  } catch {}
  try { await supabase.from("announcements").insert({ action, summary: text, details, created_at: new Date().toISOString() }); } catch {}
  try { await alert("info", `Otonom: ${action}`, text); } catch {}
  log.info("announce", { action });
  return text;
}
