import { useState } from 'react';
import { ToolPanelWrapper, RecipeRow, ToolSegment, ToolToggle } from './ToolPanelPrimitives';

interface Props { onClose: () => void; }

const ExpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.2"/>
    <line x1="10" y1="6" x2="10" y2="14" stroke="currentColor" strokeWidth="1"/>
    <line x1="6" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="1"/>
  </svg>
);
const SizeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 1"/>
  </svg>
);
const FeatherIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <path d="M16 4L10 10M16 4C14 6 8 6 6 8C4 10 4 14 4 16" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);
const OpacityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M10 3A7 7 0 0 1 10 17" fill="currentColor" fillOpacity="0.3"/>
  </svg>
);

export default function DodgeBurn({ onClose }: Props) {
  const [mode, setMode] = useState('Dodge');
  const [exposure, setExposure] = useState(30);
  const [brushSize, setBrushSize] = useState(100);
  const [feather, setFeather] = useState(50);
  const [opacity, setOpacity] = useState(80);
  const [range, setRange] = useState('Midtones');
  const [showOverlay, setShowOverlay] = useState(false);

  return (
    <ToolPanelWrapper title="Dodge & Burn" badge="DB" onClose={onClose}>
      <ToolSegment options={['Dodge', 'Burn']} value={mode} onChange={setMode} />
      <RecipeRow icon={<ExpIcon />} label="Exposure" value={exposure} onChange={setExposure} />
      <RecipeRow icon={<SizeIcon />} label="Size" value={brushSize} min={1} max={500} onChange={setBrushSize} />
      <RecipeRow icon={<FeatherIcon />} label="Feather" value={feather} onChange={setFeather} />
      <RecipeRow icon={<OpacityIcon />} label="Opacity" value={opacity} onChange={setOpacity} />
      <ToolSegment options={['Shadows', 'Midtones', 'Highlights']} value={range} onChange={setRange} />
      <ToolToggle label="D&B Overlay" active={showOverlay} onToggle={() => setShowOverlay(!showOverlay)} />
    </ToolPanelWrapper>
  );
}
