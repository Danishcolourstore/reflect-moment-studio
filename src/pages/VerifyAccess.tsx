import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { OtpInput } from "@/components/OtpInput";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldAlert, LogOut, Phone, MessageCircle } from "lucide-react";

const SESSION_KEY = "mirrorai_access_verified";
const MAX_ATTEMPTS = 3;
const LOCKOUT_SECONDS = 60;

export default function VerifyAccess() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [lockoutEnd, setLockoutEnd] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (loading || !user) return;
    supabase
      .from('user_roles').select('role').eq('user_id', user.id).eq('role', 'super_admin').maybeSingle()
      .then(({ data }) => {
        if (data) {
          sessionStorage.setItem(SESSION_KEY, 'true');
          navigate('/super-admin', { replace: true });
        }
      });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "true") {
      const redirect = sessionStorage.getItem("redirectAfterLogin");
      sessionStorage.removeItem("redirectAfterLogin");
      navigate(redirect || "/dashboard", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!lockoutEnd) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockoutEnd - Date.now()) / 1000);
      if (remaining <= 0) { setLockoutEnd(null); setCountdown(0); setAttempts(0); setError(""); }
      else setCountdown(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutEnd]);

  const handleVerify = useCallback(async (inputPin: string) => {
    if (verifying || lockoutEnd) return;
    setVerifying(true);
    setError("");

    const subject = user?.id || "authenticated-user";
    const { data, error: verifyError } = await (supabase.rpc as any)("verify_access_code", {
      code_input: inputPin,
      subject_input: subject,
    });

    if (!verifyError && data?.valid) {
      sessionStorage.setItem(SESSION_KEY, "true");
      const redirect = sessionStorage.getItem("redirectAfterLogin");
      sessionStorage.removeItem("redirectAfterLogin");
      navigate(redirect || "/dashboard", { replace: true });
    } else if (data?.locked) {
      const retryAfter = Number(data.retry_after ?? LOCKOUT_SECONDS);
      setLockoutEnd(Date.now() + retryAfter * 1000);
      setCountdown(retryAfter);
      setError("Too many incorrect attempts. Access locked.");
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= MAX_ATTEMPTS) {
        setLockoutEnd(Date.now() + LOCKOUT_SECONDS * 1000);
        setCountdown(LOCKOUT_SECONDS);
        setError("Too many incorrect attempts. Access locked.");
      } else {
        setError(`Incorrect OTP. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts !== 1 ? "s" : ""} remaining.`);
      }
    }
    setVerifying(false);
  }, [attempts, verifying, lockoutEnd, navigate, user?.id]);

  const handleSignOut = async () => {
    sessionStorage.removeItem(SESSION_KEY);
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground text-sm">Loading...</p></div>;
  }

  const isLocked = lockoutEnd !== null && countdown > 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm flex flex-col">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-semibold text-foreground tracking-tight">Mirror AI</h1>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
              {isLocked ? <ShieldAlert className="w-5 h-5 text-destructive" /> : <ShieldCheck className="w-5 h-5 text-muted-foreground" />}
            </div>
            <CardTitle className="text-lg">{isLocked ? "Access Temporarily Locked" : "Enter Your OTP"}</CardTitle>
            <CardDescription className="text-center leading-relaxed">
              {isLocked ? `Try again in ${countdown} seconds` : "Contact admin to receive your access code."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isLocked && (
              <>
                <div className="flex gap-3">
                  <a href="tel:+919605761589" className="flex-1">
                    <Button variant="outline" className="w-full text-sm gap-1.5"><Phone size={14} strokeWidth={1.5} /> Call</Button>
                  </a>
                  <a href="https://wa.me/919605761589" target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline" className="w-full text-sm gap-1.5"><MessageCircle size={14} strokeWidth={1.5} /> WhatsApp</Button>
                  </a>
                </div>
                <OtpInput length={6} onComplete={handleVerify} disabled={verifying} />
              </>
            )}
            {error && <p className="text-center text-sm text-destructive">{error}</p>}
            {verifying && <p className="text-center text-xs text-muted-foreground">Verifying...</p>}
            <div className="pt-2">
              <button onClick={handleSignOut}
                className="flex items-center justify-center gap-1.5 w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
