import { useState } from 'react';
import { ToolPanelWrapper, ToolSlider, ToolSegment, ToolToggle } from './ToolPanelPrimitives';

interface Props { onClose: () => void; }

export default function BlemishRemoval({ onClose }: Props) {
  const [mode, setMode] = useState('Heal');
  const [brushSize, setBrushSize] = useState(30);
  const [opacity, setOpacity] = useState(100);
  const [feather, setFeather] = useState(50);

  return (
    <ToolPanelWrapper title="Blemish Removal" onClose={onClose}>
      <ToolSegment options={['Heal', 'Clone']} value={mode} onChange={setMode} />
      <ToolSlider label="Size" value={brushSize} min={1} max={200} onChange={setBrushSize} unit="px" />
      <ToolSlider label="Opacity" value={opacity} onChange={setOpacity} unit="%" />
      <ToolSlider label="Feather" value={feather} onChange={setFeather} unit="%" />
      <p className="text-[9px] text-[#6a6470] pt-2" style={{ fontFamily: '"DM Sans", sans-serif' }}>
        {mode === 'Heal' ? 'Tap blemish to auto-heal' : 'Long-press to set source, then paint'}
      </p>
    </ToolPanelWrapper>
  );
}
