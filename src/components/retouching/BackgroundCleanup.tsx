import { useState } from 'react';
import { ToolPanelWrapper, ToolSlider, ToolSegment } from './ToolPanelPrimitives';

interface Props { onClose: () => void; }

export default function BackgroundCleanup({ onClose }: Props) {
  const [mode, setMode] = useState('Heal');
  const [brushSize, setBrushSize] = useState(60);
  const [feather, setFeather] = useState(50);
  const [opacity, setOpacity] = useState(100);

  return (
    <ToolPanelWrapper title="Background Cleanup" onClose={onClose}>
      <ToolSegment options={['Heal', 'Clone', 'Fill']} value={mode} onChange={setMode} />
      <ToolSlider label="Size" value={brushSize} min={1} max={500} onChange={setBrushSize} unit="px" />
      <ToolSlider label="Feather" value={feather} onChange={setFeather} unit="%" />
      <ToolSlider label="Opacity" value={opacity} onChange={setOpacity} unit="%" />
      <p className="text-[9px] text-[#6a6470] pt-2" style={{ fontFamily: '"DM Sans", sans-serif' }}>
        {mode === 'Fill' ? 'Select area for content-aware fill' : 'Paint to clean distractions'}
      </p>
    </ToolPanelWrapper>
  );
}
