import DownloadGridButton from './DownloadGridButton';
import type { GridLayout, GridCellData, CanvasFormat, FreePosition } from './types';
import type { TextLayer } from './text-overlay-types';
import type { DesignElement } from './element-types';
import type { LogoLayer } from './LogoOverlay';
import type { BackgroundStyle } from './BackgroundStyler';
import type { FormatPreset } from './FormatPicker';

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
  const dimLabel = `${formatPreset.name.toUpperCase()}  ·  ${format.exportWidth} × ${format.exportHeight} px`;

  return (
    <div className="flex flex-col gap-3 pb-24">
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
        label="Export"
      />
      <p className="text-center font-sans text-[10px] text-[#555555]">{dimLabel}</p>
      {!canExport && (
        <p className="text-center font-sans text-[10px] text-grid-hint">
          Add photos before exporting
        </p>
      )}
    </div>
  );
}
