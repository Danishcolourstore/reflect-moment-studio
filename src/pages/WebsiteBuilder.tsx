import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Palette } from 'lucide-react';
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
      <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: '#FDFCFB' }}>
        {/* Preview toolbar — mobile-responsive */}
        <div
          className="sticky top-0 z-50 flex items-center justify-between px-3 sm:px-6 shrink-0"
          style={{
            minHeight: 56,
            backgroundColor: '#FDFCFB',
            borderBottom: '1px solid #F0EDE8',
            paddingTop: 'env(safe-area-inset-top, 0px)',
          }}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={handleBack}
              className="flex items-center gap-1 sm:gap-1.5 transition-opacity hover:opacity-60 active:opacity-40 cursor-pointer shrink-0"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                color: '#999',
                background: 'none',
                border: 'none',
                minWidth: 44,
                minHeight: 44,
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="hidden sm:block" style={{ width: 1, height: 20, backgroundColor: '#F0EDE8' }} />
            <span
              className="truncate"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 'clamp(14px, 3vw, 16px)',
                fontStyle: 'italic',
                color: '#1C1C1E',
              }}
            >
              {tmpl.name}
            </span>
          </div>
          <button
            onClick={() => { setSelectedId(previewId); setView('picker'); }}
            className="transition-opacity hover:opacity-80 active:opacity-60 cursor-pointer shrink-0"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 'clamp(10px, 2vw, 12px)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              color: 'white',
              backgroundColor: '#1A1A1A',
              border: 'none',
              minHeight: 36,
              padding: '0 12px',
            }}
          >
            <span className="hidden sm:inline">Select This Template</span>
            <span className="sm:hidden">Select</span>
          </button>
        </div>
        {/* Preview scroll */}
        <div className="flex-1 overflow-y-auto overscroll-contain -webkit-overflow-scrolling-touch">
          <WebsitePreview template={tmpl} />
        </div>
        {/* Safe area bottom */}
        <div style={{ height: 'env(safe-area-inset-bottom, 0px)', backgroundColor: '#FDFCFB', flexShrink: 0 }} />
      </div>
    );
  }

  /* ── Editor mode (draft) ── */
  if (view === 'editor' && selectedId) {
    const tmpl = getTemplate(selectedId);
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: '#FDFCFB' }}>
        {/* Draft bar */}
        <div
          className="flex items-center justify-between px-3 sm:px-6 shrink-0"
          style={{
            minHeight: 40,
            backgroundColor: '#FAF9F7',
            borderBottom: '1px solid #F0EDE8',
            paddingTop: 'env(safe-area-inset-top, 0px)',
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#1A1A1A' }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#999' }}>
              {"You're editing a draft"}
            </span>
          </div>
          <button
            onClick={handleBack}
            className="transition-opacity hover:opacity-60 active:opacity-40 cursor-pointer"
            style={{ background: 'none', border: 'none', color: '#999', minWidth: 44, minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Editor toolbar — mobile-responsive */}
        <div
          className="flex items-center justify-between px-3 sm:px-6 shrink-0"
          style={{
            minHeight: 56,
            backgroundColor: '#FDFCFB',
            borderBottom: '1px solid #F0EDE8',
          }}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 transition-opacity hover:opacity-60 active:opacity-40 cursor-pointer"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                color: '#999',
                background: 'none',
                border: 'none',
                minWidth: 44,
                minHeight: 44,
              }}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(15px, 3vw, 18px)',
              color: '#1C1C1E',
            }}>
              Website Editor
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Change Template — icon on mobile, text on desktop */}
            <button
              onClick={() => setView('picker')}
              className="transition-opacity hover:opacity-70 active:opacity-50 cursor-pointer flex items-center justify-center"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: '#999',
                border: '1px solid #E8E4DE',
                background: 'none',
                minHeight: 36,
                minWidth: 36,
                padding: '0 8px',
              }}
            >
              <Palette className="w-4 h-4 sm:hidden" />
              <span className="hidden sm:inline" style={{ padding: '0 8px' }}>Change Template</span>
            </button>
            <button
              className="transition-opacity hover:opacity-80 active:opacity-60 cursor-pointer"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: 'white',
                backgroundColor: '#1A1A1A',
                border: 'none',
                minHeight: 36,
                padding: '0 16px',
              }}
            >
              Publish
            </button>
          </div>
        </div>

        {/* Website preview — scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain -webkit-overflow-scrolling-touch">
          <WebsitePreview template={tmpl} />
        </div>
        {/* Safe area bottom */}
        <div style={{ height: 'env(safe-area-inset-bottom, 0px)', backgroundColor: '#FDFCFB', flexShrink: 0 }} />
      </div>
    );
  }

  /* ── Template Picker ── */
  return (
    <DashboardLayout>
      <div className="pb-24 px-3 sm:px-6 pt-4">
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
