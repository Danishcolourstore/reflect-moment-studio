import { useRef, useCallback, useEffect, useState } from 'react';

export interface CanvasLayer {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  opacity: number;
  canvas: HTMLCanvasElement;
  order: number;
}

export interface CanvasEngineState {
  width: number;
  height: number;
  zoom: number;
  panX: number;
  panY: number;
}

export function useCanvasEngine(imageUrl: string) {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const layersRef = useRef<CanvasLayer[]>([]);
  const [layers, setLayers] = useState<CanvasLayer[]>([]);
  const [engineState, setEngineState] = useState<CanvasEngineState>({
    width: 0, height: 0, zoom: 1, panX: 0, panY: 0,
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const rafRef = useRef<number>(0);

  // Load source image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      sourceImageRef.current = img;
      setEngineState(prev => ({ ...prev, width: img.naturalWidth, height: img.naturalHeight }));
      setIsLoaded(true);
      renderComposite();
    };
    img.onerror = () => console.error('Failed to load image');
    img.src = imageUrl;

    return () => {
      sourceImageRef.current = null;
      layersRef.current = [];
      setLayers([]);
    };
  }, [imageUrl]);

  const createLayer = useCallback((name: string, type: string): CanvasLayer => {
    const img = sourceImageRef.current;
    const w = img?.naturalWidth || 1200;
    const h = img?.naturalHeight || 800;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const layer: CanvasLayer = {
      id: crypto.randomUUID(),
      name,
      type,
      visible: true,
      opacity: 1,
      canvas,
      order: layersRef.current.length,
    };
    layersRef.current.push(layer);
    setLayers([...layersRef.current]);
    return layer;
  }, []);

  const removeLayer = useCallback((id: string) => {
    layersRef.current = layersRef.current.filter(l => l.id !== id);
    setLayers([...layersRef.current]);
    renderComposite();
  }, []);

  const toggleLayerVisibility = useCallback((id: string) => {
    const layer = layersRef.current.find(l => l.id === id);
    if (layer) {
      layer.visible = !layer.visible;
      setLayers([...layersRef.current]);
      renderComposite();
    }
  }, []);

  const setLayerOpacity = useCallback((id: string, opacity: number) => {
    const layer = layersRef.current.find(l => l.id === id);
    if (layer) {
      layer.opacity = opacity;
      setLayers([...layersRef.current]);
      renderComposite();
    }
  }, []);

  const getLayerCanvas = useCallback((id: string): HTMLCanvasElement | null => {
    return layersRef.current.find(l => l.id === id)?.canvas || null;
  }, []);

  const renderComposite = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const canvas = mainCanvasRef.current;
      const img = sourceImageRef.current;
      if (!canvas || !img) return;

      const container = canvas.parentElement;
      if (!container) return;
      const displayW = container.clientWidth;
      const displayH = container.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      // Fit image in container
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const containerRatio = displayW / displayH;
      let fitW: number, fitH: number;
      if (imgRatio > containerRatio) {
        fitW = displayW;
        fitH = displayW / imgRatio;
      } else {
        fitH = displayH;
        fitW = displayH * imgRatio;
      }

      const renderW = Math.round(fitW * dpr);
      const renderH = Math.round(fitH * dpr);

      if (canvas.width !== renderW || canvas.height !== renderH) {
        canvas.width = renderW;
        canvas.height = renderH;
        canvas.style.width = fitW + 'px';
        canvas.style.height = fitH + 'px';
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, renderW, renderH);

      // Draw source image
      ctx.drawImage(img, 0, 0, renderW, renderH);

      // Composite layers in order
      const sorted = [...layersRef.current].sort((a, b) => a.order - b.order);
      for (const layer of sorted) {
        if (!layer.visible || layer.opacity <= 0) continue;
        ctx.globalAlpha = layer.opacity;
        ctx.drawImage(layer.canvas, 0, 0, renderW, renderH);
        ctx.globalAlpha = 1;
      }
    });
  }, []);

  const getSourceImageData = useCallback((): ImageData | null => {
    const img = sourceImageRef.current;
    if (!img) return null;
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, c.width, c.height);
  }, []);

  const exportFullResolution = useCallback(async (quality = 0.95): Promise<Blob | null> => {
    const img = sourceImageRef.current;
    if (!img) return null;

    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0);

    const sorted = [...layersRef.current].sort((a, b) => a.order - b.order);
    for (const layer of sorted) {
      if (!layer.visible || layer.opacity <= 0) continue;
      ctx.globalAlpha = layer.opacity;
      ctx.drawImage(layer.canvas, 0, 0);
      ctx.globalAlpha = 1;
    }

    return new Promise((resolve) => {
      c.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
    });
  }, []);

  return {
    mainCanvasRef,
    sourceImageRef,
    layers,
    engineState,
    isLoaded,
    createLayer,
    removeLayer,
    toggleLayerVisibility,
    setLayerOpacity,
    getLayerCanvas,
    getSourceImageData,
    renderComposite,
    exportFullResolution,
  };
}
