import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col items-center bg-[#e8e4de]">
      {/* Hero image — final art, no overlays, no modifications */}
      <img
        src="/images/hero-bg.png"
        alt="MirrorAI — The Reflection of Now"
        className="w-full max-h-[85dvh] object-contain object-center select-none pointer-events-none"
        draggable={false}
      />

      {/* Buttons below image to avoid overlapping art */}
      <div className="flex items-center gap-4 py-8">
        <Button
          onClick={() => navigate("/register")}
          className="min-w-[170px] h-12 bg-[#1a1a1a] text-white text-[11px] tracking-[0.18em] uppercase font-medium rounded-none hover:bg-[#333] transition-colors duration-300"
        >
          Start Free
        </Button>

        <Button
          variant="ghost"
          onClick={() => navigate("/event/demo/gallery")}
          className="min-w-[170px] h-12 border border-[#999] text-[#444] text-[11px] tracking-[0.18em] uppercase font-medium rounded-none hover:bg-[#d9d4cd] transition-colors duration-300"
        >
          See Live Gallery
        </Button>
      </div>
    </div>
  );
};

export default LandingPage;
