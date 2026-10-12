import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { MAX_IMAGE_EDGE, shrinkAllUploads, shrinkImageInPlace } from '../src/lib/imageShrink';

async function tempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'shrink-'));
}

/** Noisy pixels so the JPEG stays big, like a real photo. */
async function bigJpeg(file: string, width: number, height: number) {
  const raw = Buffer.alloc(width * height * 3);
  for (let i = 0; i < raw.length; i += 1) raw[i] = (i * 7919) % 251;
  await sharp(raw, { raw: { width, height, channels: 3 } })
    .jpeg({ quality: 95 })
    .toFile(file);
}

describe('shrinkImageInPlace', () => {
  it('scales an oversized photo down, keeping name and format', async () => {
    const dir = await tempDir();
    const file = path.join(dir, 'a.jpg');
    await bigJpeg(file, 3600, 2400);
    const before = (await fs.stat(file)).size;

    const result = await shrinkImageInPlace(file);

    expect(result.shrunk).toBe(true);
    const meta = await sharp(file).metadata();
    expect(Math.max(meta.width!, meta.height!)).toBe(MAX_IMAGE_EDGE);
    expect(meta.format).toBe('jpeg');
    expect((await fs.stat(file)).size).toBeLessThan(before);
  });

  it('leaves small images and non-images alone', async () => {
    const dir = await tempDir();
    const small = path.join(dir, 'small.jpg');
    await sharp({ create: { width: 300, height: 200, channels: 3, background: '#888' } })
      .jpeg()
      .toFile(small);
    const svg = path.join(dir, 'logo.svg');
    await fs.writeFile(svg, '<svg xmlns="http://www.w3.org/2000/svg"/>');

    expect((await shrinkImageInPlace(small)).shrunk).toBe(false);
    expect((await shrinkImageInPlace(svg)).shrunk).toBe(false);
  });

  it('shrinks a whole folder and cleans leftovers', async () => {
    const dir = await tempDir();
    await bigJpeg(path.join(dir, 'one.jpg'), 3000, 2000);
    await fs.writeFile(path.join(dir, 'half.jpg.shrinking'), 'x');

    const summary = await shrinkAllUploads(dir);

    expect(summary.shrunk).toBe(1);
    expect(await fs.readdir(dir)).toEqual(['one.jpg']);
  });
});
