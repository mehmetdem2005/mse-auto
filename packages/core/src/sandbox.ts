/**
 * Sandboxes & memory tiers.  [v0.8]
 * Research (AgentSys): main agent keeps trusted long-horizon state; short-lived workers handle
 * untrusted tool output in ISOLATED scratch and pass back only schema-validated values. We model:
 *   • SharedSandbox  — the crew's common blackboard (trusted, schema-validated values).
 *   • AgentSandbox   — per-agent isolated namespace (untrusted tool output stays here).
 *   • Cache          — short-term TTL cache (pre-bellek). Persistent memory = memory.ts/RAG.
 */
export class SharedSandbox {
  private m = new Map<string, any>();
  set(k: string, v: any) { this.m.set(k, v); } get(k: string) { return this.m.get(k); }
  all() { return Object.fromEntries(this.m); } keys() { return [...this.m.keys()]; }
}

export class AgentSandbox {
  constructor(private agentId: string, private store = new Map<string, any>()) {}
  private k(k: string) { return `${this.agentId}::${k}`; }
  set(k: string, v: any) { this.store.set(this.k(k), v); }
  get(k: string) { return this.store.get(this.k(k)); }
  keys() { const p = this.agentId + "::"; return [...this.store.keys()].filter((x) => x.startsWith(p)).map((x) => x.slice(p.length)); }
}

export class Cache {
  private m = new Map<string, { v: any; exp: number }>();
  constructor(private ttlMs = 300000) {}
  set(k: string, v: any, ttl = this.ttlMs) { this.m.set(k, { v, exp: Date.now() + ttl }); }
  get(k: string) { const e = this.m.get(k); if (!e) return undefined; if (Date.now() > e.exp) { this.m.delete(k); return undefined; } return e.v; }
  has(k: string) { return this.get(k) !== undefined; }
  clear() { this.m.clear(); }
}
