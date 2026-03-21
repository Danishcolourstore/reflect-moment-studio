import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Camera, BookOpen, Globe, Menu as MenuIcon, Home } from "lucide-react";
import { DrawerMenu, useDrawerMenu } from "@/components/GlobalDrawerMenu";
import { NavLink } from "@/components/NavLink";

const ease = [0.4, 0, 0.2, 1];

export default function IntelligenceHome() {
  const navigate = useNavigate();
  const drawer = useDrawerMenu();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 1600);
    const t3 = setTimeout(() => setPhase(3), 2300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="h-[100dvh] w-screen overflow-hidden relative bg-black">
      {/* Film grain */}
      <svg className="pointer-events-none fixed inset-0 w-full h-full z-[200]" style={{ opacity: 0.03 }}>
        <filter id="ig-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#ig-grain)" />
      </svg>

      <DrawerMenu open={drawer.open} onClose={drawer.close} />

      {/* Intro black overlay */}
      <AnimatePresence>
        {phase < 3 && (
          <motion.div
            key="intro-bg"
            className="absolute inset-0 z-[300] bg-black"
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease }}
          />
        )}
      </AnimatePresence>

      {/* Intro center logo */}
      {phase >= 1 && phase < 3 && (
        <motion.span
          className="fixed select-none z-[301]"
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            color: "#E8C97A",
            letterSpacing: "0.25em",
          }}
          initial={{
            top: "50%",
            left: "50%",
            x: "-50%",
            y: "-50%",
            fontSize: 28,
            opacity: 0,
          }}
          animate={phase === 1 ? { opacity: 1 } : { top: 28, left: "50%", y: "-50%", fontSize: 13, opacity: 1 }}
          transition={{ duration: phase === 1 ? 0.6 : 0.7, ease }}
        >
          REAL INTELLIGENCE
        </motion.span>
      )}

      {/* Main content — fades in after intro */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 3 ? 1 : 0 }}
        transition={{ duration: 1.2, ease }}
      >
        {/* Hero image */}
        <img src="/images/home-hero.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.6) 100%)",
          }}
        />

        {/* Top bar */}
        <div
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between"
          style={{
            height: 48,
            padding: "0 20px",
            paddingTop: "env(safe-area-inset-top, 0px)",
          }}
        >
          {/* MENU */}
          <motion.button
            onClick={drawer.toggle}
            className="cursor-pointer select-none uppercase"
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 10,
              color: "rgba(240,237,232,0.7)",
              letterSpacing: "0.25em",
              background: "none",
              border: "none",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6, ease }}
          >
            Menu
          </motion.button>

          {/* REAL INTELLIGENCE */}
          <motion.span
            className="select-none absolute left-1/2 -translate-x-1/2"
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: 13,
              fontWeight: 400,
              color: "#E8C97A",
              letterSpacing: "0.25em",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6, ease }}
          >
            REAL INTELLIGENCE
          </motion.span>

          {/* Active dot */}
          <motion.div
            style={{ width: 5, height: 5, borderRadius: "50%", background: "#E8C97A" }}
            animate={{
              opacity: [0.5, 1, 0.5],
              boxShadow: [
                "0 0 4px 1px rgba(232,201,122,0.2)",
                "0 0 8px 2px rgba(232,201,122,0.4)",
                "0 0 4px 1px rgba(232,201,122,0.2)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Bottom Tab Bar */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-[100] flex items-stretch border-t border-white/[0.06]"
          style={{
            height: 56,
            background: "rgba(10,10,10,0.92)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {[
            { title: "Home", url: "/home", icon: Home, end: true },
            { title: "Events", url: "/dashboard/events", icon: Camera },
            { title: "Albums", url: "/dashboard/album-designer", icon: BookOpen },
            { title: "Website", url: "/dashboard/website-editor", icon: Globe },
          ].map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.end}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px]"
              activeClassName="[&>svg]:text-[#C8A97E] [&>span]:text-[#C8A97E]"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              <item.icon className="h-[22px] w-[22px] transition-colors" strokeWidth={1.6} />
              <span className="text-[10px] font-medium tracking-wide transition-colors">{item.title}</span>
            </NavLink>
          ))}
          <button
            onClick={drawer.toggle}
            className="flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px]"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            <MenuIcon className="h-[22px] w-[22px]" strokeWidth={1.6} />
            <span className="text-[10px] font-medium tracking-wide">More</span>
          </button>
        </nav>
      </motion.div>
    </div>
  );
}
