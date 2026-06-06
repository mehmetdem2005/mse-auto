import { db } from "@/lib/supabaseServer";
import ApprovalCard from "@/components/ApprovalCard";

export const dynamic = "force-dynamic";

export default async function Queue() {
  const { data: jobs } = await db
    .from("video_jobs").select("*")
    .in("stage", ["needs_review"]).order("created_at", { ascending: false });

  const { data: rest } = await db
    .from("video_jobs").select("id,topic,stage,scheduled_for,youtube_video_id")
    .not("stage", "in", "(needs_review)").order("created_at", { ascending: false }).limit(15);

  return (
    <>
      <div className="eyebrow">Editorial gate</div>
      <h1>Queue / Approval</h1>
      <p className="sub">
        The pipeline drafts, fact-checks and styles each Short, then stops here for your call.
        This editorial step is the single most important thing keeping the channel out of YouTube's
        inauthentic-content sweep.
      </p>

      {(jobs ?? []).map((j: any) => <ApprovalCard key={j.id} job={j} />)}
      {!jobs?.length && <div className="card" style={{ color: "var(--muted)" }}>Nothing awaiting review. The worker will draft the next one.</div>}

      <h2 style={{ marginTop: 36, fontWeight: 500 }}>Recent pipeline</h2>
      <table>
        <thead><tr><th>Topic</th><th>Stage</th><th>When</th><th>Video</th></tr></thead>
        <tbody>
          {(rest ?? []).map((r: any) => (
            <tr key={r.id}>
              <td>{r.topic}</td>
              <td><span className={`badge ${r.stage === "published" ? "good" : r.stage === "failed" ? "bad" : ""}`}>{r.stage}</span></td>
              <td className="mono">{r.scheduled_for ? new Date(r.scheduled_for).toLocaleString() : "—"}</td>
              <td className="mono">{r.youtube_video_id ? <a href={`https://youtube.com/watch?v=${r.youtube_video_id}`} style={{ color: "var(--accent)" }}>open ↗</a> : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
