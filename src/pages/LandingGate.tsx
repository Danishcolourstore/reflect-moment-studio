import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const cormorant = '"Cormorant Garamond", serif';
const dmSans = '"DM Sans", sans-serif';
const playfair = '"Playfair Display", serif';
const mont = '"Montserrat", sans-serif';

export default function LandingGate() {
  const navigate = useNavigate();
  const [riHov, setRiHov] = useState(false);
  const [agHov, setAgHov] = useState(false);
  const [mob, setMob] = useState(typeof window !== "undefined" && window.innerWidth < 768);

  useEffect(() => {
    const h = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    if (!document.getElementById("gate-fonts")) {
      const link = document.createElement("link");
      link.id = "gate-fonts";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Montserrat:wght@300;400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" as const }}>
      <div style={{ height: "50vh", background: "#080808", display: "flex", flexDirection: "column" as const, justifyContent: "center", alignItems: "center", padding: mob ? "32px 24px" : "40px 24px" }}>
        <div style={{ fontFamily: dmSans, fontSize: 9, letterSpacing: "0.5em", color: "#E8C97A", textTransform: "uppercase" as const }}>THE WORKSPACE</div>
        <div style={{ fontFamily: cormorant, fontSize: mob ? 48 : 64, fontWeight: 300, color: "#F0EDE8", letterSpacing: 4, marginTop: 8 }}>RI</div>
        <div style={{ fontFamily: cormorant, fontSize: mob ? 18 : 24, fontWeight: 400, color: "#F0EDE8", marginTop: 4 }}>Real Intelligence</div>
        <div style={{ width: 32, height: 1, background: "#E8C97A", margin: "16px auto" }} />
        <div style={{ fontFamily: dmSans, fontSize: mob ? 11 : 12, color: "rgba(240,237,232,0.4)", textAlign: "center" as const, maxWidth: 300, lineHeight: 1.7 }}>Your studio. Your tools. Events, albums, AI culling, live delivery, and everything you need to run your photography business.</div>
        <button onClick={() => navigate("/dashboard")} onMouseEnter={() => setRiHov(true)} onMouseLeave={() => setRiHov(false)} style={{ marginTop: 24, background: riHov ? "#E8C97A" : "transparent", color: riHov ? "#080808" : "#E8C97A", border: "1px solid #E8C97A", fontFamily: dmSans, fontSize: 11, letterSpacing: "2px", padding: "12px 44px", cursor: "pointer", transition: "all 0.3s", textTransform: "uppercase" as const }}>ENTER</button>
      </div>
      <div style={{ position: "absolute" as const, top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(180deg, #080808 50%, #FFFFFF 50%)", border: "2px solid #E8C97A", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10 }}>
        <span style={{ fontFamily: cormorant, fontSize: 18, color: "#E8C97A" }}>M</span>
      </div>
      <div style={{ height: "50vh", background: "#FFFFFF", display: "flex", flexDirection: "column" as const, justifyContent: "center", alignItems: "center", padding: mob ? "32px 24px" : "40px 24px" }}>
        <div style={{ fontFamily: mont, fontSize: 9, letterSpacing: "0.5em", color: "#B8960C", textTransform: "uppercase" as const }}>THE PHOTOGRAPHER'S FEED</div>
        <div style={{ fontFamily: playfair, fontSize: mob ? 48 : 64, fontWeight: 700, color: "#000000", letterSpacing: 4, marginTop: 8 }}>AG</div>
        <div style={{ fontFamily: playfair, fontSize: mob ? 18 : 24, fontWeight: 700, color: "#000000", marginTop: 4 }}>Art Gallery</div>
        <div style={{ width: 32, height: 2, background: "#B8960C", margin: "16px auto" }} />
        <div style={{ fontFamily: mont, fontSize: mob ? 11 : 12, color: "#666666", textAlign: "center" as const, maxWidth: 300, lineHeight: 1.7 }}>Shoot. Share. Inspire. Discover featured photographers, community stories, trending styles, and the pulse of Indian wedding photography.</div>
        <button onClick={() => navigate("/art-gallery")} onMouseEnter={() => setAgHov(true)} onMouseLeave={() => setAgHov(false)} style={{ marginTop: 24, background: agHov ? "#B8960C" : "transparent", color: agHov ? "#FFFFFF" : "#000000", border: "1px solid #B8960C", fontFamily: mont, fontSize: 11, letterSpacing: "2px", padding: "12px 44px", cursor: "pointer", transition: "all 0.3s", textTransform: "uppercase" as const }}>ENTER</button>
      </div>
    </div>
  );
}