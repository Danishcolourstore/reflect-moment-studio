import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const [clicked, setClicked] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    setClicked(true);
    setTimeout(() => {
      navigate("/login");
    }, 400);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        height: "100vh",
        width: "100vw",
        background: "#f5f3ef",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
        overflow: "hidden",
      }}
    >
      {/* Top small text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        style={{
          fontSize: "10px",
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          color: "#777",
          marginBottom: "20px",
          fontFamily: "serif",
        }}
      >
        Introducing
      </motion.p>

      {/* Main heading */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: clicked ? 0 : 1, y: clicked ? -20 : 0 }}
        transition={{ duration: 0.5 }}
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(42px, 10vw, 90px)",
          letterSpacing: "0.08em",
          textAlign: "center",
          color: "#000",
          lineHeight: "1.1",
        }}
      >
        Welcome to <br />
        <span style={{ letterSpacing: "0.12em" }}>MirrorAI</span>
      </motion.h1>

      {/* Hint text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1 }}
        style={{
          marginTop: "30px",
          fontSize: "12px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#555",
        }}
      >
        Tap anywhere to continue
      </motion.p>
    </div>
  );
};

export default LandingPage;
