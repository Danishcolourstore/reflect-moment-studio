import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, MessageCircle } from "lucide-react";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");
    const validCodes = ["141120", "291219", "150847"];
    if (validCodes.includes(code)) {
      navigate("/verify-access");
    } else {
      setError("Invalid code. Please contact Danish.");
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden w-screen bg-[hsl(20,22%,5%)]">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/images/login-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(50px) saturate(0.5) brightness(0.35)",
          transform: "scale(1.25) translateZ(0)",
        }}
      />
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.50)" }} />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        <div
          className="w-full max-w-[400px] flex flex-col gap-6 p-9 sm:p-10"
          style={{
            background: "rgba(44, 33, 24, 0.45)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 32px 80px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.03)",
          }}
        >
          {/* Heading */}
          <div className="text-center">
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                fontSize: "clamp(1.4rem, 4vw, 1.8rem)",
                fontWeight: 300,
                color: "#FFFFFF",
                letterSpacing: "0.06em",
                lineHeight: 1.3,
              }}
            >
              Enter OTP to Start Your Mirror Gallery
            </h1>
            <p
              className="mt-3"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "10px",
                fontWeight: 400,
                color: "rgba(232,226,218,0.45)",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
              }}
            >
              Contact Danish to get your access code
            </p>
          </div>

          <div className="h-px w-12 mx-auto" style={{ background: "rgba(255,255,255,0.06)" }} />

          {/* Contact buttons */}
          <div className="flex gap-3">
            <a
              href="https://wa.me/919605761589"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl transition-all duration-200 hover:opacity-90"
              style={{
                background: "rgba(37, 211, 102, 0.15)",
                border: "1px solid rgba(37, 211, 102, 0.25)",
                color: "#25D366",
                fontFamily: "Inter, sans-serif",
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </a>
            <a
              href="tel:+919605761589"
              className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl transition-all duration-200 hover:opacity-90"
              style={{
                background: "rgba(199, 165, 100, 0.12)",
                border: "1px solid rgba(199, 165, 100, 0.25)",
                color: "#C7A564",
                fontFamily: "Inter, sans-serif",
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              <Phone className="h-3.5 w-3.5" />
              Call
            </a>
          </div>

          {/* OTP Input */}
          <div
            className="flex items-center px-4 h-12 rounded-xl"
            style={{
              background: "rgba(26,24,22,0.45)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setError("");
              }}
              placeholder="Enter OTP"
              className="bg-transparent w-full outline-none placeholder:text-[rgba(139,115,85,0.3)] text-center"
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 400,
                fontSize: "18px",
                color: "#E8E2DA",
                letterSpacing: "0.35em",
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              className="px-4 py-2.5 rounded-lg text-center"
              style={{
                border: "1px solid rgba(229,115,115,0.15)",
                background: "rgba(229,115,115,0.06)",
                color: "#E57373",
                fontSize: "11px",
                lineHeight: "1.5",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={code.length < 6}
            className="w-full h-12 rounded-xl transition-all duration-200 disabled:opacity-40"
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              fontSize: "10px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              background: "rgba(232,226,218,0.9)",
              color: "#2C2118",
            }}
          >
            Verify & Continue
          </button>
        </div>

        <p
          className="mt-14"
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "0.45em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          Colour Store Preset Universe
        </p>
      </div>
    </div>
  );
};

export default VerifyOTP;
