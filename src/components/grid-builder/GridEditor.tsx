import React, { useState } from "react";

type TextLayer = {
  id: string;
  content: string;
  x: number;
  y: number;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  color: string;
};

interface Props {
  layout: {
    cols?: number;
    cells?: number;
  };
  design: {
    images: string[];
    texts: TextLayer[];
    gap: number;
  };
  setDesign: React.Dispatch<React.SetStateAction<any>>;
  onBack: () => void;
}

export default function GridEditor({ layout, design, setDesign, onBack }: Props) {
  const [activeTextId, setActiveTextId] = useState<string | null>(null);

  // ✅ ADD TEXT
  const addText = () => {
    const newText: TextLayer = {
      id: Date.now().toString(),
      content: "Text",
      x: 50,
      y: 50,
      fontSize: 18,
      letterSpacing: 1,
      lineHeight: 1.2,
      color: "#ffffff",
    };

    setDesign((prev: any) => ({
      ...prev,
      texts: [...prev.texts, newText],
    }));
  };

  // ✅ UPDATE TEXT POSITION (basic click positioning)
  const updateTextPosition = (id: string, x: number, y: number) => {
    setDesign((prev: any) => ({
      ...prev,
      texts: prev.texts.map((t: TextLayer) => (t.id === id ? { ...t, x, y } : t)),
    }));
  };

  return (
    <div className="w-full h-full flex flex-col bg-black text-white">
      {/* Top */}
      <div className="flex justify-between p-3 border-b border-white/10">
        <button onClick={onBack}>Back</button>
        <button onClick={addText}>Add Text</button>
      </div>

      {/* Grid */}
      <div
        className="flex-1 grid"
        style={{
          gridTemplateColumns: `repeat(${layout?.cols || 3}, 1fr)`,
          gap: `${design.gap}px`,
        }}
      >
        {Array.from({ length: layout?.cells || 9 }).map((_, i) => {
          const img = design.images.length ? design.images[i % design.images.length] : null;

          return (
            <div
              key={i}
              className="relative bg-neutral-900 overflow-hidden"
              onClick={(e) => {
                if (!activeTextId) return;

                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;

                updateTextPosition(activeTextId, x, y);
              }}
            >
              {/* Image */}
              {img && <img src={img} className="w-full h-full object-cover" />}

              {/* Text Layers */}
              {design.texts.map((t) => (
                <div
                  key={t.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTextId(t.id);
                  }}
                  style={{
                    position: "absolute",
                    top: `${t.y}%`,
                    left: `${t.x}%`,
                    transform: "translate(-50%, -50%)",
                    fontSize: `${t.fontSize}px`,
                    letterSpacing: `${t.letterSpacing}px`,
                    lineHeight: t.lineHeight,
                    color: t.color,
                    cursor: "pointer",
                    border: activeTextId === t.id ? "1px dashed white" : "none",
                    padding: "2px 4px",
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
      <div className="p-3 flex gap-2 border-t border-white/10">
        <button onClick={() => setDesign((prev: any) => ({ ...prev, gap: prev.gap + 2 }))}>+ Gap</button>

        <button onClick={() => setDesign((prev: any) => ({ ...prev, gap: Math.max(0, prev.gap - 2) }))}>- Gap</button>
      </div>
    </div>
  );
}
