import { useRef, useCallback } from 'react';
import { Sparkles } from 'lucide-react';

interface Props {
  totalCells: number;
  onFiles: (files: File[]) => void;
}

export default function SmartFillUploader({ totalCells, onFiles }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  const handle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) onFiles(files);
    e.target.value = '';
  }, [onFiles]);

  return (
    <>
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={handle} />
      <button
        onClick={() => ref.current?.click()}
        className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-[10px] tracking-wider uppercase font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-200 active:scale-95"
      >
        <Sparkles className="h-3 w-3" />
        Fill ({totalCells})
      </button>
    </>
  );
}
