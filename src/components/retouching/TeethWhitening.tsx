import { useState } from 'react';
import { ToolPanelWrapper, RecipeRow, ToolToggle } from './ToolPanelPrimitives';

interface Props { onClose: () => void; }

const WhitenIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <path d="M4.5 9C4.5 9 6.5 6.5 10 6.5S15.5 9 15.5 9" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M4.5 9C4.5 9 6.5 13.5 10 13.5S15.5 9 15.5 9" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);

export default function TeethWhitening({ onClose }: Props) {
  const [whitening, setWhitening] = useState(40);
  const [paintMode, setPaintMode] = useState(false);

  return (
    <ToolPanelWrapper title="Teeth" badge="TW" onClose={onClose}>
      <RecipeRow icon={<WhitenIcon />} label="Whitening" value={whitening} onChange={setWhitening} />
      <ToolToggle label="Paint Selection" active={paintMode} onToggle={() => setPaintMode(!paintMode)} />
    </ToolPanelWrapper>
  );
}
