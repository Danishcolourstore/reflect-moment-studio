import { useState } from 'react';
import { ToolPanelWrapper, ToolSlider } from './ToolPanelPrimitives';

interface Props { onClose: () => void; }

export default function HairCleanup({ onClose }: Props) {
  const [sensitivity, setSensitivity] = useState(50);
  const [brushSize, setBrushSize] = useState(20);

  return (
    <ToolPanelWrapper title="Hair & Flyaway Cleanup" onClose={onClose}>
      <ToolSlider label="Detection" value={sensitivity} onChange={setSensitivity} />
      <ToolSlider label="Brush Size" value={brushSize} min={1} max={100} onChange={setBrushSize} unit="px" />
      <p className="text-[9px] text-[#6a6470] pt-2" style={{ fontFamily: '"DM Sans", sans-serif' }}>
        Smart brush detects flyaway hairs · Paint edges for manual cleanup
      </p>
    </ToolPanelWrapper>
  );
}
