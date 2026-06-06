import { db } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function Memory() {
  const { data } = await db.from("memory").select("kind,content,created_at").order("created_at", { ascending: false }).limit(120);
  const groups: Record<string, any[]> = {};
  for (const m of data ?? []) (groups[m.kind] ||= []).push(m);

  return (
    <>
      <div className="eyebrow">Sistemin bildikleri</div>
      <h1>Hafıza</h1>
      <p className="sub">
        Senin belirlediğin tercihler, analitikten öğrenilen performans içgörüleri ve daha önce kullanılan
        konuların kaydı (böylece bir hikâye asla tekrarlanmaz). pgvector ile anlamsal hatırlama.
      </p>
      {Object.keys(groups).length === 0 && <div className="card" style={{ color: "var(--muted)" }}>Henüz hafıza kaydı yok.</div>}
      {Object.entries(groups).map(([kind, items]) => (
        <div key={kind} style={{ marginBottom: 22 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>{kind.replace("_", " ")}</div>
          <div className="grid" style={{ gap: 8 }}>
            {items.slice(0, 30).map((m: any, i: number) => (
              <div className="card" key={i} style={{ padding: "10px 14px" }}>
                <span style={{ fontSize: 14 }}>{m.content}</span>
                <span className="tag" style={{ float: "right" }}>{new Date(m.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
