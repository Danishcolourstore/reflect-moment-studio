import { useState } from "react";

interface Props {
  layout: any;
  onBack: () => void;
  initialTextLayers: any[];
}

type TextLayer = {
  content: string;
  x: number;
  y: number;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  color: string;
};

export default function GridEditor({ layout, onBack, initialTextLayers }: Props) {
  const [images, setImages] = useState<string[]>([]);
  const [texts, setTexts] = useState<TextLayer[]>(initialTextLayers || []);
  const [gap, setGap] = useState(4);

  // Upload handler
  const handleUpload = (e: any) => {
    const files = Array.from(e.target.files || []);
    const urls = files.map((file: any) => URL.createObjectURL(file));
    setImages(urls);
  };

  return (
    <div className="w-full h-full flex flex-col bg-black text-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <button onClick={onBack}>Back</button>

        <input type="file" multiple accept="image/*" onChange={handleUpload} />
      </div>

      {/* Grid */}
      <div
        className="flex-1 grid"
        style={{
          gridTemplateColumns: `repeat(${layout?.cols || 3}, 1fr)`,
          gap: `${gap}px`,
        }}
      >
        {Array.from({ length: layout?.cells || 9 }).map((_, i) => {
          const img = images[i % images.length];

          return (
            <div key={i} className="relative bg-neutral-900 overflow-hidden">
              {img && <img src={img} className="w-full h-full object-cover" />}

              {/* Text layers */}
              {texts.map((t, idx) => (
                <div
                  key={idx}
                  style={{
                    position: "absolute",
                    top: `${t.y}%`,
                    left: `${t.x}%`,
                    transform: "translate(-50%, -50%)",
                    fontSize: `${t.fontSize}px`,
                    letterSpacing: `${t.letterSpacing}px`,
                    lineHeight: t.lineHeight,
                    color: t.color,
                  }}
                >
                  {t.content}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="p-3 border-t border-white/10 flex gap-2">
        <button onClick={() => setGap((g) => g + 2)}>+ Gap</button>
        <button onClick={() => setGap((g) => Math.max(0, g - 2))}>- Gap</button>

        <button
          onClick={() =>
            setTexts((prev) => [
              ...prev,
              {
                content: "Your Text",
                x: 50,
                y: 50,
                fontSize: 18,
                letterSpacing: 1,
                lineHeight: 1.2,
                color: "#ffffff",
              },
            ])
          }
        >
          Add Text
        </button>
      </div>
    </div>
  );
}
