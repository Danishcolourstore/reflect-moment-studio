import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const CheetahLanding = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"running" | "trail" | "done">("running");

  useEffect(() => {
    const trailTimer = setTimeout(() => setPhase("trail"), 3000);
    const doneTimer = setTimeout(() => {
      setPhase("done");
      navigate("/login", { replace: true });
    }, 4200);
    return () => {
      clearTimeout(trailTimer);
      clearTimeout(doneTimer);
    };
  }, [navigate]);

  const handleSkip = () => {
    setPhase("done");
    navigate("/login", { replace: true });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        background: "linear-gradient(180deg, #050505 0%, #0a0808 50%, #080604 100%)",
        overflow: "hidden",
        opacity: phase === "trail" ? 0 : 1,
        transition: "opacity 1.2s ease-out",
      }}
    >
      {/* Skip Intro */}
      <button
        onClick={handleSkip}
        style={{
          position: "absolute",
          top: 24,
          right: 28,
          zIndex: 100,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          padding: "8px 20px",
          fontFamily: "Jost, sans-serif",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.5)",
          cursor: "pointer",
          backdropFilter: "blur(8px)",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "rgba(212,175,55,0.9)";
          e.currentTarget.style.borderColor = "rgba(212,175,55,0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "rgba(255,255,255,0.5)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
        }}
      >
        Skip Intro
      </button>

      {/* Glossy mirror floor */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "35%",
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(212,175,55,0.02) 40%, rgba(212,175,55,0.05) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Floor line */}
      <div
        style={{
          position: "absolute",
          bottom: "35%",
          left: 0,
          right: 0,
          height: 1,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.12) 30%, rgba(212,175,55,0.22) 50%, rgba(212,175,55,0.12) 70%, transparent 100%)",
        }}
      />

      {/* Speed lines */}
      <div
        style={{
          position: "absolute",
          bottom: "38%",
          left: 0,
          right: 0,
          height: 120,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 12 + i * 18,
              height: 1,
              background: `linear-gradient(90deg, transparent, rgba(212,175,55,${0.06 + i * 0.025}), transparent)`,
              width: "45%",
              animation: `cheetah-speed-line 3s ease-in-out ${i * 0.12}s forwards`,
            }}
          />
        ))}
      </div>

      {/* Cheetah running left to right */}
      <div
        style={{
          position: "absolute",
          bottom: "28%",
          left: 0,
          width: "100%",
          animation: "cheetah-run 3s cubic-bezier(0.25, 0.1, 0.25, 1) forwards",
        }}
      >
        <div style={{ filter: "blur(0.3px)", position: "relative" }}>
          <img
            src="/images/cheetah.png"
            alt=""
            draggable={false}
            style={{
              width: "min(500px, 70vw)",
              height: "auto",
              objectFit: "contain",
              display: "block",
              pointerEvents: "none",
              userSelect: "none",
            }}
          />
          {/* Mirror reflection */}
          <img
            src="/images/cheetah.png"
            alt=""
            draggable={false}
            style={{
              width: "min(500px, 70vw)",
              height: "auto",
              objectFit: "contain",
              display: "block",
              pointerEvents: "none",
              userSelect: "none",
              transform: "scaleY(-1) translateY(-8px)",
              opacity: 0.22,
              filter: "blur(4px)",
              maskImage:
                "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 65%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 65%)",
            }}
          />
        </div>
      </div>

      {/* Glowing energy particles */}
      <div
        style={{
          position: "absolute",
          bottom: "32%",
          left: 0,
          right: 0,
          height: 60,
          pointerEvents: "none",
          animation: "cheetah-particle-fade 3.5s ease-out forwards",
        }}
      >
        {[...Array(14)].map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${4 + i * 6.5}%`,
              top: (i * 17) % 45,
              width: 3 + (i % 3) * 2,
              height: 3 + (i % 3) * 2,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(212,${160 + (i % 4) * 12},55,0.85), transparent)`,
              boxShadow: `0 0 ${6 + (i % 3) * 4}px rgba(212,175,55,0.5)`,
              animation: `cheetah-sparkle ${0.7 + (i % 4) * 0.25}s ease-out ${0.4 + i * 0.12}s both`,
            }}
          />
        ))}
      </div>

      {/* Expanding golden trail glow before transition */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center 65%, rgba(212,175,55,0.1), transparent 70%)",
          opacity: phase === "trail" ? 1 : 0,
          transition: "opacity 0.8s ease-in",
          pointerEvents: "none",
        }}
      />

      {/* Ambient glow trail */}
      <div
        style={{
          position: "absolute",
          bottom: "30%",
          left: "50%",
          width: 300,
          height: 80,
          transform: "translateX(-50%)",
          background:
            "radial-gradient(ellipse, rgba(212,175,55,0.06), transparent 70%)",
          animation:
            "cheetah-glow-trail 3s cubic-bezier(0.25, 0.1, 0.25, 1) forwards",
          pointerEvents: "none",
        }}
      />

      <style>{`
        @keyframes cheetah-run {
          0%   { transform: translateX(-60%); }
          100% { transform: translateX(110%); }
        }
        @keyframes cheetah-speed-line {
          0%   { transform: translateX(-100%); opacity: 0; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateX(200%); opacity: 0; }
        }
        @keyframes cheetah-sparkle {
          0%   { opacity: 0; transform: scale(0); }
          40%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.5) translateY(-10px); }
        }
        @keyframes cheetah-particle-fade {
          0%  { opacity: 0; }
          30% { opacity: 1; }
          80% { opacity: 0.6; }
          100%{ opacity: 0; }
        }
        @keyframes cheetah-glow-trail {
          0%   { transform: translateX(-150%); opacity: 0; }
          30%  { opacity: 1; }
          100% { transform: translateX(200%); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default CheetahLanding;
