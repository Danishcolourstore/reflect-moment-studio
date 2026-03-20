import { useState } from 'react';
import { ToolPanelWrapper, ToolSlider, ToolToggle } from './ToolPanelPrimitives';

interface Props { onClose: () => void; }

export default function Liquify({ onClose }: Props) {
  const [brushSize, setBrushSize] = useState(100);
  const [pressure, setPressure] = useState(20);
  const [density, setDensity] = useState(50);
  const [freeze, setFreeze] = useState(false);

  return (
    <ToolPanelWrapper title="Liquify" onClose={onClose}>
      <ToolSlider label="Size" value={brushSize} min={10} max={500} onChange={setBrushSize} unit="px" />
      <ToolSlider label="Pressure" value={pressure} min={1} max={50} onChange={setPressure} unit="%" />
      <ToolSlider label="Density" value={density} onChange={setDensity} unit="%" />
      <div className="flex gap-2 pt-2">
        <ToolToggle label="Freeze Mask" active={freeze} onToggle={() => setFreeze(!freeze)} />
      </div>
      <p className="text-[9px] text-[#6a6470] pt-1" style={{ fontFamily: '"DM Sans", sans-serif' }}>
        Drag to push pixels · Capped at 50% for natural results
      </p>
    </ToolPanelWrapper>
  );
}
