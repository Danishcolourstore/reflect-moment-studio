import { useState } from 'react';
import { ToolPanelWrapper, ToolSlider, ToolToggle, ToolSegment } from './ToolPanelPrimitives';

interface Props {
  onClose: () => void;
}

export default function FrequencySeparation({ onClose }: Props) {
  const [radius, setRadius] = useState(8);
  const [lowOpacity, setLowOpacity] = useState(100);
  const [highOpacity, setHighOpacity] = useState(100);
  const [viewMode, setViewMode] = useState('Combined');
  const [showMask, setShowMask] = useState(false);

  return (
    <ToolPanelWrapper title="Frequency Separation" onClose={onClose}>
      <ToolSlider label="Radius" value={radius} min={1} max={50} onChange={setRadius} unit="px" />
      <ToolSlider label="Low Freq" value={lowOpacity} onChange={setLowOpacity} unit="%" />
      <ToolSlider label="High Freq" value={highOpacity} onChange={setHighOpacity} unit="%" />
      <div
        className="flex items-center gap-2 px-4"
        style={{
          height: '40px',
          background: 'rgba(0,0,0,0.2)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <ToolSegment options={['Low Only', 'High Only', 'Combined']} value={viewMode} onChange={setViewMode} />
        <div className="flex-1" />
        <ToolToggle label="Mask" active={showMask} onToggle={() => setShowMask(!showMask)} />
      </div>
    </ToolPanelWrapper>
  );
}
