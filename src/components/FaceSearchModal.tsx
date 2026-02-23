import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Camera, Upload, Loader2, ScanFace, Download, Frown, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FaceSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onResults: (photoIds: string[]) => void;
}

type SearchState = 'idle' | 'searching' | 'results' | 'no-results';

export function FaceSearchModal({ open, onOpenChange, eventId, onResults }: FaceSearchModalProps) {
  const { toast } = useToast();
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [matchedUrls, setMatchedUrls] = useState<{ id: string; url: string; file_name: string | null }[]>([]);
  const [progressText, setProgressText] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setSearchState('idle');
    setMatchedIds([]);
    setMatchedUrls([]);
  };

  const handleSearch = async () => {
    if (!selectedFile) return;
    setSearchState('searching');
    setProgressText('Preparing selfie…');
    setProgressPercent(10);

    try {
      const formData = new FormData();
      formData.append('selfie', selectedFile);
      formData.append('event_id', eventId);

      setProgressText('Detecting faces…');
      setProgressPercent(30);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(
        `${supabaseUrl}/functions/v1/face-recognition`,
        { method: 'POST', body: formData }
      );

      setProgressPercent(70);
      setProgressText('Matching photos…');

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Search failed' }));
        throw new Error(err.error || 'Search failed');
      }

      const data = await res.json();
      const ids: string[] = data.matched_photo_ids ?? [];
      const urls: { id: string; url: string; file_name: string | null }[] = data.matched_photos ?? [];

      setProgressPercent(100);

      if (ids.length === 0) {
        setSearchState('no-results');
      } else {
        setMatchedIds(ids);
        setMatchedUrls(urls);
        setSearchState('results');
        onResults(ids);
      }
    } catch (err: any) {
      toast({ title: 'Search failed', description: err.message, variant: 'destructive' });
      setSearchState('idle');
    }
  };

  const reset = () => {
    setPreview(null);
    setSelectedFile(null);
    setSearchState('idle');
    setMatchedIds([]);
    setMatchedUrls([]);
    setProgressText('');
    setProgressPercent(0);
  };

  const handleDownloadAll = async () => {
    if (matchedUrls.length === 0) return;
    for (const photo of matchedUrls) {
      try {
        const r = await fetch(photo.url);
        const blob = await r.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = photo.file_name ?? `photo-${photo.id}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } catch { /* skip */ }
    }
  };

  const handleDownloadOne = async (photo: { id: string; url: string; file_name: string | null }) => {
    try {
      const r = await fetch(photo.url);
      const blob = await r.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = photo.file_name ?? `photo-${photo.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast({ title: 'Download failed' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (searchState !== 'searching') { onOpenChange(v); if (!v) reset(); } }}>
      <DialogContent className="sm:max-w-[480px] bg-card border-border p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-semibold flex items-center gap-2">
            <ScanFace className="h-5 w-5 text-primary" />
            Find My Photos
          </DialogTitle>
        </DialogHeader>

        <p className="text-[12px] text-muted-foreground/60 -mt-1">
          Upload a selfie and we'll find all photos with your face. Your selfie is never stored.
        </p>

        <div className="space-y-4 mt-2">
          {/* SEARCHING STATE */}
          {searchState === 'searching' && (
            <div className="py-10 space-y-4 text-center">
              <Loader2 className="mx-auto h-10 w-10 text-primary animate-spin" />
              <p className="text-sm font-medium text-foreground">{progressText}</p>
              <Progress value={progressPercent} className="h-1.5 mx-auto max-w-[200px]" />
              <p className="text-[11px] text-muted-foreground/50">This may take a moment…</p>
            </div>
          )}

          {/* NO RESULTS STATE */}
          {searchState === 'no-results' && (
            <div className="py-10 text-center space-y-4">
              <Frown className="mx-auto h-12 w-12 text-muted-foreground/25" />
              <div>
                <p className="text-base font-medium text-foreground">No photos found with your face</p>
                <p className="text-[12px] text-muted-foreground/50 mt-1">We couldn't find a match in this gallery. Try a different selfie with better lighting.</p>
              </div>
              <Button variant="outline" onClick={reset} className="h-10 px-5 text-[11px] uppercase tracking-wider rounded-full">
                <RotateCcw className="mr-2 h-3.5 w-3.5" /> Retake Selfie
              </Button>
            </div>
          )}

          {/* RESULTS STATE */}
          {searchState === 'results' && matchedIds.length > 0 && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <p className="text-lg font-semibold text-foreground">
                  🎉 We found {matchedIds.length} photo{matchedIds.length > 1 ? 's' : ''} of you!
                </p>
                <p className="text-[12px] text-muted-foreground/50 mt-1">Your matched photos are now shown in the "My Photos" tab.</p>
              </div>

              {matchedUrls.length > 0 && (
                <>
                  <div className="grid grid-cols-3 gap-1.5 max-h-[240px] overflow-y-auto rounded-lg">
                    {matchedUrls.slice(0, 9).map((photo) => (
                      <div key={photo.id} className="relative aspect-square overflow-hidden rounded group cursor-pointer"
                        onClick={() => handleDownloadOne(photo)}>
                        <img src={photo.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors flex items-center justify-center">
                          <Download className="h-4 w-4 text-background opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                  {matchedUrls.length > 9 && (
                    <p className="text-[11px] text-muted-foreground/50 text-center">+{matchedUrls.length - 9} more in "My Photos" tab</p>
                  )}
                  <Button onClick={handleDownloadAll} className="w-full h-10 text-[11px] uppercase tracking-wider">
                    <Download className="mr-2 h-4 w-4" /> Download All ({matchedUrls.length})
                  </Button>
                </>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { onOpenChange(false); reset(); }} className="flex-1 h-10 text-[11px] uppercase tracking-wider rounded-full">
                  View in Gallery
                </Button>
                <Button variant="outline" onClick={reset} className="h-10 px-4 text-[11px] uppercase tracking-wider rounded-full">
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* IDLE STATE — selfie capture */}
          {searchState === 'idle' && (
            <>
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="Selfie preview" className="w-full aspect-square object-cover rounded-lg" />
                  <button onClick={reset}
                    className="absolute top-2 right-2 bg-foreground/60 text-background rounded-full p-1.5 text-[10px] hover:bg-foreground/80 transition">
                    ✕
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => cameraRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-lg hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  >
                    <Camera className="h-8 w-8 text-muted-foreground/40" />
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Take Photo</span>
                  </button>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-lg hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground/40" />
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Upload</span>
                  </button>
                </div>
              )}

              <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />

              {preview && (
                <Button onClick={handleSearch} className="w-full h-11 text-[12px] uppercase tracking-wider">
                  <ScanFace className="mr-2 h-4 w-4" />Find My Photos
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
