/**
 * Instagram safe area guide overlays — not exported, UI-only.
 */

interface Props {
  canvasRatio: number;
}

export default function SafeAreaGuides({ canvasRatio }: Props) {
  // Instagram crops to ~93% width and ~88% height in feed preview
  // Story has top/bottom UI bars ~10% each
  const isStory = canvasRatio < 0.65; // 9:16
  const isPortrait = canvasRatio < 0.9 && canvasRatio >= 0.65;

  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {/* Feed safe area — center 93% × 88% */}
      <div
        className="absolute border border-dashed border-yellow-400/40"
        style={{
          top: '6%', left: '3.5%', right: '3.5%', bottom: '6%',
        }}
      />

      {/* Center crosshair */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
      <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />

      {/* Story safe area - top/bottom bars */}
      {isStory && (
        <>
          <div className="absolute top-0 left-0 right-0 bg-red-500/10 border-b border-red-400/30" style={{ height: '12%' }} />
          <div className="absolute bottom-0 left-0 right-0 bg-red-500/10 border-t border-red-400/30" style={{ height: '10%' }} />
          <div className="absolute top-[12%] left-1/2 -translate-x-1/2 text-[7px] text-yellow-400/60 uppercase tracking-widest">
            story safe
          </div>
        </>
      )}

      {/* Carousel crop guides (4:5 crops top/bottom slightly) */}
      {!isStory && (
        <>
          <div
            className="absolute border border-cyan-400/25"
            style={{ top: '4%', left: '2%', right: '2%', bottom: '4%' }}
          />
          <div className="absolute bottom-[1%] right-[2%] text-[6px] text-cyan-400/50 uppercase tracking-widest">
            carousel safe
          </div>
        </>
      )}

      {/* Corner labels */}
      <div className="absolute top-[1%] left-[2%] text-[6px] text-yellow-400/50 uppercase tracking-widest">
        safe area
      </div>
    </div>
  );
}
