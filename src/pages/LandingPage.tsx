import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[100dvh] w-screen flex flex-col items-center justify-center bg-[#0A0A0A] overflow-hidden">
      {/* Hero image — final art, no overlays, no modifications */}
      <img
        src="/images/hero-bg.png"
        alt="MirrorAI — The Reflection of Now"
        className="w-full h-[100dvh] object-cover object-center select-none pointer-events-none sm:object-contain sm:h-auto sm:max-h-[100dvh]"
        draggable={false}
      />

      {/* Responsive overlay with CTA buttons — centered flexbox, no hardcoded offsets */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4 pointer-events-none">
        {/* Spacer to push buttons toward center-bottom of hero */}
        <div className="flex-1 min-h-[40%]" />

        {/* CTA cluster */}
        <div className="flex flex-col items-center gap-3 pointer-events-auto w-full max-w-xs sm:max-w-sm">
          <button
            onClick={() => navigate("/register")}
            className="w-full py-3.5 bg-[#C9A96E] text-[#0A0A0A] rounded-xl text-sm font-medium tracking-wide hover:bg-[#B8955A] transition-colors"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Start Free Today
          </button>
          <button
            onClick={() => navigate("/event/demo")}
            className="w-full py-3.5 border border-[#C9A96E]/40 text-[#F5F0E8] rounded-xl text-sm font-medium tracking-wide hover:border-[#C9A96E] transition-colors"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            See Live Gallery
          </button>
        </div>

        {/* Bottom spacer */}
        <div className="flex-1 min-h-[8%]" />
      </div>

      {/* Top navbar overlay */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-end gap-3 p-4 sm:p-6 z-10">
        <button
          onClick={() => navigate("/login")}
          className="text-[#F5F0E8] text-sm hover:text-[#C9A96E] transition-colors cursor-pointer"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Login
        </button>
        <button
          onClick={() => navigate("/register")}
          className="px-4 py-2 bg-[#C9A96E] text-[#0A0A0A] rounded-lg text-sm font-medium hover:bg-[#B8955A] transition-colors cursor-pointer"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Start Free
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
