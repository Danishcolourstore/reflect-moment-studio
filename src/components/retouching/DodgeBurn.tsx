import { useState } from 'react';
import { ToolPanelWrapper, ToolSlider, ToolSegment, ToolToggle } from './ToolPanelPrimitives';

interface Props {
  onClose: () => void;
}

export default function DodgeBurn({ onClose }: Props) {
  const [mode, setMode] = useState('Dodge');
  const [exposure, setExposure] = useState(30);
  const [brushSize, setBrushSize] = useState(100);
  const [feather, setFeather] = useState(50);
  const [opacity, setOpacity] = useState(80);
  const [range, setRange] = useState('Midtones');
  const [showOverlay, setShowOverlay] = useState(false);

  return (
    <ToolPanelWrapper title="Dodge & Burn" onClose={onClose}>
      <ToolSegment options={['Dodge', 'Burn']} value={mode} onChange={setMode} />
      <ToolSlider label="Exposure" value={exposure} onChange={setExposure} unit="%" />
      <ToolSlider label="Size" value={brushSize} min={1} max={500} onChange={setBrushSize} unit="px" />
      <ToolSlider label="Feather" value={feather} onChange={setFeather} unit="%" />
      <ToolSlider label="Opacity" value={opacity} onChange={setOpacity} unit="%" />
      <div className="pt-1">
        <ToolSegment options={['Shadows', 'Midtones', 'Highlights']} value={range} onChange={setRange} />
      </div>
      <div className="flex gap-2 pt-2">
        <ToolToggle label="Show D&B Overlay" active={showOverlay} onToggle={() => setShowOverlay(!showOverlay)} />
      </div>
    </ToolPanelWrapper>
  );
}
