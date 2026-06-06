/**
 * Worker entrypoint. Validates env, then runs in one of three modes:
 *   node dist/index.js tick    # one pass (e.g. Render Cron / pg_cron via HTTP)
 *   node dist/index.js loop    # long-running self-scheduled loop (Background Worker)
 *   node dist/index.js serve   # HTTP server exposing POST /tick + /health (cron-triggered)
 */
import { env, log } from "@studio/core";
import { tick } from "./runner.js";
import { serve } from "./server.js";

env.assertEnv(); // fail fast with a clear message if config is wrong

const mode = process.argv[2] || "tick";
if (mode === "loop") {
  const ms = Number(process.env.TICK_MS || 5 * 60_000);
  const run = async () => {
    try { await tick(); } catch (e) { log.error("tick crashed", { err: String((e as any)?.message || e) }); }
    setTimeout(run, ms);
  };
  log.info("worker loop starting", { intervalMs: ms });
  run();
} else if (mode === "serve") {
  serve();
} else {
  tick().then(() => process.exit(0)).catch((e) => { log.error("fatal", { err: String(e?.message || e) }); process.exit(1); });
}
