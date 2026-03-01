import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col items-center bg-[#0A0A0A]">
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
          className="min-w-[170px] h-12 bg-[#C9A96E] text-[#0A0A0A] text-[11px] tracking-[0.18em] uppercase font-medium rounded-none hover:bg-[#b8983f] transition-colors duration-300"
        >
          Start Free
        </Button>

        <Button
          variant="ghost"
          onClick={() => navigate("/event/demo/gallery")}
          className="min-w-[170px] h-12 border border-[#C9A96E] text-[#C9A96E] text-[11px] tracking-[0.18em] uppercase font-medium rounded-none bg-transparent hover:bg-[#C9A96E]/10 transition-colors duration-300"
        >
          See Live Gallery
        </Button>
      </div>
    </div>
  );
};

export default LandingPage;
