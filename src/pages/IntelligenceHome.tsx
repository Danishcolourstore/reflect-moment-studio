import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { DrawerMenu, useDrawerMenu } from "@/components/GlobalDrawerMenu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ease = [0.4, 0, 0.2, 1];
const cormorant = '"Cormorant Garamond", serif';
const dm = '"DM Sans", sans-serif';

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

const GRID_IMAGES = IMAGES.slice(0, 12);

const INTRO_TEXT = "REAL INTELLIGENCE";
const LETTER_DELAY = 0.06;
const INTRO_DURATION = INTRO_TEXT.length * LETTER_DELAY + 1.2;

interface Event {
  id: string;
  name: string;
  location: string | null;
  event_date: string;
  cover_url: string | null;
}

export default function IntelligenceHome() {
  const drawer = useDrawerMenu();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [current, setCurrent] = useState(0);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), INTRO_DURATION * 1000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const interval = setInterval(() => {
      setCurrent((c) => (c + 1) % IMAGES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [ready]);

  useEffect(() => {
    if (!user) return;
    (
      supabase
        .from("events")
        .select("id, name, location, event_date, cover_url")
        .eq("user_id", user.id)
        .eq("is_published", true)
        .order("event_date", { ascending: false })
        .limit(6) as any
    ).then(({ data }: any) => {
      if (data) setEvents(data);
    });
  }, [user]);

  const prev = () => setCurrent((c) => (c - 1 + IMAGES.length) % IMAGES.length);
  const next = () => setCurrent((c) => (c + 1) % IMAGES.length);

  return (
    <div className="min-h-[100dvh] w-screen relative" style={{ background: "#080808" }}>
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
            className="fixed inset-0 z-[300] bg-black flex items-center justify-center"
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease }}
          >
            <div
              style={{
                fontFamily: cormorant,
                fontSize: 22,
                fontWeight: 400,
                color: "#E8C97A",
                letterSpacing: "0.28em",
                display: "flex",
              }}
            >
              {INTRO_TEXT.split("").map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * LETTER_DELAY, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  style={{ display: "inline-block", whiteSpace: "pre" }}
                >
                  {char}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: ready ? 1 : 0 }} transition={{ duration: 1, ease }}>
        {/* ── Top Bar ── */}
        <div
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between"
          style={{ height: 48, padding: "0 24px", paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <button
            onClick={drawer.toggle}
            style={{
              fontFamily: dm,
              fontSize: 11,
              fontWeight: 700,
              color: "#F0EDE8",
              letterSpacing: "0.2em",
              background: "none",
              border: "none",
              cursor: "pointer",
              textShadow: "0 1px 8px rgba(0,0,0,0.8)",
            }}
          >
            MENU
          </button>

          <motion.span
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap"
            style={{ fontFamily: cormorant, fontSize: 14, fontWeight: 600, color: "#E8C97A", letterSpacing: "0.22em" }}
            animate={{ opacity: [1, 1, 0.3, 1, 0.6, 1, 1, 0.2, 1] }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.7, 0.72, 0.74, 0.76, 0.78, 0.9, 0.92, 1],
            }}
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

        {/* ── Hero Slideshow ── */}
        <div className="relative overflow-hidden" style={{ marginTop: 48, aspectRatio: "4/3" }}>
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

          {/* Prev / Next arrows */}
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center transition-opacity"
            style={{
              width: 36,
              height: 36,
              background: "rgba(8,8,8,0.5)",
              border: "none",
              cursor: "pointer",
              color: "rgba(240,237,232,0.7)",
              borderRadius: 2,
              backdropFilter: "blur(8px)",
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center transition-opacity"
            style={{
              width: 36,
              height: 36,
              background: "rgba(8,8,8,0.5)",
              border: "none",
              cursor: "pointer",
              color: "rgba(240,237,232,0.7)",
              borderRadius: 2,
              backdropFilter: "blur(8px)",
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* ── Tagline ── */}
        <div className="text-center px-6 py-12">
          <h1
            style={{
              fontFamily: cormorant,
              fontSize: "clamp(22px, 6vw, 32px)",
              fontWeight: 400,
              color: "#F0EDE8",
              letterSpacing: "0.05em",
              lineHeight: 1.3,
            }}
          >
            "Every frame. Remembered forever."
          </h1>
          <div style={{ width: 32, height: 1, background: "#E8C97A", margin: "20px auto" }} />
          <p
            style={{
              fontFamily: dm,
              fontSize: 13,
              color: "rgba(240,237,232,0.4)",
              lineHeight: 1.8,
              maxWidth: 320,
              margin: "0 auto",
            }}
          >
            A wedding is a moment that exists once.
            <br />
            MirrorAI makes sure it lives forever.
          </p>
          <p
            style={{
              fontFamily: dm,
              fontSize: 9,
              color: "rgba(240,237,232,0.2)",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              marginTop: 20,
            }}
          >
            We are delivering memories with real intelligence.
          </p>
        </div>

        {/* ── Photo Grid ── */}
        <div className="px-4 pb-2">
          <div className="grid grid-cols-4 gap-[2px]">
            {GRID_IMAGES.map((src, i) => (
              <motion.div
                key={i}
                className="overflow-hidden"
                style={{ aspectRatio: "1", background: "#0E0E0E" }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.5 }}
              >
                <img
                  src={src}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Recent Events (Stories style) ── */}
        {events.length > 0 && (
          <div className="px-6 py-12">
            <div className="text-center mb-8">
              <h2
                style={{
                  fontFamily: cormorant,
                  fontSize: 22,
                  fontWeight: 400,
                  color: "#F0EDE8",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                Recent Galleries
              </h2>
              <p
                style={{
                  fontFamily: dm,
                  fontSize: 9,
                  color: "rgba(240,237,232,0.25)",
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  marginTop: 8,
                }}
              >
                Your latest delivered work
              </p>
            </div>

            <div className="space-y-0">
              {events.map((evt, i) => (
                <motion.button
                  key={evt.id}
                  className="w-full text-left py-4 transition-all"
                  style={{
                    borderTop: "1px solid rgba(240,237,232,0.06)",
                    background: "none",
                    border_bottom: i === events.length - 1 ? "1px solid rgba(240,237,232,0.06)" : "none",
                  }}
                  onClick={() => navigate(`/dashboard/events/${evt.id}`)}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  whileHover={{ x: 4 }}
                >
                  <div className="flex items-baseline justify-between">
                    <span
                      style={{
                        fontFamily: cormorant,
                        fontSize: 20,
                        fontWeight: 400,
                        color: "#F0EDE8",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {evt.name}
                      {evt.location && (
                        <span style={{ color: "rgba(240,237,232,0.35)", fontSize: 16 }}> // {evt.location}</span>
                      )}
                    </span>
                    <span
                      style={{
                        fontFamily: dm,
                        fontSize: 10,
                        color: "rgba(240,237,232,0.25)",
                        flexShrink: 0,
                        marginLeft: 16,
                      }}
                    >
                      {format(new Date(evt.event_date), "MMM yyyy")}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => navigate("/dashboard/events")}
                style={{
                  fontFamily: dm,
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#E8C97A",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                  textUnderlineOffset: 4,
                }}
              >
                View All Events
              </button>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="text-center py-8 px-6" style={{ borderTop: "1px solid rgba(240,237,232,0.04)" }}>
          <p style={{ fontFamily: cormorant, fontSize: 16, color: "#E8C97A", letterSpacing: "0.2em", marginBottom: 8 }}>
            MirrorAI
          </p>
          <p
            style={{
              fontFamily: dm,
              fontSize: 9,
              color: "rgba(240,237,232,0.15)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Real Intelligence · Photography Platform
          </p>
        </div>
      </motion.div>
    </div>
  );
}
