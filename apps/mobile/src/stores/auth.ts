import { supabase } from "@/lib/supabase";
import { create } from "zustand";

export interface Session {
  token: string;
  email: string | null;
  userId: string | null;
}

interface AuthState {
  session: Session | null;
  ready: boolean;
  setSession: (s: Session | null) => void;
}

export const useAuth = create<AuthState>((set) => ({
  session: null,
  ready: false,
  setSession: (s) => set({ session: s }),
}));

/** Supabase oturumunu store'a bağlar (root layout'ta çağrılır). Supabase yoksa dev modu. */
export function initAuth(): () => void {
  if (!supabase) {
    useAuth.setState({ ready: true });
    return () => undefined;
  }
  void supabase.auth.getSession().then(({ data }) => {
    const s = data.session;
    useAuth.setState({
      session: s ? { token: s.access_token, email: s.user.email ?? null, userId: s.user.id } : null,
      ready: true,
    });
  });
  const { data } = supabase.auth.onAuthStateChange((_event, s) => {
    useAuth.setState({
      session: s ? { token: s.access_token, email: s.user.email ?? null, userId: s.user.id } : null,
    });
  });
  return () => data.subscription.unsubscribe();
}
