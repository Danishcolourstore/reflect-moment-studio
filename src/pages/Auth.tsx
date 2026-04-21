import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

interface AuthProps {
  initialView?: "landing" | "login" | "signup" | "forgot";
}

/**
 * Auth — Editorial Atelier direction.
 * Pic-Time-inspired but elevated: serif wordmark with confidence,
 * hairline-framed paper card, bottom-rule inputs with ink underline,
 * tactile press-states, micro-typography that feels printed.
 *
 * Goals: feel like opening a leather portfolio, not filling a form.
 */
const Auth = function Auth({ initialView }: AuthProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSignup, setIsSignup] = useState(initialView === "signup");
  const [emailFocus, setEmailFocus] = useState(false);
  const [pwFocus, setPwFocus] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
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
    else setMessage("Password reset link sent to your email.");
  };

  const submit = isSignup ? handleSignup : handleLogin;

  return (
    <div className="fixed inset-0 h-[100dvh] overflow-auto bg-[#EFEDE8] flex items-center justify-center px-5 py-8">
      {/* Subtle paper grain via radial wash — adds warmth without noise */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.35]"
        style={{
          background:
            "radial-gradient(1200px 800px at 50% -10%, #F5F3EE 0%, transparent 60%), radial-gradient(900px 700px at 50% 110%, #E8E5DE 0%, transparent 55%)",
        }}
      />

      <div
        className={`relative w-full max-w-[400px] transition-all duration-700 ease-out ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
      >
        {/* ─── HEADER ─────────────────────────────────────────────────
            Tight identity stack: hairline glyph → wordmark → seal dot.
            Feels stamped, not designed. */}
        <div className="flex flex-col items-center mb-8">
          {/* Glyph: monogram-style M inside a hairline ring */}
          <div className="relative w-12 h-12 flex items-center justify-center mb-5">
            <svg
              viewBox="0 0 48 48"
              className="absolute inset-0 w-full h-full"
              fill="none"
              aria-hidden
            >
              <circle cx="24" cy="24" r="23" stroke="#1A1917" strokeWidth="0.75" />
            </svg>
            <span
              className="font-serif text-[22px] leading-none text-[#1A1917]"
              style={{ fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.02em" }}
            >
              M
            </span>
          </div>

          <span
            className="font-serif text-[26px] leading-none text-[#1A1917]"
            style={{ fontWeight: 300, letterSpacing: "0.01em" }}
          >
            Mirror
          </span>
          <span
            className="mt-1.5 text-[9px] tracking-[0.32em] uppercase text-[#8B8881]"
            style={{ fontWeight: 500 }}
          >
            Atelier · Est. 2025
          </span>
        </div>

        {/* ─── PAPER CARD ─────────────────────────────────────────────
            Double-rule frame: outer hairline + 1px inset for "matted print" feel. */}
        <div className="relative">
          {/* Outer hairline frame, offset 6px */}
          <div
            aria-hidden
            className="absolute -inset-[6px] border border-[#D8D4CB] pointer-events-none"
          />
          <div className="relative bg-white border border-[#1A1917]/15 px-7 sm:px-8 py-9">
            {/* Greeting */}
            <h1
              className="font-serif text-[32px] leading-[1.05] tracking-[-0.015em] text-[#1A1917] m-0"
              style={{ fontWeight: 300 }}
            >
              {isSignup ? (
                <>Create your<br />studio.</>
              ) : (
                <>Welcome back.</>
              )}
            </h1>
            <p
              className="font-serif italic text-[14.5px] leading-[1.5] text-[#6B6962] mt-2 mb-8"
              style={{ fontWeight: 300 }}
            >
              {isSignup ? "Where every gallery becomes a story." : "Step back into your atelier."}
            </p>

            {/* Inline messages */}
            {error && (
              <div
                role="alert"
                className="text-[12px] text-[#9B2C1F] leading-[1.45] mb-5 border-l-[2px] border-[#9B2C1F] pl-3 py-1 animate-[fadeIn_240ms_ease-out]"
              >
                {error}
              </div>
            )}
            {message && (
              <div
                className="text-[12px] text-[#3D5A3A] leading-[1.45] mb-5 border-l-[2px] border-[#3D5A3A] pl-3 py-1 animate-[fadeIn_240ms_ease-out]"
              >
                {message}
              </div>
            )}

            <form
              onSubmit={(e) => { e.preventDefault(); submit(); }}
              className="flex flex-col gap-6"
              noValidate
            >
              {/* EMAIL */}
              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-[10px] tracking-[0.22em] uppercase text-[#8B8881] mb-2"
                  style={{ fontWeight: 500 }}
                >
                  Email
                </label>
                <div className="relative">
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    onFocus={() => setEmailFocus(true)}
                    onBlur={() => setEmailFocus(false)}
                    required
                    autoComplete="email"
                    className="w-full h-11 bg-transparent border-0 text-[#1A1917] text-[15px] outline-none px-0"
                    style={{
                      borderBottom: "1px solid #D8D4CB",
                      paddingBottom: 12,
                      paddingTop: 12,
                    }}
                  />
                  {/* Animated ink underline */}
                  <span
                    aria-hidden
                    className="absolute left-0 bottom-0 h-[1.5px] bg-[#1A1917] transition-transform duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)] origin-left"
                    style={{
                      width: "100%",
                      transform: emailFocus || email ? "scaleX(1)" : "scaleX(0)",
                    }}
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <label
                    htmlFor="auth-password"
                    className="block text-[10px] tracking-[0.22em] uppercase text-[#8B8881]"
                    style={{ fontWeight: 500 }}
                  >
                    Password
                  </label>
                  {!isSignup && (
                    <button
                      type="button"
                      onClick={handleForgot}
                      className="bg-transparent border-0 cursor-pointer text-[#6B6962] text-[11px] font-serif italic hover:text-[#1A1917] transition-colors p-0"
                      style={{ fontWeight: 300 }}
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    onFocus={() => setPwFocus(true)}
                    onBlur={() => setPwFocus(false)}
                    required
                    minLength={6}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    className="w-full h-11 bg-transparent border-0 text-[#1A1917] text-[15px] outline-none px-0"
                    style={{
                      borderBottom: "1px solid #D8D4CB",
                      paddingBottom: 12,
                      paddingTop: 12,
                    }}
                  />
                  <span
                    aria-hidden
                    className="absolute left-0 bottom-0 h-[1.5px] bg-[#1A1917] transition-transform duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)] origin-left"
                    style={{
                      width: "100%",
                      transform: pwFocus || password ? "scaleX(1)" : "scaleX(0)",
                    }}
                  />
                </div>
              </div>

              {/* SUBMIT — ink slab with subtle inner highlight on press */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full h-12 bg-[#1A1917] text-white border-0 text-[11px] font-medium tracking-[0.24em] uppercase cursor-pointer overflow-hidden transition-all duration-200 hover:bg-[#0A0A0A] active:scale-[0.995] disabled:opacity-50 disabled:cursor-wait mt-3"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? (
                    <span className="inline-flex gap-1">
                      <span className="w-1 h-1 bg-white/80 rounded-full animate-[pulse_1s_ease-in-out_infinite]" />
                      <span className="w-1 h-1 bg-white/80 rounded-full animate-[pulse_1s_ease-in-out_0.15s_infinite]" />
                      <span className="w-1 h-1 bg-white/80 rounded-full animate-[pulse_1s_ease-in-out_0.3s_infinite]" />
                    </span>
                  ) : (
                    <>
                      {isSignup ? "Create account" : "Sign in"}
                      <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* DIVIDER — printed serif "or" */}
            <div className="flex items-center gap-4 my-7">
              <div className="flex-1 h-px bg-[#E0DDD8]" />
              <span
                className="font-serif italic text-[12px] text-[#8B8881]"
                style={{ fontWeight: 300 }}
              >
                or
              </span>
              <div className="flex-1 h-px bg-[#E0DDD8]" />
            </div>

            {/* GOOGLE — outline, hairline, refined */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-12 bg-white border border-[#D8D4CB] text-[#1A1917] text-[12px] font-medium tracking-[0.04em] cursor-pointer hover:border-[#1A1917] hover:bg-[#FAFAF8] transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-wait active:scale-[0.995]"
            >
              <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.04 24.04 0 0 0 0 21.56l7.98-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </button>
          </div>
        </div>

        {/* ─── SWITCH ───────────────────────────────────────────────── */}
        <p className="text-center mt-9 text-[13px] text-[#6B6962]">
          {isSignup ? "Already have an account?" : "New to Mirror?"}{" "}
          <button
            type="button"
            onClick={() => { setIsSignup(!isSignup); setPassword(""); setError(""); setMessage(""); }}
            className="bg-transparent border-0 cursor-pointer text-[#1A1917] text-[13px] font-medium underline underline-offset-4 decoration-[0.5px] p-0 hover:opacity-60 transition-opacity"
          >
            {isSignup ? "Sign in" : "Create account"}
          </button>
        </p>

        {/* ─── FOOTER WHISPER ───────────────────────────────────────── */}
        <div className="text-center mt-10">
          <span className="inline-block w-6 h-px bg-[#A8A6A0] mb-3" />
          <p
            className="font-serif italic text-[12.5px] text-[#8B8881]"
            style={{ fontWeight: 300, letterSpacing: "0.01em" }}
          >
            Every gallery, a story.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Auth;
