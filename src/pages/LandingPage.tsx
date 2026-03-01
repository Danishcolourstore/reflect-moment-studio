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

      {/* Invisible clickable overlays positioned over artwork buttons */}
      {/* Navbar — Login button (top-right area) */}
      <button
        onClick={() => navigate("/login")}
        className="absolute cursor-pointer bg-transparent border-none"
        style={{ top: "2.5%", right: "12%", width: "5%", height: "3.5%" }}
        aria-label="Login"
      />
      {/* Navbar — Start Free button (top-right corner) */}
      <button
        onClick={() => navigate("/register")}
        className="absolute cursor-pointer bg-transparent border-none"
        style={{ top: "2%", right: "2%", width: "8%", height: "4%" }}
        aria-label="Start Free"
      />

      {/* Hero — "Start Free" CTA button (center area) */}
      <button
        onClick={() => navigate("/register")}
        className="absolute cursor-pointer bg-transparent border-none"
        style={{ top: "52%", left: "50%", transform: "translateX(-50%)", width: "12%", height: "4.5%" }}
        aria-label="Start Free Today"
      />

      {/* Hero — "See Live Gallery" button (below Start Free) */}
      <button
        onClick={() => navigate("/event/demo")}
        className="absolute cursor-pointer bg-transparent border-none"
        style={{ top: "57.5%", left: "50%", transform: "translateX(-50%)", width: "12%", height: "4%" }}
        aria-label="See Live Gallery"
      />

      {/* "Start Free Today" bottom CTA if present */}
      <button
        onClick={() => navigate("/register")}
        className="absolute cursor-pointer bg-transparent border-none"
        style={{ bottom: "8%", left: "50%", transform: "translateX(-50%)", width: "14%", height: "4.5%" }}
        aria-label="Start Free Today"
      />
    </div>
  );
};

export default LandingPage;
