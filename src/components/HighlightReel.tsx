import { useEffect, useCallback, useState, useRef } from 'react';
import { X, Play, Pause, ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';

interface HighlightReelProps {
  photos: { id: string; url: string }[];
  open: boolean;
  onClose: () => void;
}

// Ambient music — royalty-free soft piano loop (base64-encoded short loop placeholder)
// We'll use a generated tone via Web Audio API for a soft ambient pad
function createAmbientAudio(ctx: AudioContext): { start: () => void; stop: () => void; setVolume: (v: number) => void } {
  const gain = ctx.createGain();
  gain.gain.value = 0.08;
  gain.connect(ctx.destination);

  const oscs: OscillatorNode[] = [];
  // Soft ambient chord: C3, E3, G3, B3
  const freqs = [130.81, 164.81, 196.0, 246.94];

  freqs.forEach(f => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    const oscGain = ctx.createGain();
    oscGain.gain.value = 0.25;
    osc.connect(oscGain);
    oscGain.connect(gain);
    oscs.push(osc);
  });

  return {
    start: () => oscs.forEach(o => { try { o.start(); } catch {} }),
    stop: () => oscs.forEach(o => { try { o.stop(); } catch {} }),
    setVolume: (v: number) => { gain.gain.value = v; },
  };
}

const SLIDE_DURATION = 4500; // ms per photo

export function HighlightReel({ photos, open, onClose }: HighlightReelProps) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slideStartRef = useRef(Date.now());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambientRef = useRef<ReturnType<typeof createAmbientAudio> | null>(null);
  const touchStartRef = useRef<number | null>(null);

  const len = photos.length;

  // Navigate
  const goTo = useCallback((next: number) => {
    setPrevIndex(index);
    setIndex(next);
    slideStartRef.current = Date.now();
    setProgress(0);
    // Clear prev after crossfade
    setTimeout(() => setPrevIndex(null), 1200);
  }, [index]);

  const advance = useCallback(() => {
    goTo((index + 1) % len);
  }, [index, len, goTo]);

  const goNext = useCallback(() => {
    goTo((index + 1) % len);
  }, [index, len, goTo]);

  const goPrev = useCallback(() => {
    goTo((index - 1 + len) % len);
  }, [index, len, goTo]);

  // Reset on open
  useEffect(() => {
    if (!open) return;
    setIndex(0);
    setPrevIndex(null);
    setPlaying(true);
    setProgress(0);
    slideStartRef.current = Date.now();
  }, [open]);

  // Auto-advance timer
  useEffect(() => {
    if (!open || !playing) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    timerRef.current = setInterval(advance, SLIDE_DURATION);
    slideStartRef.current = Date.now();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [open, playing, advance]);

  // Progress bar updater
  useEffect(() => {
    if (!open || !playing) {
      if (progressRef.current) clearInterval(progressRef.current);
      return;
    }
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - slideStartRef.current;
      setProgress(Math.min((elapsed / SLIDE_DURATION) * 100, 100));
    }, 50);
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [open, playing, index]);

  // Audio
  useEffect(() => {
    if (!open) {
      if (ambientRef.current) { ambientRef.current.stop(); ambientRef.current = null; }
      if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
      return;
    }
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const ambient = createAmbientAudio(ctx);
      ambientRef.current = ambient;
      ambient.start();
    } catch {}
    return () => {
      if (ambientRef.current) { try { ambientRef.current.stop(); } catch {} }
      if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch {} }
    };
  }, [open]);

  // Mute/unmute
  useEffect(() => {
    if (ambientRef.current) {
      ambientRef.current.setVolume(muted ? 0 : 0.08);
    }
  }, [muted]);

  // Keyboard
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') { e.preventDefault(); setPlaying(p => !p); }
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'm' || e.key === 'M') setMuted(m => !m);
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose, goNext, goPrev]);

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartRef.current;
    if (Math.abs(diff) > 50) {
      if (diff < 0) goNext();
      else goPrev();
    }
    touchStartRef.current = null;
  };

  if (!open || len === 0) return null;

  const photo = photos[index];
  const prevPhoto = prevIndex !== null ? photos[prevIndex] : null;

  return (
    <div className="fixed inset-0 z-[120] bg-black flex items-center justify-center select-none"
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

      {/* Previous image (crossfade out) */}
      {prevPhoto && (
        <img
          key={`prev-${prevIndex}`}
          src={prevPhoto.url}
          alt=""
          className="absolute inset-0 w-full h-full object-contain"
          style={{ animation: 'hr-fade-out 1.2s ease-in-out forwards' }}
          draggable={false}
        />
      )}

      {/* Current image with Ken Burns */}
      <img
        key={`cur-${index}-${photo.id}`}
        src={photo.url}
        alt=""
        className="absolute inset-0 w-full h-full object-contain"
        style={{ animation: `hr-fade-in 1.2s ease-in-out forwards, hr-ken-burns ${SLIDE_DURATION}ms ease-in-out forwards` }}
        draggable={false}
      />

      {/* MirrorAI watermark */}
      <div className="absolute top-5 right-5 text-white/15 text-[11px] font-sans tracking-[0.2em] uppercase pointer-events-none select-none">
        MirrorAI
      </div>

      {/* Counter */}
      <div className="absolute top-5 left-5 text-white/30 text-[11px] tracking-wider font-sans">
        {index + 1} / {len}
      </div>

      {/* Mute button */}
      <button
        onClick={() => setMuted(m => !m)}
        className="absolute top-5 right-24 min-w-[44px] min-h-[44px] flex items-center justify-center text-white/50 hover:text-white/80 transition"
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>

      {/* Side arrows */}
      {len > 1 && (
        <>
          <button onClick={goPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center text-white/50 hover:bg-white/15 hover:text-white/90 transition">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={goNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center text-white/50 hover:bg-white/15 hover:text-white/90 transition">
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent pt-16 pb-5 px-5">
        {/* Progress bar */}
        <div className="w-full h-[3px] bg-white/10 rounded-full mb-4 overflow-hidden">
          <div className="h-full bg-white/40 rounded-full transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }} />
        </div>

        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPlaying(p => !p)}
            className="min-w-[44px] min-h-[44px] rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-white/20 transition active:scale-95">
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <button onClick={onClose}
            className="min-w-[44px] min-h-[44px] rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-white/20 transition active:scale-95">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Inline keyframe styles */}
      <style>{`
        @keyframes hr-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes hr-fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes hr-ken-burns {
          from { transform: scale(1); }
          to { transform: scale(1.06); }
        }
      `}</style>
    </div>
  );
}
