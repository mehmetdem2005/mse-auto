/**
 * Tiny HTTP surface so the worker can be triggered on a schedule instead of running an
 * always-on loop. Pair with Supabase pg_cron + pg_net (see supabase/migrations/0003) or any
 * uptime/cron service. /tick is protected by WORKER_TOKEN; /health is open for liveness.
 */
import { createServer } from "node:http";
import { env, log } from "@studio/core";
import { tick } from "./runner.js";

export function serve() {
  const e = env.env();
  let running = false;

  const srv = createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ ok: true, ts: new Date().toISOString() }));
    }
    if (req.url === "/tick" && req.method === "POST") {
      if (!e.WORKER_TOKEN || req.headers["x-worker-token"] !== e.WORKER_TOKEN) {
        res.writeHead(401); return res.end("unauthorized");
      }
      if (running) { res.writeHead(200, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: true, note: "already running" })); }
      running = true;
      tick().catch((err) => log.error("tick error", { err: String((err as any)?.message || err) })).finally(() => { running = false; });
      res.writeHead(202, { "content-type": "application/json" });
      return res.end(JSON.stringify({ ok: true, accepted: true }));
    }
    res.writeHead(404); res.end("not found");
  });
  srv.listen(e.PORT, () => log.info("worker http listening", { port: e.PORT }));
}
