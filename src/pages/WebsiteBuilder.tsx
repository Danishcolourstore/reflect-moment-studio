import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { TemplatePicker } from '@/components/website-builder/TemplatePicker';
import { WebsitePreview } from '@/components/website-builder/WebsitePreview';
import { getTemplate, type TemplateId } from '@/lib/website-templates';

type BuilderView = 'picker' | 'preview' | 'editor';

const WebsiteBuilder = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<BuilderView>('picker');
  const [selectedId, setSelectedId] = useState<TemplateId | null>(null);
  const [previewId, setPreviewId] = useState<TemplateId | null>(null);

  const handlePreview = (id: TemplateId) => {
    setPreviewId(id);
    setView('preview');
  };

  const handleSelect = (id: TemplateId) => {
    setSelectedId(id);
  };

  const handleContinue = () => {
    if (selectedId) {
      setView('editor');
    }
  };

  const handleBack = () => {
    if (view === 'preview') {
      setView('picker');
      setPreviewId(null);
    } else if (view === 'editor') {
      setView('picker');
    }
  };

  /* ── Full-screen Preview ── */
  if (view === 'preview' && previewId) {
    const tmpl = getTemplate(previewId);
    return (
      <div className="fixed inset-0 z-50" style={{ backgroundColor: '#FDFCFB' }}>
        {/* Preview toolbar */}
        <div
          className="sticky top-0 z-50 flex items-center justify-between px-6 h-14"
          style={{ backgroundColor: '#FDFCFB', borderBottom: '1px solid #F0EDE8' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 transition-opacity hover:opacity-60 cursor-pointer"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                color: '#999',
                background: 'none',
                border: 'none',
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div style={{ width: 1, height: 20, backgroundColor: '#F0EDE8' }} />
            <span style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 16,
              fontStyle: 'italic',
              color: '#1C1C1E',
            }}>
              {tmpl.name}
            </span>
          </div>
          <button
            onClick={() => { setSelectedId(previewId); setView('picker'); }}
            className="transition-opacity hover:opacity-80 cursor-pointer"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              color: 'white',
              backgroundColor: '#C8A97E',
              border: 'none',
              height: 36,
              padding: '0 20px',
            }}
          >
            Select This Template
          </button>
        </div>
        {/* Preview scroll */}
        <div className="overflow-y-auto" style={{ height: 'calc(100vh - 56px)' }}>
          <WebsitePreview template={tmpl} />
        </div>
      </div>
    );
  }

  /* ── Editor mode (draft) ── */
  if (view === 'editor' && selectedId) {
    const tmpl = getTemplate(selectedId);
    return (
      <div className="fixed inset-0 z-50" style={{ backgroundColor: '#FDFCFB' }}>
        {/* Draft bar */}
        <div
          className="flex items-center justify-between px-6 h-10"
          style={{ backgroundColor: '#FAF9F7', borderBottom: '1px solid #F0EDE8' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#C8A97E' }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#999' }}>
              {"You're editing a draft"}
            </span>
          </div>
          <button
            onClick={handleBack}
            className="transition-opacity hover:opacity-60 cursor-pointer"
            style={{ background: 'none', border: 'none', color: '#999' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Editor toolbar */}
        <div
          className="flex items-center justify-between px-6 h-14"
          style={{ backgroundColor: '#FDFCFB', borderBottom: '1px solid #F0EDE8' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 transition-opacity hover:opacity-60 cursor-pointer"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                color: '#999',
                background: 'none',
                border: 'none',
              }}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 18,
              color: '#1C1C1E',
            }}>
              Website Editor
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="transition-opacity hover:opacity-70 cursor-pointer"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: '#999',
                border: '1px solid #E8E4DE',
                background: 'none',
                height: 36,
                padding: '0 16px',
              }}
            >
              Change Template
            </button>
            <button
              className="transition-opacity hover:opacity-80 cursor-pointer"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: 'white',
                backgroundColor: '#C8A97E',
                border: 'none',
                height: 36,
                padding: '0 16px',
              }}
            >
              Publish
            </button>
          </div>
        </div>
        {/* Website preview */}
        <div className="overflow-y-auto" style={{ height: 'calc(100vh - 96px)' }}>
          <WebsitePreview template={tmpl} />
        </div>
      </div>
    );
  }

  /* ── Template Picker ── */
  return (
    <DashboardLayout>
      <div className="pb-24 px-4 sm:px-6 pt-4">
        <TemplatePicker
          selectedId={selectedId}
          onSelect={handleSelect}
          onPreview={handlePreview}
          onContinue={handleContinue}
        />
      </div>
    </DashboardLayout>
  );
};

export default WebsiteBuilder;
