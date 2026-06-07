import { db } from "@/lib/supabaseServer";
import ApprovalCard from "@/components/ApprovalCard";

export const dynamic = "force-dynamic";

const STAGE_LABEL: Record<string, string> = {
  queued: "Kuyrukta", drafting: "Yazılıyor", needs_review: "İnceleme",
  approved: "Onaylandı", rendering: "Render", scheduled: "Zamanlandı",
  uploading: "Yükleniyor", published: "Yayında", failed: "Hata", dead_letter: "Atık",
};
const STAGE_CLS: Record<string, string> = {
  published: "good", failed: "bad", dead_letter: "bad",
  approved: "review", scheduled: "review", rendering: "review",
};

export default async function Queue() {
  const { data: jobs } = await db
    .from("video_jobs").select("*")
    .in("stage", ["needs_review"]).order("created_at", { ascending: false });

  const { data: rest } = await db
    .from("video_jobs")
    .select("id,topic,stage,scheduled_for,youtube_video_id,video_url,last_error,script")
    .not("stage", "in", "(needs_review)")
    .order("created_at", { ascending: false }).limit(30);

  return (
    <>
      <div className="eyebrow">Pipeline / Üretim</div>
      <h1>Kuyruk & Videolar</h1>
      <p className="sub">
        Sistem tam otonomdur — insan onayı gerekmez. Tüm üretilen içerik ve durumları aşağıda görüntüleyebilirsiniz.
      </p>

      {(jobs ?? []).map((j: any) => <ApprovalCard key={j.id} job={j} />)}
      {!jobs?.length && (
        <div className="card" style={{ color: "var(--muted)", marginBottom: 28 }}>
          İnceleme bekleyen yok — sistem otomatik onaylıyor.
        </div>
      )}

      <h2 style={{ marginTop: 24, fontWeight: 500 }}>Tüm İçerikler</h2>
      <div className="grid" style={{ gap: 10 }}>
        {(rest ?? []).map((r: any) => (
          <div className="card" key={r.id} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 16px" }}>
            {/* Thumbnail / placeholder */}
            {r.video_url ? (
              <div style={{ flex: "0 0 80px", height: 80, borderRadius: 8, overflow: "hidden", background: "var(--panel-2)" }}>
                <video src={r.video_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted preload="none" />
              </div>
            ) : (
              <div style={{ flex: "0 0 54px", height: 54, borderRadius: 8, background: "var(--panel-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, opacity: .45 }}>
                {r.stage === "queued" ? "📋" : r.stage === "drafting" ? "✍" : r.stage === "approved" ? "✅" : r.stage === "rendering" ? "🎬" : "▫"}
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.script?.title || r.topic}
              </div>
              {r.script?.hook && (
                <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 2 as any, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>
                  {r.script.hook}
                </div>
              )}
              <div className="row" style={{ gap: 8, flexWrap: "wrap" as any }}>
                <span className={`badge ${STAGE_CLS[r.stage] || ""}`}>{STAGE_LABEL[r.stage] || r.stage}</span>
                {r.scheduled_for && (
                  <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
                    {new Date(r.scheduled_for).toLocaleString("tr-TR")}
                  </span>
                )}
              </div>
              {r.last_error && (
                <div style={{ marginTop: 5, fontSize: 12, color: "var(--bad)", fontFamily: "var(--mono)" }}>
                  ⚠ {r.last_error.slice(0, 100)}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column" as any, gap: 6, flexShrink: 0 }}>
              {r.youtube_video_id && (
                <a href={`https://youtube.com/watch?v=${r.youtube_video_id}`} target="_blank" rel="noopener"
                  className="chip" style={{ padding: "5px 12px", fontSize: 12 }}>▶ YouTube</a>
              )}
              {r.video_url && (
                <>
                  <a href={r.video_url} target="_blank" rel="noopener"
                    className="chip" style={{ padding: "5px 12px", fontSize: 12 }}>▶ İzle</a>
                  <a href={r.video_url} download
                    className="chip" style={{ padding: "5px 12px", fontSize: 12 }}>↓ İndir</a>
                </>
              )}
            </div>
          </div>
        ))}
        {!rest?.length && (
          <div className="card" style={{ color: "var(--muted)" }}>
            Henüz içerik yok. Komuta Merkezi&apos;nden &quot;yeni taslak üret&quot; yazın.
          </div>
        )}
      </div>
    </>
  );
}
