import { Image, Type, Sparkles, Download } from 'lucide-react';
import DownloadGridButton from './DownloadGridButton';
import type { GridLayout, GridCellData, CanvasFormat, FreePosition } from './types';
import type { TextLayer } from './text-overlay-types';
import type { DesignElement } from './element-types';
import type { LogoLayer } from './LogoOverlay';
import type { BackgroundStyle } from './BackgroundStyler';
import type { FormatPreset } from './FormatPicker';
import { cn } from '@/lib/utils';

interface Props {
  layout: GridLayout;
  cells: GridCellData[];
  textLayers: TextLayer[];
  elements: DesignElement[];
  logo: LogoLayer | null;
  background: BackgroundStyle;
  format: CanvasFormat;
  formatPreset: FormatPreset;
  freePositions: FreePosition[] | null;
  filledCount: number;
}

export default function ExportStep({
  layout,
  cells,
  textLayers,
  elements,
  logo,
  background,
  format,
  formatPreset,
  freePositions,
  filledCount,
}: Props) {
  const canExport = filledCount > 0;
  const hasText = textLayers.length > 0;
  const hasElements = elements.length > 0;
  const hasLogo = !!logo;

  const stats = [
    { icon: Image, label: 'Photos', value: filledCount, show: true },
    { icon: Type, label: 'Text', value: textLayers.length, show: hasText },
    { icon: Sparkles, label: 'Elements', value: elements.length + (hasLogo ? 1 : 0), show: hasElements || hasLogo },
  ].filter((s) => s.show);

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Export summary card */}
      <div className="border border-grid-border bg-[#0a0a0a] p-5">
        <div className="mb-4 flex items-center gap-2">
          <Download className="h-4 w-4 text-grid-gold" strokeWidth={1.5} />
          <h3 className="font-sans text-[11px] uppercase tracking-[0.12em] text-grid-ivory">
            Export Summary
          </h3>
        </div>

        {/* Format info */}
        <div className="mb-4 flex items-baseline gap-2">
          <span className="font-serif text-2xl text-grid-ivory">{formatPreset.name}</span>
          <span className="font-sans text-[10px] tracking-wide text-[#555555]">
            {format.exportWidth} × {format.exportHeight} px
          </span>
        </div>

        {/* Stats row */}
        <div className="flex gap-6">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 text-[#555555]" strokeWidth={1.5} />
              <span className="font-sans text-[10px] text-[#777777]">
                {value} {label.toLowerCase()}
              </span>
            </div>
          ))}
        </div>

        {/* Quality note */}
        <div className="mt-4 border-t border-grid-border pt-4">
          <p className="font-sans text-[10px] leading-relaxed text-[#555555]">
            Lossless PNG export • Original image quality preserved • No compression artifacts
          </p>
        </div>
      </div>

      {/* Export button */}
      <DownloadGridButton
        gridRef={{ current: null }}
        cells={cells}
        layout={layout}
        textLayers={textLayers}
        elements={elements}
        logo={logo}
        background={background}
        format={format}
        freePositions={freePositions}
        mobileFullWidth
        disabled={!canExport}
        label="Download PNG"
      />

      {!canExport && (
        <p className="text-center font-sans text-[10px] text-grid-hint">
          Add photos before exporting
        </p>
      )}
    </div>
  );
}
