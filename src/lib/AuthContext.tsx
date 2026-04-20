import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// ═══════════════════════════════════════════════════════════
// SAFE DEV AUTH BYPASS
// Activates ONLY when (a) NODE_ENV !== "production" AND
// (b) the developer explicitly opts in via:
//    - URL query  → ?dev=true   (also persists for the session)
//    - localStorage → DEV_AUTH = "true"
// In production builds this is ALWAYS false — zero side effects.
// ═══════════════════════════════════════════════════════════

const IS_DEV_TRIGGER =
  typeof window !== "undefined" &&
  (window.location.search.includes("dev=true") ||
    (typeof localStorage !== "undefined" && localStorage.getItem("DEV_AUTH") === "true"));

// Vite exposes mode via import.meta.env; fall back to process.env for safety.
const IS_NON_PROD =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.MODE !== "production") ||
  (typeof process !== "undefined" && (process as any).env?.NODE_ENV !== "production");

export const SAFE_BYPASS = IS_DEV_TRIGGER && IS_NON_PROD;

// Persist the flag once the URL trigger is used so refreshes keep working.
if (SAFE_BYPASS && typeof window !== "undefined") {
  if (window.location.search.includes("dev=true")) {
    try {
      localStorage.setItem("DEV_AUTH", "true");
    } catch {
      /* ignore */
    }
  }
  // eslint-disable-next-line no-console
  console.log("⚠️ AUTH MODE: DEV BYPASS ACTIVE");
}

// Back-compat alias — existing imports (AdminGate, SuperAdminGate, App.tsx) keep working.
export const TEST_MODE_BYPASS_AUTH = SAFE_BYPASS;

const MOCK_USER = {
  id: "dev-user",
  email: "dev@mirror.ai",
  user_metadata: { role: "admin", studio_name: "Dev Studio" },
  app_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
  role: "authenticated",
  updated_at: new Date().toISOString(),
  identities: [],
  factors: [],
} as unknown as User;

const MOCK_SESSION = {
  user: MOCK_USER,
  access_token: "dev-token",
  refresh_token: "dev-refresh",
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: "bearer",
} as unknown as Session;

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
  const [user, setUser] = useState<User | null>(SAFE_BYPASS ? MOCK_USER : null);
  const [session, setSession] = useState<Session | null>(SAFE_BYPASS ? MOCK_SESSION : null);
  const [loading, setLoading] = useState(!SAFE_BYPASS);
  const [studioName, setStudioName] = useState(SAFE_BYPASS ? "Dev Studio" : "My Studio");

  useEffect(() => {
    if (SAFE_BYPASS) return; // Skip real auth in dev bypass mode

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
    if (SAFE_BYPASS) return; // Skip in dev bypass mode
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
    if (SAFE_BYPASS) {
      try {
        localStorage.removeItem("DEV_AUTH");
      } catch {
        /* ignore */
      }
      window.location.reload();
      return;
    }
    await supabase.auth.signOut();
    setStudioName("My Studio");
    sessionStorage.removeItem("redirectAfterLogin");
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, studioName, signOut }}>{children}</AuthContext.Provider>
  );
}
