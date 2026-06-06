/**
 * FIPA ACL — Agent Communication Language performatives.  [v1.1]
 * IEEE/FIPA standard for agent messaging: standardized speech acts (inform/request/propose/…) so agents
 * express intent uniformly. Layers on top of the A2A envelope.
 */
export type Performative = "inform" | "request" | "propose" | "accept-proposal" | "reject-proposal" | "failure" | "confirm" | "query";
export interface ACLMessage { performative: Performative; sender: string; receiver: string; content: any; conversationId?: string; inReplyTo?: string; language?: string; ontology?: string; }
const VALID = new Set<Performative>(["inform", "request", "propose", "accept-proposal", "reject-proposal", "failure", "confirm", "query"]);
export function acl(performative: Performative, sender: string, receiver: string, content: any, extra: Partial<ACLMessage> = {}): ACLMessage {
  if (!VALID.has(performative)) throw new Error(`invalid performative: ${performative}`);
  return { performative, sender, receiver, content, ...extra };
}
export function isACL(m: any): m is ACLMessage { return !!(m && VALID.has(m.performative) && m.sender && m.receiver && "content" in m); }
export function reply(to: ACLMessage, performative: Performative, content: any): ACLMessage {
  return acl(performative, to.receiver, to.sender, content, { conversationId: to.conversationId, inReplyTo: to.performative });
}
