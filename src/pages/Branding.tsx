import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, X, Loader2, Instagram, Globe, MessageCircle, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const FONT_STYLES = [
  { value: 'serif', label: 'Serif (Cormorant Garamond)' },
  { value: 'sans', label: 'Sans-serif (Inter)' },
];

const Branding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [studioName, setStudioName] = useState('');
  const [tagline, setTagline] = useState('');
  const [bio, setBio] = useState('');
  const [accentColor, setAccentColor] = useState('#b08d57');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [footerText, setFooterText] = useState('');
  const [fontStyle, setFontStyle] = useState('serif');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: profile } = await (supabase.from('profiles').select('studio_name, studio_logo_url, studio_accent_color, email') as any).eq('user_id', user.id).maybeSingle();
      const { data: studio } = await (supabase.from('studio_profiles').select('*') as any).eq('user_id', user.id).maybeSingle();
      if (profile) {
        setStudioName(profile.studio_name || '');
        setLogoUrl(profile.studio_logo_url || null);
        setAccentColor(profile.studio_accent_color || '#b08d57');
        setEmail(profile.email || '');
      }
      if (studio) {
        setBio(studio.bio || '');
        setCoverUrl(studio.cover_url || null);
        setTagline(studio.display_name || '');
        setInstagram(studio.instagram || '');
        setWebsite(studio.website || '');
        setWhatsapp(studio.whatsapp || '');
        setFooterText(studio.footer_text || '');
        setFontStyle(studio.font_style || 'serif');
        setUsername(studio.username || '');
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const uploadFile = async (file: File, path: string) => {
    const { error } = await supabase.storage.from('event-covers').upload(path, file, { upsert: true });
    if (error) throw error;
    return supabase.storage.from('event-covers').getPublicUrl(path).data.publicUrl;
  };

  const handleLogoUpload = async (file: File) => {
    if (!user) return;
    setLogoUploading(true);
    try {
      const url = await uploadFile(file, `studio-logos/${user.id}/logo.${file.name.split('.').pop()}`);
      await (supabase.from('profiles').update({ studio_logo_url: url } as any) as any).eq('user_id', user.id);
      setLogoUrl(url);
      toast.success('Logo uploaded');
    } catch (e: any) { toast.error(e.message); }
    setLogoUploading(false);
  };

  const handleCoverUpload = async (file: File) => {
    if (!user) return;
    setCoverUploading(true);
    try {
      const url = await uploadFile(file, `studio-covers/${user.id}/cover.${file.name.split('.').pop()}`);
      const { data: existing } = await (supabase.from('studio_profiles').select('id') as any).eq('user_id', user.id).maybeSingle();
      if (existing) {
        await (supabase.from('studio_profiles').update({ cover_url: url } as any) as any).eq('user_id', user.id);
      } else {
        await (supabase.from('studio_profiles').insert({ user_id: user.id, cover_url: url } as any) as any);
      }
      setCoverUrl(url);
      toast.success('Cover uploaded');
    } catch (e: any) { toast.error(e.message); }
    setCoverUploading(false);
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    await (supabase.from('profiles').update({ studio_name: studioName, studio_accent_color: accentColor } as any) as any).eq('user_id', user.id);
    const studioData = { bio, display_name: tagline, instagram: instagram || null, website: website || null, whatsapp: whatsapp || null, footer_text: footerText || null, font_style: fontStyle, username: username || null };
    const { data: existing } = await (supabase.from('studio_profiles').select('id') as any).eq('user_id', user.id).single();
    if (existing) {
      await (supabase.from('studio_profiles').update(studioData as any) as any).eq('user_id', user.id);
    } else {
      await (supabase.from('studio_profiles').insert({ user_id: user.id, ...studioData } as any) as any);
    }
    toast.success('Branding saved');
    setSaving(false);
  };

  if (loading) return <DashboardLayout><Skeleton className="h-96" /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-2xl font-semibold text-foreground">Brand Studio</h1>
        <Button onClick={() => navigate('/dashboard/branding/editor')} variant="outline" size="sm" className="text-[11px] uppercase tracking-wider h-9">
          Mobile Editor
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Form */}
        <div className="space-y-8">
          {/* Studio Identity */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60 font-medium mb-4">STUDIO IDENTITY</p>
            <div className="space-y-4">
              <div><label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Studio Name</label><Input value={studioName} onChange={(e) => setStudioName(e.target.value)} className="mt-1 bg-card" /></div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Portfolio Username</label>
                <Input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))} placeholder="yourstudio" className="mt-1 bg-card" />
                {username && (
                  <p className="text-[10px] text-muted-foreground/50 mt-1">
                    Your public portfolio: <span className="text-foreground/70 font-medium">{window.location.origin}/p/{username}</span>
                  </p>
                )}
              </div>
              <div><label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Tagline</label><Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Reflections of Your Moments" className="mt-1 bg-card" /></div>
              <div><label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">About / Bio</label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1 bg-card min-h-[100px]" placeholder="Tell your story..." /></div>
              <div><label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Footer Text</label><Input value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="Fine art wedding photography" className="mt-1 bg-card" /></div>
            </div>
          </div>

          {/* Contact & Social */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60 font-medium mb-4">CONTACT & SOCIAL</p>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Instagram className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@yourstudio" className="bg-card" />
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="www.yourstudio.com" className="bg-card" />
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+1234567890" className="bg-card" />
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hello@studio.com" className="bg-card" />
              </div>
            </div>
          </div>

          {/* Visual Identity */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60 font-medium mb-4">VISUAL IDENTITY</p>
            <div className="space-y-4">
              {/* Logo */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Studio Logo</label>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ''; }} />
                {logoUrl ? (
                  <div className="mt-2 space-y-2">
                    <img src={logoUrl} alt="Logo" className="h-20 w-auto object-contain border border-border rounded p-2 bg-background" />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => logoRef.current?.click()} disabled={logoUploading} className="text-[10px] h-7">
                        {logoUploading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />} Replace
                      </Button>
                      <Button variant="ghost" size="sm" className="text-[10px] h-7 text-destructive" onClick={async () => {
                        await (supabase.from('profiles').update({ studio_logo_url: null } as any) as any).eq('user_id', user!.id);
                        setLogoUrl(null); toast.success('Logo removed');
                      }}><X className="mr-1 h-3 w-3" /> Remove</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => logoRef.current?.click()} disabled={logoUploading} className="mt-2 text-[10px] h-8">
                    {logoUploading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />} Upload Logo
                  </Button>
                )}
              </div>

              {/* Cover */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Studio Cover Photo</label>
                <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); e.target.value = ''; }} />
                {coverUrl ? (
                  <div className="mt-2 space-y-2">
                    <img src={coverUrl} alt="Cover" className="w-full aspect-[16/9] object-cover border border-border rounded" />
                    <Button variant="outline" size="sm" onClick={() => coverRef.current?.click()} disabled={coverUploading} className="text-[10px] h-7">
                      {coverUploading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />} Replace Cover
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => coverRef.current?.click()} disabled={coverUploading} className="mt-2 text-[10px] h-8">
                    {coverUploading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />} Upload Cover
                  </Button>
                )}
              </div>

              {/* Accent color */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Brand Accent Color</label>
                <div className="flex items-center gap-3 mt-2">
                  <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="h-10 w-10 rounded border border-border cursor-pointer" />
                  <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-28 bg-card text-[13px]" />
                </div>
              </div>

              {/* Font Style */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Font Style</label>
                <Select value={fontStyle} onValueChange={setFontStyle}>
                  <SelectTrigger className="mt-1 bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FONT_STYLES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button onClick={save} disabled={saving} className="w-full bg-primary hover:bg-gold-hover text-primary-foreground text-[11px] uppercase tracking-wider">
            {saving ? 'Saving...' : 'Save Branding'}
          </Button>
        </div>

        {/* Live Preview */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60 font-medium mb-4">LIVE PREVIEW</p>
          <div className="border border-border rounded-xl overflow-hidden bg-card">
            {/* Mock hero */}
            <div className="relative aspect-[16/9] bg-secondary overflow-hidden">
              {coverUrl ? <img src={coverUrl} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-to-br from-secondary to-muted" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-5">
                {logoUrl ? <img src={logoUrl} className="h-8 mb-2" /> : <p className="font-display italic text-white text-sm mb-1">{studioName || 'Studio Name'}</p>}
                <p className="text-white/60 text-[10px]">{tagline || 'Your tagline here'}</p>
              </div>
            </div>
            {/* Mock nav */}
            <div className="p-3 flex items-center gap-3 border-t border-border">
              <span className="text-[11px] font-medium" style={{ color: accentColor }}>Gallery</span>
              <span className="text-[11px] text-muted-foreground">About</span>
              <span className="text-[11px] text-muted-foreground">Contact</span>
              <div className="ml-auto flex items-center gap-2">
                {instagram && <Instagram className="h-3 w-3 text-muted-foreground/40" />}
                {website && <Globe className="h-3 w-3 text-muted-foreground/40" />}
                <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ backgroundColor: accentColor }}>
                  <span className="text-white text-[10px]">♥</span>
                </div>
              </div>
            </div>
            {/* Mock footer */}
            <div className="px-3 py-4 border-t border-border text-center space-y-1">
              <p className="text-[10px] text-muted-foreground/50">© {new Date().getFullYear()} {studioName || 'Studio'}</p>
              {footerText && <p className="text-[9px] text-muted-foreground/30">{footerText}</p>}
              <p className="text-[8px] text-muted-foreground/20 tracking-wider uppercase">Powered by MirrorAI</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Branding;
