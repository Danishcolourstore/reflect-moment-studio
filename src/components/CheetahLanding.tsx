import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

/* ─── Particle ─── */
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
  type: "ambient" | "trail" | "burst";
}

let pid = 0;

/* easeInOutCubic: smooth acceleration + deceleration */
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

type Phase = "sparkle" | "running" | "burst" | "fade";

const CheetahLanding = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("sparkle");
  const [cheetahProgress, setCheetahProgress] = useState(-120);
  const [cheetahVisible, setCheetahVisible] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [burstOpacity, setBurstOpacity] = useState(0);
  const [fadeOpacity, setFadeOpacity] = useState(0);
  const [motionBlur, setMotionBlur] = useState(0);
  const animRef = useRef(0);
  const startRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);

  const skipIntro = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    navigate("/login", { replace: true });
  }, [navigate]);

  /* ═══ PHASE 1: SPARKLE INTRO (1.5s) ═══
     Golden ambient particles appear near the bottom */
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      for (let i = 0; i < 3; i++) {
        particlesRef.current.push({
          id: pid++,
          x: 15 + Math.random() * 70,
          y: 58 + Math.random() * 12,
          vx: (Math.random() - 0.5) * 0.08,
          vy: -(Math.random() * 0.12 + 0.03),
          life: 1,
          maxLife: 1.5 + Math.random() * 1.5,
          size: 1.5 + Math.random() * 3,
          hue: 38 + Math.random() * 18,
          brightness: 50 + Math.random() * 25,
          type: "ambient",
        });
      }
    }, 80);

    const runTimer = setTimeout(() => {
      setCheetahVisible(true);
      setTimeout(() => setPhase("running"), 200);
    }, 1300);

    return () => {
      clearInterval(spawnInterval);
      clearTimeout(runTimer);
    };
  }, []);

  /* ═══ PHASE 2: CHEETAH RUN (6.5s) ═══ */
  useEffect(() => {
    if (phase !== "running") return;

    startRef.current = performance.now();
    const runDuration = 6500;

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const t = Math.min(elapsed / runDuration, 1);
      const eased = easeInOutCubic(t);

      const progress = -120 + eased * 240;
      setCheetahProgress(progress);

      /* Motion blur: peaks in mid-run, fades at edges */
      const speed = Math.abs(eased - (t > 0 ? easeInOutCubic(t - 0.01) : 0)) * 100;
      const blur = Math.min(1.8, speed * 0.6);
      setMotionBlur(t > 0.05 && t < 0.92 ? blur : 0);

      const cheetahScreenX = ((progress + 120) / 240) * 100;

      /* Spawn trail particles behind cheetah */
      if (t > 0.08 && t < 0.92 && cheetahScreenX > 2 && cheetahScreenX < 98) {
        const intensity = Math.sin(t * Math.PI); // peaks at midpoint
        const count = Math.floor(intensity * 4) + 2;
        for (let i = 0; i < count; i++) {
          particlesRef.current.push({
            id: pid++,
            x: cheetahScreenX - 4 - Math.random() * 8,
            y: 58 + Math.random() * 8,
            vx: -(Math.random() * 0.4 + 0.1) * (0.5 + intensity * 0.5),
            vy: -(Math.random() * 0.25 + 0.05),
            life: 1,
            maxLife: 0.8 + Math.random() * 1.2,
            size: 1.5 + Math.random() * 4 * intensity,
            hue: 36 + Math.random() * 20,
            brightness: 45 + Math.random() * 30,
            type: "trail",
          });
        }
      }

      /* Sparkle particles that glow brighter near cheetah */
      if (Math.random() < 0.3) {
        particlesRef.current.push({
          id: pid++,
          x: 10 + Math.random() * 80,
          y: 56 + Math.random() * 14,
          vx: (Math.random() - 0.5) * 0.06,
          vy: -(Math.random() * 0.08 + 0.02),
          life: 1,
          maxLife: 1.2 + Math.random() * 1.0,
          size: 1 + Math.random() * 2.5,
          hue: 40 + Math.random() * 14,
          brightness: 40 + Math.random() * 20,
          type: "ambient",
        });
      }

      /* Update all particles */
      particlesRef.current = particlesRef.current
        .map((p) => {
          /* Ambient particles near cheetah glow brighter */
          let extraBright = 0;
          if (p.type === "ambient") {
            const dist = Math.abs(p.x - cheetahScreenX);
            if (dist < 15) extraBright = (15 - dist) * 1.5;
          }
          return {
            ...p,
            x: p.x + p.vx * 0.16,
            y: p.y + p.vy * 0.16,
            life: p.life - 0.016 / p.maxLife,
            brightness: Math.min(90, p.brightness + extraBright * 0.016),
          };
        })
        .filter((p) => p.life > 0);

      setParticles([...particlesRef.current]);

      if (t >= 1) {
        setMotionBlur(0);
        setPhase("burst");
        return;
      }

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase]);

  /* ═══ PHASE 3: BURST → FADE → NAVIGATE ═══ */
  useEffect(() => {
    if (phase !== "burst") return;

    /* Spawn burst particles that expand outward */
    const burstCount = 60;
    for (let i = 0; i < burstCount; i++) {
      const angle = (i / burstCount) * Math.PI * 2;
      const speed = 0.3 + Math.random() * 0.6;
      particlesRef.current.push({
        id: pid++,
        x: 85 + Math.random() * 10,
        y: 55 + Math.random() * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.6,
        life: 1,
        maxLife: 0.8 + Math.random() * 0.6,
        size: 2 + Math.random() * 5,
        hue: 36 + Math.random() * 22,
        brightness: 55 + Math.random() * 30,
        type: "burst",
      });
    }
    setParticles([...particlesRef.current]);

    /* Gold burst glow */
    setBurstOpacity(1);
    const burstFade = setTimeout(() => setBurstOpacity(0), 600);

    /* Continue animating burst particles */
    const burstAnim = () => {
      particlesRef.current = particlesRef.current
        .map((p) => ({
          ...p,
          x: p.x + p.vx * 0.16,
          y: p.y + p.vy * 0.16,
          life: p.life - 0.016 / p.maxLife,
          size: p.type === "burst" ? p.size * 1.01 : p.size,
        }))
        .filter((p) => p.life > 0);
      setParticles([...particlesRef.current]);
      if (particlesRef.current.length > 0) {
        animRef.current = requestAnimationFrame(burstAnim);
      }
    };
    animRef.current = requestAnimationFrame(burstAnim);

    /* Dark fade overlay */
    const fadeTimer = setTimeout(() => {
      setFadeOpacity(1);
      setPhase("fade");
    }, 500);

    /* Navigate */
    const navTimer = setTimeout(() => {
      navigate("/login", { replace: true });
    }, 1400);

    return () => {
      clearTimeout(burstFade);
      clearTimeout(fadeTimer);
      clearTimeout(navTimer);
      cancelAnimationFrame(animRef.current);
    };
  }, [phase, navigate]);

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

      {/* ═══ LAYER 1 — BACKGROUND ═══ */}

      {/* Ambient gold floor glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 75%, rgba(212,175,55,0.04), transparent 60%)",
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

      {/* ═══ LAYER 2 — PARTICLES & SPEED EFFECTS ═══ */}

      {/* Speed streaks (only during run) */}
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
                  background: `linear-gradient(90deg, transparent, rgba(212,175,55,${0.02 + i * 0.012}), transparent)`,
                  width: `${18 + i * 3}%`,
                  left: `${cheetahScreenX - 22 - i * 3}%`,
                  opacity: Math.max(0, Math.sin(((cheetahProgress + 120) / 240) * Math.PI) * 0.8),
                  transition: "opacity 0.1s",
                }}
              />
            );
          })}
        </div>
      )}

      {/* All particles */}
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
            boxShadow: `0 0 ${p.size * 3}px hsla(${p.hue}, 85%, ${p.brightness}%, ${0.5 + (p.type === "burst" ? 0.3 : 0)})`,
            opacity: Math.max(0, p.life * p.life),
            transform: `scale(${0.3 + p.life * 0.7})`,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Glow trail behind cheetah */}
      {(phase === "running" || phase === "burst") && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            marginTop: -45,
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

      {/* ═══ LAYER 3 — CHEETAH ═══ */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          width: "100%",
          transform: `translateX(${cheetahProgress}%) translateY(-50%)`,
          willChange: "transform",
          opacity: cheetahVisible ? 1 : 0,
          transition: "opacity 0.4s ease-out",
        }}
      >
        <div
          style={{
            filter: motionBlur > 0
              ? `blur(${motionBlur}px)`
              : "none",
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
      </div>

      {/* ═══ TRANSITION LAYERS ═══ */}

      {/* Gold energy burst (radial expansion) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 85% 60%, rgba(212,175,55,0.45), rgba(212,175,55,0.08) 45%, transparent 75%)",
          opacity: burstOpacity,
          transition: "opacity 0.5s ease-out",
          pointerEvents: "none",
          zIndex: 40,
        }}
      />

      {/* Dark fade overlay */}
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
