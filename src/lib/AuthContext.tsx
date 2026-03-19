import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  studioName: string;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  studioName: "My Studio",
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [studioName, setStudioName] = useState("My Studio");

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: sessionData }) => {
      setSession(sessionData.session);
      setUser(sessionData.session?.user ?? null);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  // Fetch actual studio name from profiles table
  useEffect(() => {
    if (!user) {
      setStudioName("My Studio");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { data } = await (supabase.from("profiles").select("studio_name") as any)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!cancelled && data?.studio_name) {
          setStudioName(data.studio_name);
        }
      } catch {
        // Keep default on error
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setStudioName("My Studio");
    sessionStorage.removeItem("redirectAfterLogin");
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, studioName, signOut }}>{children}</AuthContext.Provider>
  );
}
