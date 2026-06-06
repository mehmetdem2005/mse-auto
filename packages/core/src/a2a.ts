/**
 * A2A (Agent2Agent) adapter — standards-aligned surface for inter-agent tasks.  [v0.9]
 * Agent Card (capabilities/skills) + task/message envelope + a local dispatcher. This is the protocol
 * surface (lets internal or external A2A agents exchange tasks); a remote transport is the next step.
 */
export interface AgentCard { name: string; description: string; version: string; capabilities: string[]; skills: { id: string; description: string }[]; }
export interface A2AMessage { taskId: string; role: "user" | "agent"; parts: { type: "text"; text: string }[]; }
export interface A2ATask { id: string; skill: string; input: A2AMessage; }

export function makeCard(name: string, skills: { id: string; description: string }[]): AgentCard {
  return { name, description: `A2A agent: ${name}`, version: "0.1", capabilities: ["tasks/send"], skills };
}
export function validateTask(t: any): t is A2ATask {
  return !!(t && typeof t.id === "string" && typeof t.skill === "string" && t.input && Array.isArray(t.input.parts));
}

export class LocalA2ADispatcher {
  private handlers = new Map<string, (t: A2ATask) => Promise<A2AMessage>>();
  register(skill: string, h: (t: A2ATask) => Promise<A2AMessage>) { this.handlers.set(skill, h); return this; }
  skills() { return [...this.handlers.keys()]; }
  card(name: string) { return makeCard(name, this.skills().map((id) => ({ id, description: id }))); }
  async send(t: A2ATask): Promise<A2AMessage> {
    if (!validateTask(t)) throw new Error("invalid A2A task");
    const h = this.handlers.get(t.skill);
    if (!h) throw new Error(`no handler for skill ${t.skill}`);
    return h(t);
  }
}
