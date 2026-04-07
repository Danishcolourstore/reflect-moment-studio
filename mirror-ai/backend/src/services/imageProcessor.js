import path from "node:path";
import sharp from "sharp";
import { config } from "../config.js";
import { storagePaths } from "../storage/paths.js";
import { ensureDir } from "../utils/fs.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const applyTexture = async (buffer, texture) => {
  const softened = await sharp(buffer)
    .blur(texture.smoothSigma)
    .modulate({ brightness: 1, saturation: 1 })
    .sharpen(texture.sharpenSigma, texture.sharpenM1, texture.sharpenM2)
    .toBuffer();

  if (!texture.grain || texture.grain <= 0.005) {
    return softened;
  }

  const image = sharp(softened);
  const metadata = await image.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (!width || !height) {
    return softened;
  }

  const pixelCount = width * height;
  const noise = Buffer.alloc(pixelCount * 3);
  const strength = clamp(texture.grain, 0, 0.25);

  for (let index = 0; index < noise.length; index += 1) {
    const randomByte = Math.floor(127 + (Math.random() - 0.5) * 255 * strength);
    noise[index] = clamp(randomByte, 0, 255);
  }

  const grainLayer = await sharp(noise, {
    raw: { width, height, channels: 3 },
  })
    .jpeg({ quality: 76 })
    .toBuffer();

  return sharp(softened)
    .composite([{ input: grainLayer, blend: "overlay", opacity: clamp(strength * 0.8, 0, 0.18) }])
    .toBuffer();
};

const applyColor = (instance, color) =>
  instance
    .modulate({
      brightness: 1 + color.brightness / 420,
      saturation: color.saturation,
    })
    .linear(color.contrast, color.brightness * 0.15)
    .gamma(color.gamma)
    .recomb([
      [color.tint.red, 0, 0],
      [0, 1, 0],
      [0, 0, color.tint.blue],
    ]);

export const processImage = async ({ originalPath, imageId, adjustments }) => {
  const previewName = `${imageId}.jpg`;
  const fullName = `${imageId}.jpg`;
  const previewPath = path.join(storagePaths.processedPreview, previewName);
  const fullPath = path.join(storagePaths.processedFull, fullName);

  await Promise.all([
    ensureDir(path.dirname(previewPath)),
    ensureDir(path.dirname(fullPath)),
  ]);

  const fullBase = applyColor(
    sharp(originalPath).rotate().removeAlpha().jpeg({ quality: config.processor.jpegQualityFull }),
    adjustments.color,
  );
  const fullBuffer = await fullBase.toBuffer();
  const fullTextured = await applyTexture(fullBuffer, adjustments.texture);
  await sharp(fullTextured).jpeg({ quality: config.processor.jpegQualityFull }).toFile(fullPath);

  const previewBase = applyColor(
    sharp(originalPath)
      .rotate()
      .resize({ width: config.processor.previewWidth, withoutEnlargement: true })
      .removeAlpha()
      .jpeg({ quality: config.processor.jpegQualityPreview }),
    adjustments.color,
  );
  const previewBuffer = await previewBase.toBuffer();
  const previewTextured = await applyTexture(previewBuffer, adjustments.texture);
  await sharp(previewTextured)
    .jpeg({ quality: config.processor.jpegQualityPreview })
    .toFile(previewPath);

  return {
    previewPath,
    fullPath,
  };
};
