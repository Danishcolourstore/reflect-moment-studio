import { useState, useCallback, useRef } from 'react';

export interface BrushSettings {
  size: number;
  opacity: number;
  feather: number;
  color: string;
}

export interface BrushStroke {
  points: { x: number; y: number }[];
  settings: BrushSettings;
}

const DEFAULT_BRUSH: BrushSettings = {
  size: 50,
  opacity: 80,
  feather: 50,
  color: '#ffffff',
};

export function useBrushTool(initialSettings?: Partial<BrushSettings>) {
  const [settings, setSettings] = useState<BrushSettings>({ ...DEFAULT_BRUSH, ...initialSettings });
  const [isPainting, setIsPainting] = useState(false);
  const currentStrokeRef = useRef<BrushStroke | null>(null);
  const strokesRef = useRef<BrushStroke[]>([]);

  const updateSetting = useCallback(<K extends keyof BrushSettings>(key: K, value: BrushSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const startStroke = useCallback((x: number, y: number) => {
    setIsPainting(true);
    currentStrokeRef.current = {
      points: [{ x, y }],
      settings: { ...settings },
    };
  }, [settings]);

  const continueStroke = useCallback((x: number, y: number) => {
    if (!currentStrokeRef.current) return;
    currentStrokeRef.current.points.push({ x, y });
  }, []);

  const endStroke = useCallback((): BrushStroke | null => {
    setIsPainting(false);
    const stroke = currentStrokeRef.current;
    if (stroke && stroke.points.length > 0) {
      strokesRef.current.push(stroke);
    }
    currentStrokeRef.current = null;
    return stroke;
  }, []);

  const paintOnCanvas = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    brush: BrushSettings,
    canvasScale: number = 1
  ) => {
    const scaledSize = brush.size * canvasScale;
    const scaledX = x * canvasScale;
    const scaledY = y * canvasScale;

    ctx.save();
    ctx.globalAlpha = brush.opacity / 100;

    // Create radial gradient for feathered brush
    const gradient = ctx.createRadialGradient(scaledX, scaledY, 0, scaledX, scaledY, scaledSize / 2);
    const featherStart = 1 - (brush.feather / 100);
    gradient.addColorStop(0, brush.color);
    gradient.addColorStop(Math.max(0, featherStart), brush.color);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(scaledX, scaledY, scaledSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, []);

  return {
    settings,
    isPainting,
    updateSetting,
    setSettings,
    startStroke,
    continueStroke,
    endStroke,
    paintOnCanvas,
    strokes: strokesRef.current,
  };
}
