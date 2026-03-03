import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, ShieldAlert, LogOut, Phone, MessageCircle } from "lucide-react";

const VALID_PINS = ["291219", "010126", "141220"];
const SESSION_KEY = "mirrorai_access_verified";
const MAX_ATTEMPTS = 3;
const LOCKOUT_SECONDS = 60;

export default function VerifyAccess() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [lockoutEnd, setLockoutEnd] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [values, setValues] = useState<string[]>(Array(6).fill(""));
  const [shaking, setShaking] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "true") {
      const redirect = sessionStorage.getItem("redirectAfterLogin");
      sessionStorage.removeItem("redirectAfterLogin");
      navigate(redirect || "/dashboard", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!lockoutEnd) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockoutEnd - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockoutEnd(null);
        setCountdown(0);
        setAttempts(0);
        setError("");
      } else {
        setCountdown(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutEnd]);

  // Auto-focus first input on mount
  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 300);
  }, []);

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 400);
  };

  const handleVerify = useCallback(
    async (pin: string) => {
      if (verifying || lockoutEnd) return;
      setVerifying(true);
      setError("");

      if (VALID_PINS.includes(pin)) {
        sessionStorage.setItem(SESSION_KEY, "true");
        const redirect = sessionStorage.getItem("redirectAfterLogin");
        sessionStorage.removeItem("redirectAfterLogin");
        navigate(redirect || "/dashboard", { replace: true });
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        triggerShake();
        if (newAttempts >= MAX_ATTEMPTS) {
          const end = Date.now() + LOCKOUT_SECONDS * 1000;
          setLockoutEnd(end);
          setCountdown(LOCKOUT_SECONDS);
          setError("Too many incorrect attempts. Access locked.");
        } else {
          setError(
            `Incorrect OTP. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts !== 1 ? "s" : ""} remaining.`
          );
        }
        // Clear inputs on error
        setValues(Array(6).fill(""));
        setTimeout(() => inputRefs.current[0]?.focus(), 450);
      }
      setVerifying(false);
    },
    [attempts, verifying, lockoutEnd, navigate]
  );

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const next = [...values];
    next[index] = digit;
    setValues(next);
    setError("");

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (next.every((v) => v !== "") && next.join("").length === 6) {
      handleVerify(next.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...values];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setValues(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
    if (next.every((v) => v !== "") && next.join("").length === 6) {
      handleVerify(next.join(""));
    }
  };

  const handleSignOut = async () => {
    sessionStorage.removeItem(SESSION_KEY);
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <p style={{ fontFamily: "Jost, sans-serif", fontSize: 13, color: "var(--text-muted)" }}>Loading...</p>
      </div>
    );
  }

  const isLocked = lockoutEnd !== null && countdown > 0;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen"
      style={{ background: "var(--bg-primary)", padding: "24px 20px" }}
    >
      {/* Card */}
      <div
        className={shaking ? "otp-shake" : ""}
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
        {/* Shield Icon */}
        <div className="flex justify-center" style={{ marginBottom: 24 }}>
          <div
            className="flex items-center justify-center"
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
            }}
          >
            {isLocked ? (
              <ShieldAlert style={{ width: 28, height: 28, color: "var(--danger)" }} />
            ) : (
              <ShieldCheck style={{ width: 28, height: 28, color: "var(--accent)" }} />
            )}
          </div>
        </div>

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
          {isLocked ? "Access Locked" : "Enter Your OTP"}
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "Jost, sans-serif",
            fontSize: 13,
            fontWeight: 300,
            color: "var(--text-muted)",
            textAlign: "center",
            lineHeight: 1.6,
            marginTop: 8,
            maxWidth: 260,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {isLocked
            ? `Try again in ${countdown} seconds`
            : "Your OTP has been sent to Danish. Contact Danish to receive your access code."}
        </p>

        {!isLocked && (
          <>
            {/* Contact Buttons */}
            <div className="flex gap-2.5" style={{ marginTop: 20 }}>
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
              <a
                href="https://wa.me/919605761589?text=Hi%20Danish%2C%20I%20need%20my%20OTP%20to%20continue."
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
            </div>

            {/* OTP Inputs */}
            <div className="flex gap-2 justify-center" style={{ marginTop: 28 }}>
              {values.map((val, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={val}
                  disabled={verifying}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  className="otp-digit-input"
                  style={{
                    width: 44,
                    height: 52,
                    textAlign: "center",
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 24,
                    fontWeight: 400,
                    color: "var(--text-primary)",
                    background: val ? "var(--accent-light)" : "var(--bg-tertiary)",
                    border: `1.5px solid ${val ? "var(--accent)" : error ? "var(--danger)" : "var(--border)"}`,
                    borderRadius: 10,
                    outline: "none",
                    transition: "border 0.2s ease, background 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--accent)";
                    e.target.style.boxShadow = "0 0 0 3px var(--accent-focus-ring)";
                    e.target.style.background = "var(--card-bg)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = val ? "var(--accent)" : "var(--border)";
                    e.target.style.boxShadow = "none";
                    e.target.style.background = val ? "var(--accent-light)" : "var(--bg-tertiary)";
                  }}
                />
              ))}
            </div>

            {/* Verify Button */}
            <button
              onClick={() => {
                const pin = values.join("");
                if (pin.length === 6) handleVerify(pin);
              }}
              disabled={verifying || values.join("").length < 6}
              className="w-full transition-all duration-200 hover:opacity-90 disabled:opacity-40"
              style={{
                marginTop: 24,
                height: 52,
                background: error ? "var(--danger)" : "var(--accent)",
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
              {verifying ? "Verifying..." : error ? "Invalid OTP — Try Again" : "Verify & Continue"}
            </button>
          </>
        )}

        {/* Error Message */}
        {error && !isLocked && (
          <p
            style={{
              textAlign: "center",
              fontFamily: "Jost, sans-serif",
              fontSize: 13,
              color: "var(--danger)",
              marginTop: 16,
              animation: "slideUp 0.3s ease",
            }}
          >
            {error}
          </p>
        )}

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="flex items-center justify-center gap-1.5 w-full transition-colors duration-200 group"
          style={{
            marginTop: 20,
            background: "none",
            border: "none",
            fontFamily: "Jost, sans-serif",
            fontSize: 12,
            fontWeight: 400,
            color: "var(--text-muted)",
            cursor: "pointer",
          }}
        >
          <LogOut style={{ width: 12, height: 12 }} />
          <span className="group-hover:underline" style={{ textUnderlineOffset: 3 }}>
            Sign out
          </span>
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
}
