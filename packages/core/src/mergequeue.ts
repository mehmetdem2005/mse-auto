/**
 * Merge queue + canary — keep main green under autonomous PRs, and auto-revert regressions.  [v0.9]
 * Research: high PR volume needs a merge queue (serialize, base-green before each merge) + a canary
 * (watch health after merge; revert if it regresses). Rollback path is mandatory (Replit lesson).
 */
import { log } from "./logger.js";
import type { GitHub } from "./github.js";

export class MergeQueue {
  private q: { number: number; headSha: string }[] = [];
  constructor(private gh: GitHub) {}
  enqueue(pr: { number: number; headSha: string }) { this.q.push(pr); return this; }
  size() { return this.q.length; }
  /** Serially merge only PRs whose CI is green; returns merged PR numbers. */
  async drain(method: "squash" | "merge" | "rebase" = "squash"): Promise<number[]> {
    const merged: number[] = [];
    for (const pr of this.q) {
      try { if ((await this.gh.checksConclusion(pr.headSha)) === "success") { await this.gh.mergePR(pr.number, method); merged.push(pr.number); } }
      catch (e) { log.warn("merge-queue skip", { pr: pr.number, err: String(e) }); }
    }
    this.q = this.q.filter((pr) => !merged.includes(pr.number));
    return merged;
  }
}

/** Canary: did the just-merged change regress health beyond threshold? */
export function canaryRegressed(before: { errorRate: number }, after: { errorRate: number }, threshold = 0.15): boolean {
  return after.errorRate - before.errorRate > threshold;
}

/** Open a revert PR (rollback) restoring the prior file contents. */
export async function revert(gh: GitHub, mergedPrNumber: number, restore: { path: string; content: string }[], reason: string) {
  const branch = `auto/revert-${mergedPrNumber}-${Date.now().toString(36)}`;
  return gh.openChangePR({ branch, title: `[auto-revert] #${mergedPrNumber}`, body: `Canary regresyonu → geri alma.\n${reason}`, files: restore, message: `revert #${mergedPrNumber}` });
}
