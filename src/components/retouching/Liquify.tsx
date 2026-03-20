import { useState } from 'react';
import { ToolPanelWrapper, RecipeRow, ToolToggle } from './ToolPanelPrimitives';

interface Props { onClose: () => void; }

const SizeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);
const PressureIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <path d="M10 4V16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M6 8L10 4L14 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const DensityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <rect x="4" y="4" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2"/>
    <rect x="7" y="7" width="6" height="6" rx="1" fill="currentColor" fillOpacity="0.3"/>
  </svg>
);

export default function Liquify({ onClose }: Props) {
  const [brushSize, setBrushSize] = useState(100);
  const [pressure, setPressure] = useState(20);
  const [density, setDensity] = useState(50);
  const [freeze, setFreeze] = useState(false);

  return (
    <ToolPanelWrapper title="Liquify" badge="LQ" onClose={onClose}>
      <RecipeRow icon={<SizeIcon />} label="Size" value={brushSize} min={10} max={500} onChange={setBrushSize} />
      <RecipeRow icon={<PressureIcon />} label="Pressure" value={pressure} min={1} max={50} onChange={setPressure} />
      <RecipeRow icon={<DensityIcon />} label="Density" value={density} onChange={setDensity} />
      <ToolToggle label="Freeze Mask" active={freeze} onToggle={() => setFreeze(!freeze)} />
    </ToolPanelWrapper>
  );
}
