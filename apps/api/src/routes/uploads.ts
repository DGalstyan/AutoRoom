import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { env } from '../config/env';
import { badRequest } from '../lib/errors';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

/**
 * File uploads.
 *
 * Local disk, not S3. `references/admin.md` calls for presigned uploads to
 * S3-compatible storage, and that remains the production shape — but no bucket
 * is configured yet, and an album editor that cannot accept a file is not an
 * album editor. This keeps the contract the eventual S3 version will honour:
 * the client posts a file and receives a URL it stores as-is, so swapping the
 * storage backend does not touch the client or the Car rows.
 *
 * The constraint worth knowing: files live on the API server's disk, so they do
 * not survive a container rebuild and do not exist on a second instance.
 */
export const uploadsRouter = Router();

export const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/avif', '.avif'],
  ['image/gif', '.gif'],
  ['image/svg+xml', '.svg'],
  ['image/x-icon', '.ico'],
  ['image/vnd.microsoft.icon', '.ico'],
  ['video/mp4', '.mp4'],
  ['video/webm', '.webm'],
]);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, done) => done(null, UPLOAD_DIR),
    filename: (_req, file, done) => {
      // Random name, extension derived from the declared type rather than the
      // uploaded filename — the client controls that string, and it is the
      // usual way a ".php" ends up on disk.
      const extension = ALLOWED.get(file.mimetype) ?? '';
      done(null, `${crypto.randomBytes(16).toString('hex')}${extension}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, done) => {
    if (!ALLOWED.has(file.mimetype)) {
      done(new Error(`Unsupported file type "${file.mimetype}"`));
      return;
    }
    done(null, true);
  },
});

/**
 * Gated on `media:CREATE` rather than `cars:UPDATE`: the same endpoint will
 * serve machinery, offers and order documents, and each of those has its own
 * resource permission. Holding any of them should not imply the others.
 */
uploadsRouter.post(
  '/uploads',
  requireAuth,
  requirePermission('media', 'CREATE'),
  (req, res, next) => {
    upload.single('file')(req, res, (error: unknown) => {
      if (error instanceof multer.MulterError) {
        next(
          badRequest(
            error.code === 'LIMIT_FILE_SIZE' ? 'File is larger than 25 MB' : error.message,
          ),
        );
        return;
      }
      if (error instanceof Error) {
        next(badRequest(error.message));
        return;
      }
      next();
    });
  },
  (req, res) => {
    const file = req.file;
    if (!file) throw badRequest('No file was uploaded');

    // Absolute so the admin — served from a different origin — can render it
    // without knowing where the API lives.
    res.status(201).json({
      url: `${env.PUBLIC_API_URL}/uploads/${file.filename}`,
      filename: file.filename,
      size: file.size,
      mimeType: file.mimetype,
    });
  },
);
