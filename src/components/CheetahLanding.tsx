import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { generateCheetahPoints, createGlowTexture } from "./cheetah/geometry";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/* ── Timeline Constants (seconds) ── */
const T = {
  VOID_END: 2,
  WALK_END: 5,
  SPRINT_END: 9,
  HIGHSPEED_END: 12,
  DECEL_END: 14.5,
  STOP_END: 17,
  TURN_END: 20.5,
  DISSOLVE_END: 23.5,
  STREAM_END: 26,
  FORM_END: 28.5,
  TOTAL: 30,
};

const POINT_COUNT = 4000;
const PARTICLE_COUNT = 4000;

/* ── Glow texture loader ── */
function useGlowTexture() {
  return useMemo(() => {
    const dataUrl = createGlowTexture();
    const tex = new THREE.TextureLoader().load(dataUrl);
    return tex;
  }, []);
}

/* ── Diagonal background drift lines ── */
function DriftLines() {
  const groupRef = useRef<THREE.Group>(null);
  const linesData = useMemo(() => {
    const arr: { x: number; y: number; z: number; angle: number; color: number }[] = [];
    for (let i = 0; i < 25; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 30,
        y: (Math.random() - 0.5) * 15,
        z: -15 - Math.random() * 25,
        angle: -30 + Math.random() * 10,
        color: i % 2 === 0 ? 0x003344 : 0x220033,
      });
    }
    return arr;
  }, []);

  const lineObjects = useMemo(() => {
    return linesData.map((l) => {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-8, 0, 0),
        new THREE.Vector3(8, 0, 0),
      ]);
      const mat = new THREE.LineBasicMaterial({ color: l.color, transparent: true, opacity: 0.3 });
      const line = new THREE.Line(geo, mat);
      line.position.set(l.x, l.y, l.z);
      line.rotation.z = (l.angle * Math.PI) / 180;
      return line;
    });
  }, [linesData]);

  useFrame(() => {
    lineObjects.forEach((line) => {
      line.position.x += 0.003;
      if (line.position.x > 20) line.position.x = -20;
    });
  });

  return (
    <group ref={groupRef}>
      {lineObjects.map((obj, i) => (
        <primitive key={i} object={obj} />
      ))}
    </group>
  );
}

/* ── Reflective Floor ── */
function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <planeGeometry args={[60, 60]} />
      <meshStandardMaterial color={0x050505} metalness={0.95} roughness={0.15} transparent opacity={0.6} />
    </mesh>
  );
}

/* ── Energy pulse sphere ── */
function EnergySphere({ progress, position }: { progress: number; position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const s = 0.1 + progress * 5.9;
    ref.current.scale.set(s, s, s);
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    if (mat) {
      mat.opacity = progress < 0.5 ? progress * 1.6 : Math.max(0, 1.6 - progress * 1.6);
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color={0x00ffff} wireframe transparent opacity={0} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

/* ── Main Animated Scene ── */
function AnimatedScene({ onPhaseChange, onTimeUpdate }: { onPhaseChange: (p: string) => void; onTimeUpdate: (t: number) => void }) {
  const { camera } = useThree();
  const clockRef = useRef(0);
  const glowTex = useGlowTexture();

  const { positions: basePositions, colors: baseColors } = useMemo(() => generateCheetahPoints(POINT_COUNT), []);
  const origPositions = useRef(new Float32Array(basePositions));

  // Materials — each created fresh, never shared
  const cheetahMat = useMemo(
    () => new THREE.PointsMaterial({
      size: 0.04, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 1,
      blending: THREE.AdditiveBlending, depthWrite: false, map: glowTex,
    }), [glowTex]
  );

  const reflMat = useMemo(
    () => new THREE.PointsMaterial({
      size: 0.03, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.15,
      blending: THREE.AdditiveBlending, depthWrite: false, map: glowTex,
    }), [glowTex]
  );

  const trailMat = useMemo(
    () => new THREE.PointsMaterial({
      size: 0.025, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.7,
      blending: THREE.AdditiveBlending, depthWrite: false, map: glowTex,
    }), [glowTex]
  );

  const dissolveMat = useMemo(
    () => new THREE.PointsMaterial({
      size: 0.035, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 1,
      blending: THREE.AdditiveBlending, depthWrite: false, map: glowTex,
    }), [glowTex]
  );

  // Refs
  const cheetahRef = useRef<THREE.Points>(null);
  const reflRef = useRef<THREE.Points>(null);
  const trailRef = useRef<THREE.Points>(null);
  const dissolveRef = useRef<THREE.Points>(null);

  // Buffers for trail
  const trailPositions = useRef(new Float32Array(1500 * 3));
  const trailColors = useRef(new Float32Array(1500 * 3));
  const trailIdx = useRef(0);

  // Dissolve buffers
  const dissolvePositions = useRef(new Float32Array(PARTICLE_COUNT * 3));
  const dissolveVelocities = useRef(new Float32Array(PARTICLE_COUNT * 3));
  const dissolveColors = useRef(new Float32Array(PARTICLE_COUNT * 3));
  const dissolveInitialized = useRef(false);

  // Energy sphere
  const energyProgress = useRef(0);
  const energyVisible = useRef(false);
  const cheetahWorldX = useRef(0);

  useFrame((_, delta) => {
    clockRef.current += delta;
    const t = clockRef.current;
    onTimeUpdate(t);

    const cam = camera as THREE.PerspectiveCamera;

    // Camera
    let targetZ = 11;
    if (t >= T.VOID_END && t < T.WALK_END) targetZ = THREE.MathUtils.lerp(11, 9, (t - T.VOID_END) / (T.WALK_END - T.VOID_END));
    else if (t >= T.WALK_END && t < T.SPRINT_END) targetZ = THREE.MathUtils.lerp(9, 7.5, (t - T.WALK_END) / (T.SPRINT_END - T.WALK_END));
    else if (t >= T.SPRINT_END && t < T.HIGHSPEED_END) targetZ = THREE.MathUtils.lerp(7.5, 6, (t - T.SPRINT_END) / (T.HIGHSPEED_END - T.SPRINT_END));
    else if (t >= T.HIGHSPEED_END) targetZ = 6;

    cam.position.x += (0 - cam.position.x) * 0.02;
    cam.position.y += (2.2 - cam.position.y) * 0.02;
    cam.position.z += (targetZ - cam.position.z) * 0.02;
    cam.lookAt(0, 1.2, 0);

    // Phase label
    if (t < T.VOID_END) onPhaseChange("ESTABLISHING");
    else if (t < T.WALK_END) onPhaseChange("CHEETAH ENTERS");
    else if (t < T.SPRINT_END) onPhaseChange("RUNNING");
    else if (t < T.HIGHSPEED_END) onPhaseChange("HIGH SPEED");
    else if (t < T.DECEL_END) onPhaseChange("SLOWING");
    else if (t < T.STOP_END) onPhaseChange("STOPPED");
    else if (t < T.TURN_END) onPhaseChange("THE MOMENT");
    else if (t < T.DISSOLVE_END) onPhaseChange("DISSOLVE");
    else if (t < T.STREAM_END) onPhaseChange("CONVERGENCE");
    else if (t < T.FORM_END) onPhaseChange("UI FORMATION");
    else onPhaseChange("MIRRORAI");

    const cheetah = cheetahRef.current;
    const refl = reflRef.current;
    const trail = trailRef.current;
    const dissolve = dissolveRef.current;
    if (!cheetah || !refl) return;

    const posAttr = cheetah.geometry.getAttribute("position") as THREE.BufferAttribute;
    const reflPosAttr = refl.geometry.getAttribute("position") as THREE.BufferAttribute;
    if (!posAttr || !reflPosAttr) return;

    if (t < T.VOID_END) {
      cheetah.visible = false;
      refl.visible = false;
      if (trail) trail.visible = false;
      energyVisible.current = false;
    } else if (t < T.TURN_END) {
      cheetah.visible = true;
      refl.visible = true;
      energyVisible.current = false;

      let cx = 0;
      let scaleX = 1;

      if (t < T.WALK_END) {
        const p = (t - T.VOID_END) / (T.WALK_END - T.VOID_END);
        cx = THREE.MathUtils.lerp(-10, -1, p);
        cheetahMat.opacity = Math.min(1, p * 2);
      } else if (t < T.SPRINT_END) {
        const p = (t - T.WALK_END) / (T.SPRINT_END - T.WALK_END);
        cx = THREE.MathUtils.lerp(-1, 2, p);
      } else if (t < T.HIGHSPEED_END) {
        const p = (t - T.SPRINT_END) / (T.HIGHSPEED_END - T.SPRINT_END);
        cx = THREE.MathUtils.lerp(2, 4, p);
        scaleX = THREE.MathUtils.lerp(1, 1.8, p);
      } else if (t < T.DECEL_END) {
        const p = (t - T.HIGHSPEED_END) / (T.DECEL_END - T.HIGHSPEED_END);
        cx = THREE.MathUtils.lerp(4, 1.5, p);
        scaleX = THREE.MathUtils.lerp(1.8, 1, p);
      } else if (t < T.STOP_END) {
        cx = 1.5;
      } else {
        // Turn & pulse
        cx = 1.5;
        const turnP = (t - T.STOP_END) / (T.TURN_END - T.STOP_END);
        cheetah.rotation.y = THREE.MathUtils.lerp(0, Math.PI * 0.5, turnP);
        energyVisible.current = true;
        energyProgress.current = turnP;

        // Flash colors
        const colAttr = cheetah.geometry.getAttribute("color") as THREE.BufferAttribute;
        if (colAttr) {
          for (let i = 0; i < POINT_COUNT; i++) {
            const flash = Math.sin(t * 20 + i * 0.1) * 0.3 + 0.3;
            colAttr.setXYZ(i,
              Math.min(1, baseColors[i * 3] + flash * turnP),
              Math.min(1, baseColors[i * 3 + 1] + flash * turnP),
              baseColors[i * 3 + 2]
            );
          }
          colAttr.needsUpdate = true;
        }
      }

      cheetahWorldX.current = cx;

      // Gallop
      const speed = t < T.WALK_END ? 2 : t < T.SPRINT_END ? 6 : t < T.HIGHSPEED_END ? 10 : t < T.DECEL_END ? 4 : 0;
      const bobAmp = speed * 0.005;
      const legAmp = speed * 0.02;

      for (let i = 0; i < POINT_COUNT; i++) {
        const ox = origPositions.current[i * 3];
        const oy = origPositions.current[i * 3 + 1];
        const oz = origPositions.current[i * 3 + 2];
        let ny = oy + Math.sin(t * speed * 2) * bobAmp;
        if (oy < 0.6) {
          const legPhase = ox > 0 ? 0 : Math.PI;
          const sidePhase = oz > 0 ? 0 : Math.PI * 0.5;
          ny += Math.sin(t * speed * 2 + legPhase + sidePhase) * legAmp;
        }
        posAttr.setXYZ(i, ox * scaleX, ny, oz);
      }
      posAttr.needsUpdate = true;

      cheetah.position.x = cx;
      if (t < T.STOP_END) cheetah.rotation.y = 0;

      // Reflection
      refl.position.x = cx;
      refl.rotation.y = cheetah.rotation.y;
      for (let i = 0; i < POINT_COUNT; i++) {
        reflPosAttr.setXYZ(i, posAttr.getX(i), -posAttr.getY(i) - 0.02, posAttr.getZ(i));
      }
      reflPosAttr.needsUpdate = true;

      // Trail
      if (t > T.WALK_END && t < T.DECEL_END && trail) {
        const tpAttr = trail.geometry.getAttribute("position") as THREE.BufferAttribute;
        const tcAttr = trail.geometry.getAttribute("color") as THREE.BufferAttribute;
        if (tpAttr && tcAttr) {
          for (let s = 0; s < 3; s++) {
            const ti = trailIdx.current % 1500;
            tpAttr.setXYZ(ti, cx - 1.5 + (Math.random() - 0.5) * 0.5, 0.7 + (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.3);
            const cyan = Math.random() > 0.3;
            tcAttr.setXYZ(ti, cyan ? 0 : 1, cyan ? 1 : 0, 1);
            trailIdx.current++;
          }
          for (let i = 0; i < 1500; i++) {
            const y = tpAttr.getY(i);
            if (y > 0) {
              tpAttr.setY(i, y - 0.005);
              tpAttr.setX(i, tpAttr.getX(i) - 0.02);
            }
          }
          tpAttr.needsUpdate = true;
          tcAttr.needsUpdate = true;
          trail.visible = true;
        }
      } else if (trail && t > T.DECEL_END) {
        trail.visible = false;
      }
    } else {
      // Dissolve phase
      cheetah.visible = false;
      refl.visible = false;
      if (trail) trail.visible = false;
      energyVisible.current = false;

      if (!dissolveInitialized.current && dissolve) {
        const lastX = cheetahWorldX.current;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const si = i % POINT_COUNT;
          dissolvePositions.current[i * 3] = origPositions.current[si * 3] + lastX;
          dissolvePositions.current[i * 3 + 1] = origPositions.current[si * 3 + 1];
          dissolvePositions.current[i * 3 + 2] = origPositions.current[si * 3 + 2];
          dissolveVelocities.current[i * 3] = (Math.random() - 0.5) * 3;
          dissolveVelocities.current[i * 3 + 1] = (Math.random() - 0.3) * 2;
          dissolveVelocities.current[i * 3 + 2] = (Math.random() - 0.5) * 3;
          dissolveColors.current[i * 3] = baseColors[(si % POINT_COUNT) * 3];
          dissolveColors.current[i * 3 + 1] = baseColors[(si % POINT_COUNT) * 3 + 1];
          dissolveColors.current[i * 3 + 2] = baseColors[(si % POINT_COUNT) * 3 + 2];
        }
        const dGeo = dissolve.geometry;
        dGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(dissolvePositions.current), 3));
        dGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(dissolveColors.current), 3));
        dissolveInitialized.current = true;
      }

      if (dissolveInitialized.current && dissolve) {
        const dPos = dissolve.geometry.getAttribute("position") as THREE.BufferAttribute;
        if (!dPos) return;
        dissolve.visible = true;

        if (t < T.DISSOLVE_END) {
          const ep = (t - T.TURN_END) / (T.DISSOLVE_END - T.TURN_END);
          for (let i = 0; i < PARTICLE_COUNT; i++) {
            dissolvePositions.current[i * 3] += dissolveVelocities.current[i * 3] * delta * (1 - ep);
            dissolvePositions.current[i * 3 + 1] += dissolveVelocities.current[i * 3 + 1] * delta * (1 - ep);
            dissolvePositions.current[i * 3 + 2] += dissolveVelocities.current[i * 3 + 2] * delta * (1 - ep);
          }
          dissolveMat.opacity = 1;
        } else if (t < T.STREAM_END) {
          const sp = (t - T.DISSOLVE_END) / (T.STREAM_END - T.DISSOLVE_END);
          for (let i = 0; i < PARTICLE_COUNT; i++) {
            dissolvePositions.current[i * 3] += (0 - dissolvePositions.current[i * 3]) * sp * 0.03;
            dissolvePositions.current[i * 3 + 1] += (1.5 - dissolvePositions.current[i * 3 + 1]) * sp * 0.03;
            dissolvePositions.current[i * 3 + 2] += (0 - dissolvePositions.current[i * 3 + 2]) * sp * 0.03;
          }
          dissolveMat.opacity = THREE.MathUtils.lerp(1, 0.3, sp);
        } else {
          const fp = Math.min(1, (t - T.STREAM_END) / (T.FORM_END - T.STREAM_END));
          dissolveMat.opacity = THREE.MathUtils.lerp(0.3, 0, fp);
          if (fp >= 1) dissolve.visible = false;
        }

        dPos.set(dissolvePositions.current);
        dPos.needsUpdate = true;
      }
    }
  });

  // Build geometry objects
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
      <ambientLight intensity={0.15} />
      <pointLight position={[5, 8, 5]} intensity={0.5} color={0x00ffff} />
      <pointLight position={[-3, 4, -2]} intensity={0.3} color={0xff00ff} />
      <points ref={cheetahRef} visible={false} geometry={cheetahGeo} material={cheetahMat} />
      <points ref={reflRef} visible={false} geometry={reflGeo} material={reflMat} />
      <points ref={trailRef} visible={false} geometry={trailGeo} material={trailMat} />
      <points ref={dissolveRef} visible={false} geometry={dissolveGeo} material={dissolveMat} />
      {energyVisible.current && <EnergySphere progress={energyProgress.current} position={[cheetahWorldX.current, 1, 0]} />}
    </>
  );
}

/* ── Login Card Overlay ── */
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
        boxShadow: "0 0 60px rgba(0,255,255,0.08), 0 0 120px rgba(255,0,255,0.04)",
      }}>
        <h1 style={{ textAlign: "center", fontSize: 28, letterSpacing: 6, color: "#fff", margin: 0, fontFamily: "'Cormorant Garamond', serif" }}>
          Mirror<span style={{ color: "#00ffff" }}>AI</span>
        </h1>
        <p style={{ textAlign: "center", color: "#00ffff", fontStyle: "italic", fontSize: 11, margin: "6px 0 28px", letterSpacing: 2 }}>
          Mirror never lies
        </p>
        {error && <p style={{ color: "#ff4466", fontSize: 11, textAlign: "center", marginBottom: 12 }}>{error}</p>}
        <div style={{ marginBottom: 16 }}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 20, position: "relative" }}>
          <input type={showPw ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "10px 40px 10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 16 }}>
            {showPw ? "◉" : "◎"}
          </button>
        </div>
        <button type="submit" disabled={loading} style={{
          width: "100%", padding: "11px 0", background: "linear-gradient(135deg, #00cccc, #00ffff)",
          border: "none", borderRadius: 6, color: "#000", fontSize: 12, fontWeight: 700, letterSpacing: 3,
          cursor: "pointer", textTransform: "uppercase",
          boxShadow: "0 0 20px rgba(0,255,255,0.3), 0 0 40px rgba(0,255,255,0.1)",
        }}>
          {loading ? "..." : "SIGN IN"}
        </button>
        <p style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 18 }}>
          No account?{" "}<span onClick={() => navigate("/register")} style={{ color: "#00ffff", cursor: "pointer" }}>Sign up</span>
          {"   "}<span onClick={() => navigate("/forgot-password")} style={{ color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>Forgot?</span>
        </p>
        <p style={{ textAlign: "center", fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 10, letterSpacing: 1 }}>
          professional and premium
        </p>
      </form>
    </div>
  );
}

/* ── Main Component ── */
export default function CheetahLanding() {
  const [phase, setPhase] = useState("ESTABLISHING");
  const [time, setTime] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (time >= T.FORM_END - 1 || skipped) setShowLogin(true);
  }, [time, skipped]);

  const handleSkip = useCallback(() => { setSkipped(true); setShowLogin(true); }, []);
  const progress = Math.min(1, time / T.TOTAL);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", overflow: "hidden" }}>
      {!skipped && (
        <Canvas
          camera={{ position: [0, 2.2, 11], fov: 50, near: 0.1, far: 100 }}
          gl={{ antialias: window.innerWidth > 768, powerPreference: "high-performance", alpha: false }}
          dpr={Math.min(window.devicePixelRatio, 2)}
          style={{ position: "absolute", inset: 0 }}
        >
          <color attach="background" args={["#000000"]} />
          <fog attach="fog" args={["#000000", 15, 50]} />
          <AnimatedScene onPhaseChange={setPhase} onTimeUpdate={setTime} />
        </Canvas>
      )}

      {/* Scene label */}
      <div style={{
        position: "fixed", top: 16, left: 20, color: "#00ffff", fontSize: 10, letterSpacing: 3,
        fontFamily: "monospace", zIndex: 30, opacity: showLogin ? 0 : 0.7, transition: "opacity 1s", pointerEvents: "none",
      }}>
        {phase}
      </div>

      {/* Skip */}
      {!showLogin && (
        <button onClick={handleSkip} style={{
          position: "fixed", bottom: 20, right: 24, background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "rgba(255,255,255,0.5)",
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
        opacity: showLogin ? 0 : 1,
      }} />

      <LoginOverlay visible={showLogin} />
    </div>
  );
}
