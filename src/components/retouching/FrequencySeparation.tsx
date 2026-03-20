import { useState } from 'react';
import { ToolPanelWrapper, RecipeRow, ToolSegment, ToolToggle } from './ToolPanelPrimitives';

interface Props { onClose: () => void; }

/* Icons matching VSCO style — thin stroke, 18px */
const RadiusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="1"/>
  </svg>
);
const LowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <path d="M4 14C6 8 14 8 16 14" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);
const HighIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <path d="M4 10C6 4 8 16 10 10C12 4 14 16 16 10" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);

export default function FrequencySeparation({ onClose }: Props) {
  const [radius, setRadius] = useState(8);
  const [lowOpacity, setLowOpacity] = useState(100);
  const [highOpacity, setHighOpacity] = useState(100);
  const [viewMode, setViewMode] = useState('Combined');
  const [showMask, setShowMask] = useState(false);

  return (
    <ToolPanelWrapper title="Freq Sep" badge="FS" onClose={onClose}>
      <RecipeRow icon={<RadiusIcon />} label="Radius" value={radius} min={1} max={50} onChange={setRadius} />
      <RecipeRow icon={<LowIcon />} label="Low Freq" value={lowOpacity} onChange={setLowOpacity} />
      <RecipeRow icon={<HighIcon />} label="High Freq" value={highOpacity} onChange={setHighOpacity} />
      <ToolSegment options={['Low', 'High', 'Combined']} value={viewMode} onChange={setViewMode} />
      <ToolToggle
        label="Show Mask"
        active={showMask}
        onToggle={() => setShowMask(!showMask)}
        icon={
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 2"/>
          </svg>
        }
      />
    </ToolPanelWrapper>
  );
}
