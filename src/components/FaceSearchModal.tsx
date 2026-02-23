import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Loader2, ScanFace } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FaceSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onResults: (photoIds: string[]) => void;
}

export function FaceSearchModal({ open, onOpenChange, eventId, onResults }: FaceSearchModalProps) {
  const { toast } = useToast();
  const [searching, setSearching] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSearch = async () => {
    if (!selectedFile) return;
    setSearching(true);

    try {
      const formData = new FormData();
      formData.append('selfie', selectedFile);
      formData.append('event_id', eventId);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(
        `${supabaseUrl}/functions/v1/face-recognition`,
        { method: 'POST', body: formData }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Search failed' }));
        throw new Error(err.error || 'Search failed');
      }

      const data = await res.json();
      const ids: string[] = data.matched_photo_ids ?? [];

      if (ids.length === 0) {
        toast({ title: 'No matches found', description: 'We couldn\'t find your face in any photos. Try a different selfie.' });
      } else {
        toast({ title: `Found ${ids.length} photo${ids.length > 1 ? 's' : ''}!`, description: 'Your matched photos are shown in the "My Photos" tab.' });
        onResults(ids);
      }
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Search failed', description: err.message, variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setSelectedFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!searching) { onOpenChange(v); if (!v) reset(); } }}>
      <DialogContent className="sm:max-w-[400px] bg-card border-border p-6">
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
          {preview ? (
            <div className="relative">
              <img src={preview} alt="Selfie preview" className="w-full aspect-square object-cover rounded-lg" />
              {!searching && (
                <button onClick={reset}
                  className="absolute top-2 right-2 bg-foreground/60 text-background rounded-full p-1.5 text-[10px] hover:bg-foreground/80 transition">
                  ✕
                </button>
              )}
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
            <Button onClick={handleSearch} disabled={searching} className="w-full h-11 text-[12px] uppercase tracking-wider">
              {searching ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Searching {eventId ? '' : ''}…</>
              ) : (
                <><ScanFace className="mr-2 h-4 w-4" />Find My Photos</>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
