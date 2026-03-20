import { useState } from 'react';
import { ToolPanelWrapper, RecipeRow } from './ToolPanelPrimitives';

interface Props { onClose: () => void; }

const DetectIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <path d="M7 16C7 11 8 5 10 3.5C12 5 13 11 13 16" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);
const SizeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);

export default function HairCleanup({ onClose }: Props) {
  const [sensitivity, setSensitivity] = useState(50);
  const [brushSize, setBrushSize] = useState(20);

  return (
    <ToolPanelWrapper title="Hair" badge="HR" onClose={onClose}>
      <RecipeRow icon={<DetectIcon />} label="Detection" value={sensitivity} onChange={setSensitivity} />
      <RecipeRow icon={<SizeIcon />} label="Brush Size" value={brushSize} min={1} max={100} onChange={setBrushSize} />
    </ToolPanelWrapper>
  );
}
