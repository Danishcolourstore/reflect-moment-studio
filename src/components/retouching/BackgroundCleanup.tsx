import { useState } from 'react';
import { ToolPanelWrapper, RecipeRow, ToolSegment } from './ToolPanelPrimitives';

interface Props { onClose: () => void; }

const SizeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);
const FeatherIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2"/>
  </svg>
);
const OpacityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M10 3A7 7 0 0 1 10 17" fill="currentColor" fillOpacity="0.3"/>
  </svg>
);

export default function BackgroundCleanup({ onClose }: Props) {
  const [mode, setMode] = useState('Heal');
  const [brushSize, setBrushSize] = useState(60);
  const [feather, setFeather] = useState(50);
  const [opacity, setOpacity] = useState(100);

  return (
    <ToolPanelWrapper title="Background" badge="BG" onClose={onClose}>
      <ToolSegment options={['Heal', 'Clone', 'Fill']} value={mode} onChange={setMode} />
      <RecipeRow icon={<SizeIcon />} label="Size" value={brushSize} min={1} max={500} onChange={setBrushSize} />
      <RecipeRow icon={<FeatherIcon />} label="Feather" value={feather} onChange={setFeather} />
      <RecipeRow icon={<OpacityIcon />} label="Opacity" value={opacity} onChange={setOpacity} />
    </ToolPanelWrapper>
  );
}
