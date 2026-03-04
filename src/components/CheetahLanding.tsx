import { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { createCheetahGeometry } from './cheetah/geometry';

// Phase timings in seconds
const T = { WALK: 3, SPRINT: 7, FAST: 11, SLOW: 14, STOP: 17, PULSE: 19, DISSOLVE: 22, FORM: 25, DONE: 28 };
const PARTICLES = 3000;

function Scene({ onLoginReady }: { onLoginReady: () => void }) {
  const { camera } = useThree();
  const cheetahRef = useRef<THREE.Group>(null!);
  const reflRef = useRef<THREE.Group>(null!);
  const ptsRef = useRef<THREE.Points>(null!);
  const pulseRef = useRef<THREE.Mesh>(null!);
  const clock = useRef(0);
  const loginFired = useRef(false);

  const geo = useMemo(() => createCheetahGeometry(), []);
  const verts = useMemo(() => new Float32Array(geo.getAttribute('position').array), [geo]);
  const vertCols = useMemo(() => new Float32Array(geo.getAttribute('color').array), [geo]);

  const [pGeo, dissolveVel, cardTargets] = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(PARTICLES * 3);
    const c = new Float32Array(PARTICLES * 3);
    for (let i = 0; i < PARTICLES; i++) {
      p[i * 3] = 0; p[i * 3 + 1] = -10; p[i * 3 + 2] = 0;
      c[i * 3] = 0; c[i * 3 + 1] = 1; c[i * 3 + 2] = 1;
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));

    const vel = new Float32Array(PARTICLES * 3);
    const tgt = new Float32Array(PARTICLES * 3);
    for (let i = 0; i < PARTICLES; i++) {
      vel[i * 3] = (Math.random() - 0.5) * 3;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 3;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 3;

      const hw = 0.7, hh = 0.5, cy = 0.7;
      const onEdge = Math.random() < 0.35;
      if (onEdge) {
        const side = Math.floor(Math.random() * 4);
        if (side === 0) { tgt[i * 3] = (Math.random() - 0.5) * hw * 2; tgt[i * 3 + 1] = cy + hh; }
        else if (side === 1) { tgt[i * 3] = (Math.random() - 0.5) * hw * 2; tgt[i * 3 + 1] = cy - hh; }
        else if (side === 2) { tgt[i * 3] = -hw; tgt[i * 3 + 1] = cy + (Math.random() - 0.5) * hh * 2; }
        else { tgt[i * 3] = hw; tgt[i * 3 + 1] = cy + (Math.random() - 0.5) * hh * 2; }
      } else {
        tgt[i * 3] = (Math.random() - 0.5) * hw * 1.8;
        tgt[i * 3 + 1] = cy + (Math.random() - 0.5) * hh * 1.8;
      }
      tgt[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
    }

    return [g, vel, tgt] as const;
  }, []);

  useFrame((_, delta) => {
    clock.current += delta;
    const t = clock.current;

    const ch = cheetahRef.current;
    const refl = reflRef.current;
    const pts = ptsRef.current;
    const pulse = pulseRef.current;
    if (!ch || !refl || !pts || !pulse) return;

    // Camera push forward
    camera.position.set(0, 1.2, Math.max(6 - t * 0.06, 3.2));
    camera.lookAt(0, 0.7, 0);

    let cx = -10, vis = false, opacity = 1;
    let trailActive = false;

    if (t < T.WALK) {
      vis = false;
    } else if (t < T.SPRINT) {
      const p = (t - T.WALK) / (T.SPRINT - T.WALK);
      cx = THREE.MathUtils.lerp(-7, -1, p);
      vis = true;
    } else if (t < T.FAST) {
      const p = (t - T.SPRINT) / (T.FAST - T.SPRINT);
      cx = THREE.MathUtils.lerp(-1, 3, p);
      vis = true; trailActive = true;
    } else if (t < T.SLOW) {
      const p = (t - T.FAST) / (T.SLOW - T.FAST);
      cx = THREE.MathUtils.lerp(3, 1, p);
      vis = true; trailActive = true;
    } else if (t < T.STOP) {
      const p = (t - T.SLOW) / (T.STOP - T.SLOW);
      cx = THREE.MathUtils.lerp(1, 0, p);
      vis = true; trailActive = true;
    } else if (t < T.PULSE) {
      cx = 0; vis = true;
    } else if (t < T.DISSOLVE) {
      cx = 0; vis = true;
      opacity = 0.5 + Math.sin(t * 25) * 0.5;
      const rp = (t - T.PULSE) / (T.DISSOLVE - T.PULSE);
      ch.rotation.y = rp * Math.PI * 0.4;
      refl.rotation.y = ch.rotation.y;
      const pulseT = Math.min(rp * 2, 1);
      pulse.visible = pulseT < 1;
      pulse.scale.setScalar(pulseT * 3);
      (pulse.material as THREE.MeshBasicMaterial).opacity = (1 - pulseT) * 0.8;
    } else if (t < T.FORM) {
      const dp = (t - T.DISSOLVE) / (T.FORM - T.DISSOLVE);
      vis = dp < 0.2;
      opacity = Math.max(0, 1 - dp * 5);
      cx = 0;
    } else {
      vis = false;
      if (!loginFired.current) {
        loginFired.current = true;
        onLoginReady();
      }
    }

    ch.visible = vis;
    refl.visible = vis;
    ch.position.x = cx;
    refl.position.x = cx;

    // Running bob
    if (vis && t > T.WALK && t < T.STOP) {
      ch.position.y = Math.sin(t * 10) * 0.025;
      refl.position.y = -ch.position.y;
    }

    // Update cheetah opacity
    ch.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        const mat = (obj as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (mat.wireframe) mat.opacity = opacity * 0.85;
        else mat.opacity = opacity * 0.25;
      }
    });
    refl.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        const mat = (obj as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (mat.wireframe) mat.opacity = opacity * 0.12;
        else mat.opacity = opacity * 0.06;
      }
    });

    // Pulse visibility
    if (t < T.PULSE || t >= T.DISSOLVE) pulse.visible = false;

    // Particles
    const pa = pts.geometry.getAttribute('position').array as Float32Array;
    const ca = pts.geometry.getAttribute('color').array as Float32Array;
    const nv = verts.length / 3;

    if (trailActive) {
      for (let i = 0; i < PARTICLES; i++) {
        if (pa[i * 3 + 1] < -5) {
          pa[i * 3] = cx + (Math.random() - 0.5) * 2;
          pa[i * 3 + 1] = 0.2 + Math.random() * 1.2;
          pa[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
          const isCyan = Math.random() > 0.5;
          ca[i * 3] = isCyan ? 0 : 1;
          ca[i * 3 + 1] = isCyan ? 1 : 0;
          ca[i * 3 + 2] = 1;
        } else {
          pa[i * 3] -= 0.04;
          pa[i * 3 + 1] -= 0.003;
          if (Math.abs(pa[i * 3] - cx) > 4) pa[i * 3 + 1] = -10;
        }
      }
    } else if (t >= T.DISSOLVE && t < T.FORM) {
      const dp = (t - T.DISSOLVE) / (T.FORM - T.DISSOLVE);
      for (let i = 0; i < PARTICLES; i++) {
        const vi = i % nv;
        pa[i * 3] = verts[vi * 3] + dissolveVel[i * 3] * dp * 2;
        pa[i * 3 + 1] = verts[vi * 3 + 1] + dissolveVel[i * 3 + 1] * dp * 2;
        pa[i * 3 + 2] = verts[vi * 3 + 2] + dissolveVel[i * 3 + 2] * dp * 2;
        ca[i * 3] = vertCols[vi * 3];
        ca[i * 3 + 1] = vertCols[vi * 3 + 1];
        ca[i * 3 + 2] = vertCols[vi * 3 + 2];
      }
    } else if (t >= T.FORM) {
      for (let i = 0; i < PARTICLES; i++) {
        pa[i * 3] += (cardTargets[i * 3] - pa[i * 3]) * 0.04;
        pa[i * 3 + 1] += (cardTargets[i * 3 + 1] - pa[i * 3 + 1]) * 0.04;
        pa[i * 3 + 2] += (cardTargets[i * 3 + 2] - pa[i * 3 + 2]) * 0.04;
        ca[i * 3] += (0 - ca[i * 3]) * 0.03;
        ca[i * 3 + 1] += (1 - ca[i * 3 + 1]) * 0.03;
        ca[i * 3 + 2] += (1 - ca[i * 3 + 2]) * 0.03;
      }
      if (t > T.DONE + 2) {
        for (let i = 0; i < PARTICLES; i++) {
          pa[i * 3 + 1] += (Math.random() - 0.5) * 0.015;
          pa[i * 3] += (Math.random() - 0.5) * 0.015;
        }
      }
    } else {
      for (let i = 0; i < PARTICLES; i++) {
        if (pa[i * 3 + 1] > -5) pa[i * 3 + 1] -= 0.01;
      }
    }

    (pts.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (pts.geometry.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <>
      <ambientLight intensity={0.2} color="#00ffff" />
      <pointLight position={[0, 3, 2]} intensity={0.5} color="#00ffff" />
      <pointLight position={[-2, 1, 0]} intensity={0.3} color="#ff00ff" />

      {/* Floor */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.005}>
        <planeGeometry args={[50, 50]} />
        <meshBasicMaterial color="#050508" transparent opacity={0.6} />
      </mesh>

      {/* Cheetah */}
      <group ref={cheetahRef}>
        <mesh geometry={geo}>
          <meshBasicMaterial vertexColors transparent opacity={0.25} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <mesh geometry={geo}>
          <meshBasicMaterial vertexColors wireframe transparent opacity={0.85} />
        </mesh>
      </group>

      {/* Reflection */}
      <group ref={reflRef} scale-y={-1}>
        <mesh geometry={geo}>
          <meshBasicMaterial vertexColors transparent opacity={0.06} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <mesh geometry={geo}>
          <meshBasicMaterial vertexColors wireframe transparent opacity={0.12} />
        </mesh>
      </group>

      {/* Energy pulse */}
      <mesh ref={pulseRef} position={[0, 0.9, 0]} visible={false}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} />
      </mesh>

      {/* Particles */}
      <points ref={ptsRef} geometry={pGeo}>
        <pointsMaterial vertexColors size={0.035} transparent opacity={0.75} sizeAttenuation depthWrite={false} />
      </points>
    </>
  );
}

// ==================== LOGIN OVERLAY ====================

function LoginOverlay({ visible }: { visible: boolean }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setOpacity(1), 200);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!visible) return null;

  const isLogin = tab === 'login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else navigate('/verify-access');
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else navigate('/verify-otp');
    }
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 44,
    background: 'rgba(0,0,0,0.5)',
    border: '1px solid rgba(0,255,255,0.15)',
    borderRadius: 8,
    padding: '0 14px',
    fontFamily: 'Jost, sans-serif',
    fontSize: 14,
    color: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'Jost, sans-serif',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.35)',
    display: 'block',
    marginBottom: 5,
  };

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity, transition: 'opacity 1.2s ease',
      pointerEvents: visible ? 'auto' : 'none',
      zIndex: 10,
    }}>
      <div style={{
        background: 'rgba(10,10,15,0.85)',
        border: '1px solid rgba(0,255,255,0.2)',
        borderRadius: 16,
        padding: '40px 36px 32px',
        width: '100%', maxWidth: 380,
        backdropFilter: 'blur(20px)',
        boxShadow: '0 0 40px rgba(0,255,255,0.1), inset 0 1px 0 rgba(0,255,255,0.1)',
      }}>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 34, fontWeight: 400, fontStyle: 'italic',
          color: '#00ffff', textAlign: 'center', margin: 0,
          letterSpacing: '2px',
          textShadow: '0 0 20px rgba(0,255,255,0.3)',
        }}>MirrorAI</h1>

        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 13, fontStyle: 'italic',
          color: 'rgba(0,255,255,0.5)', textAlign: 'center',
          marginTop: 4, letterSpacing: '0.1em',
        }}>Mirror never lies</p>

        {error && (
          <div style={{
            marginTop: 16, padding: '8px 14px', borderRadius: 8,
            border: '1px solid rgba(255,80,80,0.4)',
            background: 'rgba(255,80,80,0.08)',
            fontFamily: 'Jost, sans-serif', fontSize: 12,
            color: '#ff6060', textAlign: 'center',
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com" required
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'rgba(0,255,255,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(0,255,255,0.15)'}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••" required minLength={6}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'rgba(0,255,255,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(0,255,255,0.15)'}
            />
          </div>
          <button type="submit" disabled={loading} style={{
            width: '100%', height: 46,
            background: 'linear-gradient(135deg, #00ffff, #00cccc)',
            border: 'none', borderRadius: 8,
            fontFamily: 'Jost, sans-serif', fontSize: 13,
            fontWeight: 700, letterSpacing: '2px',
            textTransform: 'uppercase', color: '#000',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(0,255,255,0.2)',
            opacity: loading ? 0.6 : 1,
          }}>
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
            <button type="button" onClick={() => { setTab(isLogin ? 'signup' : 'login'); setError(''); }} style={{
              background: 'none', border: 'none',
              fontFamily: 'Jost, sans-serif', fontSize: 11,
              color: 'rgba(255,255,255,0.35)', cursor: 'pointer',
            }}>
              {isLogin
                ? <>No account? <span style={{ color: '#00ffff' }}>Sign up</span></>
                : <>Have an account? <span style={{ color: '#00ffff' }}>Sign in</span></>}
            </button>
          </div>
        </form>

        <p style={{
          fontFamily: 'Jost, sans-serif', fontSize: 9,
          fontWeight: 500, letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.15)',
          textAlign: 'center', marginTop: 20, marginBottom: 0,
        }}>professional and premium</p>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

const CheetahLanding = () => {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);

  const skipIntro = useCallback(() => {
    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [0, 1.2, 6], fov: 50 }}
        style={{ position: 'absolute', inset: 0 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 10, 30]} />
        <Scene onLoginReady={() => setShowLogin(true)} />
      </Canvas>

      <LoginOverlay visible={showLogin} />

      <button
        onClick={skipIntro}
        style={{
          position: 'absolute', bottom: 24, right: 28, zIndex: 100,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8, padding: '8px 20px',
          fontFamily: 'Jost, sans-serif', fontSize: 11,
          fontWeight: 500, letterSpacing: '1.5px',
          textTransform: 'uppercase' as const,
          color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
          backdropFilter: 'blur(8px)',
        }}
      >
        Skip
      </button>
    </div>
  );
};

export default CheetahLanding;
