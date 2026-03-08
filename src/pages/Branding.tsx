import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Globe, ExternalLink, Sparkles, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { WEBSITE_TEMPLATES, type WebsiteTemplateValue } from '@/lib/website-templates';
import { getStudioDisplayUrl } from '@/lib/studio-url';

const Branding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<WebsiteTemplateValue>('vows-elegance');
  const [username, setUsername] = useState('');
  const [hasStudio, setHasStudio] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: studio } = await (supabase.from('studio_profiles').select('website_template, username') as any)
        .eq('user_id', user.id).maybeSingle();
      if (studio) {
        setSelectedTemplate((studio.website_template as WebsiteTemplateValue) || 'vows-elegance');
        setUsername(studio.username || '');
        setHasStudio(true);
      }
      setLoading(false);
    })();
  }, [user]);

  const handleUseTemplate = async (tmplValue: WebsiteTemplateValue) => {
    if (!user) return;
    setSelectedTemplate(tmplValue);

    // Save template choice then navigate to editor
    const { data: existing } = await (supabase.from('studio_profiles').select('id') as any)
      .eq('user_id', user.id).maybeSingle();
    if (existing) {
      await (supabase.from('studio_profiles').update({ website_template: tmplValue } as any) as any)
        .eq('user_id', user.id);
    } else {
      await (supabase.from('studio_profiles').insert({ user_id: user.id, website_template: tmplValue } as any) as any);
    }
    navigate('/dashboard/website-editor');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Skeleton className="h-96" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Brand Studio</h1>
          <p className="text-xs text-muted-foreground/50 mt-1">Choose a template and build your portfolio website</p>
        </div>
        <div className="flex items-center gap-2">
          {username && (
            <Button variant="ghost" size="sm" className="text-[10px] h-8 gap-1.5" onClick={() => window.open(`/studio/${username}`, '_blank')}>
              <ExternalLink className="h-3 w-3" /> View Live Site
            </Button>
          )}
          {hasStudio && (
            <Button size="sm" className="text-[10px] h-8 gap-1.5 bg-primary text-primary-foreground" onClick={() => navigate('/dashboard/website-editor')}>
              <Sparkles className="h-3 w-3" /> Open Editor
            </Button>
          )}
        </div>
      </div>

      {/* Active site info */}
      {username && (
        <div className="mb-6 p-3 rounded-lg border border-border bg-card/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Globe className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">Your Studio Website</p>
              <p className="text-[10px] text-muted-foreground/50">{getStudioDisplayUrl(username)}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="text-[10px] h-7" onClick={() => navigate('/dashboard/website-editor')}>
            Edit Website
          </Button>
        </div>
      )}

      {/* Template Gallery */}
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50 font-medium">CHOOSE A TEMPLATE</p>
        <p className="text-[11px] text-muted-foreground/30 mt-0.5">Select a template to start building. All your data auto-fills instantly.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {WEBSITE_TEMPLATES.map((tmpl) => {
          const isActive = selectedTemplate === tmpl.value;
          return (
            <div
              key={tmpl.value}
              className={`group relative rounded-xl border-2 overflow-hidden transition-all duration-300 ${
                isActive
                  ? 'border-primary ring-2 ring-primary/20 scale-[1.01]'
                  : 'border-border/40 hover:border-border hover:shadow-lg'
              }`}
            >
              {/* Template preview */}
              <div className="relative h-44 overflow-hidden" style={{ backgroundColor: tmpl.bg }}>
                {/* Simulated hero */}
                <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                  <p className="text-[8px] uppercase tracking-[0.3em] mb-2" style={{ color: tmpl.textSecondary, opacity: 0.5 }}>
                    Photography Studio
                  </p>
                  <p className="text-xl font-light tracking-wide" style={{ fontFamily: tmpl.fontFamily, color: tmpl.text }}>
                    Your Studio
                  </p>
                  <div className="mt-3 w-8 h-[1px]" style={{ backgroundColor: tmpl.textSecondary, opacity: 0.3 }} />
                  <p className="mt-3 text-[9px] tracking-wide" style={{ color: tmpl.textSecondary, opacity: 0.4 }}>
                    Reflections of Your Moments
                  </p>
                </div>

                {/* Simulated grid */}
                <div className="absolute bottom-3 left-4 right-4 flex gap-1.5">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex-1 aspect-square rounded" style={{ backgroundColor: tmpl.cardBg, opacity: 0.5 }} />
                  ))}
                </div>

                {/* Simulated footer */}
                <div className="absolute bottom-0 left-0 right-0 h-6" style={{ backgroundColor: tmpl.footerBg, opacity: 0.5 }} />

                {/* Active checkmark */}
                {isActive && (
                  <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <Check className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* Info + action */}
              <div className="p-4 bg-card border-t border-border/20">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{tmpl.label}</p>
                    <p className="text-[10px] text-muted-foreground/50 mt-0.5">{tmpl.description}</p>
                  </div>
                  {isActive && (
                    <span className="text-[9px] uppercase tracking-wider font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate(`/dashboard/template-preview?template=${tmpl.value}`)}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-[10px] uppercase tracking-wider h-9 gap-1.5"
                  >
                    <Eye className="h-3 w-3" /> Preview
                  </Button>
                  <Button
                    onClick={() => handleUseTemplate(tmpl.value as WebsiteTemplateValue)}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 text-[10px] uppercase tracking-wider h-9"
                  >
                    {isActive ? 'Edit Template' : 'Use Template'}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default Branding;
