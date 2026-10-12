import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

/**
 * Photos straight from a phone or camera are 10–30 MB and 4000+ px wide. Every visitor's browser,
 * and the web app's image optimizer, has to download the whole file just to draw a 400px card,
 * which is what made team and office photos take seconds to appear. Anything shown on the site
 * fits comfortably in 2560px, so larger images are scaled down once, when they arrive.
 */
export const MAX_IMAGE_EDGE = 2560;
/** Files at or under this size and edge are left exactly as uploaded. */
const SKIP_BELOW_BYTES = 600 * 1024;

const SHRINKABLE = new Set(['.jpg', '.jpeg', '.png', '.webp']);

// One file at a time: this can run on the same container that serves live traffic.
sharp.concurrency(1);

export type ShrinkResult = { shrunk: boolean; before: number; after: number };

/**
 * Rewrites an image on disk, in place and under the same name (so every stored URL keeps working),
 * when it is larger than `MAX_IMAGE_EDGE` or heavy. The result replaces the file only if it is
 * actually smaller. SVG, GIF, video and unreadable files are left alone.
 */
export async function shrinkImageInPlace(filePath: string): Promise<ShrinkResult> {
  const extension = path.extname(filePath).toLowerCase();
  const before = (await fs.stat(filePath)).size;
  const untouched = { shrunk: false, before, after: before };
  if (!SHRINKABLE.has(extension)) return untouched;

  try {
    const metadata = await sharp(filePath).metadata();
    const edge = Math.max(metadata.width ?? 0, metadata.height ?? 0);
    if (!edge || (edge <= MAX_IMAGE_EDGE && before <= SKIP_BELOW_BYTES)) return untouched;

    const pipeline = sharp(filePath)
      .rotate() // apply the camera's EXIF orientation before the metadata is dropped
      .resize({
        width: MAX_IMAGE_EDGE,
        height: MAX_IMAGE_EDGE,
        fit: 'inside',
        withoutEnlargement: true,
      });
    const buffer = await (
      extension === '.png'
        ? pipeline.png({ compressionLevel: 9 })
        : extension === '.webp'
          ? pipeline.webp({ quality: 82 })
          : pipeline.jpeg({ quality: 82, mozjpeg: true })
    ).toBuffer();

    if (buffer.length >= before) return untouched;
    const temp = `${filePath}.shrinking`;
    await fs.writeFile(temp, buffer);
    await fs.rename(temp, filePath);
    return { shrunk: true, before, after: buffer.length };
  } catch {
    return untouched;
  }
}

/** Shrinks every existing upload (idempotent: files already small are skipped). */
export async function shrinkAllUploads(
  dir: string,
): Promise<{ shrunk: number; savedBytes: number }> {
  let shrunk = 0;
  let savedBytes = 0;
  for (const name of await fs.readdir(dir)) {
    if (name.endsWith('.shrinking')) {
      await fs.rm(path.join(dir, name), { force: true });
      continue;
    }
    const result = await shrinkImageInPlace(path.join(dir, name));
    if (result.shrunk) {
      shrunk += 1;
      savedBytes += result.before - result.after;
    }
  }
  return { shrunk, savedBytes };
}
