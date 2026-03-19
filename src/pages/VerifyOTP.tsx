import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, MessageCircle } from "lucide-react";

const ADMIN_OTP = "470815";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");

    if (code === ADMIN_OTP) {
      navigate("/verify-access");
    } else {
      setError("Invalid code. Please contact admin.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center px-6 bg-background">
      <div className="w-full max-w-[400px] flex flex-col">
        <div className="text-center mb-10">
          <h1 className="text-[28px] font-semibold text-foreground tracking-tight">Mirror AI</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Enter your access code to continue</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-8 shadow-sm space-y-6">
          <p className="text-sm text-muted-foreground text-center">Contact admin to receive your OTP</p>

          <div className="flex gap-3">
            <a
              href="https://wa.me/919605761589"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border border-border text-sm text-foreground hover:bg-secondary transition-colors"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
            <a
              href="tel:+919605761589"
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border border-border text-sm text-foreground hover:bg-secondary transition-colors"
            >
              <Phone className="h-4 w-4" /> Call
            </a>
          </div>

          <div className="flex items-center px-4 h-12 rounded-lg border border-border bg-background transition-all focus-within:ring-2 focus-within:ring-ring">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setError("");
              }}
              placeholder="Enter 6-digit OTP"
              className="bg-transparent w-full outline-none text-center text-lg font-medium text-foreground placeholder:text-muted-foreground/40 tracking-[0.3em]"
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={code.length < 6}
            className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
          >
            Verify & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
