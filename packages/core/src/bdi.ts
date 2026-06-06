/**
 * BDI (Belief–Desire–Intention) — structured agent decision state.  [v1.1]
 * Beliefs = what the agent knows (blackboard/memory), Desires = goals, Intentions = the committed plan.
 * deliberate() commits feasible desires to intentions. Pure + immutable.
 */
export interface BDIState { beliefs: Record<string, any>; desires: string[]; intentions: string[]; }
export function init(beliefs: Record<string, any> = {}): BDIState { return { beliefs, desires: [], intentions: [] }; }
export function believe(s: BDIState, key: string, value: any): BDIState { return { ...s, beliefs: { ...s.beliefs, [key]: value } }; }
export function desire(s: BDIState, goal: string): BDIState { return s.desires.includes(goal) ? s : { ...s, desires: [...s.desires, goal] }; }
/** Commit feasible desires to intentions (drops desires whose preconditions the beliefs don't satisfy). */
export function deliberate(s: BDIState, feasible: (goal: string, beliefs: Record<string, any>) => boolean): BDIState {
  return { ...s, intentions: s.desires.filter((g) => feasible(g, s.beliefs)) };
}
