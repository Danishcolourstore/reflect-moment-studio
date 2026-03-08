import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Monitor, Tablet, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type WebsiteTemplateValue } from '@/lib/website-templates';
import { useWebsiteTemplates } from '@/hooks/use-website-templates';
import { WebsiteHero } from '@/components/website/WebsiteHero';
import { WebsiteAbout } from '@/components/website/WebsiteAbout';
import { WebsitePhotoShowcase } from '@/components/website/WebsitePhotoShowcase';
import { WebsiteServices } from '@/components/website/WebsiteServices';
import { WebsiteContact } from '@/components/website/WebsiteContact';
import { WebsiteInstagramGrid } from '@/components/website/WebsiteInstagramGrid';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

type ViewMode = 'desktop' | 'tablet' | 'mobile';

export default function TemplatePreview() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: allTemplates = [] } = useWebsiteTemplates();
  const templateValue = (params.get('template') || '') as WebsiteTemplateValue;
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [choosing, setChoosing] = useState(false);

  const tmpl = useMemo(() => {
    if (!allTemplates.length) return null;
    return allTemplates.find((t) => t.value === templateValue) || allTemplates[0];
  }, [allTemplates, templateValue]);

  const demoImages = tmpl?.demoContent?.portfolio?.demo_images || [];
  const demoServices = tmpl?.demoContent?.services || [];

  const previewBranding = useMemo(() => {
    if (!tmpl) return null;
    return {
      studio_name: tmpl.label || 'Studio',
      studio_logo_url: null,
      studio_accent_color: tmpl.textSecondary,
      display_name: tmpl.demoContent?.hero?.tagline || 'Wedding Storytelling',
      cover_url: tmpl.demoContent?.hero?.image_url || null,
      about_image_url: tmpl.demoContent?.about?.profile_image_url || null,
      bio: tmpl.demoContent?.about?.bio || '',
      instagram: '@studio',
      website: '',
      whatsapp: '',
      email: 'hello@studio.com',
      footer_text: tmpl.demoContent?.footer?.text || '',
      hero_button_label: tmpl.demoContent?.hero?.button_text || 'View Portfolio',
      hero_button_url: '#portfolio',
    };
  }, [tmpl]);

  const handleUseTemplate = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!tmpl?.value) return;

    setChoosing(true);
    try {
      const { data: existing } = await (supabase.from('studio_profiles').select('id') as any)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await (supabase.from('studio_profiles').update({ website_template: tmpl.value } as any) as any)
          .eq('user_id', user.id);
      } else {
        await (supabase.from('studio_profiles').insert({ user_id: user.id, website_template: tmpl.value } as any) as any);
      }

      toast.success('Template selected successfully');
      navigate('/dashboard/website-editor');
    } catch {
      toast.error('Failed to select template');
    }
    setChoosing(false);
  };

  if (!tmpl || !previewBranding) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-sm text-muted-foreground">
        No templates available yet.
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card shrink-0 z-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/dashboard/branding')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <p className="text-xs font-semibold text-foreground">Website Preview</p>
        </div>

        <div className="flex items-center gap-1 bg-muted rounded-full p-0.5">
          {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as [ViewMode, any][]).map(([mode, Icon]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`p-1.5 rounded-full transition-colors ${
                viewMode === mode ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-[10px] h-8 gap-1.5" onClick={() => navigate('/dashboard/branding')}>
            <X className="h-3 w-3" /> Close
          </Button>
          <Button size="sm" className="text-[10px] h-8 gap-1.5" onClick={handleUseTemplate} disabled={choosing}>
            <Pencil className="h-3 w-3" />
            {choosing ? 'Setting up…' : 'Edit This Website'}
          </Button>
        </div>
      </header>

      <main className="flex-1 bg-muted/30 overflow-y-auto flex justify-center py-6 px-4">
        <div
          className={`transition-all duration-300 w-full ${
            viewMode === 'mobile' ? 'max-w-[375px]' : viewMode === 'tablet' ? 'max-w-[768px]' : 'max-w-[1400px]'
          }`}
        >
          <div className="rounded-2xl overflow-hidden border-2 shadow-2xl border-foreground/10" style={{ backgroundColor: tmpl.bg }}>
            <div className="flex items-center gap-1.5 px-3 py-2 border-b" style={{ backgroundColor: tmpl.navBg, borderColor: tmpl.navBorder }}>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-destructive/60" />
                <div className="w-2 h-2 rounded-full bg-accent/60" />
                <div className="w-2 h-2 rounded-full bg-primary/60" />
              </div>
              <div
                className="flex-1 text-center text-[9px] font-mono truncate px-2 py-0.5 rounded-md"
                style={{ backgroundColor: `${tmpl.text}08`, color: tmpl.textSecondary }}
              >
                mirrorai.gallery/studio/yourstudio
              </div>
            </div>

            <div style={{ backgroundColor: tmpl.bg, color: tmpl.text, fontFamily: tmpl.uiFontFamily }}>
              <WebsiteHero branding={previewBranding} template={tmpl.value} />
              <WebsitePhotoShowcase id="portfolio" photos={demoImages.map((url) => ({ url }))} accent={previewBranding.studio_accent_color || tmpl.textSecondary} template={tmpl.value} />
              <WebsiteAbout id="about" template={tmpl.value} branding={previewBranding} />
              <WebsiteServices id="services" services={demoServices} accent={previewBranding.studio_accent_color || tmpl.textSecondary} template={tmpl.value} />
              <WebsiteInstagramGrid id="instagram" photos={demoImages.slice(0, 5)} instagramHandle={previewBranding.instagram || '@studio'} accent={previewBranding.studio_accent_color || tmpl.textSecondary} template={tmpl.value} />
              <WebsiteContact
                id="contact"
                template={tmpl.value}
                branding={previewBranding}
                heading={tmpl.demoContent?.contact?.heading}
                buttonLabel={tmpl.demoContent?.contact?.button_text}
              />
              <WebsiteFooter template={tmpl.value} branding={previewBranding} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
