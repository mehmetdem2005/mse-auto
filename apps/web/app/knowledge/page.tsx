import { db } from "@/lib/supabaseServer";
import AddKnowledge from "@/components/AddKnowledge";

export const dynamic = "force-dynamic";

export default async function Knowledge() {
  const { data } = await db.from("knowledge").select("id,topic,source_title,verified").order("created_at", { ascending: false }).limit(100);
  return (
    <>
      <div className="eyebrow">Dayanak kaynağı</div>
      <h1>Bilgi (RAG)</h1>
      <p className="sub">
        Her senaryo bu doğrulanmış olgulara dayandırılır (gemini-embedding-001 ile gömülür, Supabase
        pgvector'da saklanır, kosinüs benzerliğiyle getirilir). Yalnızca <b>doğrulanmış</b> parçalar
        kullanılır — yanlış bilgiye karşı koruma budur.
      </p>
      <div className="notice" style={{ marginBottom: 18 }}>
        <b>Elle girmek zorunda değilsin.</b> Üretim ekibindeki <b>araştırmacı</b> ve <b>trend avcısı</b> ajanlar
        her turda konuları kendileri bulur ve web araştırmasıyla olguları toplar; "Rakip Analisti" rakip
        kanallardan içgörü çıkarır. Aşağıdaki form sadece <i>opsiyonel</i> — kendi doğruladığın bir kaynağı
        elle eklemek istersen kullan.
      </div>
      <AddKnowledge />
      <table style={{ marginTop: 20 }}>
        <thead><tr><th>Konu</th><th>Kaynak</th><th>Doğrulama</th></tr></thead>
        <tbody>
          {(data ?? []).map((k: any) => (
            <tr key={k.id}>
              <td>{k.topic}</td>
              <td className="mono" style={{ color: "var(--muted)" }}>{k.source_title}</td>
              <td><span className={`badge ${k.verified ? "good" : "bad"}`}>{k.verified ? "doğrulandı" : "doğrulanmadı"}</span></td>
            </tr>
          ))}
          {!data?.length && <tr><td colSpan={3} style={{ color: "var(--muted)" }}>Boş. Tohumlama betiğini çalıştır ya da yukarıdan parça ekle.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
