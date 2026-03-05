import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, MessageCircle } from "lucide-react";

const gold = "#D4AF37";
const goldDim = "rgba(212,175,55,0.5)";

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
    <div className="fixed inset-0 flex items-center justify-center px-6" style={{ background: '#0B0B0B' }}>
      <div className="w-full max-w-[380px] flex flex-col gap-7">
        {/* Logo */}
        <div className="text-center mb-2">
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '34px', fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
            MirrorAI
          </h1>
          <p className="mt-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '14px', fontStyle: 'italic', fontWeight: 300, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>
            Enter OTP to Start Your Mirror Gallery
          </p>
        </div>

        {/* Subtitle */}
        <p className="text-center" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 400, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Contact Danish to get your access code
        </p>

        {/* Contact buttons */}
        <div className="flex gap-3">
          <a
            href="https://wa.me/919605761589"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl transition-all duration-200 hover:brightness-110"
            style={{ background: 'rgba(37, 211, 102, 0.1)', border: '1px solid rgba(37, 211, 102, 0.2)', color: '#25D366', fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' }}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </a>
          <a
            href="tel:+919605761589"
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl transition-all duration-200 hover:brightness-110"
            style={{ background: 'rgba(212,175,55,0.08)', border: `1px solid rgba(212,175,55,0.2)`, color: gold, fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' }}
          >
            <Phone className="h-3.5 w-3.5" />
            Call
          </a>
        </div>

        {/* OTP Input */}
        <div
          className="flex items-center px-4 h-12 rounded-xl transition-all duration-200 focus-within:border-[#D4AF37]"
          style={{ background: '#111111', border: '1px solid #2A2A2A' }}
        >
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
            placeholder="Enter OTP"
            className="bg-transparent w-full outline-none placeholder:text-[rgba(255,255,255,0.2)] text-center"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, fontSize: '18px', color: '#E8E2DA', letterSpacing: '0.35em' }}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-2.5 rounded-lg" style={{ border: '1px solid rgba(192,97,74,0.25)', background: 'rgba(192,97,74,0.08)', color: '#E57373', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={code.length < 6}
          className="w-full h-12 rounded-[10px] transition-all duration-200 disabled:opacity-40 hover:brightness-110 active:scale-[0.98]"
          style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase', background: gold, color: '#000000' }}
        >
          Verify & Continue
        </button>
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

export default VerifyOTP;
