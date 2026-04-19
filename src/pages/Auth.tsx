import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

interface AuthProps {
  initialView?: "landing" | "login" | "signup" | "forgot";
}

/**
 * Auth — Pixieset-Minimal.
 * Light surface. Bottom-rule inputs. Black ink button. Cormorant greeting only.
 */
const Auth = function Auth({ initialView }: AuthProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSignup, setIsSignup] = useState(initialView === "signup");

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
    <div
      style={{
        position: "fixed",
        inset: 0,
        height: "100dvh",
        overflow: "auto",
        background: "var(--paper)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 360 }}>
        {/* Wordmark */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 22,
              fontWeight: 400,
              color: "var(--ink)",
            }}
          >
            Mirror
          </span>
        </div>

        {/* Greeting — the only Cormorant on this surface besides wordmark */}
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 28,
            fontWeight: 400,
            color: "var(--ink)",
            letterSpacing: "-0.01em",
            margin: 0,
            marginBottom: 8,
            lineHeight: 1.15,
          }}
        >
          {isSignup ? "Create your studio." : "Welcome back."}
        </h1>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: "var(--ink-muted)",
            margin: 0,
            marginBottom: 32,
          }}
        >
          {isSignup ? "Start delivering work in minutes." : "Sign in to continue."}
        </p>

        {error && (
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              color: "var(--alert)",
              marginBottom: 16,
              lineHeight: 1.4,
            }}
          >
            {error}
          </div>
        )}
        {message && (
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              color: "var(--ink-muted)",
              marginBottom: 16,
              lineHeight: 1.4,
            }}
          >
            {message}
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); submit(); }}
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
          <div>
            <label
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--ink-muted)",
                display: "block",
                marginBottom: 6,
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              required
              autoComplete="email"
              style={{
                width: "100%",
                height: 44,
                background: "transparent",
                border: "none",
                borderBottom: "1px solid var(--rule)",
                color: "var(--ink)",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                padding: "12px 0",
                outline: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderBottom = "2px solid var(--ink)";
                e.currentTarget.style.paddingBottom = "11px";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderBottom = "1px solid var(--rule)";
                e.currentTarget.style.paddingBottom = "12px";
              }}
            />
          </div>

          <div>
            <label
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--ink-muted)",
                display: "block",
                marginBottom: 6,
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              required
              minLength={6}
              autoComplete={isSignup ? "new-password" : "current-password"}
              style={{
                width: "100%",
                height: 44,
                background: "transparent",
                border: "none",
                borderBottom: "1px solid var(--rule)",
                color: "var(--ink)",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                padding: "12px 0",
                outline: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderBottom = "2px solid var(--ink)";
                e.currentTarget.style.paddingBottom = "11px";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderBottom = "1px solid var(--rule)";
                e.currentTarget.style.paddingBottom = "12px";
              }}
            />
          </div>

          {!isSignup && (
            <button
              type="button"
              onClick={handleForgot}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--ink-muted)",
                fontSize: 12,
                fontFamily: "'DM Sans', sans-serif",
                textAlign: "left",
                padding: 0,
                marginTop: -8,
              }}
            >
              Forgot password?
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: 44,
              border: "none",
              background: "var(--ink)",
              color: "#FFFFFF",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "0.02em",
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.5 : 1,
              transition: "opacity 120ms",
              marginTop: 8,
            }}
          >
            {loading ? "—" : isSignup ? "Create account" : "Sign in"}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0 16px" }}>
          <div style={{ flex: 1, height: 1, background: "var(--rule)" }} />
          <span
            style={{
              fontSize: 10,
              color: "var(--ink-muted)",
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontWeight: 500,
            }}
          >
            or
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--rule)" }} />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: "100%",
            height: 44,
            border: "1px solid var(--rule-strong)",
            background: "transparent",
            color: "var(--ink)",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.02em",
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.5 : 1,
            transition: "border-color 120ms",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--ink)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--rule-strong)"; }}
        >
          <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.04 24.04 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continue with Google
        </button>

        <p
          style={{
            textAlign: "center",
            marginTop: 24,
            fontSize: 13,
            color: "var(--ink-muted)",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => { setIsSignup(!isSignup); setPassword(""); setError(""); setMessage(""); }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--ink)",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
              padding: 0,
              textDecoration: "underline",
              textUnderlineOffset: 2,
            }}
          >
            {isSignup ? "Sign in" : "Create account"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
