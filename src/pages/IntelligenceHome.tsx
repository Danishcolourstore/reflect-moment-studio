import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DrawerMenu, useDrawerMenu } from "@/components/GlobalDrawerMenu";

const ease = [0.4, 0, 0.2, 1];

const IMAGES = [
  "https://i.ibb.co/Xx3w0fH4/001-9.webp",
  "https://i.ibb.co/tTMdF67Q/001-5-1.webp",
  "https://i.ibb.co/hRwGy2KM/01-27-1.webp",
  "https://i.ibb.co/ZzK0jpvx/01-6.webp",
  "https://i.ibb.co/LhQB7t04/01-8-1.webp",
  "https://i.ibb.co/d01F1HPQ/01-8.webp",
  "https://i.ibb.co/Q7Cmpq6F/01-27.webp",
  "https://i.ibb.co/DDmSvrwC/01-11.webp",
  "https://i.ibb.co/xqvx71ym/01-3.webp",
  "https://i.ibb.co/vxnCrLX1/01-5.webp",
  "https://i.ibb.co/fYLGTq55/01-1.webp",
  "https://i.ibb.co/pvqV2hfJ/01-35.webp",
  "https://i.ibb.co/4wLQmnJ8/01-1.jpg",
  "https://i.ibb.co/rRwfw5Pb/01-35.jpg",
];

export default function IntelligenceHome() {
  const drawer = useDrawerMenu();
  const [ready, setReady] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const interval = setInterval(() => {
      setCurrent((c) => (c + 1) % IMAGES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [ready]);

  return (
    <div className="h-[100dvh] w-screen overflow-hidden relative bg-black">
      {/* Film grain */}
      <svg className="pointer-events-none fixed inset-0 w-full h-full z-[200]" style={{ opacity: 0.025 }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      <DrawerMenu open={drawer.open} onClose={drawer.close} />

      {/* Intro overlay */}
      <AnimatePresence>
        {!ready && (
          <motion.div
            key="intro"
            className="absolute inset-0 z-[300] bg-black flex items-center justify-center"
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease }}
          >
            <motion.span
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: 18,
                color: "#E8C97A",
                letterSpacing: "0.3em",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, ease }}
            >
              REAL INTELLIGENCE
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slideshow */}
      <AnimatePresence mode="crossfade">
        <motion.div
          key={current}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1.02 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.5, ease }}
        >
          <img src={IMAGES[current]} alt="" className="absolute inset-0 w-full h-full object-cover" />
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlay */}
      <div
        className="fixed inset-0 z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.3) 100%)",
        }}
      />

      {/* Top bar */}
      <div
        className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between"
        style={{
          height: 48,
          padding: "0 24px",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        <motion.button
          onClick={drawer.toggle}
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 10,
            color: "rgba(240,237,232,0.8)",
            letterSpacing: "0.28em",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: ready ? 1 : 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease }}
        >
          MENU
        </motion.button>

        <motion.span
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: 12,
            fontWeight: 400,
            color: "#E8C97A",
            letterSpacing: "0.28em",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: ready ? 1 : 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease }}
        >
          REAL INTELLIGENCE
        </motion.span>

        <motion.div
          style={{ width: 4, height: 4, borderRadius: "50%", background: "#E8C97A" }}
          animate={{
            opacity: [0.4, 1, 0.4],
            boxShadow: [
              "0 0 3px 1px rgba(232,201,122,0.15)",
              "0 0 6px 2px rgba(232,201,122,0.35)",
              "0 0 3px 1px rgba(232,201,122,0.15)",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
