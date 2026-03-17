import multer   from 'multer';
import path     from 'path';
import mongoose from 'mongoose';

/* ─────────────────────────────────────────────
   MIME type allowlist
   Only accept known-safe types; block executables,
   scripts, and anything else not explicitly listed.
───────────────────────────────────────────── */
const ALLOWED_MIMES = new Set([
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  // Audio
  'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/flac', 'audio/aac',
  'audio/mp4',  'audio/x-m4a',
  // Video
  'video/mp4',  'video/webm', 'video/ogg', 'video/quicktime',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Plain text / CSV
  'text/plain', 'text/csv',
]);

/** Strip path components and replace anything that is not
 *  alphanumeric, dash, dot, or underscore with an underscore.
 *  Limits filename to 200 chars to prevent oversized keys in GridFS. */
function sanitizeFilename(raw) {
  const base = path.basename(raw);              // strip any path traversal
  const safe = base
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')         // allow-list safe chars
    .replace(/\.{2,}/g, '.')                    // collapse consecutive dots
    .slice(0, 200);                             // cap length
  return safe || 'upload';
}

/* ─────────────────────────────────────────────
   Upload middleware — validated MIME type, 50 MB
───────────────────────────────────────────── */
export const fileUpload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(Object.assign(
        new Error(`File type "${file.mimetype}" is not allowed`),
        { status: 415 }
      ));
    }
  },
});

/* ─────────────────────────────────────────────
   Private GridFS helpers
───────────────────────────────────────────── */
function getBucket() {
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'businessFiles',
  });
}

function toObjectId(str) {
  try   { return new mongoose.Types.ObjectId(str); }
  catch { return null; }
}

/* ─────────────────────────────────────────────
   Controllers
───────────────────────────────────────────── */
export async function uploadFile(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const category     = (req.body.category || 'general').trim().slice(0, 50);
    const filename     = sanitizeFilename(req.file.originalname);
    const bucket       = getBucket();
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: req.file.mimetype,
      metadata:    { category, size: req.file.size },
    });

    uploadStream.on('finish', () => {
      res.status(201).json({
        _id:        uploadStream.id,
        filename,
        size:       req.file.size,
        mimetype:   req.file.mimetype,
        category,
        uploadedAt: new Date(),
      });
    });

    uploadStream.on('error', next);
    uploadStream.end(req.file.buffer);
  } catch (err) { next(err); }
}

export async function getFiles(req, res, next) {
  try {
    const bucket = getBucket();
    const filter = req.query.category
      ? { 'metadata.category': req.query.category }
      : {};

    const files = await bucket.find(filter).sort({ uploadDate: -1 }).toArray();

    res.json(files.map(f => ({
      _id:        f._id,
      filename:   f.filename,
      size:       f.length,
      mimetype:   f.contentType || 'application/octet-stream',
      category:   f.metadata?.category || 'general',
      uploadedAt: f.uploadDate,
    })));
  } catch (err) { next(err); }
}

export async function getFile(req, res, next) {
  try {
    const fileId = toObjectId(req.params.id);
    if (!fileId) return res.status(400).json({ error: 'Invalid file ID' });

    const bucket = getBucket();
    const [file] = await bucket.find({ _id: fileId }).toArray();
    if (!file) return res.status(404).json({ error: 'File not found' });

    const mimeType = file.contentType || 'application/octet-stream';
    const fileSize = file.length;

    // Browser-streamable types get inline disposition so <audio>/<video>/<img> work
    const isStreamable = /^(audio|video|image)\//i.test(mimeType) || mimeType === 'application/pdf';
    const disposition  = isStreamable ? 'inline' : 'attachment';

    res.set('Content-Type',        mimeType);
    res.set('Content-Disposition', `${disposition}; filename="${encodeURIComponent(file.filename)}"`);
    res.set('Accept-Ranges',       'bytes');

    // ── HTTP Range support — required for audio/video seeking ─────────────
    const rangeHeader = req.headers.range;
    if (rangeHeader && fileSize) {
      const [startStr, endStr] = rangeHeader.replace(/bytes=/, '').split('-');
      const start     = parseInt(startStr, 10);
      const end       = endStr ? parseInt(endStr, 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.status(206);
      res.set('Content-Range',  `bytes ${start}-${end}/${fileSize}`);
      res.set('Content-Length', String(chunkSize));
      bucket.openDownloadStream(fileId, { start, end: end + 1 }).pipe(res);
    } else {
      res.set('Content-Length', String(fileSize));
      bucket.openDownloadStream(fileId).pipe(res);
    }
  } catch (err) { next(err); }
}

export async function deleteFile(req, res, next) {
  try {
    const fileId = toObjectId(req.params.id);
    if (!fileId) return res.status(400).json({ error: 'Invalid file ID' });

    await getBucket().delete(fileId);
    res.json({ message: 'File deleted' });
  } catch (err) { next(err); }
}
