/**
 * Contract Net Protocol (CNP) — decentralized task allocation by bidding.  [v1.1]
 * A manager announces a task; workers bid by fit (confidence) and cost; the manager awards the best bid.
 * Upgrades static role assignment to dynamic, capability-aware allocation.
 */
export interface Bid { worker: string; cost: number; confidence: number; }
export interface CNPResult { task: string; winner: string | null; bids: Bid[]; }

/** Award to the highest-confidence bid; ties broken by lowest cost. Zero-confidence bids are ignored. */
export function award(taskId: string, bids: Bid[]): CNPResult {
  const valid = bids.filter((b) => b.confidence > 0);
  const winner = valid.length ? valid.slice().sort((a, b) => b.confidence - a.confidence || a.cost - b.cost)[0].worker : null;
  return { task: taskId, winner, bids };
}

/** Run a full CNP round: announce → collect bids → award. */
export async function allocate(taskId: string, goal: string, workers: { name: string; bid: (goal: string) => Promise<Bid> | Bid }[]): Promise<CNPResult> {
  const bids = await Promise.all(workers.map(async (w) => { try { return await w.bid(goal); } catch { return { worker: w.name, cost: Infinity, confidence: 0 }; } }));
  return award(taskId, bids);
}
