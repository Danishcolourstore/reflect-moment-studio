import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, X, Loader2, Instagram, Globe, MessageCircle, Mail, ExternalLink, Camera, Type, Droplets, FolderOpen, Link2, Copy } from 'lucide-react';
import { getStudioUrl, getStudioDisplayUrl } from '@/lib/studio-url';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BrandTypography, { BRAND_PRESETS, type BrandPreset } from '@/components/brand/BrandTypography';
import BrandWatermark from '@/components/brand/BrandWatermark';
import BrandAssets, { type BrandAsset } from '@/components/brand/BrandAssets';
import { WebsiteTemplateSelector } from '@/components/brand-editor/WebsiteTemplateSelector';
import { StudioLivePreview } from '@/components/brand-editor/StudioLivePreview';
import { type WebsiteTemplateValue } from '@/lib/website-templates';

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
  const [feedEvents, setFeedEvents] = useState<{ id: string; name: string; cover_url: string | null; photo_count: number }[]>([]);
  const [feedThumbs, setFeedThumbs] = useState<Record<string, string>>({});

  // New brand fields
  const [headingFont, setHeadingFont] = useState('Cormorant Garamond');
  const [bodyFont, setBodyFont] = useState('Jost');
  const [brandPreset, setBrandPreset] = useState('editorial-vogue');
  const [customDomain, setCustomDomain] = useState('');
  const [watermarkUrl, setWatermarkUrl] = useState<string | null>(null);
  const [watermarkOpacity, setWatermarkOpacity] = useState(20);
  const [watermarkPosition, setWatermarkPosition] = useState('bottom-right');
  const [watermarkUploading, setWatermarkUploading] = useState(false);
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([]);
  const [websiteTemplate, setWebsiteTemplate] = useState<WebsiteTemplateValue>('dark-portfolio');
  const [sectionOrder, setSectionOrder] = useState<string[]>(['hero', 'social', 'portfolio', 'albums', 'about', 'featured', 'services', 'testimonials', 'contact']);
  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>({ hero: true, social: true, portfolio: true, albums: false, about: true, featured: true, services: false, testimonials: false, contact: true });
  const [servicesData, setServicesData] = useState<any[]>([]);
  const [testimonialsData, setTestimonialsData] = useState<any[]>([]);
  const [featuredGalleryIds, setFeaturedGalleryIds] = useState<string[]>([]);
  const [portfolioLayout, setPortfolioLayout] = useState<'grid' | 'masonry' | 'large'>('grid');

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
        // New fields
        setHeadingFont(studio.heading_font || 'Cormorant Garamond');
        setBodyFont(studio.body_font || 'Jost');
        setBrandPreset(studio.brand_preset || 'editorial-vogue');
        setCustomDomain(studio.custom_domain || '');
        setWatermarkUrl(studio.watermark_logo_url || null);
        setWatermarkOpacity(studio.watermark_opacity ?? 20);
        setWatermarkPosition(studio.watermark_position || 'bottom-right');
        setBrandAssets((studio.brand_assets as BrandAsset[]) || []);
      }

      const { data: evData } = await (supabase.from('events')
        .select('id, name, cover_url, photo_count') as any)
        .eq('user_id', user.id)
        .eq('is_published', true)
        .eq('feed_visible', true)
        .order('event_date', { ascending: false })
        .limit(4);
      const typedEv = (evData || []) as { id: string; name: string; cover_url: string | null; photo_count: number }[];
      setFeedEvents(typedEv);

      const noCover = typedEv.filter(e => !e.cover_url);
      if (noCover.length > 0) {
        const thumbs: Record<string, string> = {};
        for (const ev of noCover) {
          const { data: p } = await (supabase.from('photos').select('url') as any).eq('event_id', ev.id).limit(1);
          if (p?.[0]?.url) thumbs[ev.id] = p[0].url;
        }
        setFeedThumbs(thumbs);
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

  const handleWatermarkUpload = async (file: File) => {
    if (!user) return;
    setWatermarkUploading(true);
    try {
      const url = await uploadFile(file, `brand-assets/${user.id}/watermark.${file.name.split('.').pop()}`);
      setWatermarkUrl(url);
      toast.success('Watermark uploaded');
    } catch (e: any) { toast.error(e.message); }
    setWatermarkUploading(false);
  };

  const handlePresetChange = (preset: BrandPreset) => {
    setBrandPreset(preset.id);
    setHeadingFont(preset.headingFont);
    setBodyFont(preset.bodyFont);
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    await (supabase.from('profiles').update({ studio_name: studioName, studio_accent_color: accentColor } as any) as any).eq('user_id', user.id);
    const studioData = {
      bio, display_name: tagline, instagram: instagram || null, website: website || null,
      whatsapp: whatsapp || null, footer_text: footerText || null, font_style: fontStyle,
      username: username || null, heading_font: headingFont, body_font: bodyFont,
      brand_preset: brandPreset, custom_domain: customDomain || null,
      watermark_logo_url: watermarkUrl, watermark_opacity: watermarkOpacity,
      watermark_position: watermarkPosition, brand_assets: brandAssets,
    };
    const { data: existing } = await (supabase.from('studio_profiles').select('id') as any).eq('user_id', user.id).maybeSingle();
    if (existing) {
      await (supabase.from('studio_profiles').update(studioData as any) as any).eq('user_id', user.id);
    } else {
      await (supabase.from('studio_profiles').insert({ user_id: user.id, ...studioData } as any) as any);
    }
    toast.success('Brand Studio saved');
    setSaving(false);
  };

  if (loading) return <DashboardLayout><Skeleton className="h-96" /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-semibold text-foreground">Brand Studio</h1>
        <Button onClick={() => navigate('/dashboard/branding/editor')} variant="outline" size="sm" className="text-[11px] uppercase tracking-wider h-9">
          Mobile Editor
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Main Content */}
        <div>
          <Tabs defaultValue="identity" className="w-full">
            <TabsList className="w-full justify-start bg-card border border-border rounded-xl h-11 p-1 mb-6">
              <TabsTrigger value="identity" className="text-[11px] uppercase tracking-wider data-[state=active]:bg-background">Identity</TabsTrigger>
              <TabsTrigger value="typography" className="text-[11px] uppercase tracking-wider data-[state=active]:bg-background">
                <Type className="h-3 w-3 mr-1" /> Typography
              </TabsTrigger>
              <TabsTrigger value="watermark" className="text-[11px] uppercase tracking-wider data-[state=active]:bg-background">
                <Droplets className="h-3 w-3 mr-1" /> Watermark
              </TabsTrigger>
              <TabsTrigger value="assets" className="text-[11px] uppercase tracking-wider data-[state=active]:bg-background">
                <FolderOpen className="h-3 w-3 mr-1" /> Assets
              </TabsTrigger>
              <TabsTrigger value="domain" className="text-[11px] uppercase tracking-wider data-[state=active]:bg-background">
                <Link2 className="h-3 w-3 mr-1" /> Domain
              </TabsTrigger>
            </TabsList>

            {/* ── IDENTITY TAB ── */}
            <TabsContent value="identity" className="space-y-8">
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
                        Your studio page: <span className="text-foreground/70 font-medium">{getStudioDisplayUrl(username)}</span>
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
                  <div className="flex items-center gap-2"><Instagram className="h-4 w-4 text-muted-foreground/40 shrink-0" /><Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@yourstudio" className="bg-card" /></div>
                  <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground/40 shrink-0" /><Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="www.yourstudio.com" className="bg-card" /></div>
                  <div className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" /><Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+1234567890" className="bg-card" /></div>
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground/40 shrink-0" /><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hello@studio.com" className="bg-card" /></div>
                </div>
              </div>

              {/* Visual Identity */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60 font-medium mb-4">VISUAL IDENTITY</p>
                <div className="space-y-4">
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

                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Brand Accent Color</label>
                    <div className="flex items-center gap-3 mt-2">
                      <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="h-10 w-10 rounded border border-border cursor-pointer" />
                      <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-28 bg-card text-[13px]" />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── TYPOGRAPHY TAB ── */}
            <TabsContent value="typography">
              <BrandTypography
                headingFont={headingFont}
                bodyFont={bodyFont}
                activePreset={brandPreset}
                onHeadingFontChange={setHeadingFont}
                onBodyFontChange={setBodyFont}
                onPresetChange={handlePresetChange}
              />
            </TabsContent>

            {/* ── WATERMARK TAB ── */}
            <TabsContent value="watermark">
              <BrandWatermark
                watermarkUrl={watermarkUrl}
                opacity={watermarkOpacity}
                position={watermarkPosition}
                studioName={studioName}
                onUpload={handleWatermarkUpload}
                onRemove={() => setWatermarkUrl(null)}
                onOpacityChange={setWatermarkOpacity}
                onPositionChange={setWatermarkPosition}
                uploading={watermarkUploading}
              />
            </TabsContent>

            {/* ── ASSETS TAB ── */}
            <TabsContent value="assets">
              {user && (
                <BrandAssets
                  userId={user.id}
                  assets={brandAssets}
                  onAssetsChange={setBrandAssets}
                />
              )}
            </TabsContent>

            {/* ── DOMAIN TAB ── */}
            <TabsContent value="domain" className="space-y-6">
              {/* Studio URL */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60 font-medium mb-4">STUDIO URL</p>
                {username ? (
                  <div className="border border-border rounded-xl p-5 bg-card/50 space-y-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/40 font-medium mb-1">Your Studio Page</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-foreground font-medium">{getStudioDisplayUrl(username)}</p>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                          navigator.clipboard.writeText(getStudioUrl(username));
                          toast.success('Studio link copied!');
                        }}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
                      Share this link on Instagram bio, WhatsApp, Google Business, or anywhere to showcase your portfolio.
                    </p>
                  </div>
                ) : (
                  <div className="border border-dashed border-border rounded-xl p-5 text-center">
                    <p className="text-sm text-muted-foreground/50">Set a portfolio username in the Identity tab to get your studio URL.</p>
                  </div>
                )}
              </div>

              {/* Custom Domain */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60 font-medium mb-4">CUSTOM DOMAIN</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Your Domain</label>
                    <Input
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ''))}
                      placeholder="www.yourstudio.com"
                      className="mt-1 bg-card"
                    />
                  </div>
                  {customDomain && (
                    <div className="border border-border rounded-xl p-5 bg-card/50 space-y-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/40 font-medium mb-1">DNS CONFIGURATION</p>
                        <p className="text-[10px] text-muted-foreground/50 mb-3">
                          Add these records at your domain registrar to connect your custom domain:
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-start gap-3 p-3 bg-background rounded-lg border border-border">
                            <div className="shrink-0 w-12 text-center">
                              <span className="text-[9px] uppercase tracking-wider font-medium text-muted-foreground/60 bg-muted px-2 py-0.5 rounded">A</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-muted-foreground/50">Name: <span className="text-foreground font-mono">@</span></p>
                              <p className="text-[10px] text-muted-foreground/50">Value: <span className="text-foreground font-mono">185.158.133.1</span></p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-background rounded-lg border border-border">
                            <div className="shrink-0 w-12 text-center">
                              <span className="text-[9px] uppercase tracking-wider font-medium text-muted-foreground/60 bg-muted px-2 py-0.5 rounded">A</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-muted-foreground/50">Name: <span className="text-foreground font-mono">www</span></p>
                              <p className="text-[10px] text-muted-foreground/50">Value: <span className="text-foreground font-mono">185.158.133.1</span></p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                        <p className="text-[10px] text-primary/70 leading-relaxed">
                          After adding DNS records, connect your domain in Project Settings → Domains. SSL will be provisioned automatically. DNS propagation may take up to 72 hours.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SEO Preview */}
              {username && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60 font-medium mb-4">SOCIAL SHARE PREVIEW</p>
                  <div className="border border-border rounded-xl overflow-hidden bg-card/50">
                    <div className="aspect-[1.91/1] relative overflow-hidden" style={{ backgroundColor: '#111' }}>
                      {coverUrl ? (
                        <img src={coverUrl} alt="" className="h-full w-full object-cover opacity-80" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <p className="text-muted-foreground/20 text-sm">Add a cover photo for social preview</p>
                        </div>
                      )}
                    </div>
                    <div className="p-3 border-t border-border">
                      <p className="text-[10px] text-muted-foreground/40 truncate">{customDomain || getStudioDisplayUrl(username)}</p>
                      <p className="text-sm font-medium text-foreground mt-0.5">{studioName || 'Studio Name'} — Photography</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-0.5 line-clamp-2">{bio || tagline || 'Professional photography portfolio'}</p>
                    </div>
                  </div>
                  <p className="text-[9px] text-muted-foreground/40 mt-2">
                    This is how your studio link will appear when shared on WhatsApp, Instagram, Facebook, etc.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <Button onClick={save} disabled={saving} className="w-full mt-6 bg-primary hover:bg-gold-hover text-primary-foreground text-[11px] uppercase tracking-wider">
            {saving ? 'Saving...' : 'Save Brand Studio'}
          </Button>
        </div>

        {/* ── LIVE PREVIEW SIDEBAR ── */}
        <div className="hidden lg:block">
          <div className="sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60 font-medium">LIVE PREVIEW</p>
              {username && (
                <Button variant="ghost" size="sm" className="text-[10px] h-7 gap-1" onClick={() => navigate(`/studio/${username}`)}>
                  <ExternalLink className="h-3 w-3" /> Open Gallery
                </Button>
              )}
            </div>
            <div
              className="border border-border rounded-xl overflow-hidden shadow-lg cursor-pointer transition-shadow hover:shadow-xl active:scale-[0.995] transition-transform"
              style={{ backgroundColor: '#0C0B08' }}
              onClick={() => {
                if (username) navigate(`/studio/${username}`);
                else toast.info('Set a portfolio username first to preview your gallery.');
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' && username) navigate(`/studio/${username}`); }}
            >
              {/* Hero */}
              <div className="relative aspect-[16/9] overflow-hidden">
                {coverUrl ? (
                  <img src={coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="h-full w-full" style={{ backgroundColor: '#131109' }} />
                )}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0C0B08 0%, rgba(12,11,8,0.4) 50%, rgba(12,11,8,0.6) 100%)' }} />
                <div className="absolute bottom-4 left-5 right-5 z-10">
                  {logoUrl ? (
                    <img src={logoUrl} alt="" className="h-8 object-contain mb-2 opacity-90" loading="lazy" />
                  ) : (
                    <p className="text-sm font-light text-white/90" style={{ fontFamily: `'${headingFont}', serif` }}>
                      {studioName || 'Studio Name'}
                    </p>
                  )}
                  <p className="text-[10px] mt-1" style={{ color: '#A6A197', fontFamily: `'${bodyFont}', sans-serif` }}>{tagline || 'Your tagline here'}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {instagram && (
                      <span className="flex items-center gap-1 text-[9px]" style={{ color: accentColor }}>
                        <Instagram className="h-3 w-3" /> {instagram}
                      </span>
                    )}
                    {website && (
                      <span className="flex items-center gap-1 text-[9px]" style={{ color: accentColor }}>
                        <Globe className="h-3 w-3" /> Website
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Typography preview bar */}
              <div className="px-4 py-2 border-t border-white/5">
                <p className="text-[8px] uppercase tracking-[0.2em] text-white/20 mb-1">Typography</p>
                <p className="text-[11px] text-white/70" style={{ fontFamily: `'${headingFont}', serif` }}>{headingFont}</p>
                <p className="text-[9px] text-white/40" style={{ fontFamily: `'${bodyFont}', sans-serif` }}>{bodyFont}</p>
              </div>

              {/* Portfolio label */}
              <div className="text-center py-3">
                <div className="w-6 h-[1px] mx-auto mb-2" style={{ backgroundColor: accentColor }} />
                <p className="text-[9px] tracking-[0.25em] uppercase" style={{ color: '#A6A197', fontFamily: `'${bodyFont}', sans-serif` }}>
                  Portfolio · {feedEvents.length} {feedEvents.length === 1 ? 'shoot' : 'shoots'}
                </p>
              </div>

              {/* Event grid */}
              {feedEvents.length > 0 ? (
                <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                  {feedEvents.map(ev => {
                    const thumb = ev.cover_url || feedThumbs[ev.id] || null;
                    return (
                      <div key={ev.id} className="relative aspect-[4/3] overflow-hidden" style={{ borderRadius: '3px', backgroundColor: '#17140D' }}>
                        {thumb ? (
                          <img src={thumb} alt={ev.name} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Camera className="h-5 w-5" style={{ color: '#A6A197', opacity: 0.2 }} />
                          </div>
                        )}
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(12,11,8,0.75) 0%, transparent 60%)' }} />
                        <div className="absolute bottom-1.5 left-2 right-2">
                          <p className="text-[9px] font-light text-white/90 truncate" style={{ fontFamily: `'${headingFont}', serif` }}>{ev.name}</p>
                          {ev.photo_count > 0 && (
                            <p className="text-[8px] mt-0.5" style={{ color: accentColor, opacity: 0.7 }}>{ev.photo_count} photos</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-3 pb-4 text-center">
                  <Camera className="mx-auto h-6 w-6 mb-2" style={{ color: '#A6A197', opacity: 0.2 }} />
                  <p className="text-[9px]" style={{ color: '#A6A197' }}>No public shoots yet</p>
                  <p className="text-[8px] mt-1" style={{ color: '#A6A197', opacity: 0.5 }}>Mark events as "Show in Feed" to see them here</p>
                </div>
              )}

              {/* Footer */}
              <div className="py-3 text-center border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-[9px] text-muted-foreground/40">© {new Date().getFullYear()} {studioName || 'Studio'}</p>
                {footerText && <p className="text-[8px] mt-0.5" style={{ color: '#A6A197', opacity: 0.3 }}>{footerText}</p>}
                <p className="text-[7px] mt-1 tracking-[0.2em] uppercase" style={{ color: '#A6A197', opacity: 0.2 }}>Powered by MirrorAI</p>
              </div>
            </div>
            {!username && (
              <p className="text-[9px] text-muted-foreground/40 mt-2 text-center">
                Set a portfolio username above to enable the live preview link
              </p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Branding;
