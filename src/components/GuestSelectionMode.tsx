import { useState, useRef, useCallback } from 'react';
import { Check, Send, X, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Photo {
  id: string;
  url: string;
  file_name: string | null;
}

interface GuestSelectionModeProps {
  eventId: string;
  photos: Photo[];
  onClose: () => void;
}

export function GuestSelectionMode({ eventId, photos, onClose }: GuestSelectionModeProps) {
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Double-tap detection
  const lastTapRef = useRef<{ time: number; id: string }>({ time: 0, id: '' });
  const [heartBurst, setHeartBurst] = useState<{ x: number; y: number } | null>(null);

  const toggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleTap = useCallback((id: string, e: React.MouseEvent) => {
    const now = Date.now();
    const last = lastTapRef.current;
    if (now - last.time < 400 && last.id === id) {
      // Double-tap: add if not already selected
      if (!selectedIds.has(id)) toggle(id);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setHeartBurst({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      setTimeout(() => setHeartBurst(null), 700);
      lastTapRef.current = { time: 0, id: '' };
    } else {
      // Single tap: toggle
      lastTapRef.current = { time: now, id };
      setTimeout(() => {
        if (lastTapRef.current.time === now) {
          toggle(id);
        }
      }, 350);
    }
  }, [selectedIds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.size === 0 || !name.trim() || !email.trim()) return;
    setSubmitting(true);
    try {
      const { data: selection, error: selError } = await (supabase
        .from('guest_selections' as any)
        .insert({ event_id: eventId, guest_name: name.trim(), guest_email: email.trim() } as any)
        .select('id').single() as any);
      if (selError || !selection) throw selError;
      const photoRows = Array.from(selectedIds).map(photoId => ({ selection_id: selection.id, photo_id: photoId }));
      const { error: photosError } = await (supabase.from('guest_selection_photos' as any).insert(photoRows as any) as any);
      if (photosError) throw photosError;
      setSubmitted(true);
      toast({ title: 'Selections sent' });
    } catch {
      toast({ title: 'Could not send — try again', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="text-center space-y-3 max-w-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Heart className="h-5 w-5 text-primary" fill="hsl(var(--primary))" />
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, color: "hsl(48, 7%, 10%)" }}>
            Selections sent
          </h2>
          <p className="text-[12px] text-muted-foreground/60">
            {selectedIds.size} photos shared with your photographer
          </p>
          <Button onClick={onClose} variant="outline" className="mt-4 text-[11px] uppercase tracking-wider">
            Back to Gallery
          </Button>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-card border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 400, color: "hsl(48, 7%, 10%)", margin: 0 }}>
                Send Selections
              </h3>
              <p className="text-[11px] text-muted-foreground/60 mt-1">
                {selectedIds.size} {selectedIds.size === 1 ? 'photo' : 'photos'}
              </p>
            </div>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground/50 hover:text-foreground p-1">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Thumbnail strip */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {photos.filter(p => selectedIds.has(p.id)).slice(0, 8).map(p => (
              <img key={p.id} src={p.url} alt="" className="h-12 w-12 object-cover shrink-0" loading="lazy" decoding="async" />
            ))}
            {selectedIds.size > 8 && (
              <div className="h-12 w-12 bg-muted flex items-center justify-center shrink-0">
                <span className="text-[10px] text-muted-foreground">+{selectedIds.size - 8}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">Your Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="bg-background h-9 text-[13px]" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">Your Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" className="bg-background h-9 text-[13px]" required />
            </div>
            <Button type="submit" disabled={submitting} className="w-full h-10 bg-primary text-primary-foreground text-[11px] tracking-wider uppercase">
              {submitting ? 'Sending…' : 'Send Selections'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Heart burst animation */}
      <AnimatePresence>
        {heartBurst && (
          <motion.div
            initial={{ scale: 0.4, opacity: 0.9 }}
            animate={{ scale: 1.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed", left: heartBurst.x - 24, top: heartBurst.y - 24,
              width: 48, height: 48, pointerEvents: "none", zIndex: 100,
            }}
          >
            <Heart style={{ width: 48, height: 48, color: "hsl(var(--primary))", fill: "hsl(var(--primary))" }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating selection pill */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 left-1/2 z-50 flex items-center gap-3"
            style={{ transform: "translateX(-50%)" }}
          >
            <button
              onClick={() => selectedIds.size > 0 && setShowForm(true)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 20px", background: "hsl(48, 7%, 10%)",
                border: "none", borderRadius: 40, cursor: "pointer",
                boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
              }}
            >
              <Heart style={{ width: 14, height: 14, color: "hsl(var(--primary))", fill: "hsl(var(--primary))" }} />
              <span style={{
                fontFamily: "'Cormorant Garamond', serif", fontSize: 14,
                color: "hsl(45, 14%, 97%)", letterSpacing: "0.02em",
              }}>
                {selectedIds.size} {selectedIds.size === 1 ? 'selection' : 'selections'}
              </span>
            </button>
            <button
              onClick={onClose}
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "hsl(45, 14%, 97%)", border: "1px solid hsl(37, 10%, 88%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <X style={{ width: 14, height: 14, color: "hsl(35, 4%, 56%)" }} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selection grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-[2px] pb-20">
        {photos.map(photo => {
          const selected = selectedIds.has(photo.id);
          return (
            <button
              key={photo.id}
              type="button"
              onClick={(e) => handleTap(photo.id, e)}
              className="relative aspect-square overflow-hidden group"
            >
              <img src={photo.url} alt="" className="h-full w-full object-cover" loading="lazy" />
              {/* Subtle selection overlay */}
              <div className={`absolute inset-0 transition-all duration-150 ${selected ? 'bg-primary/10' : ''}`} />
              {/* Minimal dot indicator */}
              {selected && (
                <div style={{
                  position: "absolute", bottom: 6, right: 6, width: 6, height: 6,
                  borderRadius: "50%", background: "hsl(var(--primary))",
                  boxShadow: "0 0 4px hsl(var(--primary) / 0.4)",
                }} />
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
