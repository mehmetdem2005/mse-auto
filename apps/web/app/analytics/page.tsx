import { db } from "@/lib/supabaseServer";
import ViewsChart from "@/components/ViewsChart";

export const dynamic = "force-dynamic";

export default async function Analytics() {
  const { data } = await db.from("analytics").select("*").order("views", { ascending: false }).limit(50);
  const rows = data ?? [];
  const totals = rows.reduce(
    (a: any, r: any) => ({ views: a.views + Number(r.views), likes: a.likes + Number(r.likes), comments: a.comments + Number(r.comments) }),
    { views: 0, likes: 0, comments: 0 },
  );
  const chart = rows.slice(0, 12).map((r: any) => ({ name: (r.title || r.video_id).slice(0, 14), views: Number(r.views) }));

  return (
    <>
      <div className="eyebrow">Performance</div>
      <h1>Analytics</h1>
      <p className="sub">Pulled from the YouTube Data API for your published videos.</p>

      <div className="grid cards">
        <div className="card stat"><div className="n">{totals.views.toLocaleString()}</div><div className="l">Total views</div></div>
        <div className="card stat"><div className="n">{totals.likes.toLocaleString()}</div><div className="l">Likes</div></div>
        <div className="card stat"><div className="n">{totals.comments.toLocaleString()}</div><div className="l">Comments</div></div>
        <div className="card stat"><div className="n">{rows.length}</div><div className="l">Videos</div></div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Views by video</div>
        <ViewsChart data={chart} />
      </div>

      <table style={{ marginTop: 20 }}>
        <thead><tr><th>Title</th><th>Views</th><th>Likes</th><th>Comments</th></tr></thead>
        <tbody>
          {rows.map((r: any) => (
            <tr key={r.video_id}>
              <td>{r.title || r.video_id}</td>
              <td className="mono">{Number(r.views).toLocaleString()}</td>
              <td className="mono">{r.likes}</td>
              <td className="mono">{r.comments}</td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={4} style={{ color: "var(--muted)" }}>No data yet — publish a few videos first.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
