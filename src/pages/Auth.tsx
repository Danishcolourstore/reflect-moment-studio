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
    <div className="fixed inset-0 overflow-hidden w-screen bg-[hsl(20,22%,5%)]">
      {/* Layer 1: Blurred ambient background fill */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/images/login-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(60px) saturate(0.4) brightness(0.3)",
          opacity: 0.6,
          transform: "scale(1.3)",
        }}
      />
      
      {/* Layer 2: Contained photograph — object-fit: contain */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src="/images/login-bg.png"
          alt=""
          className="max-h-full max-w-full object-contain"
          style={{ opacity: 0.85 }}
        />
      </div>

      {/* Layer 3: Dark luxury overlay — #1A1410 at 40% */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(26,20,16,0.30) 0%, rgba(26,20,16,0.40) 40%, rgba(26,20,16,0.65) 100%)",
        }}
      />

      {/* Layer 4: Subtle vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 45%, rgba(10,9,8,0.35) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">

        {/* Auth card — frosted glass */}
        <div
          className="w-full max-w-[380px] flex flex-col gap-6 p-9 sm:p-10 animate-[fade-in_1s_ease-out_forwards]"
          style={{
            background: "rgba(44, 33, 24, 0.45)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 32px 80px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.03)",
          }}
        >
          {/* Brand */}
          <div className="text-center mb-2">
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                fontSize: "clamp(2rem, 5vw, 2.8rem)",
                fontWeight: 300,
                color: '#FFFFFF',
                letterSpacing: '0.12em',
                lineHeight: 1,
              }}
            >
              MirrorAI
            </h1>
            <p
              className="mt-3"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "9px",
                fontWeight: 400,
                color: '#E8E2DA',
                letterSpacing: '0.35em',
                textTransform: 'uppercase',
                opacity: 0.5,
              }}
            >
              The Art Gallery
            </p>
          </div>

          {/* Subtle separator */}
          <div className="h-px w-12 mx-auto" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* Card heading */}
          <p
            className="text-center"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "8px",
              fontWeight: 400,
              color: 'rgba(232,226,218,0.35)',
              letterSpacing: '0.3em',
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
                fontFamily: 'Inter, sans-serif',
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
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <Mail className="h-3.5 w-3.5 shrink-0" style={{ color: 'rgba(139,115,85,0.6)' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="Email"
                required
                autoComplete="email"
                className="bg-transparent w-full outline-none placeholder:text-[rgba(139,115,85,0.3)]"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 300,
                  fontSize: '13px',
                  color: '#E8E2DA',
                  letterSpacing: '0.03em',
                }}
              />
            </div>

            {/* Password */}
            <div
              className="flex items-center gap-3 px-4 h-12 rounded-xl transition-colors duration-200"
              style={{
                background: 'rgba(26,24,22,0.45)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <Lock className="h-3.5 w-3.5 shrink-0" style={{ color: 'rgba(139,115,85,0.6)' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Password"
                required
                minLength={6}
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="bg-transparent w-full outline-none placeholder:text-[rgba(139,115,85,0.3)]"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 300,
                  fontSize: '13px',
                  color: '#E8E2DA',
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
                  color: 'rgba(232,226,218,0.4)',
                  letterSpacing: '0.04em',
                }}
              >
                {isLogin ? (
                  <>No account? <span style={{ color: 'rgba(139,115,85,0.8)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>Sign up</span></>
                ) : (
                  <>Have an account? <span style={{ color: 'rgba(139,115,85,0.8)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>Sign in</span></>
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
                    color: 'rgba(139,115,85,0.6)',
                    letterSpacing: '0.04em',
                  }}
                >
                  Forgot?
                </button>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-xl transition-all duration-200 disabled:opacity-50"
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
                fontSize: '10px',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                background: 'rgba(232,226,218,0.9)',
                color: '#2C2118',
              }}
            >
              {isLogin ? "Enter Gallery" : "Create Account"}
            </button>

          </form>
        </div>

        {/* Bottom whisper */}
        <p
          className="mt-14 animate-[fade-in_1.2s_ease-out_0.8s_forwards] opacity-0"
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: '7px',
            letterSpacing: '0.45em',
            textTransform: 'uppercase',
            color: 'rgba(232,226,218,0.08)',
          }}
        >
          Private Photography Platform
        </p>
      </div>
    </div>
  );
};

export default Auth;
