import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      const { error: supaError } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (supaError) toast.error(supaError.message);
      else { setSent(true); toast.success("Reset link sent. Check your inbox."); }
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center px-6 bg-background">
      <div className="w-full max-w-[400px] flex flex-col">
        <div className="text-center mb-10">
          <h1 className="text-[28px] font-semibold text-foreground tracking-tight">Mirror AI</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Photography platform for professionals</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/login")} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h2 className="text-base font-medium text-foreground">Forgot Password</h2>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                We sent a reset link to <span className="text-foreground font-medium">{email}</span>. Check your inbox and spam folder.
              </p>
              <button onClick={() => navigate("/login")} className="text-sm font-medium text-foreground hover:underline">
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Enter your email and we'll send you a password reset link.</p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex items-center gap-3 px-4 h-11 rounded-lg border border-border bg-background transition-all focus-within:ring-2 focus-within:ring-ring">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    type="email" value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="you@example.com"
                    required autoComplete="email"
                    className="bg-transparent w-full outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
                  />
                </div>
                <button
                  type="submit" disabled={submitting}
                  className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                >
                  {submitting ? "Sending…" : "Send Reset Link"}
                </button>
              </form>
              <p className="text-center">
                <button onClick={() => navigate("/login")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Back to Sign In
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
