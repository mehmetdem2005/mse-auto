/**
 * Standards compliance matrix — the machine-checkable contract.  [v1.1]
 * Encodes the self-healing loop + agent/architecture standards with an honest status for each:
 *  implemented = built + unit-tested (NOT yet live-run) | partial | documented | na (out of scope, with reason).
 * The autonomy loop logs complianceReport() each pass so gaps are visible.
 */
export type CStatus = "implemented" | "partial" | "documented" | "na";
export interface StandardCheck { id: string; name: string; category: string; status: CStatus; where: string; note: string; }

export const STANDARDS: StandardCheck[] = [
  // Self-healing loop (screenshot)
  { id: "sh-telemetry", name: "Telemetry", category: "self-heal", status: "implemented", where: "otel/metrics/events", note: "gen_ai spans + metrics + job_events" },
  { id: "sh-introspection", name: "Introspection", category: "self-heal", status: "implemented", where: "supervisor/monitor", note: "superviseOnce + auditRepo" },
  { id: "sh-analysis", name: "Analysis", category: "self-heal", status: "implemented", where: "monitor/anomaly", note: "opportunities + detectAnomalies" },
  { id: "sh-codegen", name: "Code Gen", category: "self-heal", status: "implemented", where: "selfimprove", note: "surgical proposeEdits" },
  { id: "sh-shadowtest", name: "Shadow Test", category: "self-heal", status: "partial", where: "github CI + canary", note: "CI is the hard gate; true shadow-env run is the next step" },
  { id: "sh-validated", name: "Validated Patch", category: "self-heal", status: "implemented", where: "mergequeue", note: "merge only on green CI" },
  { id: "sh-reflection", name: "Structural Reflection", category: "self-heal", status: "implemented", where: "selfimprove/github", note: "PR-based structure change" },
  { id: "sh-hotswap", name: "Hot-Swap", category: "self-heal", status: "partial", where: "deploy", note: "cold-swap via redeploy by design (in-process hot-swap is unsafe — Replit lesson)" },
  // Communication
  { id: "fipa-acl", name: "FIPA ACL", category: "comms", status: "implemented", where: "acl.ts", note: "performatives inform/request/propose/…" },
  { id: "actor", name: "Actor Model", category: "comms", status: "implemented", where: "actors.ts", note: "mailbox, sequential per-actor, no deadlock" },
  { id: "grpc", name: "gRPC / Protobuf", category: "comms", status: "partial", where: "proto/agent.proto + contract.ts", note: "Protobuf IDL + zod-validated typed contract; grpc-js wire transport is the distributed step" },
  // Enterprise architecture
  { id: "togaf", name: "TOGAF", category: "enterprise", status: "documented", where: "docs", note: "data/app/tech layers documented; full TOGAF process is overkill for single-user" },
  { id: "iso42010", name: "ISO/IEC/IEEE 42010", category: "enterprise", status: "documented", where: "STANDARDS.md", note: "viewpoints documented" },
  { id: "bdi", name: "BDI Architecture", category: "enterprise", status: "implemented", where: "bdi.ts", note: "beliefs/desires/intentions + deliberate" },
  // Isolation & safe execution
  { id: "hexagonal", name: "Hexagonal (Ports/Adapters)", category: "isolation", status: "documented", where: "gemini/youtube/supabase/github adapters", note: "adapters behind typed modules; no live code-executor (PR/CI instead)" },
  { id: "oci", name: "OCI Containers", category: "isolation", status: "implemented", where: "apps/worker/Dockerfile", note: "worker runs in a container" },
  { id: "zerotrust", name: "Zero Trust", category: "isolation", status: "implemented", where: "authz.ts + HMAC + RLS", note: "default-deny capability gate + signed worker + RLS" },
  // Task distribution & thinking
  { id: "blackboard", name: "Blackboard", category: "thinking", status: "implemented", where: "runtime.ts", note: "shared blackboard for agents" },
  { id: "react", name: "ReAct", category: "thinking", status: "implemented", where: "runtime.ts", note: "reason→act→observe loop" },
  { id: "cnp", name: "Contract Net Protocol", category: "thinking", status: "implemented", where: "contractnet.ts", note: "announce→bid→award" },
  { id: "raft", name: "Raft / Paxos", category: "thinking", status: "implemented", where: "leader.ts", note: "DB TTL-lease leader election (one safe leader among N workers); full multi-node consensus not needed at this scale" },
  // Simulation & spatial (game-AI — belong to the Godot project, not this pipeline)
  { id: "goap", name: "GOAP", category: "planning", status: "implemented", where: "goap.ts", note: "STRIPS-derived backward/forward A* planner; plans the Shorts pipeline (research→…→publish)" },
  { id: "btree", name: "Behavior Trees", category: "thinking", status: "implemented", where: "behaviortree.ts", note: "tick-based reactive control (sequence/selector/parallel/decorator); used for LLM-agent orchestration" },
  { id: "spatial", name: "Spatial Partitioning (kd-tree)", category: "cognitive", status: "implemented", where: "spatial.ts", note: "kd-tree nearest-neighbor over embeddings for originality/dedup/clustering (pgvector for 768-dim prod scale)" },
  // Cognitive & memory
  { id: "soar", name: "SOAR / ACT-R memory tiers", category: "cognitive", status: "documented", where: "blackboard/events/rag", note: "working=blackboard, episodic=events/incidents, semantic=RAG vectors" },
  { id: "owl", name: "OWL / Knowledge Graph", category: "cognitive", status: "implemented", where: "ontology.ts", note: "queryable subject-predicate-object triple store; full OWL/DL reasoner out of scope for single channel" },
  // Observability & resilience
  { id: "otel", name: "OpenTelemetry", category: "observability", status: "implemented", where: "otel.ts", note: "OTLP/HTTP exporter, gen_ai spans" },
  { id: "dlq", name: "Dead Letter Queue", category: "observability", status: "implemented", where: "reliability + 0002 migration", note: "failed jobs isolated in dead_letter" },
];

export function complianceReport(items: StandardCheck[] = STANDARDS) {
  const by = (s: CStatus) => items.filter((i) => i.status === s).length;
  return { total: items.length, implemented: by("implemented"), partial: by("partial"), documented: by("documented"), na: by("na"), gaps: items.filter((i) => i.status === "partial") };
}
