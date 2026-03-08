import { useEffect } from 'react';
import { loadFont } from '@/components/grid-builder/font-library';

/**
 * Dynamically loads Google Fonts when font family names change.
 * Accepts any number of font family strings (nulls/undefined are ignored).
 */
export function useGoogleFonts(...families: (string | null | undefined)[]) {
  useEffect(() => {
    families.forEach(f => {
      if (f && f.trim()) loadFont(f.trim());
    });
  }, [families.join('|')]);
}
