import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

      if (supaError) {
        toast.error(supaError.message);
      } else {
        setSent(true);
        toast.success("Reset link sent. Check your inbox.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-display italic text-3xl font-semibold text-primary tracking-tight">MirrorAI</h1>
          <div className="w-6 h-px bg-primary/30 mx-auto" />
          <p className="text-[9px] text-muted-foreground/50 tracking-[0.2em] uppercase font-medium">Reflections of Your Moments</p>
        </div>

        <div className="bg-card border border-border p-8">
          <div className="flex items-center gap-2.5 mb-6">
            <button onClick={() => navigate("/login")} className="text-muted-foreground/40 hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h2 className="font-display text-xl font-semibold text-foreground">Forgot Password</h2>
          </div>

          {sent ? (
            <div className="space-y-3 text-center py-2">
              <p className="text-[13px] text-foreground leading-relaxed">
                We have sent a reset link to <span className="font-medium">{email}</span>. Please check your inbox and spam folder.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="text-[11px] text-primary hover:text-primary/80 transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              <p className="text-[12px] text-muted-foreground/60 mb-5 leading-relaxed">
                Enter your email address and we will send you a password reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">Email Address</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="bg-background border-border h-10 text-[13px]"
                  />
                  {error && (
                    <p className="text-[10px] text-destructive/70 mt-1">{error}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/85 text-primary-foreground h-10 text-[11px] tracking-[0.12em] uppercase font-medium mt-2"
                  disabled={submitting}
                >
                  {submitting ? "Sending…" : "Send Reset Link"}
                </Button>
              </form>

              <p className="mt-6 text-center">
                <button
                  onClick={() => navigate("/login")}
                  className="text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors"
                >
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
