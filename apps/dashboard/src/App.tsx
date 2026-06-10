import type { Me } from "@watcher/contracts";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { Admin } from "./components/Admin";
import { Feed } from "./components/Feed";
import { Login } from "./components/Login";
import { Overview } from "./components/Overview";
import { Shell } from "./components/Shell";
import { api } from "./lib/api";
import { installRipple } from "./lib/ripple";
import { supabase } from "./lib/supabase";

export interface Session {
  token: string;
  email: string | null;
}
export type View = "feed" | "overview" | "admin";

export function App(): ReactNode {
  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [view, setView] = useState<View>("feed");
  const [booting, setBooting] = useState(true);

  // Supabase oturumu
  useEffect(() => {
    if (!supabase) {
      setBooting(false);
      return;
    }
    void supabase.auth.getSession().then(({ data }) => {
      const s = data.session;
      if (s) setSession({ token: s.access_token, email: s.user.email ?? null });
      setBooting(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ? { token: s.access_token, email: s.user.email ?? null } : null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // mevcut kullanıcı
  useEffect(() => {
    if (!session) {
      setMe(null);
      return;
    }
    api
      .me(session.token)
      .then(setMe)
      .catch(() => setMe(null));
  }, [session]);

  // admin değilse admin görünümünü engelle (sunucu da zorlar)
  useEffect(() => {
    if (view === "admin" && me && !me.isAdmin) setView("overview");
  }, [view, me]);

  // Material ripple — etkileşimli yüzeylere (tek delegasyon).
  useEffect(() => installRipple(), []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setMe(null);
    setView("feed");
  }, []);

  if (booting) return <div className="boot">yükleniyor…</div>;
  if (!session) return <Login onDevLogin={(uid) => setSession({ token: uid, email: null })} />;

  return (
    <Shell me={me} view={view} onNav={setView} onSignOut={() => void signOut()}>
      {view === "admin" && me?.isAdmin ? (
        <Admin token={session.token} />
      ) : view === "overview" ? (
        <Overview token={session.token} />
      ) : (
        <Feed token={session.token} />
      )}
    </Shell>
  );
}
