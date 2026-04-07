import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Globe, ExternalLink, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { templatePreviews } from '@/assets/templates';
type WebsiteTemplateValue = string;
const useWebsiteTemplates = () => ({ data: [] as any[] });
import { getStudioDisplayUrl } from '@/lib/studio-url';

const Branding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: templates = [] } = useWebsiteTemplates();
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
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 40 }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300, color: "hsl(48, 7%, 10%)", margin: 0, letterSpacing: "0.02em" }}>
            Website
          </h1>
          <div style={{ display: "flex", gap: 8 }}>
            {username && (
              <button
                onClick={() => window.open(`/studio/${username}`, '_blank')}
                style={{ background: "none", border: "1px solid hsl(37, 10%, 90%)", padding: "8px 16px", fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(35, 4%, 56%)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, minHeight: 44, transition: "border-color 0.2s" }}
              >
                <ExternalLink style={{ width: 14, height: 14 }} /> View Live
              </button>
            )}
            {hasStudio && (
              <button
                onClick={() => navigate('/dashboard/website-editor')}
                style={{ background: "hsl(48, 7%, 10%)", border: "none", padding: "8px 16px", fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(45, 14%, 97%)", cursor: "pointer", minHeight: 44, transition: "opacity 0.2s" }}
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {username && (
          <div style={{ marginBottom: 40, padding: 16, border: "1px solid hsl(37, 10%, 90%)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Globe style={{ width: 16, height: 16, color: "hsl(40, 52%, 48%)" }} strokeWidth={1.5} />
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "hsl(35, 4%, 56%)" }}>{getStudioDisplayUrl(username)}</p>
            </div>
          </div>
        )}

        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "hsl(35, 4%, 56%)", marginBottom: 16 }}>Choose a Style</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {templates.map((tmpl) => {
            const isActive = selectedTemplate === tmpl.value;
            return (
              <div
                key={tmpl.value}
                style={{ border: `1px solid ${isActive ? "hsl(40, 52%, 48%)" : "hsl(37, 10%, 90%)"}`, transition: "border-color 0.2s", overflow: "hidden" }}
              >
                <div style={{ height: 192, overflow: "hidden", backgroundColor: tmpl.bg, position: "relative" }}>
                  {templatePreviews[tmpl.value] ? (
                    <img src={templatePreviews[tmpl.value]} alt={tmpl.label} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", transition: "transform 0.4s ease" }} />
                  ) : (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <p style={{ fontFamily: tmpl.fontFamily, fontSize: 20, fontWeight: 300, color: tmpl.text }}>{tmpl.label}</p>
                    </div>
                  )}
                  {isActive && (
                    <div style={{ position: "absolute", top: 8, right: 8, width: 24, height: 24, borderRadius: "50%", background: "hsl(40, 52%, 48%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Check style={{ width: 14, height: 14, color: "hsl(45, 14%, 97%)" }} />
                    </div>
                  )}
                </div>
                <div style={{ padding: 16, borderTop: "1px solid hsl(37, 10%, 90%)" }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "hsl(48, 7%, 10%)", marginBottom: 16 }}>{tmpl.label}</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => navigate(`/dashboard/template-preview?template=${tmpl.value}`)}
                      style={{ flex: 1, background: "none", border: "1px solid hsl(37, 10%, 90%)", padding: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(35, 4%, 56%)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, minHeight: 40, transition: "border-color 0.2s" }}
                    >
                      <Eye style={{ width: 12, height: 12 }} /> Preview
                    </button>
                    <button
                      onClick={() => handleUseTemplate(tmpl.value as WebsiteTemplateValue)}
                      style={{ flex: 1, background: isActive ? "hsl(48, 7%, 10%)" : "none", border: isActive ? "none" : "1px solid hsl(37, 10%, 90%)", padding: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: isActive ? "hsl(45, 14%, 97%)" : "hsl(35, 4%, 56%)", cursor: "pointer", minHeight: 40, transition: "all 0.2s" }}
                    >
                      {isActive ? 'Edit' : 'Use'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Branding;