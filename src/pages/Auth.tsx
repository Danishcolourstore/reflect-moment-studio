import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { colors, fonts } from "@/styles/design-tokens";

interface AuthProps {
  initialView?: "landing" | "login" | "signup" | "forgot";
}

const Auth = function Auth({ initialView }: AuthProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSignup, setIsSignup] = useState(initialView === "signup");
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 80);
    const t2 = setTimeout(() => setPhase(2), 1500);
    const t3 = setTimeout(() => setPhase(3), 2800);
    const t4 = setTimeout(() => setPhase(4), 3600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("accent");
    if (saved === "red") document.documentElement.classList.add("accent-red");
    else document.documentElement.classList.remove("accent-red");
  }, []);

  const handleLogin = async () => {
    setLoading(true); setError(""); setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else navigate("/home");
    setLoading(false);
  };

  const handleSignup = async () => {
    setLoading(true); setError(""); setMessage("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else setMessage("Check your email to confirm your account, then sign in.");
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true); setError("");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(result.error instanceof Error ? result.error.message : "Google sign-in failed");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate("/home");
    setLoading(false);
  };

  const handleForgot = async () => {
    if (!email) { setError("Enter your email address first"); return; }
    setError(""); setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setError(error.message);
    else setMessage("Password reset link sent to your email");
  };

  const submit = isSignup ? handleSignup : handleLogin;

  const inputStyle: React.CSSProperties = {
    background: "transparent",
    border: "none",
    borderBottom: `1px solid ${colors.border}`,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 16,
    padding: "12px 0",
    outline: "none",
    width: "100%",
    height: 44,
    WebkitFontSmoothing: "antialiased",
    transition: "border-color 0.2s",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        height: "100dvh",
        overflow: "hidden",
        backgroundColor: colors.black,
      }}
    >
      <img
        src="/images/login-hero.jpg"
        alt=""
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover",
          opacity: phase >= 1 ? 1 : 0,
          transition: "opacity 2s ease-out",
        }}
      />
      <div
        style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0.7))",
        }}
      />

      <div
        style={{
          position: "relative", zIndex: 10, height: "100%",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
          padding: "0 24px 48px",
        }}
      >
        <div
          style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", minHeight: 0,
          }}
        >
          <h1
            style={{
              fontFamily: fonts.display,
              fontWeight: 300,
              fontSize: "clamp(28px, 7vw, 36px)",
              color: colors.gold,
              letterSpacing: "0.08em",
              opacity: phase >= 2 ? 1 : 0,
              transform: phase >= 2 ? "translateY(0)" : "translateY(8px)",
              transition: "opacity 1.2s ease-out, transform 1.2s ease-out",
              margin: 0,
            }}
          >
            Mirror AI
          </h1>
          <p
            style={{
              fontFamily: fonts.display,
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: "clamp(13px, 3.5vw, 16px)",
              color: "rgba(255,255,255,0.7)",
              letterSpacing: "0.05em",
              marginTop: 6,
              opacity: phase >= 3 ? 1 : 0,
              transition: "opacity 1s ease-out",
            }}
          >
            Reflections of Your Moments
          </p>
        </div>

        <div
          style={{
            width: "100%", maxWidth: 380,
            background: "rgba(10,10,11,0.7)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: `1px solid ${colors.border}`,
            padding: "32px 24px",
            opacity: phase >= 4 ? 1 : 0,
            transform: phase >= 4 ? "translateY(0)" : "translateY(6px)",
            transition: "opacity 1s ease-out, transform 1s ease-out",
          }}
        >
          <p
            style={{
              fontFamily: fonts.display,
              fontWeight: 400, fontSize: 17,
              color: colors.gold,
              letterSpacing: "0.06em",
              textAlign: "center", marginBottom: 24,
            }}
          >
            Mirror AI
          </p>

          {error && (
            <div style={{ fontSize: 12, color: colors.danger, textAlign: "center", marginBottom: 14, lineHeight: 1.5 }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{ fontSize: 12, color: colors.textDim, textAlign: "center", marginBottom: 14, lineHeight: 1.5 }}>
              {message}
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); submit(); }}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <input
              type="email" value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="Email" required autoComplete="email"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = String(colors.borderActive))}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = colors.border)}
            />
            <input
              type="password" value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Password" required minLength={6}
              autoComplete={isSignup ? "new-password" : "current-password"}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = String(colors.borderActive))}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = colors.border)}
            />

            {!isSignup && (
              <button
                type="button" onClick={handleForgot}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: colors.textMuted, fontSize: 12, fontFamily: fonts.body,
                  textAlign: "right", padding: 0,
                }}
              >
                Forgot password?
              </button>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                width: "100%", height: 48,
                border: "none", background: colors.gold, color: colors.bg,
                fontFamily: fonts.body, fontSize: 14, fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase" as const,
                cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.6 : 1,
                transition: "opacity 0.2s",
                marginTop: 8,
              }}
            >
              {loading ? "..." : isSignup ? "Create Account" : "Enter"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 4px" }}>
            <div style={{ flex: 1, height: 1, background: colors.border }} />
            <span style={{ fontSize: 11, color: colors.textMuted, fontFamily: fonts.body, letterSpacing: "0.08em" }}>OR</span>
            <div style={{ flex: 1, height: 1, background: colors.border }} />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: "100%", height: 48,
              border: `1px solid ${colors.border}`,
              background: "transparent",
              color: colors.text,
              fontFamily: fonts.body, fontSize: 14, fontWeight: 400,
              letterSpacing: "0.04em",
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.6 : 1,
              transition: "opacity 0.2s, border-color 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              marginTop: 8,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.04 24.04 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Continue with Google
          </button>

          <p
            style={{
              textAlign: "center", marginTop: 16,
              fontSize: 14, color: colors.textMuted, fontFamily: fonts.body,
            }}
          >
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => { setIsSignup(!isSignup); setPassword(""); setError(""); setMessage(""); }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: colors.textDim, fontSize: 14, fontFamily: fonts.body,
              }}
            >
              {isSignup ? "Sign in" : "Create Account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
