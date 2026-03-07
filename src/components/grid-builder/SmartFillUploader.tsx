import { useRef, useCallback } from 'react';
import { Upload, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      <Button
        variant="outline"
        size="sm"
        onClick={() => ref.current?.click()}
        className="gap-2"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Smart Fill ({totalCells})
      </Button>
    </>
  );
}
