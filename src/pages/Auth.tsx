import { forwardRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AuthProps {
  initialView?: "landing" | "login" | "signup" | "forgot";
}

const Auth = forwardRef<HTMLDivElement, AuthProps>(function Auth({ initialView }, ref) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [tab, setTab] = useState<"login" | "signup">(initialView === "signup" ? "signup" : "login");

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
    if (!email) {
      setError("Please enter your email address first");
      return;
    }
    setError("");
    setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setError(error.message);
    else setMessage("Password reset link sent to your email");
  };

  const isLogin = tab === "login";

  return (
    <div
      ref={ref}
      className="fixed inset-0 flex items-center justify-center px-6 overflow-hidden"
      style={{ background: "#0B0B0B" }}
    >
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(212,175,55,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-[400px] flex flex-col gap-8 z-10">
        {/* Brand header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-2" style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.15)" }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: 600, color: "#D4AF37" }}>M</span>
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "32px",
              fontWeight: 600,
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
            }}
          >
            MirrorAI
          </h1>
          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "15px",
              fontStyle: "italic",
              fontWeight: 300,
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "0.06em",
            }}
          >
            Mirror never lies
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex rounded-xl p-1 gap-1" style={{ background: "#111111", border: "1px solid #1A1A1A" }}>
          {(["login", "signup"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                setPassword("");
                setError("");
                setMessage("");
              }}
              className="flex-1 py-2.5 rounded-lg text-center transition-all duration-300"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "13px",
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                background: tab === t ? "rgba(212,175,55,0.1)" : "transparent",
                color: tab === t ? "#D4AF37" : "rgba(255,255,255,0.3)",
                border: tab === t ? "1px solid rgba(212,175,55,0.2)" : "1px solid transparent",
              }}
            >
              {t === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Alerts */}
        {error && (
          <div
            className="px-4 py-3 rounded-xl flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300"
            style={{
              border: "1px solid rgba(239,68,68,0.2)",
              background: "rgba(239,68,68,0.06)",
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: "#EF4444" }} />
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#F87171", lineHeight: 1.5 }}>
              {error}
            </p>
          </div>
        )}
        {message && (
          <div
            className="px-4 py-3 rounded-xl flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300"
            style={{
              border: "1px solid rgba(212,175,55,0.2)",
              background: "rgba(212,175,55,0.06)",
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: "#D4AF37" }} />
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#D4AF37", lineHeight: 1.5 }}>
              {message}
            </p>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            isLogin ? handleLogin() : handleSignup();
          }}
          className="flex flex-col gap-4"
        >
          {/* Email field */}
          <div className="space-y-2">
            <label
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
              }}
            >
              Email
            </label>
            <div
              className="flex items-center gap-3 px-4 h-[52px] rounded-xl transition-all duration-300 focus-within:shadow-[0_0_0_1px_#D4AF37,0_0_20px_rgba(212,175,55,0.1)]"
              style={{ background: "#111111", border: "1px solid #222222" }}
            >
              <Mail className="h-4 w-4 shrink-0" style={{ color: "rgba(212,175,55,0.4)" }} />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="your@email.com"
                required
                autoComplete="email"
                className="bg-transparent w-full outline-none placeholder:text-[rgba(255,255,255,0.15)]"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 400,
                  fontSize: "14px",
                  color: "#E8E2DA",
                }}
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <label
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
              }}
            >
              Password
            </label>
            <div
              className="flex items-center gap-3 px-4 h-[52px] rounded-xl transition-all duration-300 focus-within:shadow-[0_0_0_1px_#D4AF37,0_0_20px_rgba(212,175,55,0.1)]"
              style={{ background: "#111111", border: "1px solid #222222" }}
            >
              <Lock className="h-4 w-4 shrink-0" style={{ color: "rgba(212,175,55,0.4)" }} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder={isLogin ? "Enter your password" : "Create a password (min 6 chars)"}
                required
                minLength={6}
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="bg-transparent w-full outline-none placeholder:text-[rgba(255,255,255,0.15)]"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 400,
                  fontSize: "14px",
                  color: "#E8E2DA",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="shrink-0 p-1 rounded-md transition-colors hover:bg-white/5"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" style={{ color: "rgba(255,255,255,0.25)" }} />
                ) : (
                  <Eye className="h-4 w-4" style={{ color: "rgba(255,255,255,0.25)" }} />
                )}
              </button>
            </div>
          </div>

          {/* Forgot password */}
          {isLogin && (
            <div className="flex justify-end -mt-1">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="transition-all hover:text-[#D4AF37]"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "12px",
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="group w-full h-[52px] rounded-xl transition-all duration-300 disabled:opacity-40 hover:shadow-[0_0_30px_rgba(212,175,55,0.2)] active:scale-[0.98] flex items-center justify-center gap-2"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              fontSize: "13px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              background: "linear-gradient(135deg, #D4AF37 0%, #B8962E 100%)",
              color: "#000000",
            }}
          >
            {loading ? (
              <div className="w-5 h-5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
            ) : (
              <>
                {isLogin ? "Sign In" : "Create Account"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.15)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {isLogin ? "New here?" : "Already a member?"}
          </span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>

        {/* Switch auth mode */}
        <button
          type="button"
          onClick={() => {
            setTab(isLogin ? "signup" : "login");
            setPassword("");
            setError("");
            setMessage("");
          }}
          className="w-full h-[48px] rounded-xl transition-all duration-300 hover:bg-white/[0.04] hover:border-[rgba(212,175,55,0.3)]"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "13px",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#D4AF37",
            border: "1px solid rgba(212,175,55,0.15)",
            background: "transparent",
          }}
        >
          {isLogin ? "Create an Account" : "Sign In Instead"}
        </button>
      </div>

      {/* Footer */}
      <p
        className="fixed bottom-5 left-0 right-0 text-center"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "8px",
          fontWeight: 500,
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.15)",
        }}
      >
        Colour Store Preset Universe
      </p>
    </div>
  );
});

Auth.displayName = "Auth";

export default Auth;
