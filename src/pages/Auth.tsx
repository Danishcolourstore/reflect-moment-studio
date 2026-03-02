import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    // Ensure test account exists (silent, no-op if already created)
    supabase.auth.signUp({ email: "test@mirroraigallery.com", password: "Test@1234" }).catch(() => {});
    const timer = setTimeout(() => setRevealed(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); }
    else { navigate("/verify-access"); }
    setLoading(false);
  };

  const handleSignup = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); }
    else { navigate("/verify-otp"); }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    setError("");
    setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) { setError(error.message); }
    else { setMessage("Password reset email sent"); }
  };

  const isLogin = tab === "login";

  return (
    <div className="fixed inset-0 overflow-hidden w-screen bg-[hsl(20,22%,5%)]">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/images/login-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(50px) saturate(0.5) brightness(0.35)",
          transform: "scale(1.25) translateZ(0)",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src="/images/login-bg.png"
          alt=""
          className="max-h-full max-w-full object-contain"
          style={{
            opacity: 0.88,
            filter: revealed ? "blur(18px)" : "blur(0px)",
            transition: "filter 2.5s ease-in-out 2s",
            transform: "translateZ(0)",
            willChange: "filter",
          }}
        />
      </div>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.40)" }} />
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(10,9,8,0.30) 100%)",
        }}
      />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        <div
          className="w-full max-w-[380px] flex flex-col gap-6 p-9 sm:p-10"
          style={{
            background: "rgba(44, 33, 24, 0.45)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 32px 80px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.03)",
            opacity: revealed ? 1 : 0,
            transform: revealed ? "translateY(0) scale(1)" : "translateY(40px) scale(0.98)",
            transition: "opacity 2.2s ease-in-out 2s, transform 2.2s ease-in-out 2s",
            willChange: "opacity, transform",
          }}
        >
          <div className="text-center mb-2">
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                fontSize: "clamp(2rem, 5vw, 2.8rem)",
                fontWeight: 300,
                color: "#FFFFFF",
                letterSpacing: "0.12em",
                lineHeight: 1,
              }}
            >
              MirrorAI
            </h1>
            <p
              className="mt-2"
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                fontSize: "13px",
                fontStyle: "italic",
                fontWeight: 300,
                color: "rgba(255,255,255,0.55)",
                letterSpacing: "0.1em",
              }}
            >
              Mirror never lies
            </p>
          </div>
          {error && (
            <div
              className="px-4 py-2.5 rounded-lg"
              style={{
                border: "1px solid rgba(229,115,115,0.15)",
                background: "rgba(229,115,115,0.06)",
                color: "#E57373",
                fontSize: "11px",
                lineHeight: "1.5",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {error}
            </div>
          )}
          {message && (
            <div
              className="px-4 py-2.5 rounded-lg"
              style={{
                border: "1px solid rgba(129,199,132,0.15)",
                background: "rgba(129,199,132,0.06)",
                color: "#81C784",
                fontSize: "11px",
                lineHeight: "1.5",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {message}
            </div>
          )}
          <form onSubmit={(e) => { e.preventDefault(); isLogin ? handleLogin() : handleSignup(); }} className="flex flex-col gap-4">
            <div
              className="flex items-center gap-3 px-4 h-12 rounded-xl transition-colors duration-200"
              style={{
                background: "rgba(26,24,22,0.45)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <Mail className="h-3.5 w-3.5 shrink-0" style={{ color: "rgba(139,115,85,0.6)" }} />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="Email Address"
                required
                autoComplete="email"
                className="bg-transparent w-full outline-none placeholder:text-[rgba(139,115,85,0.3)]"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 300,
                  fontSize: "13px",
                  color: "#E8E2DA",
                  letterSpacing: "0.03em",
                }}
              />
            </div>
            <div
              className="flex items-center gap-3 px-4 h-12 rounded-xl transition-colors duration-200"
              style={{
                background: "rgba(26,24,22,0.45)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <Lock className="h-3.5 w-3.5 shrink-0" style={{ color: "rgba(139,115,85,0.6)" }} />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Password"
                required
                minLength={6}
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="bg-transparent w-full outline-none placeholder:text-[rgba(139,115,85,0.3)]"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 300,
                  fontSize: "13px",
                  color: "#E8E2DA",
                  letterSpacing: "0.03em",
                }}
              />
            </div>
            <div className="flex items-center justify-between pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setTab(isLogin ? "signup" : "login");
                  setPassword("");
                  setError("");
                  setMessage("");
                }}
                className="transition-colors"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "10px",
                  color: "rgba(232,226,218,0.4)",
                  letterSpacing: "0.04em",
                }}
              >
                {isLogin ? (
                  <>
                    No account?{" "}
                    <span
                      style={{ color: "rgba(139,115,85,0.8)", textDecoration: "underline", textUnderlineOffset: "3px" }}
                    >
                      Sign up
                    </span>
                  </>
                ) : (
                  <>
                    Have an account?{" "}
                    <span
                      style={{ color: "rgba(139,115,85,0.8)", textDecoration: "underline", textUnderlineOffset: "3px" }}
                    >
                      Sign in
                    </span>
                  </>
                )}
              </button>
              {isLogin && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="transition-colors hover:opacity-80"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "10px",
                    color: "rgba(139,115,85,0.6)",
                    letterSpacing: "0.04em",
                  }}
                >
                  Forgot?
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl transition-all duration-200 disabled:opacity-50"
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
                fontSize: "10px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                background: "rgba(232,226,218,0.9)",
                color: "#2C2118",
              }}
            >
              {loading ? "Please wait..." : isLogin ? "Enter Gallery" : "Create Account"}
            </button>
          </form>
        </div>
      </div>

      {/* Bottom branding — fixed to viewport bottom */}
      <p
        className="fixed bottom-5 left-0 right-0 text-center z-10"
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "12px",
          fontWeight: 700,
          letterSpacing: "0.45em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.85)",
          opacity: revealed ? 1 : 0,
          transition: "opacity 2s cubic-bezier(0.4,0,0.2,1) 0.5s",
        }}
      >
        Colour Store Preset Universe
      </p>
    </div>
  );
};

export default Auth;
