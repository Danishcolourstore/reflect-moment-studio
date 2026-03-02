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
    <div className="fixed inset-0 overflow-hidden w-screen bg-[#0a0908]">
      {/* Layer 1: Soft blurred fill for edge bleed */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/images/login-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(60px) saturate(0.7)",
          opacity: 0.3,
          transform: "scale(1.3)",
        }}
      />
      {/* Layer 2: Full cinematic image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/images/login-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Layer 3: Warm cinematic overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(10,9,8,0.15) 0%, rgba(10,9,8,0.5) 60%, rgba(10,9,8,0.85) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Brand */}
        <div className="text-center mb-10 animate-[fade-in_0.6s_ease-out_forwards]">
          <h1
            className="text-[#F5F0E8] tracking-[0.12em] mb-2"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              fontWeight: 300,
            }}
          >
            MirrorAI
          </h1>
          <p
            className="text-[#F5F0E8]/40 tracking-[0.25em] uppercase"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "clamp(0.55rem, 1.5vw, 0.7rem)",
              fontWeight: 300,
            }}
          >
            The Reflection of Now
          </p>
        </div>

        {/* Auth card */}
        <div
          className="w-full max-w-[340px] flex flex-col gap-4 p-6 sm:p-7 animate-[fade-in_0.8s_ease-out_0.2s_forwards] opacity-0"
          style={{
            background: "rgba(15, 13, 11, 0.65)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            boxShadow: "0 24px 64px rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* Card title */}
          <p
            className="text-center text-[#F5F0E8]/60 tracking-[0.18em] uppercase mb-1"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "10px",
              fontWeight: 400,
            }}
          >
            {isLogin ? "Welcome Back" : "Create Account"}
          </p>

          {error && (
            <div className="px-3 py-2 border border-[#E57373]/20 bg-[#E57373]/8 text-[11px] text-[#E57373] leading-relaxed rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={isLogin ? handleLogin : handleSignup} className="flex flex-col gap-3.5">
            {/* Email */}
            <div className="flex items-center gap-2.5 bg-[#1a1816]/50 border border-[#ffffff08] rounded-xl px-3.5 h-11 focus-within:border-[#8B7355]/50 transition-colors">
              <Mail className="h-3.5 w-3.5 text-[#5a5248] shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="Email"
                required
                autoComplete="email"
                className="bg-transparent w-full text-[#F5F0E8] text-[13px] placeholder:text-[#4a4038] outline-none tracking-wide"
                style={{ fontFamily: "Inter, sans-serif", fontWeight: 300 }}
              />
            </div>

            {/* Password */}
            <div className="flex items-center gap-2.5 bg-[#1a1816]/50 border border-[#ffffff08] rounded-xl px-3.5 h-11 focus-within:border-[#8B7355]/50 transition-colors">
              <Lock className="h-3.5 w-3.5 text-[#5a5248] shrink-0" />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Password"
                required
                minLength={6}
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="bg-transparent w-full text-[#F5F0E8] text-[13px] placeholder:text-[#4a4038] outline-none tracking-wide"
                style={{ fontFamily: "Inter, sans-serif", fontWeight: 300 }}
              />
            </div>

            {/* Links row */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setView(isLogin ? "signup" : "login");
                  setPassword("");
                  setError("");
                }}
                className="text-[10px] text-[#9A8E82] hover:text-[#F5F0E8] transition-colors tracking-wide"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {isLogin ? (
                  <>No account? <span className="text-[#8B7355] underline underline-offset-2">Sign up</span></>
                ) : (
                  <>Have an account? <span className="text-[#8B7355] underline underline-offset-2">Sign in</span></>
                )}
              </button>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-[10px] text-[#8B7355] hover:text-[#F5F0E8] transition-colors tracking-wide"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Forgot?
                </button>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-xl bg-[#F5F0E8] text-[#2C2118] text-[11px] font-medium tracking-[0.16em] uppercase hover:bg-[#EDE7DC] transition-all duration-200 disabled:opacity-50"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {isLogin ? "Enter Studio" : "Create Account"}
            </button>

            {/* Divider */}
            {isLogin && (
              <div className="flex items-center gap-3 my-0.5">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[#5a5248] text-[9px] tracking-[0.2em] uppercase" style={{ fontFamily: "Inter, sans-serif" }}>or</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>
            )}

            {/* Google */}
            {isLogin && (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="flex items-center justify-center gap-2.5 w-full h-11 rounded-xl border border-[#ffffff0a] bg-[#1a1816]/40 hover:bg-[#1a1816]/60 transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-[11px] text-[#F5F0E8]/60 tracking-wide" style={{ fontFamily: "Inter, sans-serif" }}>Continue with Google</span>
              </button>
            )}
          </form>
        </div>

        {/* Bottom tagline */}
        <p
          className="mt-8 text-[#F5F0E8]/15 text-[9px] tracking-[0.3em] uppercase animate-[fade-in_1s_ease-out_0.6s_forwards] opacity-0"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Luxury Photography Platform
        </p>
      </div>
    </div>
  );
};

export default Auth;
