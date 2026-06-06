/**
 * Self-improvement — propose BOUNDED, low-risk code/config changes and open a PR.  [v0.7]
 *
 * Grounded in DGM (self-modify + EMPIRICALLY VALIDATE each change; net-benefit can't be proven) and
 * 2026 safe-PR practice (dual gate: agent self-checks, CI is the hard gate; same branch protection as
 * humans; auto-merge only low-risk + green + opt-in; everything revertable). The model is the ceiling
 * — this fixes bugs, tunes config/prompts, extends knowledge/style; it does NOT rewrite core/security.
 */
import { GitHub } from "./github.js";
import { generate, MODELS } from "./gemini.js";
import { recordUsage } from "./budget.js";
import { supabase } from "./supabase.js";
import { log } from "./logger.js";

export type RiskLevel = "low" | "medium" | "high";

// Paths the self-improver may NEVER auto-touch (infra / security / money / its own machinery).
const FORBIDDEN = ["youtube", ".github/workflows", "supabase/migrations", "dockerfile", "render.yaml",
  "middleware", "github.ts", "selfimprove.ts", "env.ts", "budget.ts", "control.ts", "package.json", "package-lock"];
// Low-blast-radius paths eligible for auto-merge.
const LOW_RISK = ["data/", "docs/", "compliance", "agents.ts", "scriptwriter", "knowledge",
  ".env.example", "readme", "agent", "research", "plan.md", "architecture", "handoff", "self-improvement"];

const has = (p: string, list: string[]) => list.some((x) => p.toLowerCase().includes(x));

/** Pure risk classifier — drives the auto-merge gate. */
export function classifyRisk(paths: string[]): RiskLevel {
  if (paths.some((p) => has(p, FORBIDDEN))) return "high";
  if (paths.length && paths.every((p) => has(p, LOW_RISK))) return "low";
  return "medium";
}

export interface ChangeProposal { title: string; rationale: string; files: { path: string; content: string }[]; }

const PROPOSAL_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" }, rationale: { type: "string" },
    files: { type: "array", items: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } }, required: ["path", "content"] } },
  },
  required: ["title", "rationale", "files"],
};

async function defGen(a: any) { return generate({ model: MODELS.reasoning, ...a }); }

/** Ask the model for a small, revertable change given an opportunity + current file snapshots. */
export async function proposeChange(opportunity: string, context: { path: string; content: string }[], gen = defGen): Promise<ChangeProposal | null> {
  try {
    const ctx = context.map((c) => `### ${c.path}\n${c.content.slice(0, 4000)}`).join("\n\n");
    const r = await gen({
      system: "Sen güvenli, KÜÇÜK ve geri-alınabilir iyileştirmeler öneren bir mühendissin. Yalnızca verilen dosyaları, TAM içerikleriyle güncelle. Çekirdek mantığı/güvenliği/altyapıyı bozma. SADECE JSON.",
      prompt: `FIRSAT: ${opportunity}\n\nMEVCUT DOSYALAR:\n${ctx}`,
      responseSchema: PROPOSAL_SCHEMA,
    });
    await recordUsage("reasoning", r.usage?.totalTokens || 1);
    const p = JSON.parse(r.text) as ChangeProposal;
    return p.files?.length ? p : null;
  } catch (e: any) { log.warn("proposeChange failed", { err: String(e?.message || e) }); return null; }
}

/** Open a PR; record it; auto-merge ONLY if low-risk + CI green + opt-in. Returns the outcome. */
export async function submitImprovement(
  gh: GitHub, p: ChangeProposal,
  opts: { autoMerge?: boolean; waitForCi?: (headSha: string) => Promise<"success" | "failure" | "pending"> } = {},
): Promise<{ prNumber: number; url: string; risk: RiskLevel; merged: boolean }> {
  const risk = classifyRisk(p.files.map((f) => f.path));
  const branch = `auto/improve-${Date.now().toString(36)}`;
  const body =
    `Otomatik iyileştirme (self-improve).\n\n**Gerekçe:** ${p.rationale}\n\n**Risk:** ${risk}\n\n` +
    `> CI (typecheck+test+build) zorunlu kapıdır. Bu PR ancak **yeşil CI + düşük risk + opt-in** iken otomatik birleşir; aksi halde insan onayı bekler. Geri alma: PR revert.`;
  const pr = await gh.openChangePR({ branch, title: `[auto] ${p.title}`, body, files: p.files, message: `auto: ${p.title}` });

  let merged = false;
  const status = opts.waitForCi && pr.headSha ? await opts.waitForCi(pr.headSha) : "pending";
  if (opts.autoMerge && risk === "low" && status === "success") {
    try { await gh.mergePR(pr.number, "squash"); merged = true; } catch (e) { log.warn("auto-merge failed", { err: String(e) }); }
  }
  try {
    await supabase.from("improvements").insert({
      pr_number: pr.number, url: pr.html_url, title: p.title, rationale: p.rationale,
      risk, status: merged ? "merged" : "open", files: p.files.map((f) => f.path), created_at: new Date().toISOString(),
    });
  } catch (e) { log.debug("record improvement failed", { err: String(e) }); }
  return { prNumber: pr.number, url: pr.html_url, risk, merged };
}

import { applyEdits, type Edit } from "./patch.js";

const EDITS_SCHEMA = { type: "object", properties: { title: { type: "string" }, rationale: { type: "string" }, edits: { type: "array", items: { type: "object", properties: { find: { type: "string" }, replace: { type: "string" } }, required: ["find", "replace"] } } }, required: ["title", "rationale", "edits"] };
export interface EditProposal { title: string; rationale: string; edits: Edit[]; }

/** Propose SURGICAL edits (find/replace) for a single file — not a full rewrite. */
export async function proposeEdits(opportunity: string, file: { path: string; content: string }, gen = defGen): Promise<EditProposal | null> {
  try {
    const r = await gen({ system: "Cerrahi düzenleme öner: TÜM dosyayı DEĞİL, yalnızca değişmesi gereken yerler için 'find'/'replace' çiftleri ver. 'find' dosyada TAM ve BENZERSİZ olmalı (yeterli bağlam koy, boşluklar dahil). SADECE JSON.", prompt: `FIRSAT: ${opportunity}\n\nDOSYA ${file.path}:\n${file.content.slice(0, 6000)}`, responseSchema: EDITS_SCHEMA });
    await recordUsage("reasoning", r.usage?.totalTokens || 1);
    const p = JSON.parse(r.text) as EditProposal;
    return p?.edits?.length ? p : null;
  } catch (e: any) { log.warn("proposeEdits failed", { err: String(e?.message || e) }); return null; }
}

/** Apply surgical edits to a fetched file and open a PR (CI-gated; auto-merge only low-risk + opt-in). */
export async function submitEditPR(gh: GitHub, path: string, current: string, proposal: EditProposal, opts: { autoMerge?: boolean; waitForCi?: (headSha: string) => Promise<"success" | "failure" | "pending"> } = {}): Promise<{ ok: boolean; prNumber?: number; url?: string; risk?: RiskLevel; merged?: boolean; errors?: string[] }> {
  const outcome = applyEdits(current, proposal.edits);
  if (!outcome.ok) return { ok: false, errors: outcome.errors }; // ambiguous/not-found → refuse (no blind write)
  const res = await submitImprovement(gh, { title: proposal.title, rationale: proposal.rationale, files: [{ path, content: outcome.content }] }, opts);
  return { ok: true, prNumber: res.prNumber, url: res.url, risk: res.risk, merged: res.merged };
}
