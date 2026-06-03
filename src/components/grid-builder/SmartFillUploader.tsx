import { useRef, useCallback } from "react";
import { ImagePlus } from "lucide-react";

interface Props {
  totalCells: number;
  onFiles: (files: File[]) => void;
}

export default function SmartFillUploader({ totalCells, onFiles }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  const handle = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) onFiles(files);
      e.target.value = "";
    },
    [onFiles],
  );

  return (
    <>
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={handle} />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="flex h-10 min-h-[44px] items-center gap-1.5 border border-[#242424] bg-[#121212] px-3 font-sans text-[10px] font-light uppercase tracking-[0.08em] text-[#E8E0D5]/50 transition-colors hover:border-[#C8A97E]/40 hover:text-[#E8E0D5]/70 active:scale-95"
        title={`Choose up to ${totalCells} frames`}
      >
        <ImagePlus className="h-3.5 w-3.5" strokeWidth={1.5} />
        <span className="hidden sm:inline">Choose frames</span>
      </button>
    </>
  );
}
