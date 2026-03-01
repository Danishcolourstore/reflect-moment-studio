import { useNavigate } from "react-router-dom";

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
    </div>
  );
};

export default LandingPage;
