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
      <div className="eyebrow">Control</div>
      <h1>Settings</h1>
      <p className="sub">Scheduling, posting cadence and the human-approval gate. Keys are read from env — never shown here.</p>

      <form action="/api/settings" method="post">
        <div className="card">
          <div className="eyebrow" style={{ marginBottom: 12 }}>Scheduling & cadence</div>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Timezone" name="timezone" value={cfg?.timezone} />
            <Field label="Seed" name="seed" value={cfg?.seed} />
            <Field label="Daytime start hour" name="daytimeStartHour" value={cfg?.daytimeStartHour} />
            <Field label="Daytime end hour" name="daytimeEndHour" value={cfg?.daytimeEndHour} />
            <Field label="Max per day (keep low)" name="maxPerDay" value={cfg?.maxPerDay} />
            <Field label="Min spacing (min)" name="minSpacingMinutes" value={cfg?.minSpacingMinutes} />
          </div>
          <label className="row" style={{ marginTop: 14, gap: 8 }}>
            <input type="checkbox" name="requireHumanApproval" defaultChecked={cfg?.requireHumanApproval} style={{ width: "auto" }} />
            <span className="mono" style={{ fontSize: 13 }}>Require human approval before producing (recommended ON)</span>
          </label>
          <button className="btn primary" style={{ marginTop: 16 }} type="submit">Save config</button>
        </div>
      </form>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>YouTube connection</div>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <span className="mono" style={{ fontSize: 13 }}>
            Status: <span className={`badge ${ytConnected ? "good" : "bad"}`}>{ytConnected ? "connected" : "not connected"}</span>
          </span>
          <a className="btn primary" href="/api/youtube/auth">{ytConnected ? "Reconnect" : "Connect YouTube"}</a>
        </div>
        {yt === "connected" && <div className="tag" style={{ marginTop: 10 }}>✓ YouTube hesabı bağlandı. Worker bu token ile yükleyecek.</div>}
        {yt === "norefresh" && <div className="tag" style={{ marginTop: 10 }}>Refresh token gelmedi — Google Hesabı → Üçüncü taraf erişimi'nden izni kaldırıp tekrar deneyin (consent zorunlu).</div>}
        {yt === "error" && <div className="tag" style={{ marginTop: 10 }}>Bağlantı hatası — CLIENT_ID / CLIENT_SECRET / REDIRECT_URI değerlerini kontrol edin.</div>}
        <div className="tag" style={{ marginTop: 10 }}>Redirect URI (Google Cloud'a tam bu URL kayıtlı olmalı): <span className="mono">&lt;web-domaininiz&gt;/api/youtube/callback</span></div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>API keys (from environment)</div>
        <div className="grid" style={{ gap: 6 }}>
          {KEYS.map((k) => (
            <div className="row" key={k} style={{ justifyContent: "space-between" }}>
              <span className="mono" style={{ fontSize: 13 }}>{k}</span>
              <span className={`badge ${present(k) ? "good" : "bad"}`}>{present(k) ? "set" : "missing"}</span>
            </div>
          ))}
        </div>
        <div className="tag" style={{ marginTop: 12 }}>Set these on Vercel (web) and Render (worker). See HANDOFF.md.</div>
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
