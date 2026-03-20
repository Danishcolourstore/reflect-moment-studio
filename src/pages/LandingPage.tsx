import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ease = [0.16, 1, 0.3, 1];

/* ─── Animated Hands SVG ─── */
function AnimatedHands() {
  return (
    <div className="landing-hands-wrap">
      <svg viewBox="0 0 400 200" fill="none" className="landing-hands-svg">
        {/* Left hand */}
        <motion.g
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1.6, delay: 0.8, ease }}
        >
          <path
            d="M30 130 C50 110, 80 95, 120 90 C130 88, 140 85, 155 82 C160 80, 168 78, 175 80 C180 82, 178 88, 172 90 C165 92, 155 95, 150 97"
            stroke="rgba(201,169,110,0.4)"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M150 97 C158 92, 168 88, 178 86 C184 84, 188 90, 182 94 C176 97, 165 100, 155 103"
            stroke="rgba(201,169,110,0.35)"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M155 103 C163 99, 172 96, 180 95 C185 94, 187 100, 181 103 C175 106, 165 108, 155 110"
            stroke="rgba(201,169,110,0.3)"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M120 90 C110 100, 60 120, 30 135"
            stroke="rgba(201,169,110,0.25)"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </motion.g>

        {/* Right hand */}
        <motion.g
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1.6, delay: 1.0, ease }}
        >
          <path
            d="M370 130 C350 110, 320 95, 280 90 C270 88, 260 85, 245 82 C240 80, 232 78, 225 80 C220 82, 222 88, 228 90 C235 92, 245 95, 250 97"
            stroke="rgba(201,169,110,0.4)"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M250 97 C242 92, 232 88, 222 86 C216 84, 212 90, 218 94 C224 97, 235 100, 245 103"
            stroke="rgba(201,169,110,0.35)"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M245 103 C237 99, 228 96, 220 95 C215 94, 213 100, 219 103 C225 106, 235 108, 245 110"
            stroke="rgba(201,169,110,0.3)"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M280 90 C290 100, 340 120, 370 135"
            stroke="rgba(201,169,110,0.25)"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </motion.g>

        {/* Connection spark — pulsing glow between fingertips */}
        <motion.circle
          cx="200"
          cy="86"
          r="3"
          fill="rgba(201,169,110,0.6)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.5, 1, 1.5, 1], opacity: [0, 0.8, 0.4, 0.8, 0.4] }}
          transition={{ duration: 3, delay: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          cx="200"
          cy="86"
          r="8"
          fill="none"
          stroke="rgba(201,169,110,0.15)"
          strokeWidth="1"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 2, 1.5], opacity: [0, 0.3, 0] }}
          transition={{ duration: 2.5, delay: 2.4, repeat: Infinity, ease: "easeOut" }}
        />
      </svg>
    </div>
  );
}

/* ─── Login Modal ─── */
function LoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [tab, setTab] = useState<"login" | "signup">("login");

  const handleLogin = async () => {
    setLoading(true); setError(""); setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else { onClose(); navigate("/verify-access"); }
    setLoading(false);
  };

  const handleSignup = async () => {
    setLoading(true); setError(""); setMessage("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else { onClose(); navigate("/verify-otp"); }
    setLoading(false);
  };

  const handleForgot = async () => {
    if (!email) { setError("Enter your email first"); return; }
    setError(""); setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setError(error.message);
    else setMessage("Reset link sent to your email");
  };

  const isLogin = tab === "login";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-[380px] rounded-2xl overflow-hidden"
            style={{
              background: "#141414",
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
            }}
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ duration: 0.35, ease }}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10"
              style={{ color: "rgba(240,237,232,0.4)" }}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 pt-8">
              {/* Header */}
              <div className="text-center mb-6">
                <h2
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 22,
                    fontWeight: 600,
                    color: "#F0EDE8",
                    letterSpacing: "0.04em",
                  }}
                >
                  {isLogin ? "Welcome back" : "Create account"}
                </h2>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(240,237,232,0.35)", marginTop: 4, letterSpacing: "0.08em" }}>
                  {isLogin ? "Sign in to continue" : "Start your journey"}
                </p>
              </div>

              {/* Tabs */}
              <div className="flex rounded-lg p-1 mb-5" style={{ background: "rgba(255,255,255,0.04)" }}>
                {(["login", "signup"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setPassword(""); setError(""); setMessage(""); }}
                    className="flex-1 py-2 rounded-md transition-all"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                      fontWeight: 500,
                      letterSpacing: "0.04em",
                      background: tab === t ? "rgba(255,255,255,0.06)" : "transparent",
                      color: tab === t ? "#F0EDE8" : "rgba(240,237,232,0.35)",
                    }}
                  >
                    {t === "login" ? "Sign In" : "Sign Up"}
                  </button>
                ))}
              </div>

              {/* Errors / Messages */}
              {error && (
                <div className="mb-4 px-3 py-2 rounded-lg" style={{ background: "rgba(200,80,80,0.1)", border: "1px solid rgba(200,80,80,0.2)", color: "#e88", fontSize: 12 }}>
                  {error}
                </div>
              )}
              {message && (
                <div className="mb-4 px-3 py-2 rounded-lg" style={{ background: "rgba(201,169,110,0.08)", border: "1px solid rgba(201,169,110,0.15)", color: "#c9a96e", fontSize: 12 }}>
                  {message}
                </div>
              )}

              {/* Form */}
              <form
                onSubmit={(e) => { e.preventDefault(); isLogin ? handleLogin() : handleSignup(); }}
                className="flex flex-col gap-4"
              >
                <div>
                  <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "rgba(240,237,232,0.5)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Email</label>
                  <div className="flex items-center gap-3 mt-1.5 px-4 rounded-lg" style={{ height: 44, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <Mail className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(240,237,232,0.25)" }} />
                    <input
                      type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      placeholder="you@example.com" required autoComplete="email"
                      className="bg-transparent w-full outline-none"
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#F0EDE8" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "rgba(240,237,232,0.5)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Password</label>
                  <div className="flex items-center gap-3 mt-1.5 px-4 rounded-lg" style={{ height: 44, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <Lock className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(240,237,232,0.25)" }} />
                    <input
                      type={showPassword ? "text" : "password"} value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      placeholder={isLogin ? "Enter password" : "Min 6 characters"}
                      required minLength={6} autoComplete={isLogin ? "current-password" : "new-password"}
                      className="bg-transparent w-full outline-none"
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#F0EDE8" }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ color: "rgba(240,237,232,0.3)" }}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isLogin && (
                  <div className="flex justify-end -mt-1">
                    <button type="button" onClick={handleForgot} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "rgba(240,237,232,0.35)", background: "none", border: "none" }}>
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit" disabled={loading}
                  className="w-full rounded-lg font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                  style={{
                    height: 44,
                    background: "#c9a96e",
                    color: "#0a0a0a",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    letterSpacing: "0.04em",
                    opacity: loading ? 0.6 : 1,
                    border: "none",
                  }}
                >
                  {loading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-[#0a0a0a]/30 border-t-[#0a0a0a] animate-spin" />
                  ) : (
                    <>
                      {isLogin ? "Sign In" : "Create Account"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Main Landing Page ─── */
const LandingPage = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 1000);
    const t3 = setTimeout(() => setPhase(3), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="landing-root">
      {/* Content */}
      <div className="landing-content">
        {/* Top — Logo */}
        <motion.div
          className="landing-topbar"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 1 ? 1 : 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="landing-logo">Mirror AI</div>
        </motion.div>

        {/* Center — Hands + Tagline */}
        <div className="landing-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 12 }}
            transition={{ duration: 1.2, ease }}
          >
            <AnimatedHands />
          </motion.div>

          <motion.h1
            className="landing-title"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 16 }}
            transition={{ duration: 1, delay: 0.3, ease }}
          >
            Connecting<br />
            <span className="landing-title-accent">Mind, Body & Heart</span>
          </motion.h1>

          <motion.p
            className="landing-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 3 ? 1 : 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Real Intelligence for Professional Photography
          </motion.p>
        </div>

        {/* Bottom — CTA */}
        <motion.div
          className="landing-bottom"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: phase >= 3 ? 1 : 0, y: phase >= 3 ? 0 : 16 }}
          transition={{ duration: 0.8, delay: 0.4, ease }}
        >
          <button className="landing-cta" onClick={() => setShowLogin(true)}>
            Get Started
          </button>
          <button className="landing-login-link" onClick={() => setShowLogin(true)}>
            Already have an account? <span>Sign in</span>
          </button>
          <p className="landing-footer-text">Real Intelligence · Not Artificial</p>
        </motion.div>
      </div>

      {/* Login Modal */}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');

        .landing-root {
          position: fixed; inset: 0;
          background: #0a0a0a;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
        }

        .landing-content {
          position: relative; z-index: 1;
          display: flex; flex-direction: column;
          height: 100%; padding: 0 24px;
        }

        /* Top bar */
        .landing-topbar {
          padding: 28px 0 0;
          text-align: center;
        }

        .landing-logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 500;
          color: #F0EDE8;
          letter-spacing: 0.12em;
        }

        /* Center */
        .landing-center {
          flex: 1;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 8px;
        }

        .landing-hands-wrap {
          width: 280px;
          margin-bottom: 16px;
        }

        .landing-hands-svg {
          width: 100%;
          height: auto;
        }

        .landing-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(26px, 7vw, 40px);
          font-weight: 400;
          color: #F0EDE8;
          text-align: center;
          line-height: 1.25;
          letter-spacing: 0.02em;
        }

        .landing-title-accent {
          color: #c9a96e;
        }

        .landing-subtitle {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          color: rgba(240,237,232,0.35);
          letter-spacing: 0.15em;
          text-transform: uppercase;
          text-align: center;
          margin-top: 12px;
        }

        /* Bottom */
        .landing-bottom {
          display: flex; flex-direction: column;
          align-items: center;
          padding-bottom: 40px;
          gap: 14px;
        }

        .landing-cta {
          width: 100%; max-width: 320px;
          height: 48px;
          background: #c9a96e;
          color: #0a0a0a;
          border: none; border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 500;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
        }
        .landing-cta:active { transform: scale(0.97); }
        .landing-cta:hover { opacity: 0.9; }

        .landing-login-link {
          background: none; border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          color: rgba(240,237,232,0.35);
          cursor: pointer;
          letter-spacing: 0.02em;
        }
        .landing-login-link span {
          color: #c9a96e;
          font-weight: 500;
        }

        .landing-footer-text {
          font-size: 9px;
          color: rgba(240,237,232,0.15);
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin-top: 8px;
        }

        /* Placeholder styling */
        .landing-root input::placeholder {
          color: rgba(240,237,232,0.2);
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
