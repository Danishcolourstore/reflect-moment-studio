import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// ═══════════════════════════════════════════════════════════
// TEMPORARY: Set to true for full app testing without auth
// Set to false to restore normal authentication
export const TEST_MODE_BYPASS_AUTH = true;
// ═══════════════════════════════════════════════════════════

if (TEST_MODE_BYPASS_AUTH && typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.warn("⚠️ AUTH MODE: BYPASS ACTIVE — all auth guards disabled");
}

// Mock user for testing
const MOCK_USER: User = {
  id: "test-user-123",
  email: "test@mirror.studio",
  user_metadata: { studio_name: "Test Studio" },
  app_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
  role: "authenticated",
  updated_at: new Date().toISOString(),
  identities: [],
  factors: [],
} as User;

const MOCK_SESSION: Session = {
  access_token: "mock-token",
  refresh_token: "mock-refresh",
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: "bearer",
  user: MOCK_USER,
} as Session;

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
  const [user, setUser] = useState<User | null>(TEST_MODE_BYPASS_AUTH ? MOCK_USER : null);
  const [session, setSession] = useState<Session | null>(TEST_MODE_BYPASS_AUTH ? MOCK_SESSION : null);
  const [loading, setLoading] = useState(!TEST_MODE_BYPASS_AUTH);
  const [studioName, setStudioName] = useState(TEST_MODE_BYPASS_AUTH ? "Test Studio" : "My Studio");

  useEffect(() => {
    if (TEST_MODE_BYPASS_AUTH) return; // Skip real auth in test mode

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
    if (TEST_MODE_BYPASS_AUTH) return; // Skip in test mode
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
    if (TEST_MODE_BYPASS_AUTH) {
      // In test mode, just reload to reset
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
