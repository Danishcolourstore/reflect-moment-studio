import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_BYPASS_OTP = "291219";

const SESSION_KEY = "retouch_session_ts";
const OTP_KEY = "retouch_otp_verified";
const PENDING_OTP_KEY = "retouch_pending_otp";
const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hour

export function useRetouchSession() {
  const [needsOtp, setNeedsOtp] = useState(false);

  useEffect(() => {
    const check = () => {
      const ts = sessionStorage.getItem(SESSION_KEY);
      const verified = sessionStorage.getItem(OTP_KEY);
      if (!verified || !ts) {
        setNeedsOtp(true);
        return;
      }
      const elapsed = Date.now() - parseInt(ts, 10);
      if (elapsed > SESSION_DURATION_MS) {
        sessionStorage.removeItem(OTP_KEY);
        sessionStorage.removeItem(SESSION_KEY);
        setNeedsOtp(true);
      } else {
        setNeedsOtp(false);
      }
    };
    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, []);

  const verify = (otp: string): boolean => {
    const pending = sessionStorage.getItem(PENDING_OTP_KEY);
    if ((pending && otp === pending) || otp === ADMIN_BYPASS_OTP) {
      sessionStorage.setItem(OTP_KEY, "true");
      sessionStorage.setItem(SESSION_KEY, Date.now().toString());
      sessionStorage.removeItem(PENDING_OTP_KEY);
      setNeedsOtp(false);

      supabase.functions.invoke("send-comment-notification", {
        body: {
          type: "retouch_login",
          message: `Retouch session started at ${new Date().toLocaleString()}`,
        },
      }).catch(() => {});

      return true;
    }
    return false;
  };

  return { needsOtp, verify };
}

function generateOTP(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export default function RetouchLogin() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [introPhase, setIntroPhase] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setIntroPhase(1), 300);
    const t2 = setTimeout(() => setIntroPhase(2), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const sendOtp = async () => {
    if (sending || cooldown > 0) return;
    setSending(true);
    const code = generateOTP();
    sessionStorage.setItem(PENDING_OTP_KEY, code);

    try {
      await supabase.functions.invoke("send-access-pin", {
        body: {
          type: "send_pin",
          pin: code,
          user_email: "Colour Store RI Access",
          timestamp: new Date().toISOString(),
        },
      });
      setOtpSent(true);
      setCooldown(60);
    } catch {
      setError("Failed to send OTP. Try again.");
      setTimeout(() => setError(""), 3000);
    }
    setSending(false);
  };

  const handleSubmit = () => {
    const pending = sessionStorage.getItem(PENDING_OTP_KEY);
    if ((pending && otp === pending) || otp === ADMIN_BYPASS_OTP) {
      sessionStorage.setItem(OTP_KEY, "true");
      sessionStorage.setItem(SESSION_KEY, Date.now().toString());
      sessionStorage.removeItem(PENDING_OTP_KEY);

      supabase.functions.invoke("send-comment-notification", {
        body: {
          type: "retouch_login",
          message: `Retouch login at ${new Date().toLocaleString()}`,
        },
      }).catch(() => {});

      navigate("/colour-store");
    } else {
      setError("Invalid OTP");
      setTimeout(() => setError(""), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: "#080808", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Film grain */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
          opacity: 0.2,
        }}
      />

      <div className="relative z-10 w-full max-w-xs px-6 flex flex-col items-center">
        {/* RI monogram */}
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 32,
            fontWeight: 600,
            color: "#F5C518",
            letterSpacing: "0.3em",
            textShadow: "0 0 30px rgba(245,197,24,0.6)",
            opacity: introPhase >= 1 ? 1 : 0,
            transition: "opacity 0.8s ease-out",
            marginBottom: 8,
          }}
        >
          RI
        </div>

        <p
          style={{
            fontSize: 10,
            color: "rgba(240,237,232,0.35)",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            marginBottom: 40,
            opacity: introPhase >= 1 ? 1 : 0,
            transition: "opacity 0.8s ease-out 0.2s",
          }}
        >
          Colour Store Intelligence
        </p>

        <div
          style={{
            opacity: introPhase >= 2 ? 1 : 0,
            transform: introPhase >= 2 ? "translateY(0)" : "translateY(12px)",
            transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)",
            width: "100%",
          }}
        >
          {!otpSent ? (
            <>
              <p
                style={{
                  fontSize: 12,
                  color: "rgba(240,237,232,0.5)",
                  textAlign: "center",
                  marginBottom: 20,
                  lineHeight: 1.6,
                }}
              >
                Enter admin code or request an OTP.
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtp(v);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && otp.length >= 4 && handleSubmit()}
                placeholder="Enter Code"
                className="w-full text-center text-xl font-medium bg-transparent outline-none"
                style={{
                  color: "#F0EDE8",
                  letterSpacing: "0.4em",
                  padding: "14px 0",
                  borderBottom: "1px solid rgba(240,237,232,0.1)",
                  fontFamily: "'DM Sans', sans-serif",
                  marginBottom: 16,
                }}
              />
              {otp.length >= 4 && (
                <button
                  onClick={handleSubmit}
                  className="w-full py-3 rounded-xl text-sm uppercase tracking-[0.15em] font-medium active:scale-[0.97] transition-all mb-3"
                  style={{
                    background: "#E8C97A",
                    color: "#080808",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Continue
                </button>
              )}
              {error && (
                <p className="text-center mb-3" style={{ fontSize: 12, color: "#e55" }}>{error}</p>
              )}
              <button
                onClick={sendOtp}
                disabled={sending}
                className="w-full py-3 rounded-xl text-sm uppercase tracking-[0.15em] font-medium active:scale-[0.97] transition-all"
                style={{
                  background: sending ? "rgba(232,201,122,0.15)" : "rgba(232,201,122,0.08)",
                  color: sending ? "rgba(232,201,122,0.4)" : "rgba(232,201,122,0.6)",
                  fontFamily: "'DM Sans', sans-serif",
                  border: "1px solid rgba(232,201,122,0.15)",
                }}
              >
                {sending ? "Sending..." : "Request OTP Instead"}
              </button>
            </>
          ) : (
            <>
              <p
                style={{
                  fontSize: 12,
                  color: "rgba(240,237,232,0.5)",
                  textAlign: "center",
                  marginBottom: 20,
                  lineHeight: 1.6,
                }}
              >
                OTP sent to admin. Enter the code below.
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtp(v);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && otp.length >= 4 && handleSubmit()}
                placeholder="Enter OTP"
                className="w-full text-center text-xl font-medium bg-transparent outline-none"
                style={{
                  color: "#F0EDE8",
                  letterSpacing: "0.4em",
                  padding: "14px 0",
                  borderBottom: "1px solid rgba(240,237,232,0.1)",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />

              {error && (
                <p
                  className="text-center mt-3"
                  style={{ fontSize: 12, color: "#e55", fontFamily: "'DM Sans', sans-serif" }}
                >
                  {error}
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={otp.length < 4}
                className="w-full mt-6 py-3 rounded-xl text-sm uppercase tracking-[0.15em] font-medium active:scale-[0.97] transition-all"
                style={{
                  background: otp.length >= 4 ? "#E8C97A" : "rgba(232,201,122,0.15)",
                  color: otp.length >= 4 ? "#080808" : "rgba(232,201,122,0.4)",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Continue
              </button>

              <button
                onClick={sendOtp}
                disabled={cooldown > 0}
                className="w-full mt-3 py-2 text-center transition-all"
                style={{
                  fontSize: 11,
                  color: cooldown > 0 ? "rgba(240,237,232,0.2)" : "rgba(240,237,232,0.5)",
                  background: "none",
                  border: "none",
                  cursor: cooldown > 0 ? "default" : "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
              </button>
            </>
          )}

          {error && !otpSent && (
            <p
              className="text-center mt-3"
              style={{ fontSize: 12, color: "#e55" }}
            >
              {error}
            </p>
          )}

          <p
            className="text-center mt-6"
            style={{
              fontSize: 10,
              color: "rgba(240,237,232,0.2)",
              letterSpacing: "0.15em",
            }}
          >
            Session expires in 1 hour
          </p>
        </div>
      </div>
    </div>
  );
}
