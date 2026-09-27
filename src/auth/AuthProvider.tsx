import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

/** undefined while the stored session is being read; null when signed out. */
type AuthState = Session | null | undefined;

const AuthContext = createContext<AuthState>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthState>(undefined);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={session}>{children}</AuthContext.Provider>;
}

export function useSession(): AuthState {
  return useContext(AuthContext);
}
