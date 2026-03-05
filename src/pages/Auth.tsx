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

  useEffect(() => {
    supabase.auth.signUp({ email: "test@mirroraigallery.com", password: "Test@1234" }).catch(() => {});
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
    <div
      className="fixed inset-0 flex items-center justify-center px-6"
      style={{ background: '#F3EFE9' }}
    >
      <div
        className="w-full max-w-[400px] flex flex-col gap-6"
        style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #DDD6CC',
          padding: '32px',
          boxShadow: '0 8px 40px rgba(43,42,40,0.08)',
        }}
      >
        {/* Logo */}
        <div className="text-center mb-1">
          <h1
            style={{
              fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
              fontSize: '32px',
              fontWeight: 600,
              color: '#2B2A28',
              letterSpacing: '-0.01em',
              lineHeight: 1,
            }}
          >
            MirrorAI
          </h1>
          <p
            className="mt-2"
            style={{
              fontFamily: "'DM Sans', 'Jost', sans-serif",
              fontSize: '13px',
              fontWeight: 400,
              color: '#7B756D',
              letterSpacing: '0.02em',
            }}
          >
            Mirror never lies
          </p>
        </div>

        {error && (
          <div
            className="px-4 py-2.5 rounded-lg"
            style={{
              border: '1px solid rgba(192,97,74,0.2)',
              background: 'rgba(192,97,74,0.06)',
              color: '#C0614A',
              fontSize: '12px',
              lineHeight: '1.5',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {error}
          </div>
        )}
        {message && (
          <div
            className="px-4 py-2.5 rounded-lg"
            style={{
              border: '1px solid rgba(183,170,152,0.3)',
              background: 'rgba(183,170,152,0.08)',
              color: '#7B756D',
              fontSize: '12px',
              lineHeight: '1.5',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); isLogin ? handleLogin() : handleSignup(); }} className="flex flex-col gap-4">
          <div>
            <label
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '12px',
                fontWeight: 500,
                color: '#7B756D',
                letterSpacing: '0.04em',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              Email
            </label>
            <div
              className="flex items-center gap-3 px-4 h-12 rounded-xl transition-all duration-200"
              style={{
                background: '#F3EFE9',
                border: '1px solid #DDD6CC',
              }}
            >
              <Mail className="h-4 w-4 shrink-0" style={{ color: '#B7AA98' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="you@studio.com"
                required
                autoComplete="email"
                className="bg-transparent w-full outline-none"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 400,
                  fontSize: '15px',
                  color: '#2B2A28',
                  letterSpacing: '0.01em',
                }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '12px',
                fontWeight: 500,
                color: '#7B756D',
                letterSpacing: '0.04em',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              Password
            </label>
            <div
              className="flex items-center gap-3 px-4 h-12 rounded-xl transition-all duration-200"
              style={{
                background: '#F3EFE9',
                border: '1px solid #DDD6CC',
              }}
            >
              <Lock className="h-4 w-4 shrink-0" style={{ color: '#B7AA98' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="bg-transparent w-full outline-none"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 400,
                  fontSize: '15px',
                  color: '#2B2A28',
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => { setTab(isLogin ? "signup" : "login"); setPassword(""); setError(""); setMessage(""); }}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                color: '#7B756D',
              }}
            >
              {isLogin ? (
                <>No account? <span style={{ color: '#2B2A28', fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: '3px' }}>Sign up</span></>
              ) : (
                <>Have an account? <span style={{ color: '#2B2A28', fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: '3px' }}>Sign in</span></>
              )}
            </button>
            {isLogin && (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="hover:opacity-70 transition-opacity"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px',
                  color: '#B7AA98',
                }}
              >
                Forgot?
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-[10px] transition-all duration-200 disabled:opacity-50 hover:opacity-90 active:scale-[0.98]"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              fontSize: '13px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              background: '#2B2A28',
              color: '#FFFFFF',
            }}
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>

      {/* Bottom branding */}
      <p
        className="fixed bottom-5 left-0 right-0 text-center"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '9px',
          fontWeight: 500,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: '#B7AA98',
        }}
      >
        Colour Store Preset Universe
      </p>
    </div>
  );
};

export default Auth;
