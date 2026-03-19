import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getStudioDisplayUrl } from '@/lib/studio-url';
import { Check, Camera, Copy, Sparkles, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STEPS = ['Studio', 'Logo', 'Event', 'Share'];

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [studioName, setStudioName] = useState('');
  const [tagline, setTagline] = useState('');
  const [slug, setSlug] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [contentVisible, setContentVisible] = useState(true);

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, []);

  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [createdSlug, setCreatedSlug] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    (supabase.from('profiles').select('studio_name, onboarding_completed') as any)
      .eq('user_id', user.id).single()
      .then(({ data }: any) => {
        if (data?.onboarding_completed) navigate('/dashboard', { replace: true });
        if (data?.studio_name) setStudioName(data.studio_name);
      });
  }, [user, navigate]);

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40);

  // Animate step transitions
  const changeStep = (newStep: number) => {
    setContentVisible(false);
    setTimeout(() => {
      setStep(newStep);
      setContentVisible(true);
    }, 50);
  };

  const handleNext = async () => {
    if (!user) return;
    if (step === 0) {
      if (!studioName.trim()) { toast.error('Studio name is required'); return; }
      await (supabase.from('profiles').update({ studio_name: studioName } as any) as any).eq('user_id', user.id);
      changeStep(1);
    } else if (step === 1) {
      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const path = `studio-logos/${user.id}/logo.${ext}`;
        await supabase.storage.from('event-covers').upload(path, logoFile, { upsert: true });
        const url = supabase.storage.from('event-covers').getPublicUrl(path).data.publicUrl;
        await (supabase.from('profiles').update({ studio_logo_url: url } as any) as any).eq('user_id', user.id);
      }
      changeStep(2);
    } else if (step === 2) {
      if (!eventTitle.trim()) { toast.error('Event title is required'); return; }
      const eventSlug = generateSlug(eventTitle) + '-' + Math.random().toString(36).slice(2, 6);
      const { data } = await (supabase.from('events').insert({
        user_id: user.id, name: eventTitle, slug: eventSlug,
        event_date: eventDate || new Date().toISOString().split('T')[0],
        location: eventLocation || null,
      } as any).select('id').single() as any);
      if (data) {
        setCreatedEventId(data.id);
        setCreatedSlug(eventSlug);
        toast.success('First event created!');
      }
      changeStep(3);
    }
  };

  const finish = async () => {
    if (!user) return;
    await (supabase.from('profiles').update({ onboarding_completed: true } as any) as any).eq('user_id', user.id);
    setShowCelebration(true);
    setTimeout(() => navigate('/dashboard'), 2500);
  };

  const skipOnboarding = async () => {
    if (!user) return;
    await (supabase.from('profiles').update({ onboarding_completed: true } as any) as any).eq('user_id', user.id);
    navigate('/dashboard');
  };

  const galleryUrl = createdSlug ? `${window.location.origin}/event/${createdSlug}` : '';
  const progressWidth = `${((step + 1) / STEPS.length) * 100}%`;

  if (showCelebration) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        {/* Confetti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${2 + Math.random() * 3}px`,
                height: `${2 + Math.random() * 3}px`,
                left: '50%',
                top: '50%',
                backgroundColor: ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--primary) / 0.6)', '#f59e0b', '#10b981', '#8b5cf6'][i % 6],
                animation: `confetti-burst 1.5s ease-out forwards`,
                animationDelay: `${Math.random() * 0.3}s`,
                '--confetti-x': `${(Math.random() - 0.5) * 300}px`,
                '--confetti-y': `${(Math.random() - 0.5) * 300}px`,
              } as any}
            />
          ))}
        </div>
        <style>{`
          @keyframes confetti-burst {
            0% { transform: translate(0, 0) scale(1); opacity: 1; }
            100% { transform: translate(var(--confetti-x), var(--confetti-y)) scale(0); opacity: 0; }
          }
        `}</style>
        <div className="text-center animate-fade-in">
          <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 pulse">
            <Sparkles className="h-12 w-12 text-primary" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-foreground">You're all set!</h1>
          <p className="text-sm text-muted-foreground mt-2">Your studio is ready. Redirecting…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center px-4">
      {/* Film grain overlay */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]">
        <svg width="100%" height="100%"><filter id="onboard-grain"><feTurbulence baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" /></filter><rect width="100%" height="100%" filter="url(#onboard-grain)" /></svg>
      </div>

      <div className={cn(
        "w-full max-w-lg bg-card border border-border rounded-2xl p-6 sm:p-8 relative overflow-hidden z-10",
        "max-sm:max-w-full max-sm:rounded-none max-sm:min-h-screen max-sm:flex max-sm:flex-col max-sm:justify-center"
      )}>
        {/* Progress stepper */}
        <div className="flex items-center justify-center gap-0 mb-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "rounded-full flex items-center justify-center text-[10px] font-medium transition-all",
                  "h-6 w-6 sm:h-8 sm:w-8 sm:text-xs",
                  i < step && "bg-primary text-primary-foreground",
                  i === step && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  i > step && "bg-muted text-muted-foreground"
                )}>
                  {i < step ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : i + 1}
                </div>
                <span className={cn(
                  "text-[9px] uppercase tracking-widest mt-1",
                  i === step ? "text-foreground font-medium" : "text-muted-foreground"
                )}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("w-8 sm:w-12 h-0.5 mx-1 mb-4", i < step ? "bg-primary" : "bg-border")} />
              )}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full bg-border rounded-full overflow-hidden mb-6">
          <div className="h-full bg-primary transition-all duration-500 rounded-full" style={{ width: progressWidth }} />
        </div>

        {/* Step content with transition */}
        <div
          key={step}
          className="transition-all duration-400 ease-out"
          style={{
            opacity: contentVisible ? 1 : 0,
            transform: contentVisible ? 'translateY(0)' : 'translateY(12px)',
          }}
        >
          {step === 0 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="font-serif text-xl font-semibold text-foreground">Name your studio</h2>
                <p className="text-xs text-muted-foreground mt-1 mb-6">This is how clients will see your brand</p>
              </div>
              <Input
                value={studioName}
                onChange={e => { setStudioName(e.target.value); setSlug(generateSlug(e.target.value)); }}
                className="h-12 min-h-[44px] text-center text-lg font-serif bg-background border-border rounded-xl"
                placeholder="e.g. Pixel Stories Photography"
                required
              />
              {/* Live preview */}
              <div className="bg-muted/30 rounded-lg p-3 mt-4">
                <p className="font-serif text-sm font-medium text-foreground">{studioName || 'Your Studio Name'}</p>
                <p className="text-[10px] text-muted-foreground">{tagline || 'Wedding & Event Photography'}</p>
                <p className="text-[10px] text-primary mt-1">mirrorai.studio/p/{slug || 'your-studio'}</p>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Tagline (optional)</label>
                <Input
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  placeholder="Wedding & Event Photography"
                  className="mt-1 h-10 min-h-[44px] text-sm bg-background border-border rounded-xl"
                />
              </div>
              <Button onClick={handleNext} className="w-full h-12 min-h-[44px] rounded-xl bg-primary text-primary-foreground font-medium gap-2">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="font-serif text-xl font-semibold text-foreground">Add your studio logo</h2>
                <p className="text-xs text-muted-foreground mt-1">Optional — you can add this later</p>
              </div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files?.[0];
                if (f) {
                  setLogoFile(f);
                  if (logoPreview) URL.revokeObjectURL(logoPreview);
                  setLogoPreview(URL.createObjectURL(f));
                }
              }} />
              <div
                onClick={() => logoRef.current?.click()}
                className="mx-auto h-[120px] w-[120px] rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 transition-all overflow-hidden relative"
              >
                {logoPreview ? (
                  <>
                    <img src={logoPreview} className="h-full w-full object-cover" alt="Logo preview" />
                    <div className="absolute bottom-0 inset-x-0 bg-background/80 backdrop-blur-sm py-1 text-center">
                      <span className="text-[10px] text-muted-foreground">Change</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Camera className="h-10 w-10 text-muted-foreground/25" />
                    <span className="text-[10px] text-muted-foreground mt-1">Tap to upload</span>
                  </>
                )}
              </div>
              <div className="space-y-2 pt-2">
                <Button onClick={handleNext} className="w-full h-12 min-h-[44px] rounded-xl bg-primary text-primary-foreground font-medium gap-2">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
                <button onClick={() => changeStep(2)} className="text-sm text-muted-foreground hover:text-foreground transition-colors block mx-auto py-2">
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="font-serif text-xl font-semibold text-foreground">Create your first gallery</h2>
                <p className="text-xs text-muted-foreground mt-1">You can always add more later</p>
              </div>
              {createdEventId ? (
                <div className="text-center py-6">
                  <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                    <Check className="h-6 w-6 text-emerald-500" />
                  </div>
                  <p className="font-serif text-sm font-medium text-foreground">{eventTitle}</p>
                  <p className="text-xs text-muted-foreground mt-1">Gallery created!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Event Name</label>
                    <Input value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="Arjun & Priya's Wedding" className="mt-1 h-11 min-h-[44px] rounded-xl bg-background" required />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Event Date</label>
                    <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="mt-1 h-11 min-h-[44px] rounded-xl bg-background" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Location</label>
                    <Input value={eventLocation} onChange={e => setEventLocation(e.target.value)} placeholder="Kochi, Kerala" className="mt-1 h-11 min-h-[44px] rounded-xl bg-background" />
                  </div>
                </div>
              )}
              <div className="space-y-2 pt-1">
                <Button onClick={handleNext} className="w-full h-12 min-h-[44px] rounded-xl bg-primary text-primary-foreground font-medium gap-2">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
                <button onClick={() => changeStep(3)} className="text-sm text-muted-foreground hover:text-foreground transition-colors block mx-auto py-2">
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-3 pulse">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-foreground">You're all set!</h2>
                <p className="text-sm text-muted-foreground mt-1">Your studio is ready. Start uploading photos.</p>
              </div>

              {galleryUrl && (
                <div className="flex gap-2">
                  <Input value={galleryUrl} readOnly className="bg-background text-[12px] font-mono h-11 min-h-[44px] rounded-xl" />
                  <Button variant="outline" size="icon" className="h-11 w-11 min-h-[44px] rounded-xl shrink-0" onClick={() => { navigator.clipboard.writeText(galleryUrl); toast.success('Link copied!'); }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {galleryUrl && (
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Invite a Client (optional)</label>
                  <div className="flex gap-2 mt-1">
                    <Input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="client@email.com" className="bg-background h-11 min-h-[44px] rounded-xl" />
                    <Button variant="outline" className="h-11 min-h-[44px] rounded-xl" onClick={() => { console.log('Send invite to:', clientEmail); toast.success('Invite sent!'); }}>Send</Button>
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <Button onClick={finish} className="w-full h-12 min-h-[44px] rounded-xl bg-primary text-primary-foreground font-medium">
                  Go to Dashboard
                </Button>
                <Button variant="outline" onClick={() => navigate('/dashboard/upload')} className="w-full h-11 min-h-[44px] rounded-xl">
                  Upload Photos
                </Button>
              </div>
            </div>
          )}
        </div>

        <button onClick={skipOnboarding} className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground underline block mx-auto mt-6 transition-colors">
          Skip setup
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
