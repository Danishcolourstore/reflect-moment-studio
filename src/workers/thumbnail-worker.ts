/**
 * Web Worker for generating compressed thumbnails off the main thread.
 * Receives an image Blob, draws it onto an OffscreenCanvas, and returns
 * a compressed JPEG thumbnail Blob.
 */

const THUMB_MAX = 400;
const THUMB_QUALITY = 0.6;

self.onmessage = async (e: MessageEvent<{ id: string; blob: Blob }>) => {
  const { id, blob } = e.data;
  try {
    const bmp = await createImageBitmap(blob);
    const scale = Math.min(THUMB_MAX / bmp.width, THUMB_MAX / bmp.height, 1);
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);

    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();

    const thumbBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: THUMB_QUALITY });
    self.postMessage({ id, thumbnail: thumbBlob });
  } catch (err) {
    self.postMessage({ id, error: (err as Error).message });
  }
};
