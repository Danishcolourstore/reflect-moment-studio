import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const cormorant = '"Cormorant Garamond", serif';
const playfair = '"Playfair Display", serif';
const mont = '"Montserrat", sans-serif';
const dm = '"DM Sans", sans-serif';

export default function LandingGate() {
  const navigate = useNavigate();
  const [topHov, setTopHov] = useState(false);
  const [botHov, setBotHov] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>

      {/* keyframes */}
      <style>{`
        @keyframes lg-top{from{opacity:0;transform:translateY(-15px)}to{opacity:1;transform:translateY(0)}}
        @keyframes lg-bot{from{opacity:0;transform:translateY(15px)}to{opacity:1;transform:translateY(0)}}
        @keyframes lg-circle{from{opacity:0}to{opacity:1}}
      `}</style>

      {/* ─── TOP HALF — REAL INTELLIGENCE ─── */}
      <div style={{
        height: "50vh", width: "100%", background: "#080808",
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        padding: 40, boxSizing: "border-box",
        animation: "lg-top 0.6s ease both",
      }}>
        <div style={{ fontFamily: mont, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.5em", color: "#E8C97A", marginBottom: 16 }}>THE WORKSPACE</div>
        <div style={{ fontFamily: cormorant, fontSize: 64, fontWeight: 300, color: "#F0EDE8", letterSpacing: 4, lineHeight: 1 }}>RI</div>
        <div style={{ fontFamily: cormorant, fontSize: 24, fontWeight: 400, color: "#F0EDE8", marginTop: 8 }}>Real Intelligence</div>
        <div style={{ width: 32, height: 1, background: "#E8C97A", margin: "16px auto" }} />
        <p style={{ fontFamily: dm, fontSize: 12, color: "rgba(240,237,232,0.4)", textAlign: "center", maxWidth: 340, lineHeight: 1.7, margin: 0 }}>
          Your studio. Your tools. Events, albums, AI culling, live delivery, and everything you need to run your photography business.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          onMouseEnter={() => setTopHov(true)}
          onMouseLeave={() => setTopHov(false)}
          style={{
            marginTop: 24, background: topHov ? "#E8C97A" : "transparent",
            border: "1px solid #E8C97A", color: topHov ? "#080808" : "#E8C97A",
            fontFamily: dm, fontSize: 11, textTransform: "uppercase", letterSpacing: 2,
            padding: "12px 44px", borderRadius: 0, cursor: "pointer", transition: "all 0.3s",
          }}
        >ENTER</button>
      </div>

      {/* ─── CENTER CIRCLE ─── */}
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 10,
        width: 44, height: 44, borderRadius: "50%",
        background: "linear-gradient(180deg, #080808 50%, #FFFFFF 50%)",
        border: "2px solid #E8C97A",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "lg-circle 0.8s ease 0.4s both",
      }}>
        <span style={{ fontFamily: cormorant, fontSize: 18, color: "#E8C97A", lineHeight: 1 }}>M</span>
      </div>

      {/* ─── BOTTOM HALF — ART GALLERY ─── */}
      <div style={{
        height: "50vh", width: "100%", background: "#FFFFFF",
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        padding: 40, boxSizing: "border-box", borderTop: "1px solid rgba(0,0,0,0.06)",
        animation: "lg-bot 0.6s ease 0.15s both",
      }}>
        <div style={{ fontFamily: mont, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.5em", color: "#FFCC00", marginBottom: 16 }}>THE PHOTOGRAPHER'S FEED</div>
        <div style={{ fontFamily: playfair, fontSize: 64, fontWeight: 700, color: "#000000", letterSpacing: 4, lineHeight: 1 }}>AG</div>
        <div style={{ fontFamily: playfair, fontSize: 24, fontWeight: 700, color: "#000000", marginTop: 8 }}>Art Gallery</div>
        <div style={{ width: 32, height: 2, background: "#FFCC00", margin: "16px auto" }} />
        <p style={{ fontFamily: mont, fontSize: 12, color: "#666666", textAlign: "center", maxWidth: 340, lineHeight: 1.7, margin: 0 }}>
          Shoot. Share. Inspire. Discover featured photographers, community stories, trending styles, and the pulse of Indian wedding photography.
        </p>
        <button
          onClick={() => navigate("/art-gallery")}
          onMouseEnter={() => setBotHov(true)}
          onMouseLeave={() => setBotHov(false)}
          style={{
            marginTop: 24, background: botHov ? "#FFCC00" : "transparent",
            border: "1px solid #FFCC00", color: "#000000",
            fontFamily: mont, fontSize: 11, textTransform: "uppercase", letterSpacing: 2,
            padding: "12px 44px", borderRadius: 0, cursor: "pointer", transition: "all 0.3s",
          }}
        >ENTER</button>
      </div>
    </div>
  );
}
