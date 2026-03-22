import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
    else navigate("/verify-access");
    setLoading(false);
  };

  const handleSignup = async () => {
    setLoading(true); setError(""); setMessage("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else navigate("/verify-otp");
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
            borderRadius: 16,
            border: `1px solid ${colors.border}`,
            padding: "28px 20px",
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
            style={{ display: "flex", flexDirection: "column", gap: 18 }}
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
                  textAlign: "right", padding: 0, marginTop: -6,
                }}
              >
                Forgot password?
              </button>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                width: "100%", height: 48, borderRadius: 10,
                border: "none", background: colors.gold, color: colors.bg,
                fontFamily: fonts.body, fontSize: 15, fontWeight: 600,
                letterSpacing: "0.03em",
                cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.6 : 1,
                transition: "opacity 0.15s, box-shadow 0.2s",
                marginTop: 4,
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = "0 0 24px rgba(200,169,126,0.3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
            >
              {loading ? "..." : isSignup ? "Create Account" : "Enter"}
            </button>
          </form>

          <p
            style={{
              textAlign: "center", marginTop: 18,
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
