import { useState } from 'react';
import { ToolPanelWrapper, RecipeRow } from './ToolPanelPrimitives';

interface Props { onClose: () => void; }

const IrisIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <ellipse cx="10" cy="10" rx="7" ry="4.5" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1"/>
  </svg>
);
const WhiteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="10" cy="10" r="3" fill="currentColor" fillOpacity="0.15"/>
  </svg>
);
const CatchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="8" cy="8" r="1.5" fill="currentColor" fillOpacity="0.5"/>
  </svg>
);

export default function EyeEnhancement({ onClose }: Props) {
  const [iris, setIris] = useState(40);
  const [whites, setWhites] = useState(15);
  const [catchlight, setCatchlight] = useState(30);

  return (
    <ToolPanelWrapper title="Eyes" badge="EY" onClose={onClose}>
      <RecipeRow icon={<IrisIcon />} label="Iris Clarity" value={iris} onChange={setIris} />
      <RecipeRow icon={<WhiteIcon />} label="Whites" value={whites} max={50} onChange={setWhites} />
      <RecipeRow icon={<CatchIcon />} label="Catchlight" value={catchlight} onChange={setCatchlight} />
    </ToolPanelWrapper>
  );
}
