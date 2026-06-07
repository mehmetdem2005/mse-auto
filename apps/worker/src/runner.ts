/**
 * Durable stage runner (AAA orchestration).
 *
 * Each tick:
 *   1. assertRunning()           — honor the kill switch / pause
 *   2. assertWithinBudget()      — stop before overspending money/quota (else auto-pause)
 *   3. reclaimStaleLocks()       — recover jobs from crashed/stuck workers
 *   4. topUp()                   — keep the queue full (respecting the daily cap)
 *   5. claim + dispatch a job    — atomic lease, per-stage timeout, retry/backoff, dead-letter
 *   6. refreshAnalytics()        — pull stats for the dashboard
 *
 * Every transition emits an event (job_events) with timing, so the whole run is replayable.
 */
import {
  supabase, compliance, scheduler, video as vid, youtube, memory, gemini,
  env as Env, log, newTraceId, events, reliability, budget, control, alerts, agents, orchestrator, checkpoint, github, selfimprove, monitor, supervisor, panels, announce, competitor, audit, anomaly, otel, promptlab, canary, metrics, standards, leader, storage, agentbus,
} from "@studio/core";
import type { ChannelConfig } from "@studio/core";

const TIMEOUTS = Env.TIMEOUTS;

const e = Env.env();
const WORKER = e.WORKER_ID;

async function getConfig(): Promise<ChannelConfig> {
  const { data } = await supabase.from("config").select("*").eq("id", 1).single();
  return data ?? {
    timezone: "Europe/Istanbul", daytimeStartHour: 9, daytimeEndHour: 21,
    maxPerDay: 2, minSpacingMinutes: 150, seed: 1337, requireHumanApproval: true, language: "tr",
  };
}

async function patch(id: string, p: Record<string, unknown>) {
  await supabase.from("video_jobs").update(p).eq("id", id);
}
const unlock = { locked_by: null, locked_until: null };
const estTokens = (...s: string[]) => Math.ceil(s.join(" ").length / 4);

/** Keep the queue topped up to the daily cap (creates 'queued' jobs with a fresh topic). */
async function topUp(cfg: ChannelConfig) {
  const st = await control.getState();
  if (st.mode === "dry_run") return;
  const { count } = await supabase
    .from("video_jobs").select("id", { count: "exact", head: true })
    .in("stage", ["queued", "drafting", "needs_review", "approved", "rendering", "scheduled", "uploading"]);
  if ((count ?? 0) >= cfg.maxPerDay) return;

  const { data: t } = await supabase.rpc("pick_unused_topic");
  const topic = t?.[0]?.topic;
  if (!topic) { log.info("topUp: no unused topics — add more to the knowledge base"); return; }

  const traceId = newTraceId();
  const { data: job } = await supabase.from("video_jobs")
    .insert({ stage: "queued", topic, made_with_ai: true, trace_id: traceId, idempotency_key: `${topic}:${Date.now()}` })
    .select().single();
  await events.logEvent({ jobId: job!.id, traceId, type: "created", data: { topic } });
}

// ── stage handlers (return the next stage + any patch) ──────────────────────────
async function draft(job: any, cfg: ChannelConfig) {
  const styleId = await compliance.pickStyle();
  let out;
  try {
    out = await reliability.breakers.gemini.run(() =>
      reliability.withRetry(() =>
        agentbus.track("scriptwriter", `Senaryo yazılıyor: ${job.topic}`,
          () => orchestrator.produceShort({ topic: job.topic, language: cfg.language, styleId, jobId: job.id, checkpointer: new checkpoint.SupabaseCheckpointer() }),
          { jobId: job.id }),
        { attempts: 2, label: "editorial" }));
  } catch (err: any) {
    if (err instanceof gemini.SafetyBlockedError) {
      await memory.remember("used_topic", job.topic);
      return { next: "needs_review", patch: { last_error: `Safety: ${err.message} — needs a different topic/angle` } };
    }
    throw err;
  }
  const { script, report, usage } = out;
  const disc = compliance.disclosure(script);
  script.description = (script.description || "") + disc.descriptionLine;

  const [nemb] = await gemini.embed([script.narrationText]);
  await budget.recordUsage("embed", estTokens(script.narrationText), job.id);
  await memory.remember("used_topic", job.topic);

  // Deterministic gate (originality/cosine, daily cap, disclosure) on top of the LLM board.
  const check = await compliance.checkScript(script, cfg);
  const base = { script, narration_embedding: nemb, review: report, review_score: report.decision.score };
  const boardOk = report.decision.verdict === "approve";

  const fullAuto = (e as any).AUTONOMY_FULL === "on";

  if (boardOk && check.ok)
    return { next: (cfg.requireHumanApproval && !fullAuto) ? "needs_review" : "approved", patch: { ...base, last_error: null } };

  const why = [
    boardOk ? null : `Kurul: ${report.decision.verdict} (${report.decision.passCount}/${report.reviewerCount} onay)${report.decision.blockers.length ? ` · veto: ${report.decision.blockers.join(", ")}` : ""}`,
    check.ok ? null : `Otomatik: ${check.reasons.join(" | ")}`,
  ].filter(Boolean).join(" • ");

  // FULL AUTONOMY: never park a draft waiting for a human that will never come. The board's
  // concerns are recorded for transparency, but the job proceeds to render. (Without full
  // autonomy it parks in needs_review for a human to approve.)
  if (fullAuto) return { next: "approved", patch: { ...base, last_error: `otomatik onaylandı (otonom) • ${why}` } };
  return { next: "needs_review", patch: { ...base, last_error: why } };
}

async function render(job: any, cfg: ChannelConfig) {
  const { videoPath, audioPath } = await agentbus.track("packaging", "Görseller üretiliyor & video kurgulanıyor",
    () => reliability.breakers.gemini.run(() =>
      reliability.withRetry(() => vid.renderVideo(job.id, job.script), { attempts: 2, label: "render" })),
    { jobId: job.id });
  const imgs = (job.script.visualPrompts?.length || job.script.beats?.length || 3);
  await budget.recordUsage("image", imgs, job.id);
  await budget.recordUsage("tts", estTokens(job.script.narrationText), job.id);

  const slots = scheduler.planAhead(cfg, 3).map((s) => s.iso).filter((iso) => new Date(iso) > new Date());
  const { data: taken } = await supabase.from("video_jobs").select("scheduled_for").not("scheduled_for", "is", null);
  const used = new Set((taken ?? []).map((t: any) => t.scheduled_for));
  const slot = slots.find((iso) => !used.has(iso)) ?? slots[0];
  // Persist the rendered MP4 to Supabase Storage (worker disk is ephemeral) → durable URL.
  const videoUrl = await storage.uploadRenderedVideo(job.id, videoPath).catch(() => null);
  return { next: "scheduled", patch: { video_path: videoPath, video_url: videoUrl, audio_path: audioPath, scheduled_for: slot, next_run_at: slot } };
}

async function upload(job: any) {
  const s = job.script;
  // If YouTube is not connected, hold here (do NOT consume attempts → no dead-letter).
  // The video is already rendered and stored. User connects YouTube → it uploads next tick.
  const connected = await youtube.isConnected();
  if (!connected) {
    const nextRun = new Date(Date.now() + 6 * 3600 * 1000).toISOString(); // retry in 6h
    return {
      next: "scheduled",
      patch: { last_error: "YouTube bağlı değil — /settings sayfasından OAuth bağlayın", next_run_at: nextRun, attempts: 0 },
    };
  }
  // Idempotency: on a retry, the previous attempt may have uploaded before crashing.
  if ((job.attempts ?? 0) > 0 && job.idempotency_key) {
    const existing = await youtube.findUploadedByKey(job.idempotency_key).catch(() => null);
    if (existing) return { next: "published", patch: { youtube_video_id: existing }, uploaded: true };
  }
  const id = await agentbus.track("manager", `YouTube'a yükleniyor: ${s.title}`,
    () => reliability.breakers.youtube.run(() =>
      reliability.withRetry(() => youtube.uploadVideo({
        filePath: job.video_path, title: s.title, description: s.description, tags: s.tags,
        madeWithAI: true, idempotencyKey: job.idempotency_key,
      }), { attempts: 2, label: "upload" })),
    { jobId: job.id });
  await budget.recordUsage("youtube_units", 100, job.id);
  return { next: "published", patch: { youtube_video_id: id }, uploaded: true };
}

// Common shape returned by every stage handler (the stage branches differ in their patch
// fields, so type the union loosely to keep dispatch's inferred return type consistent).
type StageResult = { next: string; patch?: Record<string, any>; uploaded?: boolean };

function dispatch(job: any, cfg: ChannelConfig): Promise<StageResult> {
  switch (job.stage) {
    case "queued": return reliability.withTimeout(() => draft(job, cfg), TIMEOUTS.draft, "draft");
    case "approved": return reliability.withTimeout(() => render(job, cfg), TIMEOUTS.render, "render");
    case "scheduled": return reliability.withTimeout(() => upload(job), TIMEOUTS.upload, "upload");
    default: throw new reliability.FatalError(`No handler for stage ${job.stage}`);
  }
}

async function processJob(job: any, cfg: ChannelConfig) {
  const traceId = job.trace_id || newTraceId();
  const stage = job.stage;
  try {
    const res: any = await events.tracedStage({ jobId: job.id, traceId, stage }, () => dispatch(job, cfg));
    await patch(job.id, {
      stage: res.next, ...(res.patch || {}), ...unlock,
      next_run_at: res.patch?.next_run_at ?? new Date().toISOString(), last_error: res.patch?.last_error ?? null,
    });
    if (res.uploaded) await events.logEvent({ jobId: job.id, traceId, type: "uploaded", data: { youtube_video_id: res.patch.youtube_video_id } });
  } catch (err: any) {
    const fatal = err instanceof reliability.FatalError;
    if (!fatal && reliability.isRateLimit(err)) {
      const waitMs = reliability.rateLimitWaitMs(err);
      const secs = Math.round(waitMs / 1000);
      await patch(job.id, { next_run_at: new Date(Date.now() + waitMs).toISOString(), last_error: `rate-limited; ${secs}s sonra ayni istekten devam`, ...unlock });
      await events.logEvent({ jobId: job.id, traceId, stage, type: "rate_limited_resume", data: { waitMs } });
      return; // rate-limit => do NOT consume an attempt; the SAME request resumes (never dead-letter)
    }
    const attempts = (job.attempts ?? 0) + 1;
    if (fatal || attempts >= (job.max_attempts ?? 4)) {
      await patch(job.id, { stage: "dead_letter", attempts, last_error: String(err?.message || err), ...unlock });
      await events.logEvent({ jobId: job.id, traceId, stage, type: "dead_letter", data: { attempts, message: String(err?.message || err) } });
      await alerts.alert("warn", `Job dead-lettered: ${job.topic}`, `stage=${stage} attempts=${attempts}\n${String(err?.message || err)}`);
    } else {
      const backoff = 2000 * 2 ** attempts + Math.floor(Math.random() * 2000);
      await patch(job.id, { attempts, next_run_at: new Date(Date.now() + backoff).toISOString(), last_error: String(err?.message || err), ...unlock });
      await events.logEvent({ jobId: job.id, traceId, stage, type: "retry", data: { attempts, backoffMs: backoff } });
    }
  }
}

async function refreshAnalytics() {
  const { data: pub } = await supabase
    .from("video_jobs").select("youtube_video_id").eq("stage", "published").not("youtube_video_id", "is", null).limit(50);
  const ids = (pub ?? []).map((p: any) => p.youtube_video_id);
  if (!ids.length) return;
  const stats = await youtube.fetchStats(ids);
  await budget.recordUsage("youtube_units", 1);
  for (const st of stats)
    await supabase.from("analytics").upsert({
      video_id: st.id, title: st.title, published_at: st.publishedAt,
      views: st.views, likes: st.likes, comments: st.comments, snapshot_at: new Date().toISOString(),
    });
}

let tickCount = 0;

/** Best-effort AAA module audit over the core source dir (when source is present on disk). */
async function auditRepo(): Promise<number> {
  try {
    const fs = await import("node:fs/promises");
    const dir = (e as any).CORE_SRC_DIR || "packages/core/src";
    const entries = await fs.readdir(dir).catch(() => [] as string[]);
    const files: audit.FileInfo[] = [];
    for (const name of entries) {
      if (!name.endsWith(".ts")) continue;
      const txt = await fs.readFile(`${dir}/${name}`, "utf8").catch(() => "");
      files.push({ path: `${dir}/${name}`, lines: txt.split("\n").length, hasTest: true });
    }
    const flags = audit.auditModules(files, { maxLines: 400 });
    for (const f of flags.slice(0, 5))
      await supabase.from("opportunities").insert({ title: f.issue, area: `module:${f.path}`, severity: f.severity, score: f.severity === "warn" ? 20 : 10, suggestion: f.suggestion, status: "open", created_at: new Date().toISOString() }).then(() => {}, () => {});
    return flags.length;
  } catch { return 0; }
}

/** Competitor comment + transcript analysis for configured competitor video ids. */
async function runCompetitors(): Promise<number> {
  const ids = String((e as any).COMPETITOR_VIDEO_IDS || "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3);
  let done = 0;
  for (const id of ids) {
    const ins = await competitor.analyzeCompetitor(id).catch(() => null);
    if (!ins) continue;
    done++;
    await panels.writePanel({ key: `competitor:${id}`, title: `Rakip analizi · ${id}`, columns: ["tür", "içgörü"], rows: [
      ...(ins.winningHooks || []).map((h: string) => ["hook", h]),
      ...(ins.gaps || []).map((g: string) => ["boşluk", g]),
      ...(ins.audienceRequests || []).map((r: string) => ["istek", r]),
    ] }).catch(() => {});
    await memory.remember("competitor_insight", JSON.stringify({ id, ...ins })).catch(() => {});
  }
  return done;
}

/** Anomaly → reason → act, within the bounded safe action space (autonomous, audited). */
async function anomalyPass(): Promise<number> {
  try {
    const anomalies = await anomaly.detectAnomalies();
    let handled = 0;
    for (const a of anomalies.slice(0, 3)) {
      const r = await anomaly.handleAnomaly(a);
      handled++;
      await announce.announce(`Anomali kararı: ${a.kind} → ${r.decision.action}`, r.decision as any).catch(() => {});
    }
    return handled;
  } catch (err: any) { log.error("anomalyPass failed", { err: String(err?.message || err) }); return 0; }
}

/** Forward agent spans to an OTel backend if configured. */
async function otelExport(): Promise<void> {
  if (!(e as any).OTEL_EXPORTER_OTLP_ENDPOINT) return;
  await otel.exportSpans().then((r) => r.exported && log.info("otel exported", r), () => {});
}

/** GEPA-style prompt audit: evaluate the scriptwriter prompt on recent scripts; store improved proposals. */
async function promptAudit(): Promise<void> {
  if ((e as any).PROMPTLAB_ENABLED !== "on") return;
  try {
    const { data } = await supabase.from("video_jobs").select("topic, script").not("script", "is", null).order("updated_at", { ascending: false }).limit(5);
    const evalSet = (data ?? []).map((j: any) => ({ input: j.topic, output: j.script?.narrationText || "" })).filter((s) => s.output);
    if (evalSet.length < 3) return;
    const current = await promptlab.activePrompt("scriptwriter", "Retention odaklı, promise=payoff hizalı, özgün yorumlu Shorts senaryosu yaz.");
    const res = await promptlab.optimizePrompt("scriptwriter", current, evalSet, "Hook gücü, retention, özgünlük, promise=payoff, doğruluk.");
    if (res.improved) await announce.announce("Senarist promptu iyileştirildi (önerildi)", { before: res.before, after: res.after, rationale: res.rationale }).catch(() => {});
  } catch (err: any) { log.debug("promptAudit failed", { err: String(err?.message || err) }); }
}

/** Periodic autonomy: broad monitor + memory self-heal + competitor analysis + AAA audit + (opt-in, PR-gated) self-improvement. */
async function runAutonomy() {
  if ((e as any).MONITOR_ENABLED === "off") return;
  try {
    const { signals, opportunities } = await supervisor.superviseOnce();
    const auditedFlags = await auditRepo();
    const competitorsDone = await runCompetitors();
    const anomaliesHandled = await anomalyPass();
    await otelExport();
    await promptAudit();
    log.info("autonomy pass", { signals: signals.length, opportunities: opportunities.length, auditedFlags, competitorsDone, anomaliesHandled });
    const comp = standards.complianceReport();
    log.info("standards compliance", { implemented: comp.implemented, partial: comp.partial, documented: comp.documented, na: comp.na, gaps: comp.gaps.map((g) => g.id) });
    if ((e as any).AUTONOMY_FULL === "on")
      await announce.announce("Özerklik turu", { signals: signals.length, opportunities: opportunities.length, auditedFlags, competitorsDone, anomaliesHandled }).catch(() => {});

    if ((e as any).SELF_IMPROVE_ENABLED !== "on" || !opportunities.length) return;
    const gh = github.githubFromEnv();
    if (!gh) { log.warn("self-improve enabled but GitHub not configured (GITHUB_TOKEN/OWNER/REPO)"); return; }
    const top = opportunities[0];
    const autoMerge = (e as any).SELF_IMPROVE_AUTOMERGE === "on";
    const waitForCi = (sha: string) => gh.checksConclusion(sha);
    const baseErr = ((await metrics.getMetrics().catch(() => ({ errorRate24h: 0 } as any))).errorRate24h) ?? 0;
    await canary.checkCanaries(gh, baseErr).then((r) => r.reverted && log.info("canary reverted", r), () => {}); // close the loop: auto-revert regressions

    // Surgical code self-edit (opt-in) when the opportunity targets a module file.
    if ((e as any).SELF_IMPROVE_CODE === "on" && String(top.area || "").startsWith("module:")) {
      const filePath = top.area.slice("module:".length);
      const current = await gh.getFileContent(filePath).catch(() => null);
      if (current) {
        const ep = await selfimprove.proposeEdits([top.title, top.suggestion].filter(Boolean).join(": "), { path: filePath, content: current });
        if (ep) {
          const r = await selfimprove.submitEditPR(gh, filePath, current, ep, { autoMerge, waitForCi });
          if (r.merged && r.prNumber) await canary.openCanary(r.prNumber, [{ path: filePath, content: current }], baseErr).catch(() => {});
          log.info("self-edit PR", r as any);
          await events.logEvent({ type: "self_improvement", data: r as any });
          await announce.announce(r.ok ? `Cerrahi kod düzenleme PR'ı: ${filePath}` : `Cerrahi düzenleme reddedildi (belirsiz/bulunamadı): ${filePath}`, r as any).catch(() => {});
          return;
        }
      }
    }

    // Default: append a dated entry to the improvement log (low-risk, always valid).
    const path = "docs/IMPROVEMENT-LOG.md";
    const current = (await gh.getFileContent(path).catch(() => null)) ?? "# Improvement Log\n";
    const proposal = await selfimprove.proposeChange(
      [top.area, top.suggestion].filter(Boolean).join(": ") + ` — bu firsati ${path} dosyasina tarihli bir kayit olarak ekle, mevcut icerigi koru.`,
      [{ path, content: current }],
    );
    if (!proposal) return;
    const res = await selfimprove.submitImprovement(gh, proposal, { autoMerge, waitForCi });
    if (res.merged) await canary.openCanary(res.prNumber, [{ path, content: current }], baseErr).catch(() => {});
    log.info("self-improvement PR", res as any);
    await events.logEvent({ type: "self_improvement", data: res as any });
    await announce.announce("Self-improvement PR açıldı", res as any).catch(() => {});
  } catch (err: any) { log.error("autonomy failed", { err: String(err?.message || err) }); }
}

/** Full-autonomy catch-all: any draft parked in needs_review (e.g. a board quality rejection, or
 *  jobs created before full-autonomy) is auto-approved so nothing waits for a human that won't come. */
async function autoApprove(): Promise<number> {
  if ((e as any).AUTONOMY_FULL !== "on") return 0;
  const { data } = await supabase.from("video_jobs").select("id").eq("stage", "needs_review").limit(10);
  let n = 0;
  for (const j of data ?? []) {
    await patch(j.id, { stage: "approved", ...unlock, next_run_at: new Date().toISOString(), last_error: "otomatik onaylandı (otonom)" });
    await events.logEvent({ jobId: j.id, stage: "approved", type: "stage_enter", data: { reason: "auto-approve (autonomy)" } }).catch(() => {});
    n++;
  }
  return n;
}

/** Self-recovery: automatically re-drive failed / dead-letter jobs (bounded) instead of just
 *  surfacing the error to the user. Resumes from the furthest completed point. */
export async function autoHeal(): Promise<number> {
  const { data: stuck } = await supabase
    .from("video_jobs")
    .select("id,topic,script,video_path,youtube_video_id,heal_count,last_error")
    .in("stage", ["dead_letter", "failed"]).lt("heal_count", 2).limit(5);
  let n = 0;
  for (const j of stuck ?? []) {
    // Don't reset jobs that are stuck because YouTube is not connected — they'll
    // auto-advance once credentials are added. Only reset real pipeline errors.
    if (String(j.last_error || "").includes("YouTube bağlı değil")) continue;
    let stage = "queued";
    if (j.script) stage = "approved";
    if (j.video_path && !j.youtube_video_id) stage = "scheduled";
    const hc = (j.heal_count ?? 0) + 1;
    await supabase.from("video_jobs").update({
      stage, attempts: 0, locked_by: null, locked_until: null,
      next_run_at: new Date().toISOString(), heal_count: hc,
      last_error: `auto-heal #${hc}: sistem sorunu kendi çözmeye çalışıyor (${stage}'dan yeniden)`,
    }).eq("id", j.id);
    await events.logEvent({ jobId: j.id, stage, type: "retry", data: { reason: "auto-heal", attempt: hc } }).catch(() => {});
    n++;
  }
  return n;
}

export async function tick() {
  try { await control.assertRunning(); }
  catch (e) { log.warn("paused — idling", { reason: String((e as any).message) }); return; }

  try { await budget.assertWithinBudget(); }
  catch (e) {
    const reason = String((e as any).message);
    await control.pause(reason);
    await alerts.alert("critical", "Pipeline auto-paused (budget/quota)", reason);
    log.error("budget exceeded — auto-paused", { reason });
    return;
  }

  const cfg = await getConfig();
  const reclaimed = await reliability.reclaimStaleLocks();
  if (reclaimed) log.info("reclaimed stale locks", { reclaimed });

  const healed = await autoHeal();          // self-recover failed/dead-letter jobs (don't just show errors)
  if (healed) log.info("auto-heal: recovered jobs", { healed });

  const approved = await autoApprove();     // full-autonomy: never leave drafts waiting for a human
  if (approved) log.info("auto-approve: released needs_review jobs", { approved });

  await topUp(cfg);

  // process up to a few jobs per tick (bounded concurrency = 1 for cheap tiers; raise if needed)
  for (let i = 0; i < 3; i++) {
    const job = await reliability.claimNextJob();
    if (!job) break;
    await events.logEvent({ jobId: job.id, traceId: job.trace_id, stage: job.stage, type: "lock_acquired", data: { worker: WORKER } });
    await processJob(job, cfg);
  }

  await refreshAnalytics().catch((e) => log.error("analytics failed", { err: String(e?.message || e) }));

  if (++tickCount % Math.max(1, (e as any).AUTONOMY_EVERY_TICKS || 20) === 0) {
    if (await leader.acquireOrRenew(WORKER || `w-${process.pid}`)) await runAutonomy().catch((err) => log.error("autonomy failed", { err: String(err?.message || err) }));
    else log.info("not leader — skipping autonomy this pass");
  }
  log.info("tick complete");
}
