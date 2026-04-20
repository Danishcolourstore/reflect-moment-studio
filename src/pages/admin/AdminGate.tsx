import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, TEST_MODE_BYPASS_AUTH } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export default function AdminGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // ── Bypass in test mode ──
  if (TEST_MODE_BYPASS_AUTH) return <>{children}</>;

  useEffect(() => {
    let cancelled = false;

    if (loading)
      return () => {
        cancelled = true;
      };

    if (!user) {
      setIsAdmin(false);
      setChecking(false);
      return () => {
        cancelled = true;
      };
    }

    // Server-side role check — no hardcoded emails
    (async () => {
      try {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .in("role", ["admin", "super_admin"]);

        if (cancelled) return;

        const roles = (data || []).map((r: any) => r.role);
        setIsAdmin(roles.includes("admin") || roles.includes("super_admin"));
      } catch {
        if (!cancelled) setIsAdmin(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  if (loading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
