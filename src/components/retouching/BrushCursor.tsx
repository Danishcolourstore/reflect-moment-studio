import { useEffect, useState } from 'react';

interface Props {
  size: number;
  feather: number;
  visible: boolean;
}

export default function BrushCursor({ size, feather, visible }: Props) {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!visible) return;
    const handler = (e: PointerEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('pointermove', handler);
    return () => window.removeEventListener('pointermove', handler);
  }, [visible]);

  if (!visible) return null;

  const outerSize = size;
  const innerSize = size * (1 - feather / 100);

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: pos.x - outerSize / 2,
        top: pos.y - outerSize / 2,
        width: outerSize,
        height: outerSize,
      }}
    >
      {/* Outer ring (feather edge) */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: '1px solid rgba(201,169,110,0.4)',
        }}
      />
      {/* Inner ring (hard edge) */}
      {feather > 0 && (
        <div
          className="absolute rounded-full"
          style={{
            width: innerSize,
            height: innerSize,
            left: (outerSize - innerSize) / 2,
            top: (outerSize - innerSize) / 2,
            border: '1px dashed rgba(201,169,110,0.2)',
          }}
        />
      )}
      {/* Center dot */}
      <div
        className="absolute w-1 h-1 rounded-full"
        style={{
          background: '#c9a96e',
          left: outerSize / 2 - 2,
          top: outerSize / 2 - 2,
        }}
      />
    </div>
  );
}
