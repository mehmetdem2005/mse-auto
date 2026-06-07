import AgentBoard from "@/components/AgentBoard";
export const dynamic = "force-dynamic";

// Live AI CORE control center — the client component polls /api/agents for real agent state.
export default function AgentsPage() {
  return <AgentBoard />;
}
