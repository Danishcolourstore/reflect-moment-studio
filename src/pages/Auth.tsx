import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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

  /* cinematic entrance phases */
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100);   // bg image
    const t2 = setTimeout(() => setPhase(2), 2600);   // logo
    const t3 = setTimeout(() => setPhase(3), 4100);   // tagline
    const t4 = setTimeout(() => setPhase(4), 5400);   // form
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  useEffect(() => {
    const savedAccent = localStorage.getItem('accent');
    if (savedAccent === 'red') document.documentElement.classList.add('accent-red');
    else document.documentElement.classList.remove('accent-red');
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

  const handleForgotPassword = async () => {
    if (!email) { setError("Enter your email address first"); return; }
    setError(""); setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setError(error.message);
    else setMessage("Password reset link sent to your email");
  };

  const submit = isSignup ? handleSignup : handleLogin;

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ backgroundColor: '#000' }}>
      {/* ── Hero background image ── */}
      <img
        src="/images/login-hero.jpg"
        alt=""
        className="absolute inset-0 w-full h-full"
        style={{
          objectFit: 'cover',
          objectPosition: 'center',
          opacity: phase >= 1 ? 1 : 0,
          transition: 'opacity 2.5s ease-out',
        }}
      />

      {/* ── Dark overlay ── */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6">

        {/* Logo */}
        <h1
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontWeight: 300,
            fontSize: 'clamp(32px, 8vw, 52px)',
            color: '#C8A97E',
            letterSpacing: '0.08em',
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 1.5s ease-out, transform 1.5s ease-out',
          }}
        >
          Mirror AI
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 'clamp(13px, 3vw, 16px)',
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: '0.05em',
            marginTop: 8,
            marginBottom: 40,
            opacity: phase >= 3 ? 1 : 0,
            transition: 'opacity 1.2s ease-out',
          }}
        >
          Reflections of Your Moments
        </p>

        {/* Login card */}
        <div
          style={{
            width: '100%',
            maxWidth: 380,
            background: 'rgba(10,10,10,0.7)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '32px 28px 28px',
            opacity: phase >= 4 ? 1 : 0,
            transform: phase >= 4 ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 1s ease-out, transform 1s ease-out',
          }}
        >
          {/* Mini logo inside card */}
          <p
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontWeight: 400,
              fontSize: 18,
              color: '#C8A97E',
              letterSpacing: '0.06em',
              textAlign: 'center',
              marginBottom: 28,
            }}
          >
            Mirror AI
          </p>

          {/* Error / Message */}
          {error && (
            <div style={{
              fontSize: 12, color: '#e88', textAlign: 'center',
              marginBottom: 16, lineHeight: 1.5,
            }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{
              fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'center',
              marginBottom: 16, lineHeight: 1.5,
            }}>
              {message}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={(e) => { e.preventDefault(); submit(); }}
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="Email"
              required
              autoComplete="email"
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                fontFamily: 'Inter, sans-serif',
                fontSize: 14,
                padding: '10px 0',
                outline: 'none',
                width: '100%',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.currentTarget.style.borderBottomColor = 'rgba(200,169,126,0.5)'}
              onBlur={(e) => e.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.15)'}
            />

            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Password"
              required
              minLength={6}
              autoComplete={isSignup ? "new-password" : "current-password"}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                fontFamily: 'Inter, sans-serif',
                fontSize: 14,
                padding: '10px 0',
                outline: 'none',
                width: '100%',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.currentTarget.style.borderBottomColor = 'rgba(200,169,126,0.5)'}
              onBlur={(e) => e.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.15)'}
            />

            {/* Forgot password link — login only */}
            {!isSignup && (
              <button
                type="button"
                onClick={handleForgotPassword}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.4)', fontSize: 12,
                  fontFamily: 'Inter, sans-serif',
                  textAlign: 'right', padding: 0, marginTop: -8,
                }}
              >
                Forgot password?
              </button>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: 46,
                borderRadius: 8,
                border: 'none',
                background: '#C8A97E',
                color: '#111',
                fontFamily: 'Inter, sans-serif',
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: '0.04em',
                cursor: loading ? 'wait' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'opacity 0.15s, box-shadow 0.2s',
                boxShadow: '0 0 0 0 rgba(200,169,126,0)',
                marginTop: 4,
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.boxShadow = '0 0 20px rgba(200,169,126,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 0 rgba(200,169,126,0)';
              }}
            >
              {loading ? '...' : isSignup ? 'Create Account' : 'Enter'}
            </button>
          </form>

          {/* Toggle signup / login */}
          <p style={{
            textAlign: 'center', marginTop: 20,
            fontSize: 13, color: 'rgba(255,255,255,0.4)',
            fontFamily: 'Inter, sans-serif',
          }}>
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => { setIsSignup(!isSignup); setPassword(""); setError(""); setMessage(""); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.7)', fontSize: 13,
                fontFamily: 'Inter, sans-serif',
                textDecoration: 'none',
              }}
            >
              {isSignup ? 'Sign in' : 'Create Account'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
