import multer from 'multer';
import { uploadToStorage } from './supabase-storage.js';
import { ValidationError } from './errors.js';

export interface UploadResult {
  url: string;
  publicId: string | null;
}

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    return cb(new ValidationError('Only JPG, PNG, or WEBP images are allowed', { field: 'photo' }));
  }
  cb(null, true);
};

// Memory storage — file never touches disk, streamed directly to Supabase Storage
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

/**
 * Upload an image buffer. Uses Supabase Storage if configured.
 * If Supabase is NOT configured (or upload fails), returns a base64 data URL
 * of the actual image so that the rest of the application still works.
 */
export const uploadImage = async (
  buffer: Buffer,
  folder = 'catcare-utm'
): Promise<UploadResult> => {
  return uploadToStorage(buffer, folder);
};
