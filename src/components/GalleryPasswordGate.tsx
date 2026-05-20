import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface GalleryPasswordGateProps {
  eventId: string;
  eventTitle: string;
  studioLogoUrl?: string | null;
  onUnlock: () => void;
}

export function GalleryPasswordGate({ eventId, eventTitle, studioLogoUrl, onUnlock }: GalleryPasswordGateProps) {
  const [input, setInput] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [shake, setShake] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checking || !input.trim()) return;
    setChecking(true);
    try {
      const { data, error } = await (supabase.rpc as any)("verify_gallery_password", {
        event_id: eventId,
        password_input: input,
      });
      if (error) throw error;
      if (data?.valid) {
        localStorage.setItem(`mirrorai_gallery_pw_verified_${eventId}`, "true");
        if (data?.token) localStorage.setItem(`gallery_token:${eventId}`, data.token);
        onUnlock();
      } else {
        toast.error("That didn't match. Try again.");
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "var(--paper, #FAFAF8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          border: "1px solid var(--rule)",
          padding: 40,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {studioLogoUrl ? (
          <img
            src={studioLogoUrl}
            alt=""
            style={{ height: 48, margin: "0 auto", objectFit: "contain" }}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 20,
            fontWeight: 300,
            fontStyle: "italic",
            color: "var(--ink)",
            margin: 0,
          }}>
            Mirror
          </p>
        )}

        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 24,
          fontWeight: 300,
          fontStyle: "italic",
          color: "var(--ink)",
          margin: 0,
        }}>
          {eventTitle}
        </h1>

        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 16,
          fontWeight: 300,
          fontStyle: "italic",
          color: "var(--ink-muted)",
          margin: 0,
        }}>
          Private gallery
        </p>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          fontWeight: 300,
          color: "var(--ink-muted)",
          margin: 0,
        }}>
          Enter the password to view
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}
        >
          <div
            style={{
              position: "relative",
              animation: shake ? "shake 0.4s ease" : undefined,
            }}
          >
            <Lock
              size={14}
              strokeWidth={1.5}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--ink-muted)",
              }}
            />
            <input
              type={showPw ? "text" : "password"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter password"
              autoFocus
              style={{
                width: "100%",
                border: "1px solid rgba(17,17,17,0.2)",
                background: "transparent",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                fontWeight: 300,
                padding: "10px 40px",
                color: "var(--ink)",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(184,149,63,0.6)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(17,17,17,0.2)")}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--ink-muted)",
                padding: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              {showPw
                ? <EyeOff size={14} strokeWidth={1.5} />
                : <Eye size={14} strokeWidth={1.5} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={checking}
            style={{
              border: "1px solid #B8953F",
              background: "transparent",
              color: "var(--ink)",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              fontWeight: 300,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "12px 20px",
              cursor: checking ? "not-allowed" : "pointer",
              opacity: checking ? 0.6 : 1,
              width: "100%",
            }}
          >
            {checking ? "Verifying…" : "View Gallery"}
          </button>
        </form>
      </div>
    </div>
  );
}
