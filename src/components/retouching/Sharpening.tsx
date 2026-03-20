import { useState } from 'react';
import { ToolPanelWrapper, RecipeRow, ToolToggle } from './ToolPanelPrimitives';

interface Props { onClose: () => void; }

const AmountIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <polygon points="10,3 17,17 3,17" stroke="currentColor" strokeWidth="1.2" fill="none"/>
  </svg>
);
const RadiusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="1"/>
  </svg>
);
const ThreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <line x1="4" y1="14" x2="10" y2="14" stroke="currentColor" strokeWidth="1.2"/>
    <line x1="10" y1="6" x2="16" y2="6" stroke="currentColor" strokeWidth="1.2"/>
    <line x1="10" y1="6" x2="10" y2="14" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);

export default function Sharpening({ onClose }: Props) {
  const [amount, setAmount] = useState(60);
  const [radius, setRadius] = useState(1);
  const [threshold, setThreshold] = useState(10);
  const [lumOnly, setLumOnly] = useState(true);

  return (
    <ToolPanelWrapper title="Sharpen" badge="SH" onClose={onClose}>
      <RecipeRow icon={<AmountIcon />} label="Amount" value={amount} max={200} onChange={setAmount} />
      <RecipeRow icon={<RadiusIcon />} label="Radius" value={radius} min={0} max={10} step={0.1} onChange={setRadius} />
      <RecipeRow icon={<ThreshIcon />} label="Threshold" value={threshold} onChange={setThreshold} />
      <ToolToggle label="Luminosity Only" active={lumOnly} onToggle={() => setLumOnly(!lumOnly)} />
    </ToolPanelWrapper>
  );
}
