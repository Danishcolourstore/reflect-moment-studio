import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Globe, ExternalLink, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { templatePreviews } from '@/assets/templates';
import { TEMPLATE_LIST, type TemplateId } from '@/lib/website-templates';
import { getStudioDisplayUrl } from '@/lib/studio-url';

const Branding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('reverie');
  const [username, setUsername] = useState('');
  const [hasStudio, setHasStudio] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: studio } = await (supabase.from('studio_profiles').select('website_template, username') as any)
        .eq('user_id', user.id).maybeSingle();
      if (studio) {
        setSelectedTemplate(((studio.website_template as TemplateId) || 'reverie'));
        setUsername(studio.username || '');
        setHasStudio(true);
      }
      setLoading(false);
    })();
  }, [user]);

  const handleUseTemplate = async (id: TemplateId) => {
    if (!user) return;
    setSelectedTemplate(id);
    const { data: existing } = await (supabase.from('studio_profiles').select('id') as any)
      .eq('user_id', user.id).maybeSingle();
    if (existing) {
      await (supabase.from('studio_profiles').update({ website_template: id } as any) as any)
        .eq('user_id', user.id);
    } else {
      await (supabase.from('studio_profiles').insert({ user_id: user.id, website_template: id } as any) as any);
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
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 4px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(26px, 6vw, 32px)", fontWeight: 300, color: "#1A1A1A", margin: 0, letterSpacing: "0.01em", lineHeight: 1.1 }}>
              Brand & Website
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6E6E6E", marginTop: 6, letterSpacing: "0.02em" }}>
              Choose a template. Your brand carries everywhere.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {username && (
              <button
                onClick={() => window.open(`/studio/${username}`, '_blank')}
                style={{ background: "none", border: "1px solid #ECECEC", padding: "0 14px", height: 40, fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6E6E6E", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "border-color 0.15s" }}
              >
                <ExternalLink style={{ width: 13, height: 13 }} /> View live
              </button>
            )}
            {hasStudio && (
              <button
                onClick={() => navigate('/dashboard/website-editor')}
                style={{ background: "#1A1A1A", border: "none", padding: "0 18px", height: 40, fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#FFFFFF", cursor: "pointer", transition: "opacity 0.15s" }}
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {username && (
          <div style={{ marginBottom: 28, padding: "12px 14px", border: "1px solid #ECECEC", display: "flex", alignItems: "center", gap: 12 }}>
            <Globe style={{ width: 14, height: 14, color: "#1A1A1A" }} strokeWidth={1.5} />
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6E6E6E", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {getStudioDisplayUrl(username)}
            </p>
          </div>
        )}

        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "#A8A8A8", marginBottom: 14 }}>
          Templates
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {TEMPLATE_LIST.map((tmpl) => {
            const isActive = selectedTemplate === tmpl.id;
            const previewKey = (tmpl.id === 'reverie' ? 'warm-organic'
              : tmpl.id === 'linen' ? 'clean-minimal'
              : tmpl.id === 'vesper' ? 'noir-starter'
              : tmpl.id === 'alabaster' ? 'elegant-folio'
              : tmpl.id === 'heirloom' ? 'magazine-editorial'
              : 'starter-one');
            const previewSrc = templatePreviews[previewKey];
            return (
              <div
                key={tmpl.id}
                style={{ border: `1px solid ${isActive ? "#1A1A1A" : "#ECECEC"}`, transition: "border-color 0.15s", overflow: "hidden", background: "#FFFFFF" }}
              >
                <div style={{ aspectRatio: "4 / 3", overflow: "hidden", background: tmpl.colors.bg, position: "relative" }}>
                  {previewSrc ? (
                    <img src={previewSrc} alt={tmpl.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                  ) : (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <p style={{ fontFamily: tmpl.fonts.display, fontSize: 22, fontWeight: 300, color: tmpl.colors.text, margin: 0 }}>{tmpl.name}</p>
                    </div>
                  )}
                  {isActive && (
                    <div style={{ position: "absolute", top: 10, right: 10, width: 26, height: 26, borderRadius: "50%", background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Check style={{ width: 14, height: 14, color: "#FFFFFF" }} />
                    </div>
                  )}
                </div>
                <div style={{ padding: 14, borderTop: "1px solid #ECECEC" }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: "#1A1A1A", margin: 0 }}>{tmpl.name}</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#A8A8A8", marginTop: 2, marginBottom: 12, letterSpacing: "0.02em" }}>{tmpl.tagline}</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => navigate(`/dashboard/template-preview?template=${tmpl.id}`)}
                      style={{ flex: 1, background: "none", border: "1px solid #ECECEC", height: 40, fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6E6E6E", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "border-color 0.15s" }}
                    >
                      <Eye style={{ width: 12, height: 12 }} /> Preview
                    </button>
                    <button
                      onClick={() => handleUseTemplate(tmpl.id)}
                      style={{ flex: 1, background: isActive ? "#1A1A1A" : "none", border: isActive ? "none" : "1px solid #ECECEC", height: 40, fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: isActive ? "#FFFFFF" : "#6E6E6E", cursor: "pointer", transition: "all 0.15s" }}
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
