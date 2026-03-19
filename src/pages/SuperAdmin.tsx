import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export default function SuperAdminGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (loading)
      return () => {
        cancelled = true;
      };

    if (!user) {
      setIsSuperAdmin(false);
      setChecking(false);
      return () => {
        cancelled = true;
      };
    }

    // Server-side role check only — no client-side bypasses
    const rolePromise = supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .maybeSingle();

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("role_check_timeout")), 5000);
    });

    Promise.race([rolePromise, timeoutPromise])
      .then((result: any) => {
        if (cancelled) return;
        setIsSuperAdmin(Boolean(result?.data));
      })
      .catch(() => {
        if (cancelled) return;
        setIsSuperAdmin(false);
      })
      .finally(() => {
        if (cancelled) return;
        setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  if (loading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Verifying access…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
