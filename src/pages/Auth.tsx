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

  // Removed rogue test signup call

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
    setError(""); setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) setError(error.message);
    else setMessage("Password reset email sent");
  };

  const isLogin = tab === "login";
  const gold = "#D4AF37";
  const goldDim = "rgba(212,175,55,0.5)";

  return (
    <div className="fixed inset-0 flex items-center justify-center px-6" style={{ background: '#0B0B0B' }}>
      <div className="w-full max-w-[380px] flex flex-col gap-7">
        {/* Logo */}
        <div className="text-center mb-2">
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '34px', fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
            MirrorAI
          </h1>
          <p className="mt-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '14px', fontStyle: 'italic', fontWeight: 300, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>
            Mirror never lies
          </p>
        </div>

        {error && (
          <div className="px-4 py-2.5 rounded-lg" style={{ border: '1px solid rgba(192,97,74,0.25)', background: 'rgba(192,97,74,0.08)', color: '#E57373', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>
            {error}
          </div>
        )}
        {message && (
          <div className="px-4 py-2.5 rounded-lg" style={{ border: `1px solid rgba(212,175,55,0.2)`, background: 'rgba(212,175,55,0.06)', color: gold, fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>
            {message}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); isLogin ? handleLogin() : handleSignup(); }} className="flex flex-col gap-4">
          <div
            className="flex items-center gap-3 px-4 h-12 rounded-xl transition-all duration-200 focus-within:border-[#D4AF37]"
            style={{ background: '#111111', border: '1px solid #2A2A2A' }}
          >
            <Mail className="h-4 w-4 shrink-0" style={{ color: goldDim }} />
            <input
              type="email" value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="Email address"
              required autoComplete="email"
              className="bg-transparent w-full outline-none placeholder:text-[rgba(255,255,255,0.2)]"
              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, fontSize: '14px', color: '#E8E2DA' }}
            />
          </div>

          <div
            className="flex items-center gap-3 px-4 h-12 rounded-xl transition-all duration-200 focus-within:border-[#D4AF37]"
            style={{ background: '#111111', border: '1px solid #2A2A2A' }}
          >
            <Lock className="h-4 w-4 shrink-0" style={{ color: goldDim }} />
            <input
              type="password" value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Password"
              required minLength={6}
              autoComplete={isLogin ? "current-password" : "new-password"}
              className="bg-transparent w-full outline-none placeholder:text-[rgba(255,255,255,0.2)]"
              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, fontSize: '14px', color: '#E8E2DA' }}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => { setTab(isLogin ? "signup" : "login"); setPassword(""); setError(""); setMessage(""); }}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}
            >
              {isLogin ? (
                <>No account? <span style={{ color: gold, fontWeight: 500 }}>Sign up</span></>
              ) : (
                <>Have an account? <span style={{ color: gold, fontWeight: 500 }}>Sign in</span></>
              )}
            </button>
            {isLogin && (
              <button
                type="button" onClick={handleForgotPassword}
                className="hover:underline transition-all"
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: goldDim }}
              >
                Forgot?
              </button>
            )}
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full h-12 rounded-[10px] transition-all duration-200 disabled:opacity-50 hover:brightness-110 active:scale-[0.98]"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase', background: gold, color: '#000000' }}
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>

      <p
        className="fixed bottom-5 left-0 right-0 text-center"
        style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '7px', fontWeight: 500, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}
      >
        Colour Store Preset Universe
      </p>
    </div>
  );
};

export default Auth;
