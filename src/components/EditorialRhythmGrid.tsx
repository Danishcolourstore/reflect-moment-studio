/**
 * Editorial Rhythm Grid
 * Immersive, edge-to-edge photo layout with editorial rhythm:
 *   1. Full-width hero (3/2)
 *   2. Two-up pair (1/1)
 *   3. Two-up pair (1/1)
 *   4. Three-up row (4/5)
 *   ... repeat
 *
 * Mobile: 8px internal gaps, 32px between sections, edge-to-edge.
 * Desktop: 6px internal gaps, 40px between sections.
 */

import { useRef, useState, useEffect, ReactNode } from "react";

interface Photo {
  id: string;
  url: string;
}

interface EditorialRhythmGridProps {
  photos: Photo[];
  onPhotoClick: (index: number) => void;
  renderOverlay?: (photo: Photo) => ReactNode;
}

function RevealImage({
  src,
  eager,
  aspectHint,
  onClick,
  overlay,
}: {
  src: string;
  eager?: boolean;
  aspectHint?: string;
  onClick: () => void;
  overlay?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "200px", threshold: 0.01 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="group"
      style={{
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        aspectRatio: aspectHint,
        backgroundColor: "hsl(40, 5%, 93%)",
      }}
      onClick={onClick}
    >
      <img
        src={src}
        alt=""
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(1.01)",
          transition: "opacity 0.4s cubic-bezier(0.4,0,0.2,1), transform 0.6s cubic-bezier(0.4,0,0.2,1)",
        }}
      />
      {overlay}
    </div>
  );
}

/**
 * Pattern repeats every 8 photos:
 *   [0]       → full-width hero  (3/2)
 *   [1, 2]    → two-up pair      (1/1)
 *   [3, 4]    → two-up pair      (1/1)
 *   [5, 6, 7] → three-up row     (4/5)
 */
export function EditorialRhythmGrid({ photos, onPhotoClick, renderOverlay }: EditorialRhythmGridProps) {
  if (photos.length === 0) return null;

  const sections: ReactNode[] = [];
  let cursor = 0;
  let sectionIndex = 0;

  while (cursor < photos.length) {
    const patternStep = sectionIndex % 4;

    if (patternStep === 0) {
      // Full-width hero
      const photo = photos[cursor];
      const idx = cursor;
      sections.push(
        <div key={`hero-${cursor}`}>
          <RevealImage
            src={photo.url}
            eager={cursor < 2}
            aspectHint="3/2"
            onClick={() => onPhotoClick(idx)}
            overlay={renderOverlay?.(photo)}
          />
        </div>
      );
      cursor += 1;
    } else if (patternStep === 1 || patternStep === 2) {
      // Two-up pair
      const pair = photos.slice(cursor, cursor + 2);
      sections.push(
        <div key={`pair-${cursor}`} className="grid gap-[8px] md:gap-[6px]" style={{ gridTemplateColumns: `repeat(${pair.length}, 1fr)` }}>
          {pair.map((photo, j) => {
            const idx = cursor + j;
            return (
              <RevealImage
                key={photo.id}
                src={photo.url}
                aspectHint="1/1"
                onClick={() => onPhotoClick(idx)}
                overlay={renderOverlay?.(photo)}
              />
            );
          })}
        </div>
      );
      cursor += pair.length;
    } else {
      // Three-up row
      const trio = photos.slice(cursor, cursor + 3);
      sections.push(
        <div key={`trio-${cursor}`} className="grid gap-[8px] md:gap-[6px]" style={{ gridTemplateColumns: `repeat(${trio.length}, 1fr)` }}>
          {trio.map((photo, j) => {
            const idx = cursor + j;
            return (
              <RevealImage
                key={photo.id}
                src={photo.url}
                aspectHint="4/5"
                onClick={() => onPhotoClick(idx)}
                overlay={renderOverlay?.(photo)}
              />
            );
          })}
        </div>
      );
      cursor += trio.length;
    }

    sectionIndex += 1;
  }

  return (
    <div className="flex flex-col gap-[32px] md:gap-[40px]">
      {sections}
    </div>
  );
}
