const THUMBNAIL_MAX_DIMENSION = 480;
const THUMBNAIL_QUALITY = 0.9;

/**
 * A smaller, dimension-only-resized copy of an uploaded image for grid/card
 * contexts (album thumbnails, team cards, gallery tiles, public car cards).
 * Only the pixel dimensions shrink — this deliberately doesn't lower JPEG
 * quality below what's needed to hit that size, so a thumbnail never looks
 * worse than a scaled-down version of the original would.
 *
 * Returns the original file unchanged (not a copy) when there's nothing safe
 * or useful to do: SVG has no raster dimensions to resize, GIF would lose its
 * animation by going through a canvas, and a file already at or under the
 * target size doesn't need shrinking (never upscales — that would invent
 * detail, not preserve it).
 */
export async function makeThumbnail(file: File): Promise<File> {
  if (
    !file.type.startsWith('image/') ||
    file.type === 'image/svg+xml' ||
    file.type === 'image/gif'
  ) {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // Decode failure (a corrupt or exotic file the browser can't rasterize) —
    // let the original upload proceed and surface any real problem there.
    return file;
  }

  try {
    const scale = Math.min(1, THUMBNAIL_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    if (scale === 1) return file;

    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    // PNG stays PNG (keeps transparency); everything else becomes JPEG.
    const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, outputType, THUMBNAIL_QUALITY),
    );
    if (!blob) return file;

    return new File([blob], file.name, { type: blob.type });
  } finally {
    bitmap.close();
  }
}
