import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const CheetahLanding = () => {
  const navigate = useNavigate();
  const [cheetahProgress, setCheetahProgress] = useState(-120);
  const [cheetahVisible, setCheetahVisible] = useState(false);
  const [fadeOpacity, setFadeOpacity] = useState(0);
  const animRef = useRef(0);
  const startRef = useRef(0);

  const skipIntro = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    navigate("/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setCheetahVisible(true);
      startRef.current = performance.now();

      const runDuration = 4500;

      const tick = (now: number) => {
        const elapsed = now - startRef.current;
        const t = Math.min(elapsed / runDuration, 1);
        const eased = easeInOutCubic(t);
        setCheetahProgress(-120 + eased * 240);

        if (t >= 1) {
          setFadeOpacity(1);
          setTimeout(() => navigate("/login", { replace: true }), 800);
          return;
        }
        animRef.current = requestAnimationFrame(tick);
      };

      animRef.current = requestAnimationFrame(tick);
    }, 300);

    return () => {
      clearTimeout(showTimer);
      cancelAnimationFrame(animRef.current);
    };
  }, [navigate]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        background: "#050505",
        overflow: "hidden",
      }}
    >
      {/* Skip Intro */}
      <button
        onClick={skipIntro}
        style={{
          position: "absolute",
          top: 24,
          right: 28,
          zIndex: 100,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8,
          padding: "8px 20px",
          fontFamily: "Jost, sans-serif",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "1.5px",
          textTransform: "uppercase" as const,
          color: "rgba(255,255,255,0.4)",
          cursor: "pointer",
          backdropFilter: "blur(8px)",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "rgba(212,175,55,0.9)";
          e.currentTarget.style.borderColor = "rgba(212,175,55,0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "rgba(255,255,255,0.4)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
        }}
      >
        Skip Intro
      </button>

      {/* Cheetah */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(${cheetahProgress}%, -50%)`,
          willChange: "transform",
          opacity: cheetahVisible ? 1 : 0,
          transition: "opacity 0.4s ease-out",
        }}
      >
        <img
          src="/images/cheetah.png"
          alt=""
          draggable={false}
          style={{
            width: "min(600px, 70vw)",
            height: "auto",
            objectFit: "contain",
            display: "block",
            pointerEvents: "none",
            userSelect: "none",
            background: "transparent",
          }}
        />
      </div>

      {/* Fade overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#050505",
          opacity: fadeOpacity,
          transition: "opacity 0.8s ease-in",
          pointerEvents: "none",
          zIndex: 50,
        }}
      />
    </div>
  );
};

export default CheetahLanding;
