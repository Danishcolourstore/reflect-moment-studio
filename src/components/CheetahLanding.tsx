import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { generateCheetahPoints, createGlowTexture } from "./cheetah/geometry";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/* ── Timeline (seconds) — aggressive, front-loaded sprint ── */
const T = {
  SPRINT_END: 4,       // 0-4s: immediate aggressive sprint across screen
  HIGHSPEED_END: 7,    // 4-7s: extreme speed with stretch + blur
  DECEL_END: 9,        // 7-9s: braking
  STOP_END: 11,        // 9-11s: stopped, settling
  TURN_END: 14,        // 11-14s: turns toward camera + energy pulse
  DISSOLVE_END: 17,    // 14-17s: explosion into particles
  STREAM_END: 20,      // 17-20s: particles converge
  FORM_END: 22,        // 20-22s: particles fade, login appears
  TOTAL: 24,
};

const POINT_COUNT = 4000;
const PARTICLE_COUNT = 4000;
const TRAIL_COUNT = 2500;

/* ── Glow texture ── */
function useGlowTexture() {
  return useMemo(() => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const c = size / 2;
    const g = ctx.createRadialGradient(c, c, 0, c, c, c);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.12, "rgba(200,255,255,0.85)");
    g.addColorStop(0.35, "rgba(100,200,255,0.35)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);
}

/* ── Diagonal background drift lines ── */
function DriftLines() {
  const linesData = useMemo(() => {
    const arr: { line: THREE.Line }[] = [];
    for (let i = 0; i < 30; i++) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-12, 0, 0),
        new THREE.Vector3(12, 0, 0),
      ]);
      const color = i % 3 === 0 ? 0x004455 : i % 3 === 1 ? 0x330044 : 0x003333;
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.25 + Math.random() * 0.15 });
      const line = new THREE.Line(geo, mat);
      line.position.set((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 20, -15 - Math.random() * 30);
      line.rotation.z = ((-30 + Math.random() * 10) * Math.PI) / 180;
      arr.push({ line });
    }
    return arr;
  }, []);

  useFrame(() => {
    linesData.forEach(({ line }) => {
      line.position.x += 0.004;
      if (line.position.x > 25) line.position.x = -25;
    });
  });

  return (
    <group>
      {linesData.map(({ line }, i) => (
        <primitive key={i} object={line} />
      ))}
    </group>
  );
}

/* ── Reflective Floor ── */
function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
      <planeGeometry args={[80, 80]} />
      <meshStandardMaterial color={0x030303} metalness={0.97} roughness={0.1} transparent opacity={0.7} />
    </mesh>
  );
}

/* ── Energy Pulse ── */
function EnergySphere({ progress, position }: { progress: number; position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const s = 0.1 + progress * 6;
    ref.current.scale.set(s, s, s);
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    if (mat) mat.opacity = progress < 0.4 ? progress * 2 : Math.max(0, 1.6 - progress * 1.6);
  });
  if (progress <= 0) return null;
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[1, 20, 20]} />
      <meshBasicMaterial color={0x00ffff} wireframe transparent opacity={0} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

/* ── Main Scene ── */
function AnimatedScene({ onPhaseChange, onTimeUpdate }: { onPhaseChange: (p: string) => void; onTimeUpdate: (t: number) => void }) {
  const { camera } = useThree();
  const clockRef = useRef(0);
  const glowTex = useGlowTexture();

  const { positions: basePositions, colors: baseColors } = useMemo(() => generateCheetahPoints(POINT_COUNT), []);
  const origPositions = useRef(new Float32Array(basePositions));

  // Fresh materials - never shared
  const cheetahMat = useMemo(
    () => new THREE.PointsMaterial({
      size: 0.045, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 1,
      blending: THREE.AdditiveBlending, depthWrite: false, map: glowTex,
    }), [glowTex]
  );
  const reflMat = useMemo(
    () => new THREE.PointsMaterial({
      size: 0.035, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.18,
      blending: THREE.AdditiveBlending, depthWrite: false, map: glowTex,
    }), [glowTex]
  );
  const trailMat = useMemo(
    () => new THREE.PointsMaterial({
      size: 0.03, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.8,
      blending: THREE.AdditiveBlending, depthWrite: false, map: glowTex,
    }), [glowTex]
  );
  const dissolveMat = useMemo(
    () => new THREE.PointsMaterial({
      size: 0.04, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 1,
      blending: THREE.AdditiveBlending, depthWrite: false, map: glowTex,
    }), [glowTex]
  );

  const cheetahRef = useRef<THREE.Points>(null);
  const reflRef = useRef<THREE.Points>(null);
  const trailRef = useRef<THREE.Points>(null);
  const dissolveRef = useRef<THREE.Points>(null);

  // Trail buffers
  const trailPositions = useRef(new Float32Array(TRAIL_COUNT * 3));
  const trailColors = useRef(new Float32Array(TRAIL_COUNT * 3));
  const trailWriteIdx = useRef(0);

  // Dissolve buffers
  const dissolvePositions = useRef(new Float32Array(PARTICLE_COUNT * 3));
  const dissolveVelocities = useRef(new Float32Array(PARTICLE_COUNT * 3));
  const dissolveColors = useRef(new Float32Array(PARTICLE_COUNT * 3));
  const dissolveStarted = useRef(false);

  const energyProgress = useRef(0);
  const cheetahX = useRef(-8);

  useFrame((_, delta) => {
    clockRef.current += delta;
    const t = clockRef.current;
    onTimeUpdate(t);

    const cam = camera as THREE.PerspectiveCamera;

    // Camera: smooth push forward
    let targetZ = 10;
    let targetY = 2.0;
    if (t < T.SPRINT_END) {
      targetZ = THREE.MathUtils.lerp(10, 8, t / T.SPRINT_END);
    } else if (t < T.HIGHSPEED_END) {
      targetZ = THREE.MathUtils.lerp(8, 6.5, (t - T.SPRINT_END) / (T.HIGHSPEED_END - T.SPRINT_END));
    } else if (t < T.DECEL_END) {
      targetZ = THREE.MathUtils.lerp(6.5, 6, (t - T.HIGHSPEED_END) / (T.DECEL_END - T.HIGHSPEED_END));
    } else {
      targetZ = 6;
    }
    cam.position.x += (0 - cam.position.x) * 0.03;
    cam.position.y += (targetY - cam.position.y) * 0.03;
    cam.position.z += (targetZ - cam.position.z) * 0.025;
    cam.lookAt(0, 1.0, 0);

    // Phase labels
    if (t < T.SPRINT_END) onPhaseChange("SPRINT");
    else if (t < T.HIGHSPEED_END) onPhaseChange("MAXIMUM VELOCITY");
    else if (t < T.DECEL_END) onPhaseChange("BRAKING");
    else if (t < T.STOP_END) onPhaseChange("LOCKED");
    else if (t < T.TURN_END) onPhaseChange("THE MOMENT");
    else if (t < T.DISSOLVE_END) onPhaseChange("DISSOLVE");
    else if (t < T.STREAM_END) onPhaseChange("CONVERGENCE");
    else if (t < T.FORM_END) onPhaseChange("MATERIALIZING");
    else onPhaseChange("MIRRORAI");

    const cheetah = cheetahRef.current;
    const refl = reflRef.current;
    const trail = trailRef.current;
    const dissolve = dissolveRef.current;
    if (!cheetah || !refl) return;

    const posAttr = cheetah.geometry.getAttribute("position") as THREE.BufferAttribute;
    const reflPosAttr = refl.geometry.getAttribute("position") as THREE.BufferAttribute;
    if (!posAttr || !reflPosAttr) return;

    // ═══ RUNNING PHASES (0 to TURN_END) ═══
    if (t < T.TURN_END) {
      cheetah.visible = true;
      refl.visible = true;

      let cx: number;
      let scaleX = 1;
      let speed = 0;

      if (t < T.SPRINT_END) {
        // Aggressive sprint: start already in frame at left, run right
        const p = t / T.SPRINT_END;
        cx = THREE.MathUtils.lerp(-7, 1, p * p); // accelerating curve
        speed = 8 + p * 6;
        cheetahMat.opacity = Math.min(1, t * 2); // quick fade in
      } else if (t < T.HIGHSPEED_END) {
        // Extreme speed with body stretch
        const p = (t - T.SPRINT_END) / (T.HIGHSPEED_END - T.SPRINT_END);
        cx = THREE.MathUtils.lerp(1, 5, p);
        scaleX = THREE.MathUtils.lerp(1, 1.9, Math.sin(p * Math.PI)); // stretch then unstretch
        speed = 14;
      } else if (t < T.DECEL_END) {
        // Braking
        const p = (t - T.HIGHSPEED_END) / (T.DECEL_END - T.HIGHSPEED_END);
        cx = THREE.MathUtils.lerp(5, 1, p);
        scaleX = THREE.MathUtils.lerp(1.3, 1, p);
        speed = THREE.MathUtils.lerp(14, 1, p);
      } else if (t < T.STOP_END) {
        cx = 1;
        speed = THREE.MathUtils.lerp(1, 0, (t - T.DECEL_END) / (T.STOP_END - T.DECEL_END));
      } else {
        // Turn phase
        cx = 1;
        speed = 0;
        const turnP = (t - T.STOP_END) / (T.TURN_END - T.STOP_END);
        cheetah.rotation.y = THREE.MathUtils.lerp(0, Math.PI * 0.5, THREE.MathUtils.smoothstep(turnP, 0, 1));
        energyProgress.current = turnP;

        // Flash white during turn
        const colAttr = cheetah.geometry.getAttribute("color") as THREE.BufferAttribute;
        if (colAttr) {
          for (let i = 0; i < POINT_COUNT; i++) {
            const flash = Math.sin(t * 25 + i * 0.08) * 0.4;
            colAttr.setXYZ(i,
              Math.min(1, baseColors[i * 3] + flash * turnP * 0.8),
              Math.min(1, baseColors[i * 3 + 1] + flash * turnP * 0.8),
              Math.min(1, baseColors[i * 3 + 2] + turnP * 0.3)
            );
          }
          colAttr.needsUpdate = true;
        }
      }

      cheetahX.current = cx;

      // Gallop animation — aggressive leg movement
      const bobAmp = speed * 0.006;
      const legAmp = speed * 0.028;
      const gallop = t * speed * 2.5;

      for (let i = 0; i < POINT_COUNT; i++) {
        const ox = origPositions.current[i * 3];
        const oy = origPositions.current[i * 3 + 1];
        const oz = origPositions.current[i * 3 + 2];
        let ny = oy + Math.sin(gallop) * bobAmp;

        // Leg points get aggressive movement
        if (oy < 0.55) {
          const legPhase = ox > 0 ? 0 : Math.PI;
          const sidePhase = oz > 0 ? 0 : Math.PI * 0.5;
          ny += Math.sin(gallop + legPhase + sidePhase) * legAmp;
          // Also add forward/back motion to legs
          const legX = ox + Math.cos(gallop + legPhase + sidePhase) * legAmp * 0.5;
          posAttr.setXYZ(i, legX * scaleX, ny, oz);
        } else {
          posAttr.setXYZ(i, ox * scaleX, ny, oz);
        }
      }
      posAttr.needsUpdate = true;

      cheetah.position.x = cx;
      if (t < T.STOP_END) cheetah.rotation.y = 0;

      // Reflection
      refl.position.x = cx;
      refl.rotation.y = cheetah.rotation.y;
      for (let i = 0; i < POINT_COUNT; i++) {
        reflPosAttr.setXYZ(i, posAttr.getX(i), -posAttr.getY(i) - 0.04, posAttr.getZ(i));
      }
      reflPosAttr.needsUpdate = true;

      // ── Trail particles ──
      if (trail && speed > 2) {
        const tpAttr = trail.geometry.getAttribute("position") as THREE.BufferAttribute;
        const tcAttr = trail.geometry.getAttribute("color") as THREE.BufferAttribute;
        if (tpAttr && tcAttr) {
          // Spawn many trail particles per frame for dense trails
          const spawnCount = Math.min(20, Math.floor(speed * 1.5));
          for (let s = 0; s < spawnCount; s++) {
            const ti = trailWriteIdx.current % TRAIL_COUNT;
            const spawnX = cx - 1.2 + (Math.random() - 0.5) * 0.8;
            const spawnY = 0.3 + Math.random() * 0.8;
            const spawnZ = (Math.random() - 0.5) * 0.4;
            tpAttr.setXYZ(ti, spawnX, spawnY, spawnZ);
            const isCyan = Math.random() > 0.35;
            tcAttr.setXYZ(ti, isCyan ? 0 : 1, isCyan ? 1 : 0, 1);
            trailWriteIdx.current++;
          }
          // Drift trail particles leftward and fade down
          for (let i = 0; i < TRAIL_COUNT; i++) {
            const px = tpAttr.getX(i);
            const py = tpAttr.getY(i);
            if (py > 0) {
              tpAttr.setX(i, px - 0.04 * (speed / 8));
              tpAttr.setY(i, py - 0.003);
            }
          }
          tpAttr.needsUpdate = true;
          tcAttr.needsUpdate = true;
          trail.visible = true;
          trailMat.opacity = Math.min(0.8, speed * 0.06);
        }
      }
      if (trail && speed <= 2 && t > T.DECEL_END) {
        // Fade trail
        trailMat.opacity = Math.max(0, trailMat.opacity - delta * 0.5);
        if (trailMat.opacity <= 0.01) trail.visible = false;
      }
    } else {
      // ═══ DISSOLVE PHASES ═══
      cheetah.visible = false;
      refl.visible = false;
      if (trail) trail.visible = false;
      energyProgress.current = 0;

      if (!dissolveStarted.current && dissolve) {
        const lastX = cheetahX.current;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const si = i % POINT_COUNT;
          dissolvePositions.current[i * 3] = origPositions.current[si * 3] + lastX;
          dissolvePositions.current[i * 3 + 1] = origPositions.current[si * 3 + 1];
          dissolvePositions.current[i * 3 + 2] = origPositions.current[si * 3 + 2];
          // Explosive velocities
          dissolveVelocities.current[i * 3] = (Math.random() - 0.5) * 4;
          dissolveVelocities.current[i * 3 + 1] = (Math.random() - 0.2) * 3;
          dissolveVelocities.current[i * 3 + 2] = (Math.random() - 0.5) * 4;
          dissolveColors.current[i * 3] = baseColors[(si % POINT_COUNT) * 3];
          dissolveColors.current[i * 3 + 1] = baseColors[(si % POINT_COUNT) * 3 + 1];
          dissolveColors.current[i * 3 + 2] = baseColors[(si % POINT_COUNT) * 3 + 2];
        }
        const dGeo = dissolve.geometry;
        dGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(dissolvePositions.current), 3));
        dGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(dissolveColors.current), 3));
        dissolveStarted.current = true;
      }

      if (dissolveStarted.current && dissolve) {
        const dPos = dissolve.geometry.getAttribute("position") as THREE.BufferAttribute;
        if (!dPos) return;
        dissolve.visible = true;

        if (t < T.DISSOLVE_END) {
          // Explosion phase
          const ep = (t - T.TURN_END) / (T.DISSOLVE_END - T.TURN_END);
          const damping = 1 - ep;
          for (let i = 0; i < PARTICLE_COUNT; i++) {
            dissolvePositions.current[i * 3] += dissolveVelocities.current[i * 3] * delta * damping;
            dissolvePositions.current[i * 3 + 1] += dissolveVelocities.current[i * 3 + 1] * delta * damping;
            dissolvePositions.current[i * 3 + 2] += dissolveVelocities.current[i * 3 + 2] * delta * damping;
          }
          dissolveMat.opacity = 1;
        } else if (t < T.STREAM_END) {
          // Converge toward center
          const sp = (t - T.DISSOLVE_END) / (T.STREAM_END - T.DISSOLVE_END);
          const pull = sp * sp * 0.06; // accelerating pull
          for (let i = 0; i < PARTICLE_COUNT; i++) {
            dissolvePositions.current[i * 3] += (0 - dissolvePositions.current[i * 3]) * pull;
            dissolvePositions.current[i * 3 + 1] += (1.3 - dissolvePositions.current[i * 3 + 1]) * pull;
            dissolvePositions.current[i * 3 + 2] += (0 - dissolvePositions.current[i * 3 + 2]) * pull;
          }
          dissolveMat.opacity = THREE.MathUtils.lerp(1, 0.35, sp);
        } else {
          // Fade out as login appears
          const fp = Math.min(1, (t - T.STREAM_END) / (T.FORM_END - T.STREAM_END));
          dissolveMat.opacity = THREE.MathUtils.lerp(0.35, 0, fp);
          if (fp >= 1) dissolve.visible = false;
        }

        dPos.set(dissolvePositions.current);
        dPos.needsUpdate = true;
      }
    }
  });

  // Geometries — built fresh
  const cheetahGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(basePositions), 3));
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(baseColors), 3));
    return geo;
  }, [basePositions, baseColors]);

  const reflGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(POINT_COUNT * 3), 3));
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(baseColors), 3));
    return geo;
  }, [baseColors]);

  const trailGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(trailPositions.current, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(trailColors.current, 3));
    return geo;
  }, []);

  const dissolveGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(PARTICLE_COUNT * 3), 3));
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(PARTICLE_COUNT * 3), 3));
    return geo;
  }, []);

  return (
    <>
      <DriftLines />
      <Floor />
      <ambientLight intensity={0.1} />
      <pointLight position={[5, 8, 5]} intensity={0.6} color={0x00ffff} distance={30} />
      <pointLight position={[-4, 5, -3]} intensity={0.4} color={0xff00ff} distance={25} />
      <pointLight position={[0, 3, 8]} intensity={0.2} color={0x004444} distance={20} />
      <points ref={cheetahRef} visible={false} geometry={cheetahGeo} material={cheetahMat} />
      <points ref={reflRef} visible={false} geometry={reflGeo} material={reflMat} />
      <points ref={trailRef} visible={false} geometry={trailGeo} material={trailMat} />
      <points ref={dissolveRef} visible={false} geometry={dissolveGeo} material={dissolveMat} />
      <EnergySphere progress={energyProgress.current} position={[cheetahX.current, 0.9, 0]} />
    </>
  );
}

/* ── Login Card ── */
function LoginOverlay({ visible }: { visible: boolean }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); }
    else navigate("/dashboard");
  };

  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
      pointerEvents: visible ? "auto" : "none", zIndex: 20,
      opacity: visible ? 1 : 0, transform: `scale(${visible ? 1 : 0.94})`,
      transition: "opacity 2s ease, transform 2s ease",
    }}>
      <form onSubmit={handleSignIn} style={{
        background: "rgba(4,8,16,0.92)", border: "1px solid rgba(0,255,255,0.2)",
        backdropFilter: "blur(20px)", borderRadius: 12, padding: "40px 36px 32px", width: 340,
        boxShadow: "0 0 60px rgba(0,255,255,0.08), 0 0 120px rgba(255,0,255,0.04), inset 0 0 30px rgba(0,255,255,0.03)",
      }}>
        <h1 style={{ textAlign: "center", fontSize: 28, letterSpacing: 6, color: "#fff", margin: 0, fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}>
          Mirror<span style={{ color: "#00ffff" }}>AI</span>
        </h1>
        <p style={{ textAlign: "center", color: "#00ffff", fontStyle: "italic", fontSize: 11, margin: "6px 0 28px", letterSpacing: 2, opacity: 0.8 }}>
          Mirror never lies
        </p>
        {error && <p style={{ color: "#ff4466", fontSize: 11, textAlign: "center", marginBottom: 12 }}>{error}</p>}
        <div style={{ marginBottom: 16 }}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "11px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 0.3s" }}
            onFocus={(e) => e.currentTarget.style.borderColor = "rgba(0,255,255,0.4)"}
            onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
          />
        </div>
        <div style={{ marginBottom: 22, position: "relative" }}>
          <input type={showPw ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "11px 40px 11px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 0.3s" }}
            onFocus={(e) => e.currentTarget.style.borderColor = "rgba(0,255,255,0.4)"}
            onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
          />
          <button type="button" onClick={() => setShowPw(!showPw)} style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 16,
          }}>
            {showPw ? "◉" : "◎"}
          </button>
        </div>
        <button type="submit" disabled={loading} style={{
          width: "100%", padding: "12px 0", background: "linear-gradient(135deg, #00cccc, #00ffff)",
          border: "none", borderRadius: 6, color: "#000", fontSize: 12, fontWeight: 700, letterSpacing: 3,
          cursor: "pointer", textTransform: "uppercase",
          boxShadow: "0 0 25px rgba(0,255,255,0.35), 0 0 50px rgba(0,255,255,0.12)",
          transition: "box-shadow 0.3s",
        }}>
          {loading ? "..." : "SIGN IN"}
        </button>
        <p style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 18 }}>
          No account?{" "}<span onClick={() => navigate("/register")} style={{ color: "#00ffff", cursor: "pointer" }}>Sign up</span>
          {"   "}<span onClick={() => navigate("/forgot-password")} style={{ color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>Forgot?</span>
        </p>
        <p style={{ textAlign: "center", fontSize: 9, color: "rgba(255,255,255,0.18)", marginTop: 12, letterSpacing: 1 }}>
          professional and premium
        </p>
      </form>
    </div>
  );
}

/* ── Main Export ── */
export default function CheetahLanding() {
  const [phase, setPhase] = useState("SPRINT");
  const [time, setTime] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (time >= T.FORM_END - 1.5 || skipped) setShowLogin(true);
  }, [time, skipped]);

  const handleSkip = useCallback(() => { setSkipped(true); setShowLogin(true); }, []);
  const progress = Math.min(1, time / T.TOTAL);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", overflow: "hidden" }}>
      {!skipped && (
        <Canvas
          camera={{ position: [0, 2.0, 10], fov: 50, near: 0.1, far: 100 }}
          gl={{ antialias: window.innerWidth > 768, powerPreference: "high-performance", alpha: false }}
          dpr={Math.min(window.devicePixelRatio, 2)}
          style={{ position: "absolute", inset: 0 }}
        >
          <color attach="background" args={["#000000"]} />
          <fog attach="fog" args={["#000000", 18, 55]} />
          <AnimatedScene onPhaseChange={setPhase} onTimeUpdate={setTime} />
        </Canvas>
      )}

      {/* Phase label */}
      <div style={{
        position: "fixed", top: 16, left: 20, color: "#00ffff", fontSize: 10, letterSpacing: 3,
        fontFamily: "monospace", zIndex: 30, opacity: showLogin ? 0 : 0.6, transition: "opacity 1s", pointerEvents: "none",
      }}>
        {phase}
      </div>

      {/* Skip */}
      {!showLogin && (
        <button onClick={handleSkip} style={{
          position: "fixed", bottom: 20, right: 24, background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, color: "rgba(255,255,255,0.45)",
          fontSize: 10, letterSpacing: 2, padding: "6px 16px", cursor: "pointer", zIndex: 30, backdropFilter: "blur(8px)",
        }}>
          SKIP
        </button>
      )}

      {/* Progress bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, height: 1,
        background: "linear-gradient(90deg, #00ffff, #ff00ff)",
        width: `${progress * 100}%`, zIndex: 30, transition: "width 0.1s linear",
        opacity: showLogin ? 0 : 0.8,
      }} />

      <LoginOverlay visible={showLogin} />
    </div>
  );
}
