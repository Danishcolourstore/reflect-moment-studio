import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

let particleId = 0;

const CheetahLanding = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"cinematic" | "running" | "flash" | "done">("cinematic");
  const [cheetahProgress, setCheetahProgress] = useState(-120);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [flashOpacity, setFlashOpacity] = useState(0);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  const skipIntro = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    navigate("/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    // Timeline: 0-1s cinematic, 1-6s run, 6-6.5s flash, then navigate
    const cinematicTimer = setTimeout(() => setPhase("running"), 1000);

    return () => {
      clearTimeout(cinematicTimer);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Main animation loop
  useEffect(() => {
    if (phase !== "running") return;

    startTimeRef.current = performance.now();
    const runDuration = 5000; // 5 seconds for the run

    const easeOutPower3 = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const t = Math.min(elapsed / runDuration, 1);
      const eased = easeOutPower3(t);

      // -120% to 120% = 240% range
      const progress = -120 + eased * 240;
      setCheetahProgress(progress);

      // Spawn particles behind cheetah
      if (t < 0.95) {
        const cheetahScreenX = ((progress + 120) / 240) * 100;
        const spawnCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < spawnCount; i++) {
          particlesRef.current.push({
            id: particleId++,
            x: cheetahScreenX - 2 - Math.random() * 8,
            y: 62 + Math.random() * 6,
            vx: -(Math.random() * 0.3 + 0.1),
            vy: -(Math.random() * 0.4 + 0.1),
            life: 1,
            maxLife: 0.8 + Math.random() * 1.2,
            size: 2 + Math.random() * 4,
            hue: 40 + Math.random() * 15,
          });
        }
      }

      // Update particles
      particlesRef.current = particlesRef.current
        .map((p) => ({
          ...p,
          x: p.x + p.vx * 0.16,
          y: p.y + p.vy * 0.16,
          life: p.life - (0.016 / p.maxLife),
        }))
        .filter((p) => p.life > 0);

      setParticles([...particlesRef.current]);

      if (t >= 1) {
        // Trigger flash
        setPhase("flash");
        return;
      }

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase]);

  // Flash transition
  useEffect(() => {
    if (phase !== "flash") return;

    setFlashOpacity(1);
    const navTimer = setTimeout(() => {
      navigate("/login", { replace: true });
    }, 500);

    return () => clearTimeout(navTimer);
  }, [phase, navigate]);

  // Cinematic glow pulse
  const cinematicOpacity = phase === "cinematic" ? 1 : 0;

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
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          padding: "8px 20px",
          fontFamily: "Jost, sans-serif",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "1.5px",
          textTransform: "uppercase" as const,
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

      {/* ===== LAYER 1: BACKGROUND ===== */}

      {/* Cinematic intro glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 30% 65%, rgba(212,175,55,0.06), transparent 60%)",
          opacity: cinematicOpacity,
          transition: "opacity 1.5s ease-out",
          pointerEvents: "none",
        }}
      />

      {/* Ambient particles during cinematic phase */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: cinematicOpacity,
          transition: "opacity 0.8s ease",
          pointerEvents: "none",
        }}
      >
        {[...Array(6)].map((_, i) => (
          <div
            key={`ambient-${i}`}
            style={{
              position: "absolute",
              left: `${15 + i * 12}%`,
              top: `${55 + (i % 3) * 8}%`,
              width: 3,
              height: 3,
              borderRadius: "50%",
              background: "rgba(212,175,55,0.5)",
              boxShadow: "0 0 8px rgba(212,175,55,0.3)",
              animation: `cinematic-float ${2 + i * 0.3}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* Mirror floor surface */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "35%",
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(212,175,55,0.015) 40%, rgba(212,175,55,0.04) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Floor horizon line */}
      <div
        style={{
          position: "absolute",
          bottom: "35%",
          left: 0,
          right: 0,
          height: 1,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.1) 25%, rgba(212,175,55,0.2) 50%, rgba(212,175,55,0.1) 75%, transparent 100%)",
        }}
      />

      {/* ===== LAYER 2: SPEED EFFECTS & PARTICLES ===== */}

      {/* Speed streaks */}
      {phase === "running" && (
        <div
          style={{
            position: "absolute",
            bottom: "38%",
            left: 0,
            right: 0,
            height: 140,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          {[...Array(8)].map((_, i) => (
            <div
              key={`streak-${i}`}
              style={{
                position: "absolute",
                top: 10 + i * 16,
                height: 1,
                background: `linear-gradient(90deg, transparent, rgba(212,175,55,${0.04 + i * 0.02}), transparent)`,
                width: "50%",
                left: `${cheetahProgress + 50 - 55}%`,
                opacity: Math.max(0, 1 - Math.abs(cheetahProgress - 0) / 100),
                transition: "opacity 0.3s",
              }}
            />
          ))}
        </div>
      )}

      {/* Dynamic particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: `hsl(${p.hue}, 80%, 55%)`,
            boxShadow: `0 0 ${p.size * 2}px hsla(${p.hue}, 80%, 55%, 0.6)`,
            opacity: Math.max(0, p.life),
            transform: `scale(${0.5 + p.life * 0.5})`,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Glow trail behind cheetah */}
      {phase === "running" && (
        <div
          style={{
            position: "absolute",
            bottom: "30%",
            left: `${((cheetahProgress + 120) / 240) * 100 - 15}%`,
            width: 300,
            height: 100,
            background: "radial-gradient(ellipse, rgba(212,175,55,0.08), transparent 70%)",
            pointerEvents: "none",
            filter: "blur(10px)",
          }}
        />
      )}

      {/* ===== LAYER 3: CHEETAH ===== */}
      <div
        style={{
          position: "absolute",
          bottom: "28%",
          left: 0,
          width: "100%",
          transform: `translateX(${cheetahProgress}%)`,
          willChange: "transform",
        }}
      >
        <div style={{ position: "relative" }}>
          {/* Motion blur effect */}
          <div
            style={{
              filter: phase === "running" ? "blur(0.5px)" : "none",
              position: "relative",
            }}
          >
            {/* Main cheetah */}
            <img
              src="/images/cheetah.png"
              alt=""
              draggable={false}
              style={{
                width: "min(500px, 65vw)",
                height: "auto",
                objectFit: "contain",
                display: "block",
                pointerEvents: "none",
                userSelect: "none",
              }}
            />
          </div>

          {/* Mirror reflection */}
          <img
            src="/images/cheetah.png"
            alt=""
            draggable={false}
            style={{
              width: "min(500px, 65vw)",
              height: "auto",
              objectFit: "contain",
              display: "block",
              pointerEvents: "none",
              userSelect: "none",
              transform: "scaleY(-1) translateY(-6px)",
              opacity: 0.18,
              filter: "blur(4px)",
              maskImage:
                "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 60%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 60%)",
            }}
          />
        </div>
      </div>

      {/* ===== FLASH TRANSITION ===== */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 80% 65%, rgba(212,175,55,0.9), rgba(255,255,255,0.95) 60%, #fff 100%)",
          opacity: flashOpacity,
          transition: "opacity 0.4s ease-in",
          pointerEvents: "none",
          zIndex: 50,
        }}
      />

      <style>{`
        @keyframes cinematic-float {
          0%   { opacity: 0.2; transform: translateY(0); }
          100% { opacity: 0.6; transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
};

export default CheetahLanding;
