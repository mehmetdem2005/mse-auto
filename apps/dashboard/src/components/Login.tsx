import { type ReactNode, useState } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { Banner } from "./ui";

export function Login({ onDevLogin }: { onDevLogin: (userId: string) => void }): ReactNode {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [devId, setDevId] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn(): Promise<void> {
    if (!supabase) return;
    setBusy(true);
    setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErr(error.message);
    setBusy(false);
  }

  return (
    <div className="login-wrap">
      <div className="login">
        <div className="brand">
          <span className="dot" />
          <div>
            <div className="name">WATCHER</div>
            <div className="sub">ops console</div>
          </div>
        </div>
        <h1>Oturum aç</h1>
        <p className="lead">
          {supabaseConfigured
            ? "supabase hesabınla giriş yap"
            : "geliştirme modu · kullanıcı kimliği"}
        </p>
        {err ? <Banner kind="err">{err}</Banner> : null}

        {supabaseConfigured ? (
          <>
            <div className="field">
              <label htmlFor="email">e-posta</label>
              <input
                id="email"
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@watcher.app"
              />
            </div>
            <div className="field">
              <label htmlFor="password">parola</label>
              <input
                id="password"
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              className="btn"
              type="button"
              disabled={busy || !email || !password}
              onClick={signIn}
            >
              {busy ? "…" : "giriş"}
            </button>
          </>
        ) : (
          <>
            <div className="field">
              <label htmlFor="devid">dev kullanıcı kimliği</label>
              <input
                id="devid"
                className="input"
                value={devId}
                onChange={(e) => setDevId(e.target.value)}
                placeholder="admin_demo"
              />
            </div>
            <button
              className="btn"
              type="button"
              disabled={!devId}
              onClick={() => onDevLogin(devId.trim())}
            >
              giriş
            </button>
            <p className="lead" style={{ marginTop: 16 }}>
              backend DevAuthVerifier · token = kullanıcı kimliği
            </p>
          </>
        )}
      </div>
    </div>
  );
}
