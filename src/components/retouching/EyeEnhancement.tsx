import { useState } from 'react';
import { ToolPanelWrapper, ToolSlider } from './ToolPanelPrimitives';

interface Props { onClose: () => void; }

export default function EyeEnhancement({ onClose }: Props) {
  const [irisClarity, setIrisClarity] = useState(40);
  const [whitesBrighten, setWhitesBrighten] = useState(15);
  const [catchlight, setCatchlight] = useState(30);

  return (
    <ToolPanelWrapper title="Eye Enhancement" onClose={onClose}>
      <ToolSlider label="Iris Clarity" value={irisClarity} onChange={setIrisClarity} />
      <ToolSlider label="Whites" value={whitesBrighten} max={50} onChange={setWhitesBrighten} />
      <ToolSlider label="Catchlight" value={catchlight} onChange={setCatchlight} />
      <p className="text-[9px] text-[#6a6470] pt-2" style={{ fontFamily: '"DM Sans", sans-serif' }}>
        Luminance only — no color change · Tap eye area to apply
      </p>
    </ToolPanelWrapper>
  );
}
