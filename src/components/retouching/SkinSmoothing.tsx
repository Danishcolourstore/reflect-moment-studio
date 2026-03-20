import { useState } from 'react';
import { ToolPanelWrapper, RecipeRow, ToolToggle } from './ToolPanelPrimitives';

interface Props { onClose: () => void; }

const SmoothIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="8" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M6 16C6 13 8 11 10 11S14 13 14 16" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);
const DetailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <path d="M6 14L8 6L10 12L12 4L14 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const RadiusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);

export default function SkinSmoothing({ onClose }: Props) {
  const [smoothness, setSmoothness] = useState(40);
  const [detail, setDetail] = useState(60);
  const [radius, setRadius] = useState(8);
  const [showMask, setShowMask] = useState(false);

  return (
    <ToolPanelWrapper title="Skin" badge="SK" onClose={onClose}>
      <RecipeRow icon={<SmoothIcon />} label="Smoothness" value={smoothness} onChange={setSmoothness} />
      <RecipeRow icon={<DetailIcon />} label="Detail Preserve" value={detail} onChange={setDetail} />
      <RecipeRow icon={<RadiusIcon />} label="Radius" value={radius} min={1} max={30} onChange={setRadius} />
      <ToolToggle
        label="Show Mask"
        active={showMask}
        onToggle={() => setShowMask(!showMask)}
      />
    </ToolPanelWrapper>
  );
}
