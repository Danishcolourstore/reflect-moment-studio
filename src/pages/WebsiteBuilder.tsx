import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useWebsiteTemplates } from '@/hooks/use-website-templates';
import { useGoogleFonts } from '@/hooks/use-google-fonts';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Globe,
  Loader2,
  Sparkles,
  Eye,
  Layout,
} from 'lucide-react';

/*──────────────────────────────────────────────
  Pixieset / Pic-Time–style Website Builder
  Template Gallery → Quick Setup → Editor
──────────────────────────────────────────────*/

export interface WebsiteProfile {
  studioName: string;
  city: string;
  specialty: string;
  aboutBio: string;
  selectedPhotos: string[];
  subdomain: string;
}

const SPECIALTIES = [
  'Wedding',
  'Portrait',
  'Pre-Wedding',
  'Event',
  'Fashion',
  'Maternity',
  'Commercial',
  'Travel',
];

const WebsiteBuilder = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: templates = [], isLoading: templatesLoading } = useWebsiteTemplates();

  const [step, setStep] = useState(0); // 0 = templates, 1 = quick setup
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  // Quick setup fields
  const [studioName, setStudioName] = useState('');
  const [city, setCity] = useState('');
  const [specialty, setSpecialty] = useState('Wedding');
  const [aboutBio, setAboutBio] = useState('');
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);

  // Load Google Font for selected template preview
  const selTmpl = templates.find(t => t.value === selectedTemplate);
  useGoogleFonts(selTmpl?.fontFamily, selTmpl?.uiFontFamily);

  // Check if user already has a website → redirect to editor
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase
        .from('studio_profiles')
        .select('username, website_template')
        .eq('user_id', user.id)
        .maybeSingle() as any);
      if (data?.website_template) {
        navigate('/dashboard/website-editor', { replace: true });
        return;
      }
      // Pre-fill studio name from profile
      const { data: profile } = await (supabase
        .from('profiles')
        .select('studio_name')
        .eq('user_id', user.id)
        .maybeSingle() as any);
      if (profile?.studio_name) setStudioName(profile.studio_name);
      setCheckingExisting(false);
    })();
  }, [user, navigate]);

  // Auto-generate username from studio name
  useEffect(() => {
    if (studioName.trim()) {
      setUsername(
        studioName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .slice(0, 30)
      );
    }
  }, [studioName]);

  const handleSelectTemplate = useCallback((slug: string) => {
    setSelectedTemplate(slug);
  }, []);

  const handleContinueToSetup = useCallback(() => {
    if (!selectedTemplate) {
      toast.error('Please select a template');
      return;
    }
    setStep(1);
  }, [selectedTemplate]);

  const handleLaunchWebsite = useCallback(async () => {
    if (!user) return;
    if (!studioName.trim()) {
      toast.error('Enter your studio name');
      return;
    }
    if (!username.trim()) {
      toast.error('Enter a portfolio URL');
      return;
    }

    setSaving(true);
    try {
      // Update profile
      await (supabase
        .from('profiles')
        .update({ studio_name: studioName } as any) as any)
        .eq('user_id', user.id);

      // Upsert studio_profiles with template + basic info
      const studioData = {
        user_id: user.id,
        username,
        website_template: selectedTemplate,
        bio: aboutBio || null,
        display_name: studioName,
        section_order: [
          'hero',
          'social',
          'portfolio',
          'about',
          'featured',
          'services',
          'testimonials',
          'contact',
        ],
        section_visibility: {
          hero: true,
          social: true,
          portfolio: true,
          about: true,
          featured: true,
          services: false,
          testimonials: false,
          contact: true,
        },
      };

      const { data: existing } = await (supabase
        .from('studio_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle() as any);

      if (existing) {
        await (supabase
          .from('studio_profiles')
          .update(studioData as any) as any)
          .eq('user_id', user.id);
      } else {
        await (supabase
          .from('studio_profiles')
          .insert(studioData as any) as any);
      }

      toast.success('Website created! Opening editor…');
      navigate('/dashboard/website-editor');
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong');
    }
    setSaving(false);
  }, [user, studioName, username, selectedTemplate, aboutBio, navigate]);

  if (!user || checkingExisting) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // STEP 0: Template Gallery (Pixieset-style)
  // ═══════════════════════════════════════════
  if (step === 0) {
    return (
      <div className="min-h-[100dvh] bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigate('/dashboard/branding')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-sm font-semibold text-foreground tracking-tight">
                  Choose a Template
                </h1>
                <p className="text-[10px] text-muted-foreground">
                  Pick your style. You can always change it later.
                </p>
              </div>
            </div>
            <Button
              onClick={handleContinueToSetup}
              disabled={!selectedTemplate}
              className="h-9 text-xs gap-1.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
            >
              Continue <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </header>

        {/* Template Grid */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {templatesLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-24">
              <Layout className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No templates available yet. Contact support.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((tmpl) => {
                const isSelected = selectedTemplate === tmpl.value;
                const isHovered = hoveredTemplate === tmpl.value;

                return (
                  <button
                    key={tmpl.value}
                    onClick={() => handleSelectTemplate(tmpl.value)}
                    onMouseEnter={() => setHoveredTemplate(tmpl.value)}
                    onMouseLeave={() => setHoveredTemplate(null)}
                    className={`group relative text-left rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                      isSelected
                        ? 'border-[hsl(var(--primary))] shadow-lg shadow-[hsl(var(--primary))]/10'
                        : 'border-border/50 hover:border-border'
                    }`}
                  >
                    {/* Template Preview */}
                    <div
                      className="aspect-[4/3] relative overflow-hidden"
                      style={{ backgroundColor: tmpl.bg }}
                    >
                      {tmpl.previewImageUrl ? (
                        <img
                          src={tmpl.previewImageUrl}
                          alt={tmpl.label}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        /* Stylized preview mockup */
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                          <div
                            className="text-center"
                            style={{ color: tmpl.text, fontFamily: tmpl.fontFamily }}
                          >
                            <p
                              className="text-[9px] uppercase tracking-[0.25em] mb-2 opacity-50"
                              style={{ fontFamily: tmpl.uiFontFamily }}
                            >
                              {tmpl.category}
                            </p>
                            <h3 className="text-xl font-light leading-tight mb-1">
                              Your Studio
                            </h3>
                            <p
                              className="text-[10px] opacity-40"
                              style={{ fontFamily: tmpl.uiFontFamily }}
                            >
                              Portfolio · Galleries · Contact
                            </p>
                          </div>
                          {/* Mini layout hint */}
                          <div className="mt-5 flex gap-1.5 opacity-20">
                            {[1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className="w-10 h-14 rounded"
                                style={{
                                  backgroundColor: tmpl.text,
                                  opacity: 0.15,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Selected checkmark */}
                      {isSelected && (
                        <div className="absolute top-3 right-3 h-7 w-7 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center shadow-lg z-10">
                          <Check className="h-4 w-4 text-[hsl(var(--primary-foreground))]" />
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div
                        className={`absolute inset-0 bg-black/0 transition-colors duration-300 ${
                          isHovered && !isSelected ? 'bg-black/10' : ''
                        }`}
                      />

                      {/* Preview button on hover */}
                      {isHovered && (
                        <div className="absolute bottom-3 left-3 right-3 flex justify-center z-10">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium bg-black/60 text-white px-3 py-1.5 rounded-full backdrop-blur-sm">
                            <Eye className="h-3 w-3" />
                            {isSelected ? 'Selected' : 'Click to select'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Template info */}
                    <div className="p-4 bg-card border-t border-border/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-foreground">
                            {tmpl.label}
                          </h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {tmpl.description || tmpl.category}
                          </p>
                        </div>
                        {/* Color swatch */}
                        <div className="flex gap-1">
                          <div
                            className="w-4 h-4 rounded-full border border-border/50"
                            style={{ backgroundColor: tmpl.bg }}
                            title="Background"
                          />
                          <div
                            className="w-4 h-4 rounded-full border border-border/50"
                            style={{ backgroundColor: tmpl.text }}
                            title="Text"
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Fixed bottom bar on mobile */}
        {selectedTemplate && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-card/95 backdrop-blur-sm border-t border-border sm:hidden z-40">
            <Button
              onClick={handleContinueToSetup}
              className="w-full h-12 text-sm bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
            >
              Continue with{' '}
              {templates.find((t) => t.value === selectedTemplate)?.label}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // STEP 1: Quick Setup
  // ═══════════════════════════════════════════
  const tmpl = templates.find((t) => t.value === selectedTemplate);

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setStep(0)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-sm font-semibold text-foreground tracking-tight">
                Quick Setup
              </h1>
              <p className="text-[10px] text-muted-foreground">
                Tell us about your studio — takes 30 seconds
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        {/* Left: Form */}
        <div className="flex-1 max-w-lg">
          <div className="space-y-5">
            {/* Studio Name */}
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium block mb-2">
                Studio Name *
              </label>
              <Input
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                placeholder="e.g. Lumière Studios"
                className="h-12 text-base bg-secondary/50 border-border/50"
              />
            </div>

            {/* City */}
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium block mb-2">
                City
              </label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Mumbai, Chennai, Delhi"
                className="h-12 text-base bg-secondary/50 border-border/50"
              />
            </div>

            {/* Specialty */}
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium block mb-2">
                Specialty
              </label>
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpecialty(s)}
                    className={`px-4 py-2.5 rounded-lg text-xs font-medium tracking-wide transition-all duration-200 min-h-[44px] ${
                      specialty === s
                        ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-md'
                        : 'bg-secondary/50 text-muted-foreground border border-border/50 hover:border-[hsl(var(--primary))]/30 hover:text-foreground'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium block mb-2">
                About / Bio{' '}
                <span className="text-muted-foreground/40">(optional)</span>
              </label>
              <Textarea
                value={aboutBio}
                onChange={(e) => setAboutBio(e.target.value)}
                placeholder="A few lines about your studio…"
                rows={3}
                className="text-base bg-secondary/50 border-border/50 resize-none"
              />
            </div>

            {/* Portfolio URL */}
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium block mb-2">
                Portfolio URL *
              </label>
              <div className="flex items-center gap-0 rounded-lg overflow-hidden border border-border/50 bg-secondary/50">
                <span className="px-3 text-xs text-muted-foreground bg-muted/50 h-12 flex items-center border-r border-border/30 whitespace-nowrap">
                  mirrorai.site/
                </span>
                <Input
                  value={username}
                  onChange={(e) =>
                    setUsername(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-_]/g, '')
                    )
                  }
                  placeholder="yourstudio"
                  className="h-12 text-base border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            {/* Launch button */}
            <Button
              onClick={handleLaunchWebsite}
              disabled={saving || !studioName.trim() || !username.trim()}
              className="w-full h-12 text-sm font-medium tracking-wide bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90 shadow-lg gap-2 mt-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Globe className="h-4 w-4" />
              )}
              {saving ? 'Creating…' : 'Create & Open Editor'}
            </Button>

            <p className="text-[10px] text-muted-foreground/40 text-center">
              You can customize everything in the editor after this step
            </p>
          </div>
        </div>

        {/* Right: Template Preview */}
        <div className="flex-1 hidden lg:block">
          <div className="sticky top-20">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium mb-3">
              Selected Template
            </p>
            {tmpl && (
              <div
                className="rounded-xl overflow-hidden border border-border/50 shadow-xl"
                style={{ backgroundColor: tmpl.bg }}
              >
                {/* Mini browser bar */}
                <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/10 border-b border-border/20">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-red-400/60" />
                    <div className="h-2 w-2 rounded-full bg-yellow-400/60" />
                    <div className="h-2 w-2 rounded-full bg-green-400/60" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-black/10 rounded px-2 py-0.5 text-[9px] text-center opacity-50" style={{ color: tmpl.text }}>
                      {username || 'yourstudio'}.mirrorai.site
                    </div>
                  </div>
                </div>

                {/* Preview content */}
                <div className="p-8 min-h-[400px]" style={{ color: tmpl.text }}>
                  {/* Nav */}
                  <div className="flex items-center justify-between mb-12" style={{ fontFamily: tmpl.uiFontFamily }}>
                    <span className="text-sm font-medium" style={{ fontFamily: tmpl.fontFamily }}>
                      {studioName || 'Your Studio'}
                    </span>
                    <div className="flex gap-4 text-[9px] uppercase tracking-[0.2em] opacity-40">
                      <span>Portfolio</span>
                      <span>About</span>
                      <span>Contact</span>
                    </div>
                  </div>

                  {/* Hero mock */}
                  <div className="text-center mb-10">
                    <p
                      className="text-[9px] uppercase tracking-[0.3em] opacity-40 mb-3"
                      style={{ fontFamily: tmpl.uiFontFamily }}
                    >
                      ✦ {specialty} Photography
                    </p>
                    <h2
                      className="text-2xl font-light leading-tight mb-3"
                      style={{ fontFamily: tmpl.fontFamily }}
                    >
                      {studioName || 'Your Studio Name'}
                    </h2>
                    <p
                      className="text-xs opacity-40 max-w-xs mx-auto"
                      style={{ fontFamily: tmpl.uiFontFamily }}
                    >
                      {city
                        ? `${specialty} photographer based in ${city}`
                        : 'Capturing your most extraordinary moments'}
                    </p>
                  </div>

                  {/* Grid mock */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="aspect-[4/5] rounded"
                        style={{
                          backgroundColor: tmpl.text,
                          opacity: 0.06,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setStep(0)}
              className="mt-3 text-[10px] text-[hsl(var(--primary))] hover:underline flex items-center gap-1 mx-auto"
            >
              <ArrowLeft className="h-3 w-3" /> Change template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebsiteBuilder;
