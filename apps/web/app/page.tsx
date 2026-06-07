import { db } from "@/lib/supabaseServer";
import RunNow from "@/components/RunNow";

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
      <div className="eyebrow">Genel bakış</div>
      <h1>Panel</h1>
      <p className="sub">Tam otonom pipeline. İnsan onayı yok — sistem üretir, kurar, yayınlar.</p>

      <RunNow initialReview={c.needs_review} />

      <div className="notice">
        <b>Tam otonom mod açık.</b> İnsan onay adımı yok: ajanlar araştırır, yazar, kurul değerlendirir,
        görsel + video üretir ve yayına hazırlar. YouTube'un 2026 politikalarına karşı her videoyu
        çeşitlendirir, özgün yorum ekler ve yapay zekâ kullanımını açıkça belirtir.
      </div>

      <div className="grid cards">
        <Stat n={c.needs_review} l="İnceleme bekliyor" />
        <Stat n={c.approved + c.rendering} l="Üretimde" />
        <Stat n={c.scheduled} l="Planlandı" />
        <Stat n={c.published} l="Yayınlandı" />
        <Stat n={c.failed} l="Başarısız" />
      </div>

      <h2 style={{ marginTop: 34, fontWeight: 500 }}>Yaklaşan yayın slotları</h2>
      <table>
        <thead><tr><th>Ne zaman</th><th>Konu</th><th>Aşama</th></tr></thead>
        <tbody>
          {(upcoming ?? []).map((u: any, i: number) => (
            <tr key={i}>
              <td className="mono">{u.scheduled_for ? new Date(u.scheduled_for).toLocaleString() : "—"}</td>
              <td>{u.topic}</td>
              <td><span className="badge">{u.stage}</span></td>
            </tr>
          ))}
          {!upcoming?.length && <tr><td colSpan={3} style={{ color: "var(--muted)" }}>Henüz planlanmış bir şey yok.</td></tr>}
        </tbody>
      </table>
    </>
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  return <div className="card stat"><div className="n">{n}</div><div className="l">{l}</div></div>;
}
