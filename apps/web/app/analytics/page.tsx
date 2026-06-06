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
      <div className="eyebrow">Performans</div>
      <h1>Analitik</h1>
      <p className="sub">Yayınlanan videoların için YouTube Data API'den çekilir.</p>

      <div className="grid cards">
        <div className="card stat"><div className="n">{totals.views.toLocaleString()}</div><div className="l">Toplam izlenme</div></div>
        <div className="card stat"><div className="n">{totals.likes.toLocaleString()}</div><div className="l">Beğeni</div></div>
        <div className="card stat"><div className="n">{totals.comments.toLocaleString()}</div><div className="l">Yorum</div></div>
        <div className="card stat"><div className="n">{rows.length}</div><div className="l">Video</div></div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Videoya göre izlenme</div>
        <ViewsChart data={chart} />
      </div>

      <table style={{ marginTop: 20 }}>
        <thead><tr><th>Başlık</th><th>İzlenme</th><th>Beğeni</th><th>Yorum</th></tr></thead>
        <tbody>
          {rows.map((r: any) => (
            <tr key={r.video_id}>
              <td>{r.title || r.video_id}</td>
              <td className="mono">{Number(r.views).toLocaleString()}</td>
              <td className="mono">{r.likes}</td>
              <td className="mono">{r.comments}</td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={4} style={{ color: "var(--muted)" }}>Henüz veri yok — önce birkaç video yayınla.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
