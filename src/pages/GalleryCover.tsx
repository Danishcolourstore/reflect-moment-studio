import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Image, RefreshCw, Smartphone, Wifi, MessageCircle, ChevronDown } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { useGuestSession } from '@/hooks/use-guest-session';

interface Event {
  id: string;
  name: string;
  slug: string;
  event_date: string;
  cover_url: string | null;
  gallery_pin: string | boolean | null;
  is_published: boolean;
  gallery_layout: string;
  downloads_enabled: boolean;
}

const GalleryCover = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [pinRequired, setPinRequired] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Init guest session once we have event id
  useGuestSession(event?.id);

  const fetchEvent = useCallback(async () => {
    if (!slug) return;

    const access_token = searchParams.get('token') ?? undefined;
    const { data, error } = await supabase.functions.invoke('get-gallery-photos', {
      body: { event_slug: slug, ...(access_token ? { access_token } : {}) },
    });

    if (error || !data?.success) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const ev = data.event as Event;
    setEvent(ev);

    if (ev.gallery_pin) {
      const verified = localStorage.getItem(`mirrorai_pin_${ev.id}`) === '1';
      setPinRequired(!verified);
    }

    setLoading(false);
  }, [slug, searchParams]);

  useEffect(() => { fetchEvent(); }, [fetchEvent]);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    // Server-side verification — never compare PINs client-side.
    const { data } = await (supabase.rpc as any)('verify_gallery_pin', {
      event_id: event.id,
      pin_input: pinInput,
    });
    if (data?.valid) {
      localStorage.setItem(`mirrorai_pin_${event.id}`, '1');
      if (data.token) localStorage.setItem(`mirrorai_pin_token_${event.id}`, data.token);
      setPinRequired(false);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const enterGallery = () => {
    if (!event) return;
    navigate(`/event/${event.slug}/gallery`);
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <p className="text-[11px] text-muted-foreground/50 uppercase tracking-widest">Loading gallery…</p>
      </div>
    );
  }

  /* ── Not Found ── */
  if (notFound) {
    return (
      <div className="min-h-[100dvh] bg-background px-4 py-12 flex flex-col items-center">
        <div className="w-full max-w-sm space-y-6 text-center">
          <h1 className="font-serif text-4xl font-semibold text-primary mb-2">Gallery Not Found</h1>
          <p className="text-[12px] text-muted-foreground/50">This gallery link is invalid or has been removed.</p>

          <Button
            onClick={() => window.location.reload()}
            className="bg-primary hover:bg-primary/85 text-primary-foreground h-10 px-8 text-[11px] tracking-[0.12em] uppercase font-medium"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Retry Now
          </Button>

          <Collapsible>
            <CollapsibleTrigger className="w-full flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground/60 font-medium py-3 hover:text-muted-foreground transition-colors">
              <span>Can't load the gallery? Try a DNS fix</span>
              <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 rounded-xl border border-border/30 bg-card/50 p-4">
                <Tabs defaultValue="mobile" className="w-full">
                  <TabsList className="w-full bg-secondary/50">
                    <TabsTrigger value="mobile" className="flex-1 gap-1.5 text-[10px] tracking-[0.1em] uppercase">
                      <Smartphone className="h-3.5 w-3.5" /> Mobile Data
                    </TabsTrigger>
                    <TabsTrigger value="wifi" className="flex-1 gap-1.5 text-[10px] tracking-[0.1em] uppercase">
                      <Wifi className="h-3.5 w-3.5" /> WiFi
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="mobile" className="text-left space-y-2 mt-4">
                    {[
                      'Go to Settings',
                      "Search 'Private DNS'",
                      'Tap Private DNS',
                      "Select 'Private DNS provider hostname'",
                      'Type: dns.google',
                      'Save and retry',
                    ].map((step, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-medium flex items-center justify-center">{i + 1}</span>
                        <p className="text-[12px] text-foreground/80 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value="wifi" className="text-left space-y-2 mt-4">
                    {[
                      'Go to Settings → WiFi',
                      'Long press your connected network',
                      'Tap Modify Network',
                      'IP Settings → Select Static',
                      'DNS 1: 8.8.8.8',
                      'DNS 2: 8.8.4.4',
                      'Save and retry',
                    ].map((step, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-medium flex items-center justify-center">{i + 1}</span>
                        <p className="text-[12px] text-foreground/80 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <a
            href="https://wa.me/?text=Hi%2C%20I%20am%20unable%20to%20access%20the%20gallery%20link.%20Can%20you%20help%3F"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] font-medium text-muted-foreground/60 hover:text-primary transition-colors"
          >
            <MessageCircle className="h-4 w-4" /> Contact Photographer
          </a>
        </div>
      </div>
    );
  }

  /* ── PIN Gate ── */
  if (pinRequired) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-xs text-center space-y-8">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <h1 className="font-serif text-2xl font-semibold text-foreground">Protected Gallery</h1>
            <p className="text-[11px] text-muted-foreground/60">Enter the password to view this gallery.</p>
          </div>
          <form onSubmit={handlePinSubmit} className="space-y-3">
            <Input value={pinInput} onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
              placeholder="Enter password" className="bg-background border-border h-10 text-center text-[14px] tracking-[0.2em]" autoFocus />
            {pinError && <p className="text-[10px] text-destructive">Incorrect password. Please try again.</p>}
            <Button type="submit" className="w-full bg-primary hover:bg-primary/85 text-primary-foreground h-10 text-[11px] tracking-[0.12em] uppercase font-medium">
              View Gallery
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (!event) return null;

  /* ── Cover Page ── */
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-4">
      {event.cover_url ? (
        <div className="relative w-full max-w-2xl aspect-[3/2] overflow-hidden mb-8">
          <img src={event.cover_url} alt={event.name} className="h-full w-full object-cover" loading="lazy" decoding="async" />
        </div>
      ) : (
        <div className="w-full max-w-2xl aspect-[3/2] bg-secondary flex items-center justify-center mb-8">
          <Image className="h-12 w-12 text-muted-foreground/15" />
        </div>
      )}
      <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground text-center">{event.name}</h1>
      <p className="text-[12px] text-muted-foreground/60 tracking-wide mt-2">
        {format(new Date(event.event_date), 'MMMM d, yyyy')}
      </p>
      <Button onClick={enterGallery}
        className="mt-8 bg-primary hover:bg-primary/85 text-primary-foreground h-10 px-8 text-[11px] tracking-[0.12em] uppercase font-medium">
        Enter Gallery
      </Button>
      <div className="mt-12 pb-8 text-center">
        <p className="text-[9px] text-muted-foreground/30 tracking-[0.15em] uppercase">Powered by MirrorAI</p>
      </div>
    </div>
  );
};

export default GalleryCover;
