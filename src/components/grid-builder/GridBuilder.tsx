import { useState } from "react";
import { ArrowLeft, Grid3X3 } from "lucide-react";
import type { GridLayout } from "./types";
import GridLayoutSelector from "./GridLayoutSelector";
import GridEditor from "./GridEditor";

interface Props {
  onClose: () => void;
}

export default function GridBuilder({ onClose }: Props) {
  const [selectedLayout, setSelectedLayout] = useState<GridLayout | null>(null);

  // ✅ SINGLE SOURCE OF TRUTH
  const [design, setDesign] = useState({
    images: [] as string[],
    texts: [] as any[],
    gap: 4,
  });

  // ✅ UPLOAD HANDLER
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const urls = files.map((file) => URL.createObjectURL(file));

    setDesign((prev) => ({
      ...prev,
      images: urls,
    }));
  };

  // 👉 OPEN EDITOR
  if (selectedLayout) {
    return (
      <GridEditor
        layout={selectedLayout}
        design={design}
        setDesign={setDesign}
        onBack={() => setSelectedLayout(null)}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b">
        <button onClick={onClose}>
          <ArrowLeft />
        </button>
        <Grid3X3 />
        <span>Grid Builder</span>
      </div>

      <div className="p-4">
        {/* Upload */}
        <input type="file" multiple accept="image/*" onChange={handleUpload} />

        {/* Preview */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {design.images.map((img, i) => (
            <img key={i} src={img} className="w-full h-24 object-cover" />
          ))}
        </div>

        {/* Layout */}
        <div className="mt-4">
          <GridLayoutSelector onSelect={(layout) => setSelectedLayout(layout)} />
        </div>
      </div>
    </div>
  );
}
