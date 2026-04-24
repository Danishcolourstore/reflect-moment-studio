import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Loader2, Download, Share2, X, Sparkles, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ProgressiveImage } from '@/components/ProgressiveImage';

interface FindMyPhotosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventName: string;
  accentColor: string | null;
  onOpenLightbox?: (photoId: string) => void;
  isFavorite?: (photoId: string) => boolean;
  toggleFavorite?: (photoId: string) => void;
  canDownload?: boolean;
  onDownloadPhoto?: (photo: { id: string; url: string; file_name: string | null }) => void;
}

type Step = 'upload' | 'processing' | 'results' | 'error';

interface MatchedPhoto {
  id: string;
  url: string;
  file_name: string | null;
}

export function FindMyPhotosModal({
  open, onOpenChange, eventId, eventName, accentColor,
  onOpenLightbox, isFavorite, toggleFavorite, canDownload, onDownloadPhoto,
}: FindMyPhotosModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [matchedPhotos, setMatchedPhotos] = useState<MatchedPhoto[]>([]);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    return () => {
      if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    };
  }, []);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep('upload');
    setMatchedPhotos([]);
    setSelfiePreview(null);
    setErrorMsg('');
  }, []);

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleFile = async (file: File) => {
    if (!file || !eventId) return;
    if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    setSelfiePreview(URL.createObjectURL(file));
    setStep('processing');

    try {
      const sessionToken = crypto.randomUUID();
      const timestamp = Date.now();
      const fileName = `${eventId}/${sessionToken}/${timestamp}.jpg`;

      // Upload selfie
      const { error: uploadError } = await supabase.storage
        .from('guest-selfies')
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('guest-selfies')
        .getPublicUrl(fileName);

      // Insert selfie record
      const { data: selfie, error } = await (supabase
        .from('guest_selfies' as any)
        .insert({
          event_id: eventId,
          image_url: publicUrl,
        } as any)
        .select()
        .single() as any);
      if (error) throw error;

      // Invoke face processing
      await supabase.functions.invoke('process-guest-selfie', {
        body: { selfieId: selfie.id, eventId },
      });

      // Poll for results via security-definer RPC (anonymous reads on guest_selfies are blocked).
      const poll = setInterval(async () => {
        const { data: rows } = await (supabase.rpc as any)('get_guest_selfie_status', {
          _selfie_id: selfie.id,
        });
        const data = Array.isArray(rows) ? rows[0] : rows;

        if (data?.processing_status === 'completed') {
          clearInterval(poll);
          const matchIds: string[] = (data.match_results as string[]) || [];
          if (matchIds.length > 0) {
            const { data: photos } = await supabase
              .from('photos')
              .select('id, url, file_name')
              .in('id', matchIds);
            setMatchedPhotos((photos as MatchedPhoto[]) || []);
          }
          setStep('results');
        } else if (data?.processing_status === 'failed') {
          clearInterval(poll);
          setErrorMsg('Face matching could not process your photo.');
          setStep('error');
        }
      }, 2000);

      // Timeout after 45s
      setTimeout(() => {
        clearInterval(poll);
        if (step === 'processing') {
          setStep('results');
        }
      }, 45000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Upload failed');
      setStep('error');
    }
  };

  const accent = accentColor || 'hsl(var(--primary))';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0 bg-background border-border">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5" style={{ color: accent }} />
            Find My Photos
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          {/* ── Upload Step ── */}
          {step === 'upload' && (
            <div className="space-y-5">
              <div className="rounded-2xl p-8 text-center space-y-5 bg-muted/30 border border-border">
                <div
                  className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${accent}15` }}
                >
                  <Camera className="h-7 w-7" style={{ color: accent }} />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-foreground">Upload a selfie</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Our AI will find every photo you appear in from "{eventName}"
                  </p>
                </div>
                <div className="space-y-2.5">
                  <Button
                    className="w-full gap-2"
                    style={{ backgroundColor: accent }}
                    onClick={() => {
                      const el = document.createElement('input');
                      el.type = 'file';
                      el.accept = 'image/*';
                      el.capture = 'user';
                      el.onchange = (e: any) => e.target.files?.[0] && handleFile(e.target.files[0]);
                      el.click();
                    }}
                  >
                    <Camera className="h-4 w-4" /> Use Camera
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" /> Choose from Gallery
                  </Button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/50 text-center">
                Your selfie is only used to find your photos and is never shared publicly.
              </p>
            </div>
          )}

          {/* ── Processing Step ── */}
          {step === 'processing' && (
            <div className="space-y-6 text-center py-4">
              {selfiePreview && (
                <div className="relative w-24 h-24 mx-auto">
                  <img
                    src={selfiePreview}
                    alt="Your selfie"
                    className="w-full h-full rounded-full object-cover border-2"
                    style={{ borderColor: accent }}
                  />
                  <div
                    className="absolute inset-0 rounded-full border-2 skeleton-block"
                    style={{ borderColor: accent }}
                  />
                </div>
              )}
              <div>
                <h3 className="font-serif text-lg text-foreground">Scanning photos…</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  AI is searching through all {eventName} photos
                </p>
              </div>
              <div className="flex justify-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full skeleton-block"
                    style={{ backgroundColor: accent, animationDelay: `${i * 0.3}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Results Step ── */}
          {step === 'results' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-serif text-lg text-foreground">
                  {matchedPhotos.length > 0
                    ? `${matchedPhotos.length} photo${matchedPhotos.length > 1 ? 's' : ''} found!`
                    : 'No matches found'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {matchedPhotos.length > 0
                    ? 'Here are the photos you appear in'
                    : 'Try uploading a clearer selfie with good lighting'}
                </p>
              </div>

              {matchedPhotos.length > 0 && (
                <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                  {matchedPhotos.map(photo => (
                    <div
                      key={photo.id}
                      className="relative group rounded-lg overflow-hidden cursor-pointer aspect-square"
                      onClick={() => {
                        onOpenLightbox?.(photo.id);
                        handleClose(false);
                      }}
                    >
                      <ProgressiveImage src={photo.url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200" />
                      <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {toggleFavorite && (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(photo.id); }}
                            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
                          >
                            <Heart
                              className="h-3.5 w-3.5"
                              style={isFavorite?.(photo.id)
                                ? { color: accent, fill: accent }
                                : { color: 'white' }}
                            />
                          </button>
                        )}
                        {canDownload && onDownloadPhoto && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onDownloadPhoto(photo); }}
                            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
                          >
                            <Download className="h-3.5 w-3.5 text-white" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={reset}>
                  Try Another Photo
                </Button>
                {matchedPhotos.length > 0 && (
                  <Button
                    variant="outline"
                    className="flex-1 gap-1.5"
                    onClick={() => navigator.share?.({ title: `My photos from ${eventName}`, url: window.location.href })}
                  >
                    <Share2 className="h-3.5 w-3.5" /> Share
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ── Error Step ── */}
          {step === 'error' && (
            <div className="space-y-4 text-center py-4">
              <h3 className="font-serif text-lg text-foreground">Something went wrong</h3>
              <p className="text-xs text-muted-foreground">{errorMsg || 'Please try uploading again.'}</p>
              <Button onClick={reset} style={{ backgroundColor: accent }}>
                Try Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
