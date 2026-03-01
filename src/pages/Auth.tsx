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
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-[#0A0A0A]">
      {/* Content */}
      <div className="flex flex-col items-center w-full px-4">
        {/* Title above card */}
        <h2
          className="text-[#F5F0E8] text-center mb-6 tracking-wide"
          style={{
            fontFamily: "'Cormorant Garamond', 'Georgia', serif",
            fontSize: "clamp(1.1rem, 3vw, 1.5rem)",
            fontWeight: 400,
            letterSpacing: "0.04em",
          }}
        >
          Photographer Dashboard
        </h2>

        {/* Dark card */}
        <div
          className="w-full max-w-[400px] rounded-2xl p-8 flex flex-col gap-5 bg-[#111111] border border-[#1E1E1E]"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
        >
          {error && (
            <div className="px-3 py-2 border border-[#E57373]/30 bg-[#E57373]/10 text-[12px] text-[#E57373] leading-relaxed rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={isLogin ? handleLogin : handleSignup} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label className="text-[11px] text-[#9A8E82] uppercase tracking-wider mb-1.5 block">Email</label>
              <div className="flex items-center gap-3 bg-[#161616] border border-[#2A2A2A] rounded-lg px-3 h-11 focus-within:border-[#C9A96E] transition-colors">
                <Mail className="h-4 w-4 text-[#4A4A4A] shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="Email Address"
                  required
                  autoComplete="email"
                  className="bg-transparent w-full text-[#F5F0E8] text-sm placeholder:text-[#4A4A4A] outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[11px] text-[#9A8E82] uppercase tracking-wider mb-1.5 block">Password</label>
              <div className="flex items-center gap-3 bg-[#161616] border border-[#2A2A2A] rounded-lg px-3 h-11 focus-within:border-[#C9A96E] transition-colors">
                <Lock className="h-4 w-4 text-[#4A4A4A] shrink-0" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Password"
                  required
                  minLength={6}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className="bg-transparent w-full text-[#F5F0E8] text-sm placeholder:text-[#4A4A4A] outline-none"
                />
              </div>
            </div>

            {/* Forgot password */}
            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-[12px] text-[#C9A96E] hover:text-[#C9A96E]/80 transition-colors"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* Divider */}
            {isLogin && (
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-[#1E1E1E]" />
                <span className="text-[#3A3A3A] text-[11px] tracking-wide">Or continue with</span>
                <div className="flex-1 h-px bg-[#1E1E1E]" />
              </div>
            )}

            {/* Google Sign In */}
            {isLogin && (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="flex items-center justify-center gap-3 w-full h-12 rounded-lg bg-[#161616] border border-[#2A2A2A] hover:border-[#C9A96E]/40 transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-[14px] font-medium text-[#F5F0E8]">Sign in with Google</span>
              </button>
            )}

            {/* Sign In / Create Account button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-lg bg-[#C9A96E] text-[#0A0A0A] text-[14px] font-medium tracking-wide hover:bg-[#b8983f] transition-colors disabled:opacity-50"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>

        {/* Toggle link */}
        <p className="mt-6 text-center">
          <button
            onClick={() => {
              setView(isLogin ? "signup" : "login");
              setPassword("");
              setError("");
            }}
            className="text-[13px] text-[#9A8E82] hover:text-[#F5F0E8] transition-colors"
          >
            {isLogin ? (
              <>Don't have an account? <span className="underline text-[#C9A96E]">Sign up</span></>
            ) : (
              <>Already have an account? <span className="underline text-[#C9A96E]">Sign in</span></>
            )}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
