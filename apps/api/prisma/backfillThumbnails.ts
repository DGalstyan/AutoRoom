import crypto from 'node:crypto';
import path from 'node:path';
import dotenv from 'dotenv';
import sharp from 'sharp';
import { PrismaClient } from '@prisma/client';
import { UPLOAD_DIR } from '../src/routes/uploads';
import { env } from '../src/config/env';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

const THUMBNAIL_MAX_DIMENSION = 480;
const THUMBNAIL_QUALITY = 90;

// Deliberately slow: this walks every pre-existing image on disk, on the
// same container that's serving live traffic, so it throttles itself with a
// pause between each file rather than burning a burst of CPU. Override with
// BACKFILL_DELAY_MS for a faster (or, on a quiet staging DB, zero) pace.
const DELAY_MS = Number(process.env.BACKFILL_DELAY_MS ?? 3000);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * One-off backfill for `thumbnailUrl`/`photoThumbnailUrl` columns on rows
 * that predate that feature (see the `20260928091706_add_image_thumbnail_urls`
 * migration and `imageResize.ts`'s client-side `makeThumbnail`, which this
 * mirrors — same 480px cap, same "PNG stays PNG, else JPEG" rule, same
 * never-upscale/never-touch-SVG-or-GIF rules — except this runs server-side
 * with `sharp`, since there's no browser canvas here).
 *
 * NOT part of the automatic `prisma migrate deploy` boot step: it walks
 * every existing image at a deliberately slow pace (see DELAY_MS) so it
 * doesn't spike the API container's CPU while it's serving real traffic.
 * Run it by hand against production, e.g.:
 *   docker exec <api-container> npx tsx prisma/backfillThumbnails.ts
 * It's safe to interrupt and re-run — each row is only touched once
 * (thumbnail column stays null until that row succeeds), and already-thumbed
 * rows are skipped by the query itself. A row whose source file is missing,
 * unreadable, or lives outside `UPLOAD_DIR` (e.g. the bundled `/images/...`
 * placeholders that predate uploads entirely) is logged and left alone
 * rather than aborting the whole run.
 */
async function resizeToThumbnail(sourceUrl: string): Promise<string | null> {
  const filename = sourceUrl.split('/uploads/')[1];
  if (!filename) return null; // not a local-disk upload (or malformed) — leave it alone

  const extension = path.extname(filename).toLowerCase();
  if (extension === '.svg' || extension === '.gif') return null;

  const sourcePath = path.join(UPLOAD_DIR, filename);
  const image = sharp(sourcePath);
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) return null;

  if (Math.max(metadata.width, metadata.height) <= THUMBNAIL_MAX_DIMENSION) {
    return null; // already small enough — never upscale
  }

  const isPng = extension === '.png';
  const outputExtension = isPng ? '.png' : '.jpg';
  const outputFilename = `${crypto.randomBytes(16).toString('hex')}${outputExtension}`;
  const outputPath = path.join(UPLOAD_DIR, outputFilename);

  const resized = image.resize({
    width: THUMBNAIL_MAX_DIMENSION,
    height: THUMBNAIL_MAX_DIMENSION,
    fit: 'inside',
    withoutEnlargement: true,
  });
  await (isPng ? resized.png() : resized.jpeg({ quality: THUMBNAIL_QUALITY })).toFile(outputPath);

  return `${env.PUBLIC_API_URL}/uploads/${outputFilename}`;
}

async function backfillTable<Row extends { id: string }>(
  label: string,
  rows: Row[],
  sourceUrl: (row: Row) => string,
  save: (id: string, thumbnailUrl: string) => Promise<unknown>,
) {
  console.log(`${label}: ${rows.length} row(s) without a thumbnail`);
  for (const row of rows) {
    try {
      const thumbnailUrl = await resizeToThumbnail(sourceUrl(row));
      if (thumbnailUrl) {
        await save(row.id, thumbnailUrl);
        console.log(`  ${label}/${row.id}: ${thumbnailUrl}`);
      } else {
        console.log(`  ${label}/${row.id}: skipped (svg/gif/already small/not local)`);
      }
    } catch (error) {
      console.error(`  ${label}/${row.id}: FAILED — ${(error as Error).message}`);
    }
    await sleep(DELAY_MS);
  }
}

async function main() {
  console.log(`Backfilling thumbnails, ${DELAY_MS}ms between each image...`);

  await backfillTable(
    'car_images',
    await prisma.carImage.findMany({
      where: { thumbnailUrl: null },
      select: { id: true, url: true },
    }),
    (row) => row.url,
    (id, thumbnailUrl) => prisma.carImage.update({ where: { id }, data: { thumbnailUrl } }),
  );

  await backfillTable(
    'gallery_images',
    await prisma.galleryImage.findMany({
      where: { thumbnailUrl: null },
      select: { id: true, imageUrl: true },
    }),
    (row) => row.imageUrl,
    (id, thumbnailUrl) => prisma.galleryImage.update({ where: { id }, data: { thumbnailUrl } }),
  );

  await backfillTable(
    'team_members',
    await prisma.teamMember.findMany({
      where: { photoThumbnailUrl: null, photoUrl: { not: null } },
      select: { id: true, photoUrl: true },
    }),
    (row) => row.photoUrl!,
    (id, thumbnailUrl) =>
      prisma.teamMember.update({ where: { id }, data: { photoThumbnailUrl: thumbnailUrl } }),
  );

  console.log('Backfill complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
