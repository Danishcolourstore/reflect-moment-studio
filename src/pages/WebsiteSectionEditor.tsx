import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Undo2, Redo2, Share2, MoreHorizontal } from 'lucide-react';
import { useOrientation } from '@/hooks/useOrientation';
import { useUndoHistory } from '@/hooks/useUndoHistory';
import { EditorPanel } from '@/components/website-editor/EditorPanel';
import { SectionPreview } from '@/components/website-editor/SectionPreview';
import {
  SectionType,
  SectionSettings,
  DEFAULT_SECTION_SETTINGS,
  SECTION_LABELS,
} from '@/components/website-editor/section-configs';

interface SectionEntry {
  id: string;
  type: SectionType;
  settings: SectionSettings;
}

const INITIAL_SECTIONS: SectionEntry[] = [
  { id: 'hero-1', type: 'hero', settings: { ...DEFAULT_SECTION_SETTINGS.hero } },
  { id: 'text-1', type: 'rich-text', settings: { ...DEFAULT_SECTION_SETTINGS['rich-text'] } },
  { id: 'gallery-1', type: 'image-gallery', settings: { ...DEFAULT_SECTION_SETTINGS['image-gallery'] } },
  { id: 'testimonials-1', type: 'testimonials', settings: { ...DEFAULT_SECTION_SETTINGS.testimonials } },
  { id: 'contact-1', type: 'contact', settings: { ...DEFAULT_SECTION_SETTINGS.contact } },
  { id: 'footer-1', type: 'footer', settings: { ...DEFAULT_SECTION_SETTINGS.footer } },
];

const WebsiteSectionEditor = () => {
  const navigate = useNavigate();
  const orientation = useOrientation();
  const isPortrait = orientation === 'portrait';

  const [sections, setSections] = useState<SectionEntry[]>(INITIAL_SECTIONS);
  const [selectedId, setSelectedId] = useState<string>('hero-1');
  const [panelExpanded, setPanelExpanded] = useState(true);
  const [hasUnsaved, setHasUnsaved] = useState(false);

  const { push, undo, redo, canUndo, canRedo, undoLabel, redoLabel } = useUndoHistory<SectionEntry[]>();

  // Initialize undo history
  const initRef = useRef(false);
  if (!initRef.current) {
    push('Initial', INITIAL_SECTIONS);
    initRef.current = true;
  }

  const selected = sections.find((s) => s.id === selectedId);

  const updateSettings = useCallback(
    (patch: Partial<SectionSettings>) => {
      setSections((prev) => {
        const next = prev.map((s) =>
          s.id === selectedId ? { ...s, settings: { ...s.settings, ...patch } } : s
        );
        push(`Edit ${SECTION_LABELS[selected?.type || 'hero']}`, next);
        return next;
      });
      setHasUnsaved(true);
    },
    [selectedId, selected?.type, push],
  );

  const handleUndo = useCallback(() => {
    const prev = undo();
    if (prev) setSections(prev);
  }, [undo]);

  const handleRedo = useCallback(() => {
    const next = redo();
    if (next) setSections(next);
  }, [redo]);

  const handleReset = useCallback(() => {
    if (!selected) return;
    updateSettings({ ...DEFAULT_SECTION_SETTINGS[selected.type] });
  }, [selected, updateSettings]);

  const handleDuplicate = useCallback(() => {
    if (!selected) return;
    const idx = sections.findIndex((s) => s.id === selectedId);
    const dup: SectionEntry = {
      id: `${selected.type}-${Date.now()}`,
      type: selected.type,
      settings: { ...selected.settings },
    };
    const next = [...sections];
    next.splice(idx + 1, 0, dup);
    setSections(next);
    setSelectedId(dup.id);
    push('Duplicate section', next);
    setHasUnsaved(true);
  }, [selected, sections, selectedId, push]);

  const handleDelete = useCallback(() => {
    if (sections.length <= 1) return;
    const next = sections.filter((s) => s.id !== selectedId);
    setSections(next);
    setSelectedId(next[0].id);
    push('Delete section', next);
    setHasUnsaved(true);
  }, [sections, selectedId, push]);

  const handleSave = useCallback(() => {
    setHasUnsaved(false);
  }, []);

  /* ── Render ── */
  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{
        backgroundColor: '#111111',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ── Top Bar ── */}
      <div
        className="flex items-center justify-between px-3 shrink-0"
        style={{
          height: 52,
          backgroundColor: '#1c1c1e',
          borderBottom: '1px solid #2c2c2e',
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <div className="flex items-center gap-2">
          <button
            className="min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={() => navigate(-1)}
            style={{ color: '#0A84FF' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-[14px] text-white font-medium truncate max-w-[140px]">
            {selected ? SECTION_LABELS[selected.type] : 'Editor'}
          </span>
        </div>
        <div className="flex items-center gap-0">
          <button
            className="min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={handleUndo}
            disabled={!canUndo}
            style={{ color: canUndo ? '#0A84FF' : '#3a3a3c' }}
            title={undoLabel ? `Undo: ${undoLabel}` : 'Undo'}
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <button
            className="min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={handleRedo}
            disabled={!canRedo}
            style={{ color: canRedo ? '#0A84FF' : '#3a3a3c' }}
            title={redoLabel ? `Redo: ${redoLabel}` : 'Redo'}
          >
            <Redo2 className="w-5 h-5" />
          </button>
          {/* Unsaved dot */}
          <div className="flex items-center justify-center min-w-[44px]">
            <div
              className="w-2.5 h-2.5 rounded-full transition-colors"
              style={{ backgroundColor: hasUnsaved ? '#0A84FF' : '#3a3a3c' }}
            />
          </div>
          <button
            className="min-w-[44px] min-h-[44px] flex items-center justify-center"
            style={{ color: '#999' }}
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            className="min-w-[44px] min-h-[44px] flex items-center justify-center"
            style={{ color: '#999' }}
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Body: preview + panel ── */}
      <div className={`flex-1 flex overflow-hidden ${isPortrait ? 'flex-col' : 'flex-row'}`}>
        {/* Preview */}
        <div
          className="overflow-y-auto"
          style={{
            flex: isPortrait ? (panelExpanded ? '0 0 55%' : '1 1 auto') : '0 0 60%',
            backgroundColor: '#111111',
          }}
        >
          {sections.map((sec) => (
            <SectionPreview
              key={sec.id}
              type={sec.type}
              settings={sec.settings}
              selected={sec.id === selectedId}
              onSelect={() => setSelectedId(sec.id)}
            />
          ))}
        </div>

        {/* Panel */}
        <div
          className="shrink-0 overflow-hidden transition-all duration-300"
          style={{
            ...(isPortrait
              ? { height: panelExpanded ? '45%' : 64 }
              : { width: '40%', height: '100%' }),
            borderTop: isPortrait ? '1px solid #2c2c2e' : 'none',
            borderLeft: !isPortrait ? '1px solid #2c2c2e' : 'none',
          }}
        >
          {selected && (
            <EditorPanel
              orientation={orientation}
              sectionType={selected.type}
              settings={selected.settings}
              onChange={updateSettings}
              onReset={handleReset}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              expanded={panelExpanded}
              onToggleExpand={() => setPanelExpanded(!panelExpanded)}
            />
          )}
        </div>
      </div>

      {/* Safe area bottom padding */}
      <div style={{ height: 'env(safe-area-inset-bottom, 0px)', backgroundColor: '#1c1c1e' }} />
    </div>
  );
};

export default WebsiteSectionEditor;
