import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Image } from 'lucide-react';
import { format } from 'date-fns';
import { useGuestSession } from '@/hooks/use-guest-session';

interface Event {
  id: string;
  name: string;
  slug: string;
  event_date: string;
  cover_url: string | null;
  gallery_pin: string | null;
  is_published: boolean;
  gallery_layout: string;
  downloads_enabled: boolean;
}

const GalleryCover = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

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
    const { data } = await (supabase
      .from('events')
      .select('*') as any)
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (!data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const ev = data as unknown as Event;
    setEvent(ev);

    // Check password gate
    if (ev.gallery_pin) {
      const unlocked = sessionStorage.getItem(`unlocked_${ev.id}`);
      if (unlocked === 'true') {
        setPinRequired(false);
      } else {
        setPinRequired(true);
      }
    }

    setLoading(false);
  }, [slug]);

  useEffect(() => { fetchEvent(); }, [fetchEvent]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    if (pinInput === event.gallery_pin) {
      sessionStorage.setItem(`unlocked_${event.id}`, 'true');
      setPinRequired(false);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const enterGallery = () => {
    if (!event) return;
    navigate(`/gallery/${event.slug}/view`);
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
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-4 text-center">
        <h1 className="font-serif text-4xl font-semibold text-primary mb-2">Gallery Not Found</h1>
        <p className="text-[12px] text-muted-foreground/50">This gallery link is invalid or has been removed.</p>
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
          <img src={event.cover_url} alt={event.name} className="h-full w-full object-cover" />
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
