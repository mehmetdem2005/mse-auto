import { db } from "@/lib/supabaseServer";
import AddKnowledge from "@/components/AddKnowledge";

export const dynamic = "force-dynamic";

export default async function Knowledge() {
  const { data } = await db.from("knowledge").select("id,topic,source_title,verified").order("created_at", { ascending: false }).limit(100);
  return (
    <>
      <div className="eyebrow">Grounding source</div>
      <h1>Knowledge (RAG)</h1>
      <p className="sub">
        Every script is grounded in these verified facts (embedded with gemini-embedding-001, stored in
        Supabase pgvector, retrieved by cosine similarity). Only <b>verified</b> chunks are ever used —
        that is the anti-misinformation guard.
      </p>
      <AddKnowledge />
      <table style={{ marginTop: 20 }}>
        <thead><tr><th>Topic</th><th>Source</th><th>Verified</th></tr></thead>
        <tbody>
          {(data ?? []).map((k: any) => (
            <tr key={k.id}>
              <td>{k.topic}</td>
              <td className="mono" style={{ color: "var(--muted)" }}>{k.source_title}</td>
              <td><span className={`badge ${k.verified ? "good" : "bad"}`}>{k.verified ? "verified" : "unverified"}</span></td>
            </tr>
          ))}
          {!data?.length && <tr><td colSpan={3} style={{ color: "var(--muted)" }}>Empty. Run the seed script or add chunks above.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
