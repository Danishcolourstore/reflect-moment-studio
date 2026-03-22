// RefynExport — now a thin wrapper that accepts legacy props but renders nothing.
// Export functionality is handled inline inside RefynEditor.tsx.

import type { RefynToolValues } from './refyn-types';
import type { RefynFilter } from './refyn-filters';

interface Props {
  photoUrl: string;
  values: RefynToolValues;
  cssOverrides?: RefynFilter['cssOverrides'];
  onBack: () => void;
  onReset: () => void;
}

export default function RefynExport(_props: Props) {
  // Export is now handled inside RefynEditor
  return null;
}
