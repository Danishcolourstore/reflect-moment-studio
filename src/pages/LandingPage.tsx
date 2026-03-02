import { useState } from "react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div
      className="relative w-full overflow-hidden bg-[#0A0A0A]"
      style={{ height: "100vh", width: "100%", position: "relative" }}
    >
      {/* Background hero image — absolutely positioned, full cover */}
      <img
        src="/images/hero-bg.png"
        alt="MirrorAI — The Reflection of Now"
        onLoad={() => setImageLoaded(true)}
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover object-center select-none pointer-events-none"
        style={{
          transform: "translateZ(0)",
          willChange: "opacity",
          opacity: imageLoaded ? 1 : 0,
          transition: imageLoaded ? "opacity 1.2s ease-out" : "none",
        }}
      />

      {/* Content overlay — always on top */}
      <div
        className="absolute inset-0 z-10 flex flex-col"
        style={{ transform: "translateZ(0)" }}
      >
        {/* Top navbar */}
        <div className="flex items-center justify-end gap-3 p-4 sm:p-6">
          <button
            onClick={() => navigate("/login")}
            className="text-[#F5F0E8] text-sm hover:text-[#C9A96E] transition-colors cursor-pointer"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              opacity: imageLoaded ? 1 : 0,
              transition: "opacity 0.8s ease-out 0.6s",
            }}
          >
            Login
          </button>
          <button
            onClick={() => navigate("/register")}
            className="px-4 py-2 bg-[#C9A96E] text-[#0A0A0A] rounded-lg text-sm font-medium hover:bg-[#B8955A] transition-colors cursor-pointer"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              opacity: imageLoaded ? 1 : 0,
              transition: "opacity 0.8s ease-out 0.6s",
            }}
          >
            Start Free
          </button>
        </div>

        {/* Spacer + CTA cluster centered toward bottom */}
        <div className="flex-1" />
        <div
          className="flex flex-col items-center gap-3 w-full max-w-xs sm:max-w-sm mx-auto px-4 pb-[12vh]"
          style={{
            opacity: imageLoaded ? 1 : 0,
            transform: imageLoaded ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 1s ease-out 0.8s, transform 1s ease-out 0.8s",
          }}
        >
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
      </div>
    </div>
  );
};

export default LandingPage;
