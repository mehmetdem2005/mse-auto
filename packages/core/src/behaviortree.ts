/**
 * Behavior Trees — reactive control architecture for agents.  [v1.2]
 * NOT game-only: used in robotics and for orchestrating LLM agents. Tick-based; nodes return
 * success/failure/running. Composites: sequence, selector, parallel, decorator(inverter). Leaves: condition, action.
 */
export type Status = "success" | "failure" | "running";
export interface BTNode { tick(ctx: any): Promise<Status> | Status; }

export const cond = (fn: (ctx: any) => boolean | Promise<boolean>): BTNode => ({ async tick(ctx) { return (await fn(ctx)) ? "success" : "failure"; } });
export const act = (fn: (ctx: any) => any): BTNode => ({ async tick(ctx) { const r = await fn(ctx); return r === false ? "failure" : r === "running" ? "running" : "success"; } });
export const sequence = (...kids: BTNode[]): BTNode => ({ async tick(ctx) { for (const k of kids) { const s = await k.tick(ctx); if (s !== "success") return s; } return "success"; } });
export const selector = (...kids: BTNode[]): BTNode => ({ async tick(ctx) { for (const k of kids) { const s = await k.tick(ctx); if (s !== "failure") return s; } return "failure"; } });
export const inverter = (child: BTNode): BTNode => ({ async tick(ctx) { const s = await child.tick(ctx); return s === "success" ? "failure" : s === "failure" ? "success" : "running"; } });
export const parallel = (need: number, ...kids: BTNode[]): BTNode => ({
  async tick(ctx) {
    const rs = await Promise.all(kids.map((k) => k.tick(ctx)));
    const ok = rs.filter((s) => s === "success").length, fail = rs.filter((s) => s === "failure").length;
    return ok >= need ? "success" : fail > kids.length - need ? "failure" : "running";
  },
});
export async function run(root: BTNode, ctx: any): Promise<Status> { return root.tick(ctx); }
