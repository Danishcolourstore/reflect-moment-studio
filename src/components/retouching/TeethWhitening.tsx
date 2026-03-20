import { useState } from 'react';
import { ToolPanelWrapper, ToolSlider, ToolToggle } from './ToolPanelPrimitives';

interface Props { onClose: () => void; }

export default function TeethWhitening({ onClose }: Props) {
  const [whitening, setWhitening] = useState(40);
  const [paintMode, setPaintMode] = useState(false);

  return (
    <ToolPanelWrapper title="Teeth Whitening" onClose={onClose}>
      <ToolSlider label="Whitening" value={whitening} onChange={setWhitening} />
      <div className="flex gap-2 pt-2">
        <ToolToggle label="Paint Selection" active={paintMode} onToggle={() => setPaintMode(!paintMode)} />
      </div>
      <p className="text-[9px] text-[#6a6470] pt-2" style={{ fontFamily: '"DM Sans", sans-serif' }}>
        Desaturates yellow & lifts luminance · No color shift
      </p>
    </ToolPanelWrapper>
  );
}
