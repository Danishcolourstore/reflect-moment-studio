import exifr from 'exifr';

export async function readExif(file: File) {
  try {
    const exif = await exifr.parse(file);
    return {
      camera: `${exif?.Make || ''} ${exif?.Model || ''}`.trim(),
      iso: exif?.ISO,
      aperture: exif?.FNumber,
      flash: exif?.Flash,
      time: exif?.DateTimeOriginal,
      lens: exif?.LensModel,
    };
  } catch {
    return {};
  }
}
