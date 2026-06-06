/**
 * GOAP — Goal-Oriented Action Planning (STRIPS-derived, backward/forward A*).  [v1.2]
 * NOT game-only: descends from STRIPS (1971) general planning; used for adaptive autonomous agents.
 * Here it plans the Shorts pipeline: goal=published, actions(research→angle→draft→review→render→upload)
 * with preconditions/effects; the planner discovers the lowest-cost valid sequence and can replan.
 */
export type WorldState = Record<string, boolean>;
export interface GoapAction { name: string; cost: number; pre: WorldState; eff: WorldState; }

const satisfies = (s: WorldState, goal: WorldState) => Object.entries(goal).every(([k, v]) => s[k] === v);
const applicable = (a: GoapAction, s: WorldState) => Object.entries(a.pre).every(([k, v]) => s[k] === v);
const apply = (s: WorldState, a: GoapAction): WorldState => ({ ...s, ...a.eff });
const heuristic = (s: WorldState, goal: WorldState) => Object.entries(goal).filter(([k, v]) => s[k] !== v).length;
const keyOf = (s: WorldState) => JSON.stringify(Object.keys(s).sort().reduce((o, k) => ((o[k] = s[k]), o), {} as any));

/** Forward A* over the action graph; returns the lowest-cost plan or null if unreachable. */
export function plan(start: WorldState, goal: WorldState, actions: GoapAction[], maxNodes = 10000): GoapAction[] | null {
  if (satisfies(start, goal)) return [];
  const open: { s: WorldState; g: number; f: number; path: GoapAction[] }[] = [{ s: start, g: 0, f: heuristic(start, goal), path: [] }];
  const seen = new Map<string, number>(); let nodes = 0;
  while (open.length) {
    open.sort((a, b) => a.f - b.f);
    const cur = open.shift()!;
    if (satisfies(cur.s, goal)) return cur.path;
    if (++nodes > maxNodes) return null;
    const k = keyOf(cur.s);
    if (seen.has(k) && (seen.get(k) as number) <= cur.g) continue;
    seen.set(k, cur.g);
    for (const a of actions) {
      if (!applicable(a, cur.s)) continue;
      const ns = apply(cur.s, a), g = cur.g + a.cost;
      open.push({ s: ns, g, f: g + heuristic(ns, goal), path: [...cur.path, a] });
    }
  }
  return null;
}

/** The Shorts production domain as GOAP actions. */
export function shortsActions(): GoapAction[] {
  return [
    { name: "research", cost: 1, pre: {}, eff: { hasFacts: true } },
    { name: "angle", cost: 1, pre: { hasFacts: true }, eff: { hasAngle: true } },
    { name: "draft", cost: 1, pre: { hasAngle: true }, eff: { hasScript: true } },
    { name: "review", cost: 1, pre: { hasScript: true }, eff: { approved: true } },
    { name: "render", cost: 2, pre: { approved: true }, eff: { hasVideo: true } },
    { name: "upload", cost: 1, pre: { hasVideo: true }, eff: { published: true } },
  ];
}
export function planShort(start: WorldState = {}): GoapAction[] { return plan(start, { published: true }, shortsActions()) || []; }
