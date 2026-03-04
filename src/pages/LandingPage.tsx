import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
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

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#080604",
        overflow: "hidden",
        opacity: phase === "trail" ? 0 : 1,
        transition: "opacity 1.2s ease-out",
      }}
    >
      {/* Glossy mirror floor */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "35%",
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(201,169,110,0.03) 40%, rgba(201,169,110,0.06) 100%)",
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
            "linear-gradient(90deg, transparent 0%, rgba(201,169,110,0.15) 30%, rgba(201,169,110,0.25) 50%, rgba(201,169,110,0.15) 70%, transparent 100%)",
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
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 15 + i * 22,
              height: 1,
              background: `linear-gradient(90deg, transparent, rgba(255,180,50,${0.08 + i * 0.03}), transparent)`,
              width: "40%",
              animation: `speedLine 3s ease-in-out ${i * 0.15}s forwards`,
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
          animation: "cheetahRun 3s cubic-bezier(0.25, 0.1, 0.25, 1) forwards",
        }}
      >
        <div style={{ filter: "blur(0.3px)", position: "relative" }}>
          {/* Main cheetah */}
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
              opacity: 0.15,
              filter: "blur(3px)",
              maskImage:
                "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 70%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 70%)",
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
          animation: "particleFade 3.5s ease-out forwards",
        }}
      >
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${5 + i * 7}%`,
              top: (i * 17) % 40,
              width: 3 + (i % 3) * 2,
              height: 3 + (i % 3) * 2,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(255,${160 + (i % 4) * 15},50,0.8), transparent)`,
              boxShadow: `0 0 ${6 + (i % 3) * 3}px rgba(255,180,50,0.5)`,
              animation: `sparkle ${0.8 + (i % 4) * 0.3}s ease-out ${0.5 + i * 0.15}s both`,
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
            "radial-gradient(ellipse at center 65%, rgba(201,169,110,0.12), transparent 70%)",
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
            "radial-gradient(ellipse, rgba(201,169,110,0.08), transparent 70%)",
          animation:
            "glowTrail 3s cubic-bezier(0.25, 0.1, 0.25, 1) forwards",
          pointerEvents: "none",
        }}
      />

      <style>{`
        @keyframes cheetahRun {
          0%   { transform: translateX(-60%); }
          100% { transform: translateX(110%); }
        }
        @keyframes speedLine {
          0%   { transform: translateX(-100%); opacity: 0; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateX(200%); opacity: 0; }
        }
        @keyframes sparkle {
          0%   { opacity: 0; transform: scale(0); }
          40%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.5) translateY(-10px); }
        }
        @keyframes particleFade {
          0%  { opacity: 0; }
          30% { opacity: 1; }
          80% { opacity: 0.6; }
          100%{ opacity: 0; }
        }
        @keyframes glowTrail {
          0%   { transform: translateX(-150%); opacity: 0; }
          30%  { opacity: 1; }
          100% { transform: translateX(200%); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
