import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getStudioDisplayUrl } from '@/lib/studio-url';
import { Check, Camera, Copy, Sparkles, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

const STEPS = ['Studio', 'Logo', 'Event', 'Client'];

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [studioName, setStudioName] = useState('');
  const [tagline, setTagline] = useState('');
  const [slug, setSlug] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
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

  const handleNext = async () => {
    if (!user) return;
    if (step === 0) {
      if (!studioName.trim()) { toast.error('Studio name is required'); return; }
      await (supabase.from('profiles').update({ studio_name: studioName } as any) as any).eq('user_id', user.id);
      setStep(1);
    } else if (step === 1) {
      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const path = `studio-logos/${user.id}/logo.${ext}`;
        await supabase.storage.from('event-covers').upload(path, logoFile, { upsert: true });
        const url = supabase.storage.from('event-covers').getPublicUrl(path).data.publicUrl;
        await (supabase.from('profiles').update({ studio_logo_url: url } as any) as any).eq('user_id', user.id);
      }
      setStep(2);
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
      setStep(3);
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

  if (showCelebration) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center animate-in fade-in duration-500">
        <div className="text-center">
          <Sparkles className="mx-auto h-16 w-16 text-primary mb-4" />
          <h1 className="font-serif text-3xl font-bold text-foreground">You're all set!</h1>
          <p className="text-sm text-muted-foreground mt-2">Welcome to MirrorAI</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="pointer-events-auto flex items-center justify-center min-h-[70vh]">
        <div className="bg-card border border-border rounded-xl shadow-md p-8 max-w-[600px] w-full">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-0 mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors ${
                    i < step ? 'bg-primary border-primary text-primary-foreground' :
                    i === step ? 'border-primary text-primary' :
                    'border-border text-muted-foreground'
                  }`}>
                    {i < step ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-1 uppercase tracking-wider">{s}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`w-12 h-px mx-1 mb-4 ${i < step ? 'bg-primary' : 'bg-border'}`} />}
              </div>
            ))}
          </div>

          {step === 0 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="font-serif text-2xl font-bold text-foreground">Welcome to MirrorAI</h2>
                <p className="text-sm text-muted-foreground mt-1">Let's set up your studio in just a few steps.</p>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Studio Name</label>
                <Input value={studioName} onChange={e => { setStudioName(e.target.value); setSlug(generateSlug(e.target.value)); }} className="mt-1 bg-background" required />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Studio Tagline</label>
                <Input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="Reflections of Your Moments" className="mt-1 bg-background" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Studio Slug</label>
                <Input value={slug} onChange={e => setSlug(e.target.value)} className="mt-1 bg-background" />
                <p className="text-[10px] text-muted-foreground/50 mt-1">{getStudioDisplayUrl(slug || 'your-studio')}</p>
              </div>
              <Button onClick={handleNext} className="w-full bg-primary text-primary-foreground">Next</Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="font-serif text-2xl font-bold text-foreground">Add Your Studio Logo</h2>
                <p className="text-sm text-muted-foreground mt-1">Your logo appears on all your galleries.</p>
              </div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files?.[0];
                if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); }
              }} />
              <div onClick={() => logoRef.current?.click()} className="mx-auto h-[200px] w-[200px] rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/40 transition-colors overflow-hidden">
                {logoPreview ? <img src={logoPreview} className="h-full w-full object-cover" /> : <Camera className="h-10 w-10 text-muted-foreground/25" />}
              </div>
              <button onClick={() => setStep(2)} className="text-sm text-muted-foreground underline block mx-auto">Skip for now</button>
              <Button onClick={handleNext} className="w-full bg-primary text-primary-foreground">Next</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="font-serif text-2xl font-bold text-foreground">Create Your First Gallery</h2>
                <p className="text-sm text-muted-foreground mt-1">Add your first photo event to get started.</p>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Event Title</label>
                <Input value={eventTitle} onChange={e => setEventTitle(e.target.value)} className="mt-1 bg-background" required />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Event Date</label>
                <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="mt-1 bg-background" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Location</label>
                <Input value={eventLocation} onChange={e => setEventLocation(e.target.value)} placeholder="Mumbai, India" className="mt-1 bg-background" />
              </div>
              <Button onClick={handleNext} className="w-full bg-primary text-primary-foreground">Next</Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="font-serif text-2xl font-bold text-foreground">Share With Your Client</h2>
                <p className="text-sm text-muted-foreground mt-1">Let your client know their gallery is ready.</p>
              </div>
              {galleryUrl && (
                <div className="flex gap-2">
                  <Input value={galleryUrl} readOnly className="bg-background text-[12px] font-mono" />
                  <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(galleryUrl); toast.success('Link copied!'); }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {galleryUrl && (
                <Button asChild variant="outline" className="w-full">
                  <a href={`https://wa.me/?text=${encodeURIComponent('Your gallery is ready: ' + galleryUrl)}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" /> Share on WhatsApp
                  </a>
                </Button>
              )}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Client Email</label>
                <div className="flex gap-2 mt-1">
                  <Input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="client@email.com" className="bg-background" />
                  <Button variant="outline" onClick={() => { console.log('Send invite to:', clientEmail); toast.success('Invite sent!'); }}>Send</Button>
                </div>
              </div>
              <Button onClick={finish} className="w-full bg-primary text-primary-foreground">Finish</Button>
            </div>
          )}

          <button onClick={skipOnboarding} className="text-[10px] text-muted-foreground/50 underline block mx-auto mt-4">Skip setup</button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Onboarding;
