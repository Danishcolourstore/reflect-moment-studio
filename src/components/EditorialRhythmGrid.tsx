/**
 * Editorial Rhythm Grid
 * Lays out photos in a repeating visual story pattern:
 *   1. Full-width hero
 *   2. Two-up pair
 *   3. Three-up row
 *   4. Full-width hero
 *   ... repeat
 *
 * Between each "section" there's breathing space (40px).
 * Inside rows the gap is tight (6px).
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
  alt,
  eager,
  aspectHint,
  onClick,
  overlay,
}: {
  src: string;
  alt?: string;
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
      { rootMargin: "120px", threshold: 0.05 }
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
        alt={alt || ""}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(1.02)",
          transition: "opacity 0.6s cubic-bezier(0.4,0,0.2,1), transform 0.8s cubic-bezier(0.4,0,0.2,1)",
        }}
      />
      {overlay}
    </div>
  );
}

/**
 * The pattern repeats every 6 photos:
 *   [0]       → full-width hero (3/2 aspect)
 *   [1, 2]    → two-up pair    (1/1 aspect)
 *   [3, 4, 5] → three-up row   (4/5 aspect)
 *
 * If there aren't enough photos to fill a section,
 * it gracefully degrades.
 */
export function EditorialRhythmGrid({ photos, onPhotoClick, renderOverlay }: EditorialRhythmGridProps) {
  if (photos.length === 0) return null;

  const sections: ReactNode[] = [];
  let cursor = 0;
  let sectionIndex = 0;

  while (cursor < photos.length) {
    const patternStep = sectionIndex % 3;

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
    } else if (patternStep === 1) {
      // Two-up pair
      const pair = photos.slice(cursor, cursor + 2);
      sections.push(
        <div key={`pair-${cursor}`} style={{ display: "grid", gridTemplateColumns: `repeat(${pair.length}, 1fr)`, gap: 6 }}>
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
        <div key={`trio-${cursor}`} style={{ display: "grid", gridTemplateColumns: `repeat(${trio.length}, 1fr)`, gap: 6 }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      {sections}
    </div>
  );
}
