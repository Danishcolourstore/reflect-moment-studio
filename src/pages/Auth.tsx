import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AuthProps {
  initialView?: "landing" | "login" | "signup" | "forgot";
}

/* ── Lightweight film-dust canvas ── */
function FilmDustCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    const particles: { x: number; y: number; r: number; a: number; dy: number; flicker: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Seed particles
    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.3,
        a: Math.random() * 0.25 + 0.05,
        dy: Math.random() * 0.15 + 0.03,
        flicker: Math.random() * 200 + 100,
      });
    }

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;
      particles.forEach((p) => {
        const visible = Math.sin(frame / p.flicker) > -0.3;
        if (!visible) return;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.a})`;
        ctx.fill();
        p.y += p.dy;
        if (p.y > canvas.height + 5) {
          p.y = -5;
          p.x = Math.random() * canvas.width;
        }
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1]"
      style={{ opacity: 0.6 }}
    />
  );
}

const Auth = function Auth({ initialView }: AuthProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [tab, setTab] = useState<"login" | "signup">(initialView === "signup" ? "signup" : "login");
  const [cardVisible, setCardVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setCardVisible(true), 80);
    // Apply saved accent on login page
    const savedAccent = localStorage.getItem('accent');
    if (savedAccent === 'red') {
      document.documentElement.classList.add('accent-red');
    } else {
      document.documentElement.classList.remove('accent-red');
    }
    return () => clearTimeout(t);
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else navigate("/verify-access");
    setLoading(false);
  };

  const handleSignup = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else navigate("/verify-otp");
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) { setError("Enter your email address first"); return; }
    setError("");
    setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setError(error.message);
    else setMessage("Password reset link sent to your email");
  };

  const isLogin = tab === "login";

  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 sm:px-6 bg-background overflow-y-auto overflow-x-hidden py-8">
      {/* ── Film grain overlay ── */}
      <div
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          opacity: 0.04,
          mixBlendMode: "overlay",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`,
          backgroundSize: "180px 180px",
          animation: "grain-drift 8s steps(10) infinite",
        }}
      />

      {/* ── Film dust particles ── */}
      <FilmDustCanvas />

      {/* ── Vignette ── */}
      <div
        className="fixed inset-0 pointer-events-none z-[2]"
        style={{
          background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)",
        }}
      />

      {/* ── Film-scratch lines ── */}
      <div
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          opacity: 0.03,
          background: `repeating-linear-gradient(90deg, transparent, transparent 340px, rgba(255,255,255,0.15) 340px, rgba(255,255,255,0.15) 341px)`,
        }}
      />

      {/* ── Content ── */}
      <div
        className="w-full max-w-[400px] flex flex-col relative z-10"
        style={{
          opacity: cardVisible ? 1 : 0,
          transform: cardVisible ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
        }}
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <h1
            className="text-[28px] font-semibold text-foreground"
            style={{ letterSpacing: "0.04em" }}
          >
            Mirror AI
          </h1>
          <p
            className="mt-1.5 text-sm text-muted-foreground"
            style={{ letterSpacing: "0.06em", textTransform: "uppercase", fontSize: "11px" }}
          >
            Photography platform for professionals
          </p>
        </div>

        {/* Card with matte photo-paper texture */}
        <div
          className="bg-card rounded-xl border border-border p-8 relative overflow-hidden"
          style={{
            boxShadow: "0 8px 40px -12px rgba(0,0,0,0.6), inset 0 0 40px 8px rgba(0,0,0,0.15)",
          }}
        >
          {/* Subtle paper texture on card */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: 0.015,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)'/%3E%3C/svg%3E")`,
              backgroundSize: "150px 150px",
            }}
          />

          {/* Tab toggle */}
          <div className="flex rounded-lg bg-secondary p-1 mb-6 relative z-10">
            {(["login", "signup"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setPassword(""); setError(""); setMessage(""); }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                  tab === t
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={{ letterSpacing: "0.03em" }}
              >
                {t === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm relative z-10">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-primary/5 border border-primary/10 text-foreground text-sm relative z-10">
              {message}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={(e) => { e.preventDefault(); isLogin ? handleLogin() : handleSignup(); }}
            className="flex flex-col gap-4 relative z-10"
          >
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" style={{ letterSpacing: "0.02em" }}>Email</label>
              <div className="flex items-center gap-3 px-4 h-11 rounded-lg border border-border bg-background transition-all focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="bg-transparent w-full outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" style={{ letterSpacing: "0.02em" }}>Password</label>
              <div className="flex items-center gap-3 px-4 h-11 rounded-lg border border-border bg-background transition-all focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent">
                <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder={isLogin ? "Enter password" : "Create password (min 6 chars)"}
                  required
                  minLength={6}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className="bg-transparent w-full outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="shrink-0 p-0.5 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  style={{ letterSpacing: "0.02em" }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ letterSpacing: "0.03em" }}
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Bottom link */}
        <p className="text-center mt-6 text-sm text-muted-foreground" style={{ letterSpacing: "0.02em" }}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => { setTab(isLogin ? "signup" : "login"); setPassword(""); setError(""); setMessage(""); }}
            className="text-foreground font-medium hover:underline"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>

        {/* Film frame number – decorative */}
        <p
          className="text-center mt-8 text-muted-foreground/30 font-typewriter"
          style={{ fontSize: "10px", letterSpacing: "0.15em" }}
        >
          ▸ 35A &nbsp; ◆ &nbsp; MIRROR AI &nbsp; ◆ &nbsp; KODAK 400
        </p>
      </div>
    </div>
  );
};

export default Auth;
