import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const FEATURES = [
  {
    title: "Mirror AI",
    subtitle: "The Reflection of Now",
    description:
      "Your complete photography studio — events, galleries, clients, analytics. Everything a photographer needs, intelligently connected.",
    cta: "Enter Mirror AI",
    route: "/login",
  },
  {
    title: "Colour Store RI",
    subtitle: "Real Intelligence. Real Skin.",
    description:
      "AI-powered retouching that understands Indian weddings — skin zones, outfit fabric, jewellery, hair. Nine intelligent tools. Zero artificial results.",
    cta: "Open Colour Store",
    route: "/login",
  },
  {
    title: "Connecting\nMind, Body\nand Heart",
    subtitle: "Art meets Technology",
    description:
      "Not artificially intelligent. Real intelligence born from experience — understanding light, skin, emotion. Every tool built for the craft.",
    cta: "Start Free",
    route: "/register",
  },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [introPhase, setIntroPhase] = useState(0);

  // Intro animation phases
  useEffect(() => {
    const t1 = setTimeout(() => setIntroPhase(1), 400);
    const t2 = setTimeout(() => setIntroPhase(2), 1200);
    const t3 = setTimeout(() => setIntroPhase(3), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: "#080808", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Background image */}
      <img
        src="/images/landing-hero.jpg"
        alt=""
        onLoad={() => setImageLoaded(true)}
        draggable={false}
        className="absolute inset-0 w-full h-full select-none pointer-events-none"
        style={{
          objectFit: "cover",
          objectPosition: "center",
          opacity: imageLoaded && introPhase >= 2 ? 0.35 : 0,
          transition: "opacity 2s cubic-bezier(0.16,1,0.3,1)",
          filter: "saturate(0.7) brightness(0.5)",
        }}
      />

      {/* Dark overlay gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,8,8,0.85) 0%, rgba(8,8,8,0.6) 40%, rgba(8,8,8,0.9) 100%)",
        }}
      />

      {/* Film grain */}
      <div
        className="absolute inset-0 pointer-events-none z-[5]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
          opacity: 0.25,
        }}
      />

      {/* Content layer */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-6 pt-6 pb-4"
          style={{
            opacity: introPhase >= 1 ? 1 : 0,
            transition: "opacity 0.8s ease-out",
          }}
        >
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 18,
              fontWeight: 600,
              color: "#F5C518",
              letterSpacing: "0.25em",
              textShadow: "0 0 20px rgba(245,197,24,0.6)",
            }}
          >
            RI
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="text-xs uppercase tracking-[0.2em]"
              style={{ color: "rgba(240,237,232,0.5)", fontFamily: "'DM Sans', sans-serif" }}
            >
              Login
            </button>
            <button
              onClick={() => navigate("/register")}
              className="px-4 py-2 rounded-lg text-xs uppercase tracking-[0.15em] font-medium"
              style={{
                background: "#E8C97A",
                color: "#080808",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Start Free
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col justify-center px-6 pb-6">
          {/* Hero title */}
          <div
            className="mb-8"
            style={{
              opacity: introPhase >= 2 ? 1 : 0,
              transform: introPhase >= 2 ? "translateY(0)" : "translateY(16px)",
              transition: "all 1.2s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <h1
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "clamp(28px, 7vw, 52px)",
                fontWeight: 700,
                color: "#F0EDE8",
                lineHeight: 1.15,
                letterSpacing: "0.04em",
                whiteSpace: "pre-line",
              }}
            >
              Mirror AI
            </h1>
            <p
              className="mt-3"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: "rgba(240,237,232,0.4)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              The Reflection of Now
            </p>
          </div>

          {/* Feature cards */}
          <div
            className="flex flex-col gap-4 max-w-lg"
            style={{
              opacity: introPhase >= 3 ? 1 : 0,
              transform: introPhase >= 3 ? "translateY(0)" : "translateY(20px)",
              transition: "all 1s cubic-bezier(0.16,1,0.3,1) 0.2s",
            }}
          >
            {FEATURES.map((feature, i) => {
              const isActive = activeFeature === i;
              return (
                <button
                  key={i}
                  onClick={() => setActiveFeature(i)}
                  className="text-left w-full rounded-2xl p-5 transition-all duration-500"
                  style={{
                    background: isActive
                      ? "rgba(232,201,122,0.06)"
                      : "rgba(240,237,232,0.02)",
                    border: isActive
                      ? "1px solid rgba(232,201,122,0.15)"
                      : "1px solid rgba(240,237,232,0.04)",
                    transform: isActive ? "scale(1)" : "scale(0.98)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3
                        style={{
                          fontFamily: "'Cinzel', serif",
                          fontSize: i === 2 ? 16 : 18,
                          fontWeight: 600,
                          color: isActive ? "#E8C97A" : "#F0EDE8",
                          letterSpacing: "0.06em",
                          whiteSpace: i === 2 ? "pre-line" : "normal",
                          lineHeight: 1.3,
                          transition: "color 0.4s ease",
                        }}
                      >
                        {feature.title}
                      </h3>
                      <p
                        className="mt-1"
                        style={{
                          fontSize: 10,
                          color: "rgba(240,237,232,0.35)",
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {feature.subtitle}
                      </p>

                      {/* Expanded content */}
                      <div
                        style={{
                          maxHeight: isActive ? 120 : 0,
                          opacity: isActive ? 1 : 0,
                          overflow: "hidden",
                          transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)",
                        }}
                      >
                        <p
                          className="mt-3"
                          style={{
                            fontSize: 13,
                            color: "rgba(240,237,232,0.55)",
                            lineHeight: 1.6,
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          {feature.description}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(feature.route);
                          }}
                          className="mt-4 px-5 py-2.5 rounded-lg text-xs uppercase tracking-[0.15em] font-medium active:scale-[0.97] transition-transform"
                          style={{
                            background: i === 0 ? "#E8C97A" : "transparent",
                            color: i === 0 ? "#080808" : "#E8C97A",
                            border: i === 0 ? "none" : "1px solid rgba(232,201,122,0.3)",
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          {feature.cta}
                        </button>
                      </div>
                    </div>

                    {/* Indicator */}
                    <div
                      className="mt-1.5 rounded-full flex-shrink-0"
                      style={{
                        width: 6,
                        height: 6,
                        background: isActive ? "#E8C97A" : "rgba(240,237,232,0.12)",
                        transition: "background 0.4s ease",
                        boxShadow: isActive ? "0 0 8px rgba(232,201,122,0.4)" : "none",
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="px-6 pb-6 flex items-center justify-between"
          style={{
            opacity: introPhase >= 3 ? 1 : 0,
            transition: "opacity 0.8s ease-out 0.4s",
          }}
        >
          <p
            style={{
              fontSize: 9,
              color: "rgba(240,237,232,0.2)",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Real Intelligence · Not Artificial
          </p>
          <div
            className="rounded-full"
            style={{
              width: 5,
              height: 5,
              background: "#E8C97A",
              animation: "pulse 2.5s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.5); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
