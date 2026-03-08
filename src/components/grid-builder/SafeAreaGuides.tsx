/**
 * Instagram safe area guide overlays with toggleable layers.
 * Shows feed safe zone, story safe zone, carousel safe zone,
 * center crosshair, and rule-of-thirds grid.
 */

interface Props {
  canvasRatio: number;
  showRuleOfThirds?: boolean;
}

export default function SafeAreaGuides({ canvasRatio, showRuleOfThirds = true }: Props) {
  const isStory = canvasRatio < 0.65; // 9:16
  const isPortrait = canvasRatio < 0.9 && canvasRatio >= 0.65; // 4:5
  const isSquare = canvasRatio >= 0.9 && canvasRatio <= 1.1;

  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {/* ─── Feed safe area — center 93% × 88% ─── */}
      <div
        className="absolute border border-dashed border-yellow-400/40"
        style={{ top: '6%', left: '3.5%', right: '3.5%', bottom: '6%' }}
      />

      {/* ─── Center crosshair ─── */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
      <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />

      {/* ─── Rule of thirds grid ─── */}
      {showRuleOfThirds && (
        <>
          <div className="absolute top-[33.33%] left-0 right-0 h-px bg-cyan-300/15" />
          <div className="absolute top-[66.66%] left-0 right-0 h-px bg-cyan-300/15" />
          <div className="absolute left-[33.33%] top-0 bottom-0 w-px bg-cyan-300/15" />
          <div className="absolute left-[66.66%] top-0 bottom-0 w-px bg-cyan-300/15" />
          {/* Intersection dots */}
          {[33.33, 66.66].map(y =>
            [33.33, 66.66].map(x => (
              <div
                key={`${x}-${y}`}
                className="absolute w-1.5 h-1.5 rounded-full bg-cyan-300/30"
                style={{ top: `${y}%`, left: `${x}%`, transform: 'translate(-50%, -50%)' }}
              />
            ))
          )}
        </>
      )}

      {/* ─── Story safe area — top/bottom UI bars ─── */}
      {isStory && (
        <>
          <div
            className="absolute top-0 left-0 right-0 bg-red-500/8 border-b border-red-400/30"
            style={{ height: '14%' }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 bg-red-500/8 border-t border-red-400/30"
            style={{ height: '10%' }}
          />
          <div className="absolute top-[14%] left-1/2 -translate-x-1/2 text-[7px] text-yellow-400/60 uppercase tracking-widest">
            story safe zone
          </div>
          {/* Story text safe area — inner 86% × 76% */}
          <div
            className="absolute border border-dotted border-green-400/25"
            style={{ top: '14%', left: '7%', right: '7%', bottom: '10%' }}
          />
          <div className="absolute bottom-[11%] right-[8%] text-[6px] text-green-400/40 uppercase tracking-widest">
            text safe
          </div>
        </>
      )}

      {/* ─── Portrait (4:5) carousel crop warning ─── */}
      {isPortrait && (
        <>
          <div
            className="absolute border border-cyan-400/25"
            style={{ top: '4%', left: '2%', right: '2%', bottom: '4%' }}
          />
          {/* Feed thumbnail crop (1:1 center crop preview) */}
          <div
            className="absolute border border-dashed border-orange-400/20"
            style={{
              top: '10%',
              left: '0',
              right: '0',
              bottom: '10%',
            }}
          />
          <div className="absolute bottom-[1%] right-[2%] text-[6px] text-cyan-400/50 uppercase tracking-widest">
            4:5 carousel safe
          </div>
          <div className="absolute top-[10.5%] left-[2%] text-[6px] text-orange-400/30 uppercase tracking-widest">
            feed thumbnail crop
          </div>
        </>
      )}

      {/* ─── Square / general carousel safe area ─── */}
      {(isSquare || (!isStory && !isPortrait)) && (
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

      {/* ─── Corner labels ─── */}
      <div className="absolute top-[1%] left-[2%] text-[6px] text-yellow-400/50 uppercase tracking-widest">
        safe area
      </div>

      {/* ─── Instagram UI chrome overlay for stories ─── */}
      {isStory && (
        <>
          {/* Camera/close icon area */}
          <div className="absolute top-[2%] left-[4%] w-6 h-6 rounded-full border border-white/10" />
          <div className="absolute top-[2%] right-[4%] w-6 h-6 rounded-full border border-white/10" />
          {/* Send bar area at bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 flex items-center justify-center"
            style={{ height: '6%' }}
          >
            <div className="w-[70%] h-[40%] rounded-full border border-white/8" />
          </div>
        </>
      )}
    </div>
  );
}
