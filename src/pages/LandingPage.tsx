import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      {/* Fullscreen hero image */}
      <img
        src="/images/hero-bg.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-top"
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/45" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-6">
        <h1
          className="font-display italic text-[clamp(3rem,8vw,6.5rem)] leading-[0.95] tracking-tight text-white/95 mb-4"
          style={{ fontWeight: 500 }}
        >
          MirrorAI
        </h1>

        <div className="w-12 h-px bg-white/30 mb-5" />

        <p
          className="font-serif text-[clamp(1rem,2.5vw,1.5rem)] tracking-[0.25em] uppercase text-white/70 mb-14"
          style={{ fontWeight: 400 }}
        >
          The Reflection of Now
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button
            onClick={() => navigate("/register")}
            className="min-w-[180px] h-12 bg-white/10 backdrop-blur-sm border border-white/25 text-white text-[11px] tracking-[0.18em] uppercase font-medium hover:bg-white/20 transition-all duration-300"
          >
            Start Free
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate("/event/demo/gallery")}
            className="min-w-[180px] h-12 text-white/70 text-[11px] tracking-[0.18em] uppercase font-medium hover:text-white hover:bg-white/5 transition-all duration-300"
          >
            See Live Gallery
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
