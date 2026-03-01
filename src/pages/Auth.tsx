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
        navigate("/dashboard");
      } else {
        navigate("/login");
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
    <div className="fixed inset-0 overflow-hidden" style={{ backgroundColor: "#0b0b0b" }}>
      {/* Layer 1: Blurred fill */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/images/login-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(45px)",
          opacity: 0.35,
          transform: "scale(1.2)",
        }}
      />
      {/* Layer 2: Full image, no crop */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/images/login-bg.png')",
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Login card */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-0 z-10">
        {/* Photographer Dashboard heading — outside card */}
        <h2
          className="text-[#F5F0E8] text-center mb-6 tracking-wide"
          style={{
            fontFamily: "'Cormorant Garamond', 'Georgia', serif",
            fontSize: "clamp(1.2rem, 3.5vw, 1.6rem)",
            fontWeight: 400,
            letterSpacing: "0.04em",
          }}
        >
          Photographer Dashboard
        </h2>

        {/* Card */}
        <div
          className="w-full max-w-[280px] mx-4 flex flex-col gap-3.5 p-5"
          style={{
            background: "rgba(0, 0, 0, 0.55)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: "16px 16px 0 0",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 16px 48px rgba(0, 0, 0, 0.4)",
          }}
        >
          {error && (
            <div className="px-3 py-2 border border-[#E57373]/30 bg-[#E57373]/10 text-[12px] text-[#E57373] leading-relaxed rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={isLogin ? handleLogin : handleSignup} className="flex flex-col gap-3">
            {/* Email */}
            <div className="flex items-center gap-2 bg-[#161616]/60 border border-[#ffffff12] rounded-md px-2.5 h-9 focus-within:border-[#C9A96E] transition-colors">
              <Mail className="h-3.5 w-3.5 text-[#6A6A6A] shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="Email Address"
                required
                autoComplete="email"
                className="bg-transparent w-full text-[#F5F0E8] text-xs placeholder:text-[#4A4A4A] outline-none"
              />
            </div>

            {/* Password */}
            <div className="flex items-center gap-2 bg-[#161616]/60 border border-[#ffffff12] rounded-md px-2.5 h-9 focus-within:border-[#C9A96E] transition-colors">
              <Lock className="h-3.5 w-3.5 text-[#6A6A6A] shrink-0" />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Password"
                required
                minLength={6}
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="bg-transparent w-full text-[#F5F0E8] text-xs placeholder:text-[#4A4A4A] outline-none"
              />
            </div>

            {/* Forgot password + Sign up row */}
            <div className="flex items-center justify-between -mt-1">
              <button
                type="button"
                onClick={() => {
                  setView(isLogin ? "signup" : "login");
                  setPassword("");
                  setError("");
                }}
                className="text-[10px] text-[#9A8E82] hover:text-[#F5F0E8] transition-colors"
              >
                {isLogin ? (
                  <>Don't have an account? <span className="underline text-[#C9A96E]">Sign up</span></>
                ) : (
                  <>Already have an account? <span className="underline text-[#C9A96E]">Sign in</span></>
                )}
              </button>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-[10px] text-[#C9A96E] hover:text-[#C9A96E]/80 transition-colors"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Forgot Password?
                </button>
              )}
            </div>

            {/* Divider */}
            {isLogin && (
              <div className="flex items-center gap-3 my-0.5">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[#5A5A5A] text-[11px] tracking-wide">Or continue with</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
            )}

            {/* Google Sign In — above Sign In button */}
            {isLogin && (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="flex items-center justify-center gap-2 w-full h-9 rounded-md bg-white hover:bg-gray-100 transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-[12px] font-medium text-[#333]">Sign in with Google</span>
              </button>
            )}

            {/* Sign In button — bottom, dark */}
            <button
              type="submit"
              disabled={submitting}
              className="w-[70%] mx-auto h-8 rounded-md bg-[#1A1A1A] text-[#F5F0E8] text-[12px] font-medium tracking-wide hover:bg-[#252525] border border-white/10 transition-colors disabled:opacity-50"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Auth;
