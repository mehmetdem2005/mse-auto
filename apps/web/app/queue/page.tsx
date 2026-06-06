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
      <div className="eyebrow">Editöryel kapı</div>
      <h1>Kuyruk / Onay</h1>
      <p className="sub">
        Pipeline her Short'u yazar, olgularını doğrular ve biçimlendirir; sonra senin kararın için burada
        durur. Bu editöryel adım, kanalı YouTube'un sahte/yığın içerik taramasından uzak tutan en önemli şeydir.
      </p>

      {(jobs ?? []).map((j: any) => <ApprovalCard key={j.id} job={j} />)}
      {!jobs?.length && <div className="card" style={{ color: "var(--muted)" }}>İnceleme bekleyen yok. Worker bir sonrakini hazırlayacak.</div>}

      <h2 style={{ marginTop: 36, fontWeight: 500 }}>Son pipeline</h2>
      <table>
        <thead><tr><th>Konu</th><th>Aşama</th><th>Ne zaman</th><th>Video</th></tr></thead>
        <tbody>
          {(rest ?? []).map((r: any) => (
            <tr key={r.id}>
              <td>{r.topic}</td>
              <td><span className={`badge ${r.stage === "published" ? "good" : r.stage === "failed" ? "bad" : ""}`}>{r.stage}</span></td>
              <td className="mono">{r.scheduled_for ? new Date(r.scheduled_for).toLocaleString() : "—"}</td>
              <td className="mono">{r.youtube_video_id ? <a href={`https://youtube.com/watch?v=${r.youtube_video_id}`} style={{ color: "var(--accent)" }}>aç ↗</a> : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
