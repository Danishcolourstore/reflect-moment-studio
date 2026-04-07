import { useState, useRef, useCallback } from 'react';
import { RotateCcw, Copy, Trash2, Sparkles } from 'lucide-react';
import type { Orientation } from '@/hooks/useOrientation';
import type { SectionType, SectionSettings, SectionTabConfig } from './section-configs';
import { SECTION_TABS, SECTION_LABELS, DEFAULT_SECTION_SETTINGS } from './section-configs';
import { EditorTabControls } from './EditorTabControls';

interface EditorPanelProps {
  orientation: Orientation;
  sectionType: SectionType;
  settings: SectionSettings;
  onChange: (patch: Partial<SectionSettings>) => void;
  onReset: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  /** Panel expanded state for portrait swipe gesture */
  expanded: boolean;
  onToggleExpand: () => void;
}

export function EditorPanel({
  orientation,
  sectionType,
  settings,
  onChange,
  onReset,
  onDuplicate,
  onDelete,
  expanded,
  onToggleExpand,
}: EditorPanelProps) {
  const tabs = SECTION_TABS[sectionType] || [];
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || 'content');
  const tabsRowRef = useRef<HTMLDivElement>(null);

  // Ensure activeTab is valid when section changes
  if (tabs.length && !tabs.find((t) => t.id === activeTab)) {
    setActiveTab(tabs[0].id);
  }

  const isPortrait = orientation === 'portrait';

  return (
    <div
      className="flex flex-col h-full"
      style={{
        backgroundColor: '#1c1c1e',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Drag handle (portrait only) */}
      {isPortrait && (
        <button
          className="w-full flex justify-center py-2 min-h-[28px]"
          onClick={onToggleExpand}
        >
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: '#3a3a3c' }} />
        </button>
      )}

      {/* Section label + quick actions */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{ borderColor: '#2c2c2e' }}
      >
        <span className="text-[12px] text-[#999] font-medium uppercase tracking-[0.12em] select-none">
          {SECTION_LABELS[sectionType]}
        </span>
        <div className="flex items-center gap-1">
          {[
            { icon: RotateCcw, action: onReset, label: 'Reset' },
            { icon: Copy, action: onDuplicate, label: 'Duplicate' },
            { icon: Trash2, action: onDelete, label: 'Delete' },
            { icon: Sparkles, action: () => {}, label: 'AI Rewrite' },
          ].map(({ icon: Icon, action, label }) => (
            <button
              key={label}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg"
              style={{ color: '#999' }}
              onClick={action}
              title={label}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Tabs row */}
      <div
        ref={tabsRowRef}
        className={
          isPortrait
            ? 'flex overflow-x-auto no-scrollbar px-2 py-2 gap-1 border-b'
            : 'flex flex-col px-2 py-2 gap-1 border-b'
        }
        style={{ borderColor: '#2c2c2e' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`
              min-h-[44px] px-4 rounded-lg text-[12px] font-medium tracking-wide
              whitespace-nowrap transition-colors select-none
              ${isPortrait ? '' : 'w-full text-left'}
            `}
            style={{
              backgroundColor: activeTab === tab.id ? '#0A84FF' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#999',
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Controls scroll area */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <EditorTabControls
          sectionType={sectionType}
          activeTab={activeTab}
          settings={settings}
          onChange={onChange}
        />
      </div>
    </div>
  );
}
