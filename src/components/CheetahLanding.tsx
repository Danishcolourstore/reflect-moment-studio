import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

/* ─── Particle type ─── */
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
  brightness: number;
}

let pid = 0;

/* ─── Easing: power3.out → 1 - (1-t)^3 ─── */
const power3Out = (t: number) => 1 - Math.pow(1 - t, 3);

const CheetahLanding = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"cinematic" | "running" | "burst" | "done">("cinematic");
  const [cheetahProgress, setCheetahProgress] = useState(-120);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [burstOpacity, setBurstOpacity] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const animRef = useRef(0);
  const startRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);

  const skipIntro = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    navigate("/login", { replace: true });
  }, [navigate]);

  /* Phase 1 → cinematic dark intro (1s) */
  useEffect(() => {
    const t = setTimeout(() => setPhase("running"), 1000);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  /* Phase 2 → cheetah run (5s) with particle system */
  useEffect(() => {
    if (phase !== "running") return;

    startRef.current = performance.now();
    const duration = 5000;

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const t = Math.min(elapsed / duration, 1);
      const eased = power3Out(t);

      // -120% → +120% = 240% range
      const progress = -120 + eased * 240;
      setCheetahProgress(progress);

      // Cheetah screen position as percentage
      const cheetahScreenX = ((progress + 120) / 240) * 100;

      // Spawn particles behind cheetah (only while on screen)
      if (t < 0.92 && cheetahScreenX > 2 && cheetahScreenX < 98) {
        const speed = Math.max(0.2, 1 - t * 0.6); // particles slow as cheetah slows
        const count = Math.floor(Math.random() * 4) + 2;
        for (let i = 0; i < count; i++) {
          particlesRef.current.push({
            id: pid++,
            x: cheetahScreenX - 3 - Math.random() * 6,
            y: 60 + Math.random() * 5,
            vx: -(Math.random() * 0.5 + 0.15) * speed,
            vy: -(Math.random() * 0.35 + 0.05),
            life: 1,
            maxLife: 0.6 + Math.random() * 1.0,
            size: 1.5 + Math.random() * 3.5,
            hue: 38 + Math.random() * 18,
            brightness: 50 + Math.random() * 20,
          });
        }
      }

      // Update particles
      particlesRef.current = particlesRef.current
        .map((p) => ({
          ...p,
          x: p.x + p.vx * 0.16,
          y: p.y + p.vy * 0.16,
          life: p.life - 0.016 / p.maxLife,
        }))
        .filter((p) => p.life > 0);

      setParticles([...particlesRef.current]);

      if (t >= 1) {
        setPhase("burst");
        return;
      }

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase]);

  /* Phase 3 → gold energy burst + dark fade → navigate */
  useEffect(() => {
    if (phase !== "burst") return;

    // Gold burst flash (brief)
    setBurstOpacity(1);
    const burstFade = setTimeout(() => setBurstOpacity(0), 400);

    // Dark fade overlay
    const fadeTimer = setTimeout(() => setFadeOut(true), 200);

    // Navigate after fade completes
    const navTimer = setTimeout(() => {
      navigate("/login", { replace: true });
    }, 1000);

    return () => {
      clearTimeout(burstFade);
      clearTimeout(fadeTimer);
      clearTimeout(navTimer);
    };
  }, [phase, navigate]);

  const cinematicVisible = phase === "cinematic";

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
      {/* ───── SKIP INTRO ───── */}
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

      {/* ═══════════════════════════════════════════
          LAYER 1 — BACKGROUND
          ═══════════════════════════════════════════ */}

      {/* Cinematic intro glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 30% 65%, rgba(212,175,55,0.05), transparent 55%)",
          opacity: cinematicVisible ? 1 : 0,
          transition: "opacity 1.5s ease-out",
          pointerEvents: "none",
        }}
      />

      {/* Mirror floor surface */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "35%",
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(212,175,55,0.012) 40%, rgba(212,175,55,0.035) 100%)",
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
            "linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.08) 25%, rgba(212,175,55,0.18) 50%, rgba(212,175,55,0.08) 75%, transparent 100%)",
        }}
      />

      {/* ═══════════════════════════════════════════
          LAYER 2 — SPEED EFFECTS & PARTICLES
          ═══════════════════════════════════════════ */}

      {/* Speed streaks */}
      {phase === "running" && (
        <div
          style={{
            position: "absolute",
            bottom: "36%",
            left: 0,
            right: 0,
            height: 120,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          {[...Array(10)].map((_, i) => {
            const cheetahScreenX = ((cheetahProgress + 120) / 240) * 100;
            return (
              <div
                key={`streak-${i}`}
                style={{
                  position: "absolute",
                  top: 6 + i * 11,
                  height: 1,
                  background: `linear-gradient(90deg, transparent, rgba(212,175,55,${0.03 + i * 0.015}), transparent)`,
                  width: `${20 + i * 3}%`,
                  left: `${cheetahScreenX - 25 - i * 3}%`,
                  opacity: Math.max(0, 1 - Math.abs(cheetahProgress) / 140),
                }}
              />
            );
          })}
        </div>
      )}

      {/* Dynamic particles (trail behind cheetah only) */}
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
            background: `hsl(${p.hue}, 85%, ${p.brightness}%)`,
            boxShadow: `0 0 ${p.size * 2.5}px hsla(${p.hue}, 85%, ${p.brightness}%, 0.7)`,
            opacity: Math.max(0, p.life * p.life),
            transform: `scale(${0.3 + p.life * 0.7})`,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Glow trail behind cheetah */}
      {phase === "running" && (
        <div
          style={{
            position: "absolute",
            bottom: "28%",
            left: `${((cheetahProgress + 120) / 240) * 100 - 12}%`,
            width: 280,
            height: 90,
            background:
              "radial-gradient(ellipse, rgba(212,175,55,0.07), transparent 70%)",
            pointerEvents: "none",
            filter: "blur(12px)",
          }}
        />
      )}

      {/* ═══════════════════════════════════════════
          LAYER 3 — CHEETAH
          ═══════════════════════════════════════════ */}
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
          {/* Motion blur wrapper */}
          <div
            style={{
              filter:
                phase === "running"
                  ? `blur(${Math.max(0, 0.8 - Math.abs(cheetahProgress) * 0.004)}px)`
                  : "none",
              position: "relative",
            }}
          >
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
                "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 55%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 55%)",
            }}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          TRANSITION LAYERS
          ═══════════════════════════════════════════ */}

      {/* Gold energy burst (brief radial flash) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 85% 60%, rgba(212,175,55,0.5), rgba(212,175,55,0.1) 40%, transparent 70%)",
          opacity: burstOpacity,
          transition: "opacity 0.35s ease-out",
          pointerEvents: "none",
          zIndex: 40,
        }}
      />

      {/* Dark fade overlay (smooth transition to login) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#050505",
          opacity: fadeOut ? 1 : 0,
          transition: "opacity 0.6s ease-in",
          pointerEvents: "none",
          zIndex: 50,
        }}
      />
    </div>
  );
};

export default CheetahLanding;
