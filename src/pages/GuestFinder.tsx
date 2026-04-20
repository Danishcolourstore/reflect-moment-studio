import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useGuestFinder } from '@/hooks/useGuestFinder';
import { Camera, Upload, Download, Share2, Sparkles, Loader2 } from 'lucide-react';

const GuestFinder = () => {
  const { token } = useParams<{ token: string }>();
  const fileRef = useRef<HTMLInputElement>(null);
  const [event, setEvent] = useState<any>(null);
  const [qrAccess, setQrAccess] = useState<any>(null);
  const [invalid, setInvalid] = useState(false);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    };
  }, []);


  useEffect(() => {
    if (!token) return;
    (supabase
      .from('event_qr_access' as any)
      .select('*, events(*)')
      .eq('public_token', token)
      .eq('is_active', true)
      .single() as any)
      .then(({ data, error }: any) => {
        if (error || !data) { setInvalid(true); return; }
        if (data.expires_at && new Date(data.expires_at) < new Date()) { setInvalid(true); return; }
        setQrAccess(data);
        setEvent(data.events);
      });
  }, [token]);

  const { step, matchedPhotos, submitSelfie } = useGuestFinder(
    event?.id || '',
    qrAccess?.id || ''
  );

  const handleFile = (file: File) => {
    if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    setSelfiePreview(URL.createObjectURL(file));
    submitSelfie(file);
  };

  if (invalid) {
    return (
      <div className="min-h-[100dvh] bg-[#0A0A0A] flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-[#F5F0E8] text-xl font-serif mb-2">This link has expired</h1>
          <p className="text-[#9A8E82] text-sm">Please contact your photographer for a new link.</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-[100dvh] bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#1A1A1A]" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0A] flex flex-col">
      {/* Header */}
      <div className="text-center pt-10 pb-6 px-4">
        <p className="text-[#1A1A1A] text-sm tracking-[0.2em] uppercase flex items-center justify-center gap-2">
          <Sparkles className="h-3.5 w-3.5" /> MirrorAI
        </p>
        <h1
          className="text-[#F5F0E8] mt-3 text-2xl"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          {event.name}
        </h1>
        <p className="text-[#9A8E82] text-sm mt-1">Find the photos you're in</p>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-4 pb-8">
        {step === 'upload' && (
          <div className="w-full max-w-sm space-y-6">
            <div
              className="rounded-2xl p-8 text-center space-y-6"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-[#1A1A1A]/10 flex items-center justify-center">
                <Camera className="h-8 w-8 text-[#1A1A1A]" />
              </div>
              <div>
                <h2 className="text-[#F5F0E8] text-lg font-serif">Take a selfie</h2>
                <p className="text-[#9A8E82] text-xs mt-1">Our AI will find every photo you're in</p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    const el = document.createElement('input');
                    el.type = 'file';
                    el.accept = 'image/*';
                    el.capture = 'user';
                    el.onchange = (e: any) => handleFile(e.target.files[0]);
                    el.click();
                  }}
                  className="w-full py-3.5 bg-[#1A1A1A] text-[#0A0A0A] rounded-xl text-sm font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-[#B8955A] transition-colors"
                >
                  <Camera className="h-4 w-4" /> Use Camera
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-3.5 border border-[#2A2A2A] text-[#F5F0E8] rounded-xl text-sm font-medium tracking-wide flex items-center justify-center gap-2 hover:border-[#1A1A1A] transition-colors"
                >
                  <Upload className="h-4 w-4" /> Upload Photo
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>
            </div>
            <p className="text-[#3A3A3A] text-[10px] text-center">
              Your selfie is used only to find your photos and is never stored publicly.
            </p>
          </div>
        )}

        {step === 'processing' && (
          <div className="w-full max-w-sm space-y-6">
            <div
              className="rounded-2xl p-8 text-center space-y-6"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {selfiePreview && (
                <div className="relative w-24 h-24 mx-auto">
                  <img
                    src={selfiePreview}
                    alt="Your selfie"
                    className="w-full h-full rounded-full object-cover border-2 border-[#1A1A1A]" loading="lazy" decoding="async" />
                  <div className="absolute inset-0 rounded-full border-2 border-[#1A1A1A] skeleton-block" />
                </div>
              )}
              <div>
                <h2 className="text-[#F5F0E8] text-lg font-serif">Scanning memories…</h2>
                <p className="text-[#9A8E82] text-xs mt-1">AI is searching through every photo from the event</p>
              </div>
              <div className="flex justify-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-[#1A1A1A] skeleton-block"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'results' && (
          <div className="w-full max-w-sm space-y-6">
            <div className="text-center">
              <h2 className="text-[#F5F0E8] text-lg font-serif">
                {matchedPhotos.length > 0
                  ? `${matchedPhotos.length} photos found`
                  : 'Your photos are ready'}
              </h2>
              <p className="text-[#9A8E82] text-xs mt-1">AI matched these from your event gallery</p>
            </div>

            {matchedPhotos.length === 0 && (
              <div className="grid grid-cols-3 gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-square bg-[#1A1A1A] rounded-lg skeleton-block" />
                ))}
              </div>
            )}

            {matchedPhotos.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {matchedPhotos.map((photo: any) => (
                  <div key={photo.id} className="relative group rounded-lg overflow-hidden">
                    <img src={photo.url} alt="" className="w-full aspect-square object-cover" loading="lazy" decoding="async" />
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          fetch(photo.url).then(r => r.blob()).then(blob => {
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url; a.download = photo.file_name || 'photo.jpg';
                            document.body.appendChild(a); a.click(); document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          });
                        }}
                        className="w-9 h-9 bg-white rounded-full flex items-center justify-center"
                      >
                        <Download className="h-4 w-4 text-black" />
                      </button>
                      <button
                        onClick={() => navigator.share?.({ url: photo.url })}
                        className="w-9 h-9 bg-white rounded-full flex items-center justify-center"
                      >
                        <Share2 className="h-4 w-4 text-black" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {matchedPhotos.length > 0 && (
              <button
                onClick={async () => {
                  for (let i = 0; i < matchedPhotos.length; i++) {
                    const p = matchedPhotos[i] as any;
                    try {
                      const res = await fetch(p.url);
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = p.file_name || `photo-${i + 1}.jpg`;
                      document.body.appendChild(a); a.click(); document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      await new Promise(r => setTimeout(r, 300));
                    } catch {}
                  }
                }}
                className="w-full py-3.5 bg-[#1A1A1A] text-[#0A0A0A] rounded-xl text-sm font-medium tracking-wide flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" /> Download All Photos
              </button>
            )}

            <p className="text-[#3A3A3A] text-[10px] text-center">
              Powered by MirrorAI · Azure Face Matching activates when configured
            </p>
          </div>
        )}

        {step === 'error' && (
          <div className="w-full max-w-sm text-center space-y-4">
            <h2 className="text-[#F5F0E8] text-lg font-serif">Something went wrong</h2>
            <p className="text-[#9A8E82] text-sm">Please try uploading your photo again.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-[#1A1A1A] text-[#0A0A0A] rounded-xl text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestFinder;
