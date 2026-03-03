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
    <div
      className="flex flex-col items-center justify-center min-h-screen"
      style={{ background: "var(--bg-primary)", padding: "24px 20px" }}
    >
      {/* Card */}
      <div
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border)",
          borderRadius: 24,
          padding: "40px 32px",
          width: "100%",
          maxWidth: 400,
          boxShadow: "var(--card-shadow)",
          animation: "slideUp 0.5s ease forwards",
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 32,
            fontWeight: 400,
            fontStyle: "italic",
            color: "var(--text-primary)",
            textAlign: "center",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          Enter OTP to Start
        </h1>

        <p
          style={{
            fontFamily: "Jost, sans-serif",
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            textAlign: "center",
            marginTop: 8,
          }}
        >
          Contact Danish to get your access code
        </p>

        {/* Divider */}
        <div
          className="mx-auto"
          style={{ height: 1, width: 48, background: "var(--border)", marginTop: 20, marginBottom: 20 }}
        />

        {/* Contact buttons */}
        <div className="flex gap-2.5">
          <a
            href="https://wa.me/919605761589"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 transition-all duration-200 hover:opacity-80"
            style={{
              height: 44,
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              borderRadius: 100,
              fontFamily: "Jost, sans-serif",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: "var(--text-secondary)",
              textDecoration: "none",
            }}
          >
            <MessageCircle style={{ width: 14, height: 14 }} />
            WhatsApp
          </a>
          <a
            href="tel:+919605761589"
            className="flex-1 flex items-center justify-center gap-1.5 transition-all duration-200 hover:opacity-80"
            style={{
              height: 44,
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              borderRadius: 100,
              fontFamily: "Jost, sans-serif",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: "var(--text-secondary)",
              textDecoration: "none",
            }}
          >
            <Phone style={{ width: 14, height: 14 }} />
            Call
          </a>
        </div>

        {/* OTP Input */}
        <div
          className="flex items-center"
          style={{
            marginTop: 24,
            height: 52,
            paddingLeft: 16,
            paddingRight: 16,
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border)",
            borderRadius: 12,
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
            className="bg-transparent w-full outline-none"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 400,
              fontSize: 22,
              color: "var(--text-primary)",
              letterSpacing: "0.35em",
              textAlign: "center",
              border: "none",
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              marginTop: 16,
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid var(--danger)",
              background: "var(--bg-tertiary)",
              fontFamily: "Jost, sans-serif",
              fontSize: 12,
              color: "var(--danger)",
              textAlign: "center",
              lineHeight: 1.5,
              animation: "slideUp 0.3s ease",
            }}
          >
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={code.length < 6}
          className="w-full transition-all duration-200 hover:opacity-90 disabled:opacity-40"
          style={{
            marginTop: 20,
            height: 52,
            background: "var(--accent)",
            border: "none",
            borderRadius: 8,
            fontFamily: "Jost, sans-serif",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: "var(--bg-primary)",
            cursor: "pointer",
          }}
        >
          Verify & Continue
        </button>
      </div>

      {/* Bottom branding */}
      <p
        style={{
          marginTop: 48,
          fontFamily: "Jost, sans-serif",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.45em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          opacity: 0.6,
        }}
      >
        Colour Store Preset Universe
      </p>
    </div>
  );
};

export default VerifyOTP;
