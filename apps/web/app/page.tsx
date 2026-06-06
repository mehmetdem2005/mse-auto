import { db } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

async function counts() {
  const stages = ["needs_review", "approved", "rendering", "scheduled", "published", "failed"];
  const out: Record<string, number> = {};
  for (const s of stages) {
    const { count } = await db.from("video_jobs").select("id", { count: "exact", head: true }).eq("stage", s);
    out[s] = count ?? 0;
  }
  return out;
}

export default async function Dashboard() {
  const c = await counts();
  const { data: upcoming } = await db
    .from("video_jobs").select("topic,scheduled_for,stage")
    .not("scheduled_for", "is", null).order("scheduled_for").limit(6);

  return (
    <>
      <div className="eyebrow">Overview</div>
      <h1>Dashboard</h1>
      <p className="sub">Autonomous pipeline status. You approve, it does the rest.</p>

      <div className="notice">
        <b>Survival mode is on.</b> YouTube terminated thousands of fully-automated AI channels in Jan 2026.
        This studio keeps a human approval step, varies every video, discloses AI use, and posts a low daily
        volume — that is what keeps the channel alive.
      </div>

      <div className="grid cards">
        <Stat n={c.needs_review} l="Needs review" />
        <Stat n={c.approved + c.rendering} l="In production" />
        <Stat n={c.scheduled} l="Scheduled" />
        <Stat n={c.published} l="Published" />
        <Stat n={c.failed} l="Failed" />
      </div>

      <h2 style={{ marginTop: 34, fontWeight: 500 }}>Upcoming slots</h2>
      <table>
        <thead><tr><th>When</th><th>Topic</th><th>Stage</th></tr></thead>
        <tbody>
          {(upcoming ?? []).map((u: any, i: number) => (
            <tr key={i}>
              <td className="mono">{u.scheduled_for ? new Date(u.scheduled_for).toLocaleString() : "—"}</td>
              <td>{u.topic}</td>
              <td><span className="badge">{u.stage}</span></td>
            </tr>
          ))}
          {!upcoming?.length && <tr><td colSpan={3} style={{ color: "var(--muted)" }}>Nothing scheduled yet.</td></tr>}
        </tbody>
      </table>
    </>
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  return <div className="card stat"><div className="n">{n}</div><div className="l">{l}</div></div>;
}
