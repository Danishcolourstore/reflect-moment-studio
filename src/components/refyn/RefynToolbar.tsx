// RefynToolbar is now absorbed into RefynEditor.tsx (VSCO inline tool strip).
// This file is kept as a re-export stub for any legacy imports.

export type RetouchToolId =
  | 'retouch' | 'freqSep' | 'smooth' | 'dnb' | 'heal'
  | 'liquify' | 'sharpen' | 'hair' | 'eyes' | 'teeth';

// No-op default export — toolbar is rendered inline in RefynEditor
export default function RefynToolbar() {
  return null;
}
