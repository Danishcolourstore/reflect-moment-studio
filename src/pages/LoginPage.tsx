import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);

  // Staggered entrance
  const [showCard, setShowCard] = useState(false);
  const [showInputs, setShowInputs] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowCard(true), 100);
    const t2 = setTimeout(() => setShowInputs(true), 400);
    const t3 = setTimeout(() => setShowButton(true), 700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const isLogin = tab === "login";

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else navigate("/verify-access");
    setLoading(false);
  };

  const handleSignup = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else navigate("/verify-otp");
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    setError("");
    setMessage("");
    if (!email) { setError("Enter your email first"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) setError(error.message);
    else setMessage("Password reset email sent");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #050505 0%, #0a0808 50%, #080604 100%)",
        padding: "24px 20px",
        overflow: "auto",
      }}
    >
      {/* Subtle ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          width: 600,
          height: 400,
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(ellipse, rgba(212,175,55,0.04), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Card */}
      <div
        style={{
          position: "relative",
          background: "rgba(20,20,20,0.85)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14,
          padding: "44px 36px 36px",
          width: "100%",
          maxWidth: 400,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
          opacity: showCard ? 1 : 0,
          transform: showCard ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
            fontSize: 36,
            fontWeight: 400,
            fontStyle: "italic",
            color: "#f2e8d9",
            textAlign: "center",
            margin: 0,
            letterSpacing: "2px",
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
            color: "rgba(212,175,55,0.6)",
            textAlign: "center",
            marginTop: 6,
            letterSpacing: "0.08em",
          }}
        >
          Mirror never lies
        </p>

        {/* Tab label */}
        <p
          style={{
            fontFamily: "Jost, sans-serif",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)",
            textAlign: "center",
            marginTop: 20,
          }}
        >
          {isLogin ? "Sign In" : "Create Account"}
        </p>

        {/* Error */}
        {error && (
          <div
            style={{
              marginTop: 18,
              padding: "10px 16px",
              borderRadius: 8,
              border: "1px solid rgba(220,80,80,0.4)",
              background: "rgba(220,80,80,0.08)",
              fontFamily: "Jost, sans-serif",
              fontSize: 12,
              color: "#e06060",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {/* Success */}
        {message && (
          <div
            style={{
              marginTop: 18,
              padding: "10px 16px",
              borderRadius: 8,
              border: "1px solid rgba(80,180,80,0.4)",
              background: "rgba(80,180,80,0.08)",
              fontFamily: "Jost, sans-serif",
              fontSize: 12,
              color: "#60c060",
              textAlign: "center",
            }}
          >
            {message}
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); isLogin ? handleLogin() : handleSignup(); }}
          style={{ marginTop: 24 }}
        >
          {/* Inputs container with slide-up */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              opacity: showInputs ? 1 : 0,
              transform: showInputs ? "translateY(0)" : "translateY(16px)",
              transition: "opacity 0.6s ease, transform 0.6s ease",
            }}
          >
            {/* Email */}
            <div>
              <label
                style={{
                  fontFamily: "Jost, sans-serif",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.4)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Email
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  height: 48,
                  paddingLeft: 14,
                  paddingRight: 14,
                  background: "#0f0f0f",
                  border: "1px solid #2a2a2a",
                  borderRadius: 10,
                  transition: "border-color 0.2s ease",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#d4af37")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
              >
                <Mail style={{ width: 15, height: 15, color: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontFamily: "Jost, sans-serif",
                    fontWeight: 300,
                    fontSize: 14,
                    color: "#ffffff",
                    letterSpacing: "0.02em",
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                style={{
                  fontFamily: "Jost, sans-serif",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.4)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Password
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  height: 48,
                  paddingLeft: 14,
                  paddingRight: 14,
                  background: "#0f0f0f",
                  border: "1px solid #2a2a2a",
                  borderRadius: 10,
                  transition: "border-color 0.2s ease",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#d4af37")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
              >
                <Lock style={{ width: 15, height: 15, color: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••"
                  required
                  minLength={6}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontFamily: "Jost, sans-serif",
                    fontWeight: 300,
                    fontSize: 14,
                    color: "#ffffff",
                    letterSpacing: "0.1em",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}
                >
                  {showPassword ? (
                    <EyeOff style={{ width: 15, height: 15, color: "rgba(255,255,255,0.25)" }} />
                  ) : (
                    <Eye style={{ width: 15, height: 15, color: "rgba(255,255,255,0.25)" }} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Sign In Button */}
          <div
            style={{
              opacity: showButton ? 1 : 0,
              transform: showButton ? "translateY(0)" : "translateY(12px)",
              transition: "opacity 0.6s ease, transform 0.6s ease",
            }}
          >
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                marginTop: 24,
                height: 50,
                background: "linear-gradient(135deg, #d4af37 0%, #c5a028 50%, #b8941e 100%)",
                border: "none",
                borderRadius: 10,
                fontFamily: "Jost, sans-serif",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "#0a0a0a",
                cursor: "pointer",
                transition: "all 0.25s ease",
                boxShadow: "0 4px 20px rgba(212,175,55,0.15)",
                opacity: loading ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.boxShadow = "0 6px 30px rgba(212,175,55,0.35)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(212,175,55,0.15)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </button>

            {/* Links row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 16,
              }}
            >
              <button
                type="button"
                onClick={() => { setTab(isLogin ? "signup" : "login"); setPassword(""); setError(""); setMessage(""); }}
                style={{
                  background: "none",
                  border: "none",
                  fontFamily: "Jost, sans-serif",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.35)",
                  cursor: "pointer",
                  letterSpacing: "0.03em",
                }}
              >
                {isLogin ? (
                  <>No account? <span style={{ color: "#d4af37", textDecoration: "underline", textUnderlineOffset: 3 }}>Sign up</span></>
                ) : (
                  <>Have an account? <span style={{ color: "#d4af37", textDecoration: "underline", textUnderlineOffset: 3 }}>Sign in</span></>
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
                    color: "rgba(255,255,255,0.3)",
                    cursor: "pointer",
                  }}
                >
                  Forgot?
                </button>
              )}
            </div>
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
          color: "rgba(255,255,255,0.15)",
        }}
      >
        Colour Store Preset Universe
      </p>
    </div>
  );
};

export default LoginPage;
