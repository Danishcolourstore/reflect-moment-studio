import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const gold = "#D4AF37";
const goldDim = "rgba(212,175,55,0.5)";

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

        {/* Back button + title */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/login")} className="transition-colors hover:opacity-80" style={{ color: goldDim }}>
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', fontWeight: 500, color: '#FFFFFF', letterSpacing: '0.04em' }}>
            Forgot Password
          </h2>
        </div>

        {error && (
          <div className="px-4 py-2.5 rounded-lg" style={{ border: '1px solid rgba(192,97,74,0.25)', background: 'rgba(192,97,74,0.08)', color: '#E57373', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>
            {error}
          </div>
        )}

        {sent ? (
          <div className="flex flex-col items-center gap-5 py-4">
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 1.7 }}>
              We sent a reset link to <span style={{ color: gold, fontWeight: 500 }}>{email}</span>. Check your inbox and spam folder.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="hover:underline transition-all"
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: gold }}
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
              Enter your email and we'll send you a password reset link.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

              <button
                type="submit" disabled={submitting}
                className="w-full h-12 rounded-[10px] transition-all duration-200 disabled:opacity-50 hover:brightness-110 active:scale-[0.98]"
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase', background: gold, color: '#000000' }}
              >
                {submitting ? "Sending…" : "Send Reset Link"}
              </button>
            </form>

            <p className="text-center">
              <button
                onClick={() => navigate("/login")}
                className="hover:underline transition-all"
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}
              >
                Back to <span style={{ color: gold, fontWeight: 500 }}>Sign In</span>
              </button>
            </p>
          </>
        )}
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

export default ForgotPasswordPage;
