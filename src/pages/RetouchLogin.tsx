import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "retouch_session_ts";
const OTP_KEY = "retouch_otp_verified";
const UNIVERSAL_OTP = "1963";
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
    const interval = setInterval(check, 30_000); // check every 30s
    return () => clearInterval(interval);
  }, []);

  const verify = (otp: string): boolean => {
    if (otp === UNIVERSAL_OTP) {
      sessionStorage.setItem(OTP_KEY, "true");
      sessionStorage.setItem(SESSION_KEY, Date.now().toString());
      setNeedsOtp(false);

      // Notify admin via edge function (fire & forget)
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

export default function RetouchLogin() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [introPhase, setIntroPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setIntroPhase(1), 300);
    const t2 = setTimeout(() => setIntroPhase(2), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleSubmit = () => {
    if (otp === UNIVERSAL_OTP) {
      sessionStorage.setItem(OTP_KEY, "true");
      sessionStorage.setItem(SESSION_KEY, Date.now().toString());

      supabase.functions.invoke("send-comment-notification", {
        body: {
          type: "retouch_login",
          message: `Retouch login at ${new Date().toLocaleString()}`,
        },
      }).catch(() => {});

      navigate("/colour-store");
    } else {
      setError("Invalid access code");
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

        {/* OTP input */}
        <div
          style={{
            opacity: introPhase >= 2 ? 1 : 0,
            transform: introPhase >= 2 ? "translateY(0)" : "translateY(12px)",
            transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)",
            width: "100%",
          }}
        >
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={otp}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 4);
              setOtp(v);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && otp.length === 4 && handleSubmit()}
            placeholder="Enter access code"
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
              background: otp.length === 4 ? "#E8C97A" : "rgba(232,201,122,0.15)",
              color: otp.length === 4 ? "#080808" : "rgba(232,201,122,0.4)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Continue
          </button>

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

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');
      `}</style>
    </div>
  );
}
