import { useState } from "react";

export default function GridEditor({ layout, design, setDesign, onBack }: any) {
  const [activeTextId, setActiveTextId] = useState(null);

  const addText = () => {
    const newText = {
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

  const updateTextPosition = (id: any, x: number, y: number) => {
    setDesign((prev: any) => ({
      ...prev,
      texts: prev.texts.map((t: any) => (t.id === id ? { ...t, x, y } : t)),
    }));
  };

  return (
    <div className="w-full h-screen flex flex-col bg-black text-white">
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
              {img && <img src={img} className="w-full h-full object-cover" />}

              {design.texts.map((t: any) => (
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
                    border: activeTextId === t.id ? "1px dashed white" : "none",
                    padding: "2px 4px",
                    cursor: "pointer",
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
