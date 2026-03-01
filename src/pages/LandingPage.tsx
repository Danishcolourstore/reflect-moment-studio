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
    </div>
  );
};

export default LandingPage;
