import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import mirrorMark from "@/assets/mirror-mark.png";

interface AuthProps {
  initialView?: "landing" | "login" | "signup" | "forgot";
}

/**
 * Auth — Pixieset-Minimal, paper-card direction.
 * Symbolic mark + Fraunces wordmark in header. Bottom-rule inputs. Ink button.
 * Sized for both 390-wide phones and desktop (centered card, max 380px).
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
    else setMessage("Password reset link sent to your email.");
  };

  const submit = isSignup ? handleSignup : handleLogin;

  return (
    <div className="fixed inset-0 h-[100dvh] overflow-auto bg-[#EFEDE8] flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-[380px]">
        {/* ─── HEADER: symbolic mark + wordmark ──────────────────── */}
        <div className="flex flex-col items-center mb-10">
          <img
            src={mirrorMark}
            alt="Mirror"
            width={44}
            height={44}
            className="block mb-4 select-none"
            draggable={false}
          />
          <span className="font-serif text-[20px] font-normal text-[var(--ink)] tracking-[-0.005em]">
            Mirror
          </span>
          <span className="block w-[3px] h-[3px] bg-[var(--ink)] rounded-full mt-2" />
        </div>

        {/* ─── PAPER CARD ────────────────────────────────────────── */}
        <div className="bg-white border border-[var(--rule)] px-7 py-9">
          {/* Greeting */}
          <h1 className="font-serif font-light text-[28px] leading-[1.15] tracking-[-0.01em] text-[var(--ink)] m-0">
            {isSignup ? "Create your studio." : "Welcome back."}
          </h1>
          <p className="font-serif italic font-light text-[15px] leading-[1.5] text-[var(--ink-muted)] mt-1.5 mb-7">
            {isSignup ? "Start delivering work in minutes." : "Sign in to continue."}
          </p>

          {error && (
            <div className="text-[12px] text-[var(--alert)] leading-[1.4] mb-4 border-l-2 border-[var(--alert)] pl-3 py-1">
              {error}
            </div>
          )}
          {message && (
            <div className="text-[12px] text-[var(--ink-muted)] leading-[1.4] mb-4 border-l-2 border-[var(--rule-strong)] pl-3 py-1">
              {message}
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); submit(); }}
            className="flex flex-col gap-5"
          >
            <div>
              <label className="block text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--ink-muted)] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setEmailFocus(false)}
                required
                autoComplete="email"
                className="w-full h-11 bg-transparent border-0 text-[var(--ink)] text-[15px] outline-none px-0"
                style={{
                  borderBottom: emailFocus ? "2px solid var(--ink)" : "1px solid var(--rule-strong)",
                  paddingBottom: emailFocus ? 11 : 12,
                  paddingTop: 12,
                  transition: "border-color 180ms",
                }}
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <label className="block text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--ink-muted)]">
                  Password
                </label>
                {!isSignup && (
                  <button
                    type="button"
                    onClick={handleForgot}
                    className="bg-transparent border-0 cursor-pointer text-[var(--ink-muted)] text-[11px] tracking-[0.02em] hover:text-[var(--ink)] transition-colors p-0"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onFocus={() => setPwFocus(true)}
                onBlur={() => setPwFocus(false)}
                required
                minLength={6}
                autoComplete={isSignup ? "new-password" : "current-password"}
                className="w-full h-11 bg-transparent border-0 text-[var(--ink)] text-[15px] outline-none px-0"
                style={{
                  borderBottom: pwFocus ? "2px solid var(--ink)" : "1px solid var(--rule-strong)",
                  paddingBottom: pwFocus ? 11 : 12,
                  paddingTop: 12,
                  transition: "border-color 180ms",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[var(--ink)] text-white border-0 text-[12px] font-medium tracking-[0.08em] uppercase cursor-pointer hover:opacity-90 transition-opacity mt-2 disabled:opacity-50 disabled:cursor-wait"
            >
              {loading ? "—" : isSignup ? "Create account" : "Sign in"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[var(--rule)]" />
            <span className="text-[10px] tracking-[0.14em] uppercase text-[var(--ink-whisper)] font-medium">
              or
            </span>
            <div className="flex-1 h-px bg-[var(--rule)]" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-11 bg-transparent border border-[var(--rule-strong)] text-[var(--ink)] text-[12px] font-medium tracking-[0.02em] cursor-pointer hover:border-[var(--ink)] transition-colors flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-wait"
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

        {/* ─── SWITCH ────────────────────────────────────────────── */}
        <p className="text-center mt-6 text-[13px] text-[var(--ink-muted)]">
          {isSignup ? "Already have an account?" : "New to Mirror?"}{" "}
          <button
            type="button"
            onClick={() => { setIsSignup(!isSignup); setPassword(""); setError(""); setMessage(""); }}
            className="bg-transparent border-0 cursor-pointer text-[var(--ink)] text-[13px] font-medium underline underline-offset-2 p-0 hover:opacity-70 transition-opacity"
          >
            {isSignup ? "Sign in" : "Create account"}
          </button>
        </p>

        {/* ─── FOOTER WHISPER ────────────────────────────────────── */}
        <p className="text-center mt-8 font-serif italic text-[12px] text-[var(--ink-whisper)]">
          Every gallery, a story.
        </p>
      </div>
    </div>
  );
};

export default Auth;
