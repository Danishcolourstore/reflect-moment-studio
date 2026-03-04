import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import CheetahIntro from "@/components/CheetahIntro";

interface AuthProps {
  initialView?: "landing" | "login" | "signup" | "forgot";
}

const Auth = ({ initialView }: AuthProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"login" | "signup">(initialView === "signup" ? "signup" : "login");
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showIntro, setShowIntro] = useState(() => {
    // Only show intro once per session
    if (sessionStorage.getItem("mirrorai_intro_seen")) return false;
    return initialView === "login";
  });

  const handleIntroComplete = useCallback(() => {
    sessionStorage.setItem("mirrorai_intro_seen", "true");
    setShowIntro(false);
    setTimeout(() => setMounted(true), 50);
  }, []);

  useEffect(() => {
    if (!showIntro) {
      setTimeout(() => setMounted(true), 50);
    }
  }, [showIntro]);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); }
    else { navigate("/verify-access"); }
    setLoading(false);
  };

  const handleSignup = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); }
    else { navigate("/verify-otp"); }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    setError("");
    setMessage("");
    if (!email) { setError("Enter your email first"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) { setError(error.message); }
    else { setMessage("Password reset email sent"); }
  };

  const isLogin = tab === "login";

  return (
    <>
      {showIntro && <CheetahIntro onComplete={handleIntroComplete} />}
    <div
      className="flex flex-col items-center justify-center min-h-screen"
      style={{ background: "var(--bg-primary)", padding: "24px 20px" }}
    >
      {/* Card */}
      <div
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border)",
          borderRadius: 24,
          padding: "40px 32px",
          width: "100%",
          maxWidth: 400,
          boxShadow: "var(--card-shadow)",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
        }}
      >
        {/* Logo */}
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 32,
            fontWeight: 400,
            fontStyle: "italic",
            color: "var(--text-primary)",
            textAlign: "center",
            margin: 0,
            letterSpacing: "1px",
            lineHeight: 1.2,
          }}
        >
          MirrorAI
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 14,
            fontStyle: "italic",
            fontWeight: 300,
            color: "var(--text-muted)",
            textAlign: "center",
            marginTop: 4,
            letterSpacing: "0.05em",
          }}
        >
          Mirror never lies
        </p>

        {/* Admin Access label */}
        <p
          style={{
            fontFamily: "Jost, sans-serif",
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            textAlign: "center",
            marginTop: 16,
          }}
        >
          {isLogin ? "Sign In" : "Create Account"}
        </p>

        {/* Error */}
        {error && (
          <div
            style={{
              marginTop: 20,
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid var(--danger)",
              background: "var(--bg-tertiary)",
              fontFamily: "Jost, sans-serif",
              fontSize: 13,
              color: "var(--danger)",
              textAlign: "center",
              animation: "slideUp 0.3s ease",
            }}
          >
            {error}
          </div>
        )}

        {/* Success */}
        {message && (
          <div
            style={{
              marginTop: 20,
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid var(--success)",
              background: "var(--bg-tertiary)",
              fontFamily: "Jost, sans-serif",
              fontSize: 13,
              color: "var(--success)",
              textAlign: "center",
              animation: "slideUp 0.3s ease",
            }}
          >
            {message}
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); isLogin ? handleLogin() : handleSignup(); }}
          className="flex flex-col"
          style={{ marginTop: 24, gap: 16 }}
        >
          {/* Email */}
          <div>
            <label
              style={{
                fontFamily: "Jost, sans-serif",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                display: "block",
                marginBottom: 6,
              }}
            >
              Email
            </label>
            <div
              className="flex items-center gap-3 transition-all duration-200"
              style={{
                height: 48,
                paddingLeft: 14,
                paddingRight: 14,
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                borderRadius: 10,
              }}
            >
              <Mail style={{ width: 16, height: 16, color: "var(--text-muted)", flexShrink: 0 }} />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="your@email.com"
                required
                autoComplete="email"
                className="bg-transparent w-full outline-none"
                style={{
                  fontFamily: "Jost, sans-serif",
                  fontWeight: 300,
                  fontSize: 14,
                  color: "var(--text-primary)",
                  letterSpacing: "0.02em",
                  border: "none",
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              style={{
                fontFamily: "Jost, sans-serif",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                display: "block",
                marginBottom: 6,
              }}
            >
              Password
            </label>
            <div
              className="flex items-center gap-3 transition-all duration-200"
              style={{
                height: 48,
                paddingLeft: 14,
                paddingRight: 14,
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                borderRadius: 10,
              }}
            >
              <Lock style={{ width: 16, height: 16, color: "var(--text-muted)", flexShrink: 0 }} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="••••••"
                required
                minLength={6}
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="bg-transparent w-full outline-none"
                style={{
                  fontFamily: "Jost, sans-serif",
                  fontWeight: 300,
                  fontSize: 14,
                  color: "var(--text-primary)",
                  letterSpacing: "0.1em",
                  border: "none",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}
              >
                {showPassword ? (
                  <EyeOff style={{ width: 16, height: 16, color: "var(--text-muted)" }} />
                ) : (
                  <Eye style={{ width: 16, height: 16, color: "var(--text-muted)" }} />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full transition-all duration-200 disabled:opacity-50"
            style={{
              marginTop: 16,
              height: 48,
              background: "#111111",
              border: "none",
              borderRadius: 8,
              fontFamily: "Jost, sans-serif",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: "#ffffff",
              cursor: "pointer",
              boxShadow: "none",
              transition: "background 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#000000";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#111111";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </button>

          {/* Links row */}
          <div className="flex items-center justify-between" style={{ marginTop: 12 }}>
            <button
              type="button"
              onClick={() => { setTab(isLogin ? "signup" : "login"); setPassword(""); setError(""); setMessage(""); }}
              style={{
                background: "none",
                border: "none",
                fontFamily: "Jost, sans-serif",
                fontSize: 11,
                color: "var(--text-muted)",
                cursor: "pointer",
                letterSpacing: "0.03em",
              }}
            >
              {isLogin ? (
                <>No account? <span style={{ color: "var(--accent)", textDecoration: "underline", textUnderlineOffset: 3 }}>Sign up</span></>
              ) : (
                <>Have an account? <span style={{ color: "var(--accent)", textDecoration: "underline", textUnderlineOffset: 3 }}>Sign in</span></>
              )}
            </button>
            {isLogin && (
              <button
                type="button"
                onClick={handleForgotPassword}
                style={{
                  background: "none",
                  border: "none",
                  fontFamily: "Jost, sans-serif",
                  fontSize: 11,
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                Forgot?
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Bottom branding */}
      <p
        style={{
          marginTop: 48,
          fontFamily: "Jost, sans-serif",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.45em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          opacity: 0.6,
        }}
      >
        Colour Store Preset Universe
      </p>
    </div>
    </>
  );
};

export default Auth;
