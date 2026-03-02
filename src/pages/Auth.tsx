import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { lovable } from "@/integrations/lovable";

type AuthView = "login" | "signup";

interface AuthProps {
  initialView?: "landing" | "login" | "signup" | "forgot";
}

const Auth = ({ initialView }: AuthProps) => {
  const navigate = useNavigate();
  const startView: AuthView = initialView === "signup" ? "signup" : "login";
  const [view, setView] = useState<AuthView>(startView);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else if (data?.session) {
        let destination = "/dashboard";
        try {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", data.session.user.id) as any;
          const roleList = (roles || []).map((r: any) => r.role);
          if (roleList.includes('admin')) destination = "/admin";
          else if (roleList.includes('client')) destination = "/client";
        } catch {}
        navigate(destination);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else if (data?.session) {
        const userId = data.session.user.id;
        const { data: profile } = await (supabase.from('profiles').select('id').eq('user_id', userId).maybeSingle() as any);
        if (!profile) {
          await (supabase.from('profiles').insert({ user_id: userId, studio_name: 'My Studio', email } as any) as any);
        }
        await (supabase.from('user_roles').insert({ user_id: userId, role: 'photographer' } as any) as any);
        navigate("/dashboard");
      } else {
        setError("Check your email to confirm your account, then sign in.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      setError(error.message || "Google sign-in failed.");
    }
  };

  const isLogin = view === "login";

  return (
    <div className="fixed inset-0 overflow-hidden w-screen" style={{ backgroundColor: '#0a0908' }}>
      {/* Layer 1: Soft blurred ambient fill */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/images/login-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(80px) saturate(0.5) brightness(0.4)",
          opacity: 0.5,
          transform: "scale(1.4)",
        }}
      />
      {/* Layer 2: Full cinematic photograph */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/images/login-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Layer 3: Aged velvet overlay — #1A1410 at 70% */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(26,20,16,0.55) 0%, rgba(26,20,16,0.70) 50%, rgba(26,20,16,0.88) 100%)",
        }}
      />
      {/* Layer 4: Subtle vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(10,9,8,0.4) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Brand — generous vertical spacing */}
        <div className="text-center mb-14 animate-[fade-in_0.8s_ease-out_forwards]">
          <h1
            className="mb-3"
            style={{
              fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
              fontSize: "clamp(2.4rem, 6vw, 3.6rem)",
              fontWeight: 300,
              color: '#F5F0E8',
              letterSpacing: '0.14em',
              lineHeight: 1,
            }}
          >
            MirrorAI
          </h1>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "clamp(0.5rem, 1.2vw, 0.65rem)",
              fontWeight: 300,
              color: 'rgba(245,240,232,0.28)',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
            }}
          >
            The Reflection of Now
          </p>
        </div>

        {/* Auth card — frosted, weightless */}
        <div
          className="w-full max-w-[360px] flex flex-col gap-5 p-8 sm:p-9 animate-[fade-in_1s_ease-out_0.3s_forwards] opacity-0"
          style={{
            background: "rgba(18, 15, 12, 0.55)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            borderRadius: "14px",
            border: "1px solid rgba(245, 240, 232, 0.04)",
            boxShadow: "0 32px 80px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.02)",
          }}
        >
          {/* Card heading */}
          <p
            className="text-center mb-1"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "9px",
              fontWeight: 400,
              color: 'rgba(245,240,232,0.40)',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
            }}
          >
            {isLogin ? "Welcome Back" : "Create Account"}
          </p>

          {error && (
            <div
              className="px-4 py-2.5 rounded-lg"
              style={{
                border: '1px solid rgba(229,115,115,0.15)',
                background: 'rgba(229,115,115,0.06)',
                color: '#E57373',
                fontSize: '11px',
                lineHeight: '1.5',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={isLogin ? handleLogin : handleSignup} className="flex flex-col gap-4">
            {/* Email */}
            <div
              className="flex items-center gap-3 px-4 h-12 rounded-xl transition-colors duration-200"
              style={{
                background: 'rgba(26,24,22,0.45)',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <Mail className="h-3.5 w-3.5 shrink-0" style={{ color: '#5a5248' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="Email"
                required
                autoComplete="email"
                className="bg-transparent w-full outline-none placeholder:text-[#3d3630]"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 300,
                  fontSize: '13px',
                  color: '#F5F0E8',
                  letterSpacing: '0.03em',
                }}
              />
            </div>

            {/* Password */}
            <div
              className="flex items-center gap-3 px-4 h-12 rounded-xl transition-colors duration-200"
              style={{
                background: 'rgba(26,24,22,0.45)',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <Lock className="h-3.5 w-3.5 shrink-0" style={{ color: '#5a5248' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Password"
                required
                minLength={6}
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="bg-transparent w-full outline-none placeholder:text-[#3d3630]"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 300,
                  fontSize: '13px',
                  color: '#F5F0E8',
                  letterSpacing: '0.03em',
                }}
              />
            </div>

            {/* Links */}
            <div className="flex items-center justify-between pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setView(isLogin ? "signup" : "login");
                  setPassword("");
                  setError("");
                }}
                className="transition-colors"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: '10px',
                  color: '#9A8E82',
                  letterSpacing: '0.04em',
                }}
              >
                {isLogin ? (
                  <>No account? <span style={{ color: '#8B7355', textDecoration: 'underline', textUnderlineOffset: '3px' }}>Sign up</span></>
                ) : (
                  <>Have an account? <span style={{ color: '#8B7355', textDecoration: 'underline', textUnderlineOffset: '3px' }}>Sign in</span></>
                )}
              </button>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="transition-colors hover:opacity-80"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: '10px',
                    color: '#8B7355',
                    letterSpacing: '0.04em',
                  }}
                >
                  Forgot?
                </button>
              )}
            </div>

            {/* Submit — cream on dark */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-xl transition-all duration-200 disabled:opacity-50"
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
                fontSize: '11px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                background: '#F5F0E8',
                color: '#2C2118',
              }}
            >
              {isLogin ? "Enter Studio" : "Create Account"}
            </button>

            {/* Divider */}
            {isLogin && (
              <div className="flex items-center gap-4 my-1">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: '8px',
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                    color: '#4a4038',
                  }}
                >
                  or
                </span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
              </div>
            )}

            {/* Google */}
            {isLogin && (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="flex items-center justify-center gap-3 w-full h-12 rounded-xl transition-colors duration-200 hover:brightness-110"
                style={{
                  border: '1px solid rgba(255,255,255,0.05)',
                  background: 'rgba(26,24,22,0.35)',
                }}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: '11px',
                    color: 'rgba(245,240,232,0.50)',
                    letterSpacing: '0.06em',
                  }}
                >
                  Continue with Google
                </span>
              </button>
            )}
          </form>
        </div>

        {/* Bottom whisper */}
        <p
          className="mt-12 animate-[fade-in_1.2s_ease-out_0.8s_forwards] opacity-0"
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: '8px',
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color: 'rgba(245,240,232,0.10)',
          }}
        >
          Luxury Photography Platform
        </p>
      </div>
    </div>
  );
};

export default Auth;
