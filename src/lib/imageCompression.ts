import imageCompression from 'browser-image-compression';

// Manual check: verify the Lovable Cloud project region is ap-south-1 (Mumbai) so uploads from India stay regional.
export async function compressForGallery(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 2000,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.85,
  };

  const compressed = await imageCompression(file, options);
  const baseName = file.name.replace(/\.[^.]+$/, '');

  return new File([compressed], `${baseName}.jpg`, {
    type: 'image/jpeg',
    lastModified: file.lastModified,
  });
}