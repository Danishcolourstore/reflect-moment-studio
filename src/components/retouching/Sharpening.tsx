import { useState } from 'react';
import { ToolPanelWrapper, ToolSlider, ToolToggle } from './ToolPanelPrimitives';

interface Props { onClose: () => void; }

export default function Sharpening({ onClose }: Props) {
  const [amount, setAmount] = useState(60);
  const [radius, setRadius] = useState(1);
  const [threshold, setThreshold] = useState(10);
  const [lumOnly, setLumOnly] = useState(true);
  const [paintMode, setPaintMode] = useState(false);

  return (
    <ToolPanelWrapper title="Sharpen" onClose={onClose}>
      <ToolSlider label="Amount" value={amount} max={200} onChange={setAmount} unit="%" />
      <ToolSlider label="Radius" value={radius} min={0} max={10} step={0.1} onChange={setRadius} unit="px" />
      <ToolSlider label="Threshold" value={threshold} onChange={setThreshold} />
      <div className="flex gap-2 pt-2">
        <ToolToggle label="Luminosity Only" active={lumOnly} onToggle={() => setLumOnly(!lumOnly)} />
        <ToolToggle label="Paint to Sharpen" active={paintMode} onToggle={() => setPaintMode(!paintMode)} />
      </div>
    </ToolPanelWrapper>
  );
}
