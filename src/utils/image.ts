/**
 * Downscale a user-selected photo and re-encode it as a JPEG data URL.
 * Phone camera photos are several MB; stored raw as base64 they overflow
 * localStorage (~5 MB) and bloat every cloud sync.
 */
export async function fileToCompressedDataUrl(
  file: File,
  maxDimension = 1280,
  quality = 0.8
): Promise<string> {
  const sourceUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Unable to read this image.'));
      el.src = sourceUrl;
    });

    const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Unable to process this image.');
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}
