import { useState } from 'react';
import { ToolPanelWrapper, ToolSlider, ToolToggle } from './ToolPanelPrimitives';

interface Props {
  onClose: () => void;
}

export default function SkinSmoothing({ onClose }: Props) {
  const [smoothness, setSmoothness] = useState(40);
  const [detailPreserve, setDetailPreserve] = useState(60);
  const [radius, setRadius] = useState(8);
  const [showMask, setShowMask] = useState(false);

  return (
    <ToolPanelWrapper title="Skin Smoothing" onClose={onClose}>
      <ToolSlider label="Smoothness" value={smoothness} onChange={setSmoothness} />
      <ToolSlider label="Detail" value={detailPreserve} onChange={setDetailPreserve} />
      <ToolSlider label="Radius" value={radius} min={1} max={30} onChange={setRadius} unit="px" />
      <div className="flex gap-2 pt-2">
        <ToolToggle label="Show Mask" active={showMask} onToggle={() => setShowMask(!showMask)} />
        <ToolToggle label="Paint to Smooth" active={false} onToggle={() => {}} />
      </div>
    </ToolPanelWrapper>
  );
}
