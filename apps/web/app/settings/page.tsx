import { db } from "@/lib/supabaseServer";
import { youtube } from "@studio/core";

export const dynamic = "force-dynamic";

const KEYS = [
  "GEMINI_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY",
  "YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REDIRECT_URI",
];

export default async function Settings({ searchParams }: { searchParams?: Promise<{ yt?: string }> }) {
  const { data: cfg } = await db.from("config").select("*").eq("id", 1).single();
  const present = (k: string) => Boolean(process.env[k]);
  const ytConnected = await youtube.isConnected().catch(() => false);
  const yt = (await searchParams)?.yt;

  return (
    <>
      <div className="eyebrow">Kontrol</div>
      <h1>Ayarlar</h1>
      <p className="sub">Zamanlama, paylaşım temposu ve insan-onay kapısı. Anahtarlar ortamdan okunur — burada asla gösterilmez.</p>

      <form action="/api/settings" method="post">
        <div className="card">
          <div className="eyebrow" style={{ marginBottom: 12 }}>Zamanlama & tempo</div>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Saat dilimi" name="timezone" value={cfg?.timezone} />
            <Field label="Tohum (seed)" name="seed" value={cfg?.seed} />
            <Field label="Gündüz başlangıç saati" name="daytimeStartHour" value={cfg?.daytimeStartHour} />
            <Field label="Gündüz bitiş saati" name="daytimeEndHour" value={cfg?.daytimeEndHour} />
            <Field label="Günlük en fazla (düşük tut)" name="maxPerDay" value={cfg?.maxPerDay} />
            <Field label="Min aralık (dk)" name="minSpacingMinutes" value={cfg?.minSpacingMinutes} />
          </div>
          <label className="row" style={{ marginTop: 14, gap: 8 }}>
            <input type="checkbox" name="requireHumanApproval" defaultChecked={cfg?.requireHumanApproval} style={{ width: "auto" }} />
            <span className="mono" style={{ fontSize: 13 }}>Üretmeden önce insan onayı iste (önerilen: AÇIK)</span>
          </label>
          <button className="btn primary" style={{ marginTop: 16 }} type="submit">Ayarları kaydet</button>
        </div>
      </form>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>YouTube bağlantısı</div>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <span className="mono" style={{ fontSize: 13 }}>
            Durum: <span className={`badge ${ytConnected ? "good" : "bad"}`}>{ytConnected ? "bağlı" : "bağlı değil"}</span>
          </span>
          <a className="btn primary" href="/api/youtube/auth">{ytConnected ? "Yeniden bağlan" : "YouTube'a bağlan"}</a>
        </div>
        {yt === "connected" && <div className="tag" style={{ marginTop: 10 }}>✓ YouTube hesabı bağlandı. Worker bu token ile yükleyecek.</div>}
        {yt === "norefresh" && <div className="tag" style={{ marginTop: 10 }}>Refresh token gelmedi — Google Hesabı → Üçüncü taraf erişimi'nden izni kaldırıp tekrar deneyin (consent zorunlu).</div>}
        {yt === "error" && <div className="tag" style={{ marginTop: 10 }}>Bağlantı hatası — CLIENT_ID / CLIENT_SECRET / REDIRECT_URI değerlerini kontrol edin.</div>}
        <div className="tag" style={{ marginTop: 10 }}>
          Redirect URI (Google Cloud'a tam bu URL kayıtlı olmalı):{" "}
          <span className="mono">{process.env.YOUTUBE_REDIRECT_URI || "https://shortspilot-panel.vercel.app/api/youtube/callback"}</span>
        </div>
        {!present("YOUTUBE_CLIENT_ID") && (
          <div className="tag" style={{ marginTop: 8, color: "var(--warn)" }}>
            ⚠ Önce Google Cloud'da OAuth Client ID/Secret oluşturup ortam değişkenlerine eklemelisin; aksi halde "Bağlan" butonu client_id hatası verir.
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>API anahtarları (ortamdan)</div>
        <div className="grid" style={{ gap: 6 }}>
          {KEYS.map((k) => (
            <div className="row" key={k} style={{ justifyContent: "space-between" }}>
              <span className="mono" style={{ fontSize: 13 }}>{k}</span>
              <span className={`badge ${present(k) ? "good" : "bad"}`}>{present(k) ? "ayarlı" : "eksik"}</span>
            </div>
          ))}
        </div>
        <div className="tag" style={{ marginTop: 12 }}>Bunları Vercel (web) ve Render (worker) üzerinde ayarla. Bkz. HANDOFF.md.</div>
      </div>
    </>
  );
}

function Field({ label, name, value }: { label: string; name: string; value: any }) {
  return (
    <div>
      <label className="eyebrow">{label}</label>
      <input name={name} defaultValue={value ?? ""} />
    </div>
  );
}
