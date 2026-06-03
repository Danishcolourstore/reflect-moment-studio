import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Check, ChevronDown } from 'lucide-react';

function LayoutWireframe({ type }: { type: string }) {
  const f = { fill: 'currentColor', opacity: 0.15, rx: 0 };
  return (
    <svg viewBox="0 0 40 40" className="w-full h-full">
      {type === 'classic' && (<><rect x="2" y="2" width="11" height="11" {...f} /><rect x="15" y="2" width="11" height="11" {...f} /><rect x="28" y="2" width="11" height="11" {...f} /><rect x="2" y="15" width="11" height="11" {...f} /><rect x="15" y="15" width="11" height="11" {...f} /><rect x="28" y="15" width="11" height="11" {...f} /><rect x="2" y="28" width="11" height="11" {...f} /><rect x="15" y="28" width="11" height="11" {...f} /><rect x="28" y="28" width="11" height="11" {...f} /></>)}
      {type === 'masonry' && (<><rect x="2" y="2" width="11" height="16" {...f} /><rect x="15" y="2" width="11" height="10" {...f} /><rect x="28" y="2" width="11" height="13" {...f} /><rect x="2" y="20" width="11" height="10" {...f} /><rect x="15" y="14" width="11" height="16" {...f} /><rect x="28" y="17" width="11" height="10" {...f} /><rect x="2" y="32" width="11" height="7" {...f} /><rect x="15" y="32" width="11" height="7" {...f} /><rect x="28" y="29" width="11" height="10" {...f} /></>)}
      {type === 'justified' && (<><rect x="2" y="2" width="14" height="8" {...f} /><rect x="18" y="2" width="21" height="8" {...f} /><rect x="2" y="12" width="21" height="8" {...f} /><rect x="25" y="12" width="14" height="8" {...f} /><rect x="2" y="22" width="10" height="8" {...f} /><rect x="14" y="22" width="12" height="8" {...f} /><rect x="28" y="22" width="11" height="8" {...f} /><rect x="2" y="32" width="18" height="7" {...f} /><rect x="22" y="32" width="17" height="7" {...f} /></>)}
      {type === 'editorial' && (<><rect x="2" y="2" width="37" height="12" {...f} /><rect x="2" y="16" width="12" height="8" {...f} /><rect x="15.5" y="16" width="12" height="8" {...f} /><rect x="29" y="16" width="10" height="8" {...f} /><rect x="2" y="26" width="18" height="13" {...f} /><rect x="22" y="26" width="17" height="13" {...f} /></>)}
      {type === 'editorial-collage' && (<><rect x="2" y="2" width="22" height="18" {...f} /><rect x="26" y="2" width="13" height="10" {...f} /><rect x="26" y="14" width="13" height="6" {...f} /><rect x="2" y="22" width="13" height="9" {...f} /><rect x="17" y="22" width="10" height="17" {...f} /><rect x="29" y="22" width="10" height="9" {...f} /><rect x="2" y="33" width="13" height="6" {...f} /><rect x="29" y="33" width="10" height="6" {...f} /></>)}
      {type === 'pixieset' && (<><rect x="2" y="2" width="11" height="14" {...f} /><rect x="15" y="2" width="11" height="14" {...f} /><rect x="28" y="2" width="11" height="14" {...f} /><rect x="2" y="18" width="11" height="12" {...f} /><rect x="15" y="18" width="11" height="12" {...f} /><rect x="28" y="18" width="11" height="12" {...f} /><rect x="2" y="32" width="11" height="7" {...f} /><rect x="15" y="32" width="11" height="7" {...f} /><rect x="28" y="32" width="11" height="7" {...f} /></>)}
      {type === 'cinematic' && (<><rect x="2" y="3" width="37" height="9" {...f} /><rect x="2" y="14" width="37" height="9" {...f} /><rect x="2" y="25" width="37" height="9" {...f} /></>)}
      {type === 'mosaic' && (<><rect x="2" y="2" width="18" height="18" {...f} /><rect x="22" y="2" width="8" height="8" {...f} /><rect x="32" y="2" width="7" height="8" {...f} /><rect x="22" y="12" width="17" height="8" {...f} /><rect x="2" y="22" width="8" height="8" {...f} /><rect x="12" y="22" width="8" height="8" {...f} /><rect x="22" y="22" width="17" height="17" {...f} /><rect x="2" y="32" width="18" height="7" {...f} /></>)}
      {type === 'minimal-portfolio' && (<><rect x="6" y="3" width="28" height="14" {...f} /><rect x="6" y="20" width="28" height="14" {...f} /></>)}
      {type === 'storybook' && (<><rect x="2" y="2" width="18" height="14" {...f} /><rect x="22" y="4" width="16" height="3" {...f} /><rect x="22" y="9" width="12" height="2" {...f} /><rect x="2" y="20" width="16" height="3" {...f} /><rect x="2" y="25" width="12" height="2" {...f} /><rect x="20" y="18" width="19" height="14" {...f} /><rect x="2" y="34" width="37" height="5" {...f} /></>)}
    </svg>
  );
}

const LAYOUT_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'masonry', label: 'Masonry' },
  { value: 'justified', label: 'Justified' },
  { value: 'editorial', label: 'Editorial' },
  { value: 'editorial-collage', label: 'Collage' },
  { value: 'pixieset', label: 'Pixieset' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'mosaic', label: 'Mosaic' },
  { value: 'minimal-portfolio', label: 'Portfolio' },
  { value: 'storybook', label: 'Story Book' },
] as const;

const inputStyle = {
  border: "1px solid rgba(17,17,17,0.2)",
  background: "transparent",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 14,
  fontWeight: 300,
  padding: "10px 12px",
  width: "100%",
  color: "#111111",
  outline: "none",
  borderRadius: 0,
  boxSizing: "border-box" as const,
};

const labelStyle = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 11,
  fontWeight: 300,
  letterSpacing: "0.15em",
  textTransform: "uppercase" as const,
  color: "var(--ink-muted)",
  display: "block",
  marginBottom: 6,
};

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (eventId: string) => void;
}

export function CreateEventModal({ open, onOpenChange, onCreated }: CreateEventModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [password, setPassword] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryLayout, setGalleryLayout] = useState('classic');
  const [downloadsEnabled, setDownloadsEnabled] = useState(true);
  const [optimizedUpload, setOptimizedUpload] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const mutexRef = useRef(false);
  const lastSubmitRef = useRef(0);

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugManuallyEdited) setSlug(generateSlug(val));
  };

  const handleSlugChange = (val: string) => {
    setSlug(val);
    setSlugManuallyEdited(true);
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const now = Date.now();
    if (now - lastSubmitRef.current < 1000) return;
    lastSubmitRef.current = now;
    if (mutexRef.current) return;
    mutexRef.current = true;
    setLoading(true);
    try {
      const baseSlug = slug || generateSlug(title);
      const rand = Math.random().toString(36).substring(2, 6);
      const finalSlug = `${baseSlug}-${rand}`;
      const { data: existing } = await (supabase.from('events').select('id').eq('slug', finalSlug).eq('user_id', user.id).maybeSingle() as any);
      if (existing) {
        toast({ title: 'Event already exists' });
        onOpenChange(false);
        onCreated(existing.id);
        return;
      }
      let coverUrl: string | null = null;
      if (coverFile) {
        const ext = coverFile.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('event-covers').upload(path, coverFile);
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('event-covers').getPublicUrl(path);
          coverUrl = publicUrl;
        }
      }
      const { data: inserted, error } = await (supabase.from('events').insert({
        user_id: user.id, name: title, slug: finalSlug,
        event_date: date || new Date().toISOString().split('T')[0],
        location: location || null, cover_url: coverUrl,
        gallery_pin: password || null, gallery_layout: galleryLayout,
        downloads_enabled: downloadsEnabled,
      } as any).select('id').single() as any);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Your gallery is ready' });
        setTitle(''); setDate(''); setLocation(''); setSlug('');
        setSlugManuallyEdited(false); setPassword(''); setCoverFile(null);
        setGalleryLayout('classic'); setDownloadsEnabled(true); setShowAdvanced(false);
        onOpenChange(false);
        onCreated(inserted.id);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Something went wrong', variant: 'destructive' });
    } finally {
      setLoading(false);
      mutexRef.current = false;
    }
  }, [user, title, slug, date, location, coverFile, password, galleryLayout, downloadsEnabled, toast, onOpenChange, onCreated]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          background: "var(--paper, #FAFAF8)",
          border: "1px solid var(--rule)",
          borderRadius: 0,
          padding: 28,
          boxShadow: "0 8px 48px rgba(0,0,0,0.18)",
          maxWidth: 440,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <DialogHeader>
          <DialogTitle
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 24,
              fontWeight: 300,
              fontStyle: "italic",
              color: "var(--ink)",
              letterSpacing: "-0.01em",
            }}
          >
            New Event
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
              placeholder="Aisha & Rahul Wedding"
              autoFocus
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(184,149,63,0.6)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(17,17,17,0.2)")}
            />
          </div>

          <div>
            <label style={labelStyle}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(184,149,63,0.6)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(17,17,17,0.2)")}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              fontWeight: 300,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--ink-muted)",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ChevronDown size={12} style={{ transform: showAdvanced ? "rotate(180deg)" : "none", transition: "transform 200ms" }} />
            {showAdvanced ? "Hide options" : "More options"}
          </button>

          {showAdvanced && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Location</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Mumbai, India" style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(184,149,63,0.6)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(17,17,17,0.2)")} />
              </div>
              <div>
                <label style={labelStyle}>Slug</label>
                <input value={slug} onChange={(e) => handleSlugChange(e.target.value)} placeholder="aisha-rahul-wedding" style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(184,149,63,0.6)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(17,17,17,0.2)")} />
              </div>
              <div>
                <label style={labelStyle}>Cover</label>
                <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Privacy PIN</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="4-digit PIN" maxLength={6} style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(184,149,63,0.6)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(17,17,17,0.2)")} />
              </div>

              <div>
                <label style={labelStyle}>Gallery Layout</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 8 }}>
                  {LAYOUT_OPTIONS.map(({ value, label }) => {
                    const selected = galleryLayout === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setGalleryLayout(value)}
                        style={{
                          position: "relative",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 6,
                          padding: 8,
                          border: selected ? "1px solid #B8953F" : "1px solid rgba(17,17,17,0.15)",
                          background: "transparent",
                          cursor: "pointer",
                          minHeight: 80,
                        }}
                      >
                        {selected && (
                          <div style={{ position: "absolute", top: -6, right: -6, width: 16, height: 16, background: "#B8953F", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Check size={10} style={{ color: "#FAFAF8" }} />
                          </div>
                        )}
                        <div style={{ width: 40, height: 40, color: selected ? "#B8953F" : "rgba(17,17,17,0.4)" }}>
                          <LayoutWireframe type={value} />
                        </div>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 8, fontWeight: 300, letterSpacing: "0.12em", textTransform: "uppercase", color: selected ? "#B8953F" : "var(--ink-muted)" }}>
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--rule)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                <label style={labelStyle}>Downloads</label>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 300, color: "var(--ink)" }}>Allow guests to download</span>
                  <Switch checked={downloadsEnabled} onCheckedChange={setDownloadsEnabled} />
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--rule)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                <label style={labelStyle}>Delivery</label>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 300, color: "var(--ink)", display: "block" }}>Smart Compression</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 300, color: "var(--ink-muted)" }}>
                      {optimizedUpload ? "Faster delivery, no visible quality loss" : "Original files preserved for print"}
                    </span>
                  </div>
                  <Switch checked={optimizedUpload} onCheckedChange={setOptimizedUpload} />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              border: "1px solid #B8953F",
              background: "transparent",
              color: "#111111",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              fontWeight: 300,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "12px 20px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              width: "100%",
              marginTop: 4,
            }}
          >
            {loading ? "Creating…" : "Create Event"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
                                               }
