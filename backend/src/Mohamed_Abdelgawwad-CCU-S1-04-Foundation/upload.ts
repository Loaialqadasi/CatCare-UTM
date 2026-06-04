import multer from 'multer';
import type { UploadApiResponse } from 'cloudinary';
import { cloudinary, isCloudinaryConfigured } from './cloudinary.js';
import { env } from './env.js';
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

// Memory storage — file never touches disk, streamed directly to Cloudinary
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// Stream a buffer to Cloudinary and return a typed UploadResult
export const uploadToCloudinary = async (
  buffer: Buffer,
  folder = 'catcare-utm'
): Promise<UploadResult> => {
  if (!isCloudinaryConfigured()) {
    // Graceful fallback: return a placeholder image URL instead of crashing.
    // This allows the app to function without Cloudinary (e.g. during initial setup
    // or when Cloudinary env vars are temporarily missing).
    console.warn(
      '⚠️  Cloudinary not configured — photo saved as placeholder. ' +
      'Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET to enable real uploads.'
    );
    return {
      url: `https://placecats.com/400/400?random=${Date.now()}`,
      publicId: null,
    };
  }

  try {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Cloudinary upload failed'));
          resolve(result);
        }
      );
      stream.end(buffer);
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    // If Cloudinary upload itself fails (network error, quota exceeded, etc.),
    // return a placeholder instead of crashing the entire request.
    console.error('Cloudinary upload failed, using placeholder:', error);
    return {
      url: `https://placecats.com/400/400?random=${Date.now()}`,
      publicId: null,
    };
  }
};

/**
 * Upload an image buffer. Always attempts Cloudinary first.
 * Falls back to a placeholder URL if Cloudinary is unavailable.
 */
export const uploadImage = async (
  buffer: Buffer,
  folder = 'catcare-utm'
): Promise<UploadResult> => {
  return uploadToCloudinary(buffer, folder);
};
