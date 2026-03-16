import { forwardRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AuthProps {
  initialView?: "landing" | "login" | "signup" | "forgot";
}

const Auth = forwardRef<HTMLDivElement, AuthProps>(function Auth({ initialView }, ref) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [tab, setTab] = useState<"login" | "signup">(initialView === "signup" ? "signup" : "login");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else navigate("/verify-access");
    setLoading(false);
  };

  const handleSignup = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else navigate("/verify-otp");
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) { setError("Enter your email address first"); return; }
    setError("");
    setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setError(error.message);
    else setMessage("Password reset link sent to your email");
  };

  const isLogin = tab === "login";

  return (
    <div ref={ref} className="fixed inset-0 flex items-center justify-center px-6 bg-background">
      <div className="w-full max-w-[400px] flex flex-col">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-[28px] font-semibold text-foreground tracking-tight">
            Mirror AI
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Photography platform for professionals
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
          {/* Tab toggle */}
          <div className="flex rounded-lg bg-secondary p-1 mb-6">
            {(["login", "signup"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setPassword(""); setError(""); setMessage(""); }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                  tab === t
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-primary/5 border border-primary/10 text-foreground text-sm">
              {message}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={(e) => { e.preventDefault(); isLogin ? handleLogin() : handleSignup(); }}
            className="flex flex-col gap-4"
          >
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="flex items-center gap-3 px-4 h-11 rounded-lg border border-border bg-background transition-all focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="bg-transparent w-full outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="flex items-center gap-3 px-4 h-11 rounded-lg border border-border bg-background transition-all focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent">
                <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder={isLogin ? "Enter password" : "Create password (min 6 chars)"}
                  required
                  minLength={6}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className="bg-transparent w-full outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="shrink-0 p-0.5 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Bottom link */}
        <p className="text-center mt-6 text-sm text-muted-foreground">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => { setTab(isLogin ? "signup" : "login"); setPassword(""); setError(""); setMessage(""); }}
            className="text-foreground font-medium hover:underline"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
});

Auth.displayName = "Auth";
export default Auth;
