/**
 * Orchestrator — dynamic planning + bounded tool-using swarm + supervisor + REPLAN + synthesis,
 * with durable checkpointing and OTel-GenAI tracing, then the ≥5-reviewer board.  [v0.6]
 *
 * Research-driven (2026) properties, mapped to the leading frameworks:
 *   • Orchestrator-Workers + Parallelization + Evaluator-Optimizer (Anthropic patterns).
 *   • Dynamic decomposition + REPLAN on failure (LangGraph flexibility; closes our prior gap).
 *   • Durable checkpoint/resume (LangGraph's signature) — a crashed swarm resumes, not restarts.
 *   • OTel-GenAI spans (invoke_agent / generate_content) — fixes the "missing observability" antipattern.
 *   • Input guardrail (OpenAI SDK guardrails) on the topic, before producing.
 *
 * Honest limits (AGENTS.md): bounded parallelism/horizon, safe toolset; the model is the ceiling.
 * produceShort() falls back to the simpler board pipeline if the swarm errors.
 */
import { generate, SHORT_SCRIPT_SCHEMA, MODELS, type GenUsage } from "./gemini.js";
import { runAgent, Blackboard, type LlmTurnFn, type Tool, type StepBudget } from "./runtime.js";
import { defaultTools } from "./tools.js";
import { reviewLoop, runEditorialPipeline, type ReviewReport } from "./agents.js";
import { recordUsage } from "./budget.js";
import { log } from "./logger.js";
import { withSpan, newTraceId, type SpanCtx } from "./tracing.js";
import { MemoryCheckpointer, type Checkpointer } from "./checkpoint.js";
import { gemTurn as defaultGemTurn } from "./agent_llm.js";
import { ToolRegistry } from "./toolregistry.js";
import { getActivePrompt } from "./promptlab.js";
import * as crew from "./crew.js";
import * as goap from "./goap.js";
import type { ShortScript } from "./types.js";

const MODE = process.env.AGENT_MODE || "crew";
const MAX_PARALLEL = Number(process.env.SWARM_MAX_PARALLEL || 3);
const STEP_BUDGET = Number(process.env.SWARM_STEP_BUDGET || 40);
const SUPERVISOR_RETRIES = Number(process.env.SWARM_RETRIES || 1);
const REPLAN_ROUNDS = Number(process.env.SWARM_REPLAN_ROUNDS || 1);
const GUARDRAILS = (process.env.AGENT_GUARDRAILS || "on") !== "off";

export interface Task { id: string; goal: string; role?: string; depends_on?: string[]; maxSteps?: number; }
export interface SwarmTrace { id: string; attempt: number; ok: boolean; steps?: number; tools?: string[]; error?: string; }

const PLAN_SCHEMA = {
  type: "object",
  properties: {
    tasks: { type: "array", items: { type: "object", properties: {
      id: { type: "string" }, goal: { type: "string" }, role: { type: "string" },
      depends_on: { type: "array", items: { type: "string" } },
    }, required: ["id", "goal"] } },
  },
  required: ["tasks"],
};

const DEFAULT_PLAN: Task[] = [
  { id: "facts", role: "researcher", depends_on: [], goal: "Konu hakkında DOĞRULANMIŞ olguları rag_search ve gerekirse web_research ile topla; kaynaklarıyla birlikte write_artifact ile 'facts' anahtarına yaz, sonra finish." },
  { id: "angle", role: "editor", depends_on: ["facts"], goal: "read_artifact('facts') oku; olaya ÖZGÜN, klişe olmayan bir editöryel açı üret; write_artifact ile 'angle' anahtarına yaz, sonra finish." },
  { id: "outline", role: "writer", depends_on: ["facts", "angle"], goal: "facts ve angle'ı oku; güçlü hook + kısa beats + payoff + CTA taslağı çıkar; write_artifact ile 'outline' anahtarına yaz, sonra finish." },
];

const roleSystem = (t: Task) =>
  `Sen bir "${t.role || "uzman"}" alt-ajansın. Görevini araçlarla (rag_search, web_research, read_artifact, write_artifact, recall, remember) adım adım tamamla. Uydurma yok; doğrulanabilir kal. Bitince finish çağır.`;

// Gemini-backed single-shot generate for plan/synthesize/guardrail (thin; injectable for tests).
async function geminiGen(a: { system?: string; prompt: string; responseSchema?: Record<string, unknown>; thinkingLevel?: "minimal" | "low" | "medium" | "high" }) {
  return generate({ model: MODELS.reasoning, ...a });
}
export type GenFn = typeof geminiGen;

/** Input guardrail (OpenAI-SDK-style): cheap pre-check that the topic is safe & worth producing. */
export async function guardrailCheck(topic: string, gen = geminiGen as any): Promise<{ ok: boolean; reason?: string }> {
  if (!GUARDRAILS) return { ok: true };
  try {
    const r = await gen({
      system: "Bir konunun YouTube Shorts için ÜRETİLEBİLİR olup olmadığını denetle: çocuk güvenliği/şiddet/yanıltma/telif riski VEYA doğrulanması imkânsızsa reddet. SADECE JSON.",
      prompt: `KONU: ${topic}`,
      responseSchema: { type: "object", properties: { ok: { type: "boolean" }, reason: { type: "string" } }, required: ["ok"] },
    });
    await recordUsage("text", r.usage?.totalTokens || 1);
    const v = JSON.parse(r.text);
    return { ok: !!v.ok, reason: v.reason };
  } catch { return { ok: true }; } // fail-open on guardrail error; board still gates downstream
}

export async function plan(topic: string, gen = geminiGen): Promise<Task[]> {
  try {
    const r = await gen({
      system: "Sen bir baş yapımcısın. Bir YouTube Shorts senaryosu üretmek için görevi 2-5 alt-göreve böl (araştırma, açı, taslak gibi); depends_on ile bağımlılıkları belirt. SADECE JSON.",
      prompt: `KONU: ${topic}\nAlt-görevleri üret.`,
      responseSchema: PLAN_SCHEMA,
    });
    const tasks = JSON.parse(r.text).tasks as Task[];
    if (Array.isArray(tasks) && tasks.length) return tasks;
  } catch (e: any) { log.warn("planner failed — default plan", { err: String(e?.message || e) }); }
  return DEFAULT_PLAN;
}

/** REPLAN: given failed tasks + feedback, ask the planner for additional/replacement tasks. */
export async function replan(topic: string, failedIds: string[], feedback: string, gen = geminiGen): Promise<Task[]> {
  try {
    const r = await gen({
      system: "Önceki plan kısmen başarısız oldu. Başarısız görevleri telafi edecek YENİ/ALTERNATIF alt-görevler üret (gerekirse farklı yaklaşım). SADECE JSON.",
      prompt: `KONU: ${topic}\nBAŞARISIZ: ${failedIds.join(", ") || "yok"}\nGERİ BİLDİRİM: ${feedback || "yok"}`,
      responseSchema: PLAN_SCHEMA,
    });
    const tasks = JSON.parse(r.text).tasks as Task[];
    return Array.isArray(tasks) ? tasks : [];
  } catch (e: any) { log.warn("replan failed", { err: String(e?.message || e) }); return []; }
}

export async function runSwarm(opts: {
  topic: string; tasks: Task[]; llmTurn?: LlmTurnFn; tools?: Tool[];
  blackboard?: Blackboard; budget?: StepBudget; maxParallel?: number; retries?: number;
  jobId?: string; skip?: string[]; trace?: SpanCtx; onWave?: (s: { completed: string[]; blackboard: Record<string, any> }) => Promise<void>;
}): Promise<{ blackboard: Blackboard; trace: SwarmTrace[]; completed: string[]; failed: string[] }> {
  const llmTurn = opts.llmTurn || defaultGemTurn;
  const tools = opts.tools || defaultTools();
  const blackboard = opts.blackboard || new Blackboard();
  const budget = opts.budget || { used: 0, max: STEP_BUDGET };
  const maxParallel = opts.maxParallel ?? MAX_PARALLEL;
  const retries = opts.retries ?? SUPERVISOR_RETRIES;
  blackboard.set("topic", opts.topic);

  const done = new Set<string>(opts.skip ?? []);  // resumed/seeded tasks
  const failed = new Set<string>();
  const trace: SwarmTrace[] = [];

  while (done.size + failed.size < opts.tasks.length) {
    const ready = opts.tasks.filter((t) => !done.has(t.id) && !failed.has(t.id) && (t.depends_on ?? []).every((d) => done.has(d)));
    if (!ready.length) break;
    const wave = ready.slice(0, maxParallel);
    await Promise.all(wave.map(async (t) => {
      let ok = false;
      for (let attempt = 1; attempt <= retries + 1 && !ok && budget.used < budget.max; attempt++) {
        try {
          const run = () => runAgent({ role: t.role || "worker", system: roleSystem(t), goal: t.goal, tools, llm: llmTurn, blackboard, budget, jobId: opts.jobId, maxSteps: t.maxSteps ?? 6 });
          const res = opts.trace
            ? await withSpan(opts.trace, "invoke_agent", `subagent ${t.id}`, { "gen_ai.agent.name": t.role || t.id }, () => run())
            : await run();
          blackboard.set(`task:${t.id}`, res.result);
          trace.push({ id: t.id, attempt, ok: true, steps: res.steps, tools: res.trace.map((x) => x.tool) });
          ok = true;
        } catch (e: any) {
          trace.push({ id: t.id, attempt, ok: false, error: String(e?.message || e) });
          log.warn("subtask failed", { id: t.id, attempt, err: String(e?.message || e) });
        }
      }
      (ok ? done : failed).add(t.id);
    }));
    if (opts.onWave) await opts.onWave({ completed: [...done], blackboard: blackboard.all() });
  }
  return { blackboard, trace, completed: [...done], failed: [...failed] };
}

export async function synthesize(topic: string, blackboard: Blackboard, language: string, styleId: string, gen = geminiGen): Promise<{ script: ShortScript; usage: GenUsage }> {
  const ctx = JSON.stringify(blackboard.all()).slice(0, 9000);
  const fallbackSys = `Sen kıdemli bir senaryo yazarısın. Alt-ajanların panodaki (facts/angle/outline) MALZEMESİNİ kullanarak retention odaklı, ÖZGÜN yorumlu, doğrulanmış bir Shorts senaryosu yaz. Dil: ${language}. Uydurma yok. SADECE şema JSON.`;
  const system = await getActivePrompt("synthesize", fallbackSys);
  const r = await gen({
    system,
    prompt: `PANO:\n${ctx}`,
    responseSchema: SHORT_SCRIPT_SCHEMA,
    thinkingLevel: "high",
  });
  await recordUsage("reasoning", r.usage?.totalTokens || 1);
  let script: ShortScript;
  try { script = JSON.parse(r.text); } catch { const m = r.text.match(/\{[\s\S]*\}/); script = m ? JSON.parse(m[0]) : ({} as any); }
  script.styleId = styleId; script.language = language;
  return { script, usage: r.usage };
}

/** Crew production path: manager→specialist roles (role-scoped tools, auto-improved prompts) → synth → board. */
export async function produceViaCrew(
  opts: { topic: string; language?: string; styleId: string; jobId?: string },
  deps: { llmTurn?: LlmTurnFn; tools?: Tool[]; gen?: GenFn; getPrompt?: (name: string, fb: string) => Promise<string>; review?: (s: ShortScript, t: string) => Promise<{ script: ShortScript; report: ReviewReport }> } = {},
): Promise<{ script: ShortScript; report: ReviewReport & { plan?: any[]; crew?: any[]; mode: string }; usage: GenUsage }> {
  const language = opts.language || "tr";
  const getPrompt = deps.getPrompt || getActivePrompt;
  const llmTurn = deps.llmTurn || defaultGemTurn;
  const review = deps.review || reviewLoop;
  const registry = new ToolRegistry(deps.tools || defaultTools());
  const blackboard = new Blackboard(); blackboard.set("topic", opts.topic);
  const tasks = crew.managerPlan(opts.topic);
  const budget: StepBudget = { used: 0, max: STEP_BUDGET };
  const crewLog: any[] = [];   // per-role transcript for the Agents panel
  for (const t of tasks) {
    const role = crew.roleById(t.role); if (!role) continue;
    const system = await getPrompt(`role:${role.id}`, role.system);             // auto-improved prompt swap
    const tools = role.tools.includes("*") ? registry.list() : registry.for([...role.tools, "finish"]);
    try {
      const res = await runAgent({ role: role.id, system, goal: t.goal, tools, llm: llmTurn, blackboard, budget, jobId: opts.jobId, maxSteps: 6 });
      blackboard.set(`task:${t.id}`, res.result);
      crewLog.push({ role: role.id, title: role.title, goal: t.goal, ok: true, steps: res.steps, tools: res.trace.map((x) => x.tool), output: typeof res.result === "string" ? res.result.slice(0, 4000) : res.result });
    } catch (e: any) {
      log.warn("crew role failed", { role: role.id, err: String(e?.message || e) });
      crewLog.push({ role: role.id, title: role.title, goal: t.goal, ok: false, error: String(e?.message || e) });
    }
  }
  const { script, usage } = await synthesize(opts.topic, blackboard, language, opts.styleId, deps.gen);
  const { script: reviewed, report } = await review(script, opts.topic);
  return { script: reviewed, report: { ...report, plan: tasks, crew: crewLog, mode: "crew" }, usage };
}

/** Single entrypoint. guardrail → (resume) → plan → swarm → replan? → synth → board; falls back to board. */
export async function produceShort(opts: { topic: string; language?: string; styleId: string; jobId?: string; checkpointer?: Checkpointer }): Promise<{ script: ShortScript; report: ReviewReport & { plan?: Task[]; swarmTrace?: SwarmTrace[]; mode: string; guardrail?: string }; usage: GenUsage }> {
  const language = opts.language || "tr";
  const cp = opts.checkpointer || new MemoryCheckpointer();
  const runId = opts.jobId || `run_${Date.now()}`;
  const trace: SpanCtx | undefined = opts.jobId ? { traceId: newTraceId(), jobId: opts.jobId, enabled: true } : undefined;

  // Input guardrail (cheap, fail-open).
  const guard = await guardrailCheck(opts.topic);
  if (!guard.ok) {
    const out = await runEditorialPipeline({ topic: opts.topic, language, styleId: opts.styleId }); // still produce, but flag
    return { script: out.script, report: { ...out.report, mode: "guardrail-flagged", guardrail: guard.reason }, usage: out.usage };
  }

  if (MODE === "board") {
    const out = await runEditorialPipeline({ topic: opts.topic, language, styleId: opts.styleId });
    return { script: out.script, report: { ...out.report, mode: "board" }, usage: out.usage };
  }

  if (MODE === "goap") {
    const gplan = goap.planShort();
    log.info("goap plan", { steps: gplan.map((a) => a.name) });
    try { const r = await produceViaCrew({ topic: opts.topic, language, styleId: opts.styleId, jobId: opts.jobId }); return { ...r, report: { ...r.report, plan: gplan.map((a) => a.name) as any, mode: "goap" } }; }
    catch (e: any) {
      log.error("goap failed — board fallback", { err: String(e?.message || e) });
      const out = await runEditorialPipeline({ topic: opts.topic, language, styleId: opts.styleId });
      return { script: out.script, report: { ...out.report, mode: "goap(fallback->board)" }, usage: out.usage };
    }
  }

  if (MODE === "crew") {
    try { return await produceViaCrew({ topic: opts.topic, language, styleId: opts.styleId, jobId: opts.jobId }); }
    catch (e: any) {
      log.error("crew failed — board fallback", { err: String(e?.message || e) });
      const out = await runEditorialPipeline({ topic: opts.topic, language, styleId: opts.styleId });
      return { script: out.script, report: { ...out.report, mode: "crew(fallback->board)" }, usage: out.usage };
    }
  }

  try {
    const run = async (childTrace?: SpanCtx) => {
      const prior = await cp.load(runId);
      const blackboard = new Blackboard();
      if (prior?.blackboard) for (const [k, v] of Object.entries(prior.blackboard)) blackboard.set(k, v);
      let tasks: Task[] = prior?.plan?.length ? prior.plan : await plan(opts.topic);
      const budget: StepBudget = { used: 0, max: STEP_BUDGET };
      const saveWave = async (s: { completed: string[]; blackboard: Record<string, any> }) =>
        cp.save(runId, { plan: tasks, completed: s.completed, blackboard: s.blackboard, status: "running" });

      let { blackboard: bb, trace: swarmTrace, completed, failed } =
        await runSwarm({ topic: opts.topic, tasks, blackboard, budget, jobId: opts.jobId, trace: childTrace, skip: prior?.completed, onWave: saveWave });

      // REPLAN on failures (bounded).
      for (let r = 0; r < REPLAN_ROUNDS && failed.length; r++) {
        const extra = await replan(opts.topic, failed, "Alt-görevler başarısız; alternatif yaklaşım gerek.");
        if (!extra.length) break;
        tasks = [...tasks, ...extra];
        const res = await runSwarm({ topic: opts.topic, tasks, blackboard: bb, budget, jobId: opts.jobId, trace: childTrace, skip: completed, onWave: saveWave });
        bb = res.blackboard; swarmTrace = [...swarmTrace, ...res.trace]; completed = res.completed; failed = res.failed;
      }

      const { script, usage } = await synthesize(opts.topic, bb, language, opts.styleId);
      const { script: reviewed, report } = await reviewLoop(script, opts.topic);
      await cp.save(runId, { plan: tasks, completed, blackboard: bb.all(), status: "done" });
      await cp.clear(runId);
      return { script: reviewed, report: { ...report, plan: tasks, swarmTrace, mode: failed.length ? "swarm(partial)" : "swarm" }, usage };
    };
    return trace ? await withSpan(trace, "invoke_agent", "produce_short", { "gen_ai.agent.name": "orchestrator", topic: opts.topic }, (c) => run(c)) : await run();
  } catch (e: any) {
    log.error("swarm failed — falling back to board pipeline", { err: String(e?.message || e) });
    await cp.save(runId, { plan: [], completed: [], blackboard: {}, status: "failed" }).catch(() => {});
    const out = await runEditorialPipeline({ topic: opts.topic, language, styleId: opts.styleId });
    return { script: out.script, report: { ...out.report, mode: "board(fallback)" }, usage: out.usage };
  }
}
