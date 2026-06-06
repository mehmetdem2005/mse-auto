/**
 * Zero-Trust capability authorization — default-deny gate for agent actions.  [v1.1]
 * No agent is trusted by default; every privileged action must be an explicitly granted capability.
 * Complements the bounded action space and runtime tool-scoping.
 */
const GRANTS: Record<string, Set<string>> = {
  // The incident commander may perform only reversible, low-blast actions (high-risk stays human-gated).
  incident_commander: new Set(["action:pause_uploads", "action:takedown_video", "action:adjust_strategy", "action:open_fix_pr", "action:alert_only"]),
};
export function grant(principal: string, capability: string) { (GRANTS[principal] ??= new Set()).add(capability); }
export function revoke(principal: string, capability: string) { GRANTS[principal]?.delete(capability); }
export function can(principal: string, capability: string): boolean { return GRANTS[principal]?.has(capability) ?? false; } // default deny
export function capabilities(principal: string): string[] { return [...(GRANTS[principal] ?? [])]; }
