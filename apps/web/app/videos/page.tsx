import { db } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

// Gallery of produced videos (ready / scheduled / published) with inline players.
export default async function Videos() {
  const { data } = await db
    .from("video_jobs")
    .select("id,topic,stage,video_url,script,updated_at")
    .not("video_url", "is", null)
    .order("updated_at", { ascending: false })
    .limit(60);

  const vids = data ?? [];
  const STAGE: Record<string, string> = { ready: "Hazır", scheduled: "Planlandı", published: "Yayınlandı" };

  return (
    <>
      <div className="eyebrow">Üretilenler</div>
      <h1>Videolar</h1>
      <p className="sub">Pipeline'ın ürettiği videolar — Supabase Storage'da kalıcı. {vids.length} video.</p>

      {!vids.length && <div className="notice">Henüz üretilmiş video yok. Komuta Merkezi'nden "yeni taslak üret" diyebilirsin.</div>}

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
        {vids.map((v: any) => (
          <div className="card" key={v.id} style={{ padding: 10 }}>
            <video
              src={v.video_url}
              controls
              preload="metadata"
              playsInline
              style={{ width: "100%", borderRadius: 10, background: "#000", aspectRatio: "9 / 16", objectFit: "cover" }}
            />
            <div style={{ fontWeight: 600, fontSize: 14, marginTop: 8 }}>{v.script?.title || v.topic}</div>
            {v.script?.hook && <div className="tag" style={{ fontSize: 12, marginTop: 3, lineHeight: 1.4 }}>{v.script.hook}</div>}
            <div className="row" style={{ justifyContent: "space-between", marginTop: 8 }}>
              <span className={`badge ${v.stage === "published" ? "good" : ""}`}>{STAGE[v.stage] || v.stage}</span>
              <a href={v.video_url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontSize: 12 }}>indir ↗</a>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
