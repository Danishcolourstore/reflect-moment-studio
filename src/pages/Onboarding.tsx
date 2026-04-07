import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STEPS = ['Studio', 'Event', 'Ready'];

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [studioName, setStudioName] = useState('');
  const [slug, setSlug] = useState('');
  const [contentVisible, setContentVisible] = useState(true);

  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [createdSlug, setCreatedSlug] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);

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
      if (!eventTitle.trim()) { toast.error('Event name is required'); return; }
      const eventSlug = generateSlug(eventTitle) + '-' + Math.random().toString(36).slice(2, 6);
      const { data } = await (supabase.from('events').insert({
        user_id: user.id, name: eventTitle, slug: eventSlug,
        event_date: eventDate || new Date().toISOString().split('T')[0],
      } as any).select('id').single() as any);
      if (data) {
        setCreatedEventId(data.id);
        setCreatedSlug(eventSlug);
      }
      changeStep(2);
    }
  };

  const finish = async () => {
    if (!user) return;
    await (supabase.from('profiles').update({ onboarding_completed: true } as any) as any).eq('user_id', user.id);
    // Navigate directly to upload with event pre-selected
    if (createdEventId) {
      navigate(`/dashboard/events/${createdEventId}`);
    } else {
      navigate('/dashboard');
    }
  };

  const skipOnboarding = async () => {
    if (!user) return;
    await (supabase.from('profiles').update({ onboarding_completed: true } as any) as any).eq('user_id', user.id);
    navigate('/dashboard');
  };

  const progressWidth = `${((step + 1) / STEPS.length) * 100}%`;

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
          {/* Step 1: Studio Name */}
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
                autoFocus
              />
              <div className="bg-muted/30 rounded-lg p-3 mt-4">
                <p className="font-serif text-sm font-medium text-foreground">{studioName || 'Your Studio Name'}</p>
                <p className="text-[10px] text-primary mt-1">mirrorai.studio/p/{slug || 'your-studio'}</p>
              </div>
              <Button onClick={handleNext} className="w-full h-12 min-h-[44px] rounded-xl bg-primary text-primary-foreground font-medium gap-2">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Create First Event (minimal) */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="font-serif text-xl font-semibold text-foreground">Create your first gallery</h2>
                <p className="text-xs text-muted-foreground mt-1">Just a name is enough to get started</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Event Name</label>
                  <Input value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="Arjun & Priya's Wedding" className="mt-1 h-11 min-h-[44px] rounded-xl bg-background" required autoFocus />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Event Date</label>
                  <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="mt-1 h-11 min-h-[44px] rounded-xl bg-background" />
                </div>
              </div>
              <Button onClick={handleNext} className="w-full h-12 min-h-[44px] rounded-xl bg-primary text-primary-foreground font-medium gap-2">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 3: Gallery Ready — single primary action */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-foreground">Your gallery is ready</h2>
                <p className="text-sm text-muted-foreground mt-1">Add your photos and share with your client</p>
              </div>
              <Button onClick={finish} className="w-full h-12 min-h-[44px] rounded-xl bg-primary text-primary-foreground font-medium gap-2">
                Add Your Photos <ArrowRight className="h-4 w-4" />
              </Button>
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
