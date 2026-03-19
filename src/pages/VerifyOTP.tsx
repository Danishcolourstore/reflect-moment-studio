import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, MessageCircle, ShieldCheck } from "lucide-react";
import { ADMIN_OTP, USER_CODES } from "@/config/auth";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");

    if (code === ADMIN_OTP) {
      localStorage.setItem("admin_otp", code);
      navigate("/verify-access");
      return;
    }

    if (USER_CODES.includes(code)) {
      localStorage.removeItem("admin_otp");
      navigate("/verify-access");
      return;
    }

    setError("This code isn’t valid. Please check or contact support.");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center px-6 bg-background">
      <div className="w-full max-w-[420px] flex flex-col">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-[30px] font-semibold tracking-tight text-foreground">Mirror AI</h1>

          <p className="mt-2 text-sm text-muted-foreground">Secure access to your gallery</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border border-border p-8 shadow-sm space-y-6">
          {/* Trust line */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            Secure & private access
          </div>

          {/* Input */}
          <div className="flex items-center px-4 h-12 rounded-lg border border-border bg-background focus-within:ring-2 focus-within:ring-ring transition-all">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setError("");
              }}
              placeholder="Enter access code"
              className="w-full text-center text-lg font-medium bg-transparent outline-none tracking-[0.3em] placeholder:text-muted-foreground/40"
            />
          </div>

          {/* Error */}
          {error && <div className="text-sm text-destructive text-center">{error}</div>}

          {/* CTA */}
          <button
            onClick={handleSubmit}
            disabled={code.length < 6}
            className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
          >
            Continue
          </button>

          {/* Divider */}
          <div className="text-center text-xs text-muted-foreground">Need access?</div>

          {/* Contact */}
          <div className="flex gap-3">
            <a
              href="https://wa.me/919605761589"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border border-border text-sm hover:bg-secondary transition-colors"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>

            <a
              href="tel:+919605761589"
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border border-border text-sm hover:bg-secondary transition-colors"
            >
              <Phone className="h-4 w-4" /> Call
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">Trusted by photographers • Instant delivery</p>
      </div>
    </div>
  );
};

export default VerifyOTP;
