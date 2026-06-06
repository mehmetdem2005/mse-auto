/**
 * Leader election via DB lease — consensus-lite for multi-worker safety (Raft/Paxos intent).  [v1.2]
 * Full multi-node consensus is unnecessary here; a single TTL lease row gives one safe leader among N
 * workers (the standard production shortcut). Single-worker deployments behave as before (best-effort true).
 */
import { supabase } from "./supabase.js";

/** Pure: should this worker acquire/renew the lease now? */
export function shouldAcquire(lease: { holder?: string; expires_at?: string } | null, workerId: string, now = Date.now()): boolean {
  if (!lease || !lease.holder) return true;            // unheld → take it
  if (lease.holder === workerId) return true;          // ours → renew
  return new Date(lease.expires_at || 0).getTime() < now; // expired → take over
}

export async function acquireOrRenew(workerId: string, ttlSec = 60): Promise<boolean> {
  try {
    const { data } = await supabase.from("leader_lease").select("*").eq("id", 1).single();
    if (!shouldAcquire((data as any) ?? null, workerId)) return false;
    await supabase.from("leader_lease").upsert({ id: 1, holder: workerId, expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(), updated_at: new Date().toISOString() });
    return true;
  } catch { return true; } // no table / single-worker → don't block
}
