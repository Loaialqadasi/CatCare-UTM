import fs from 'fs';
import path from 'path';
import { logger } from './logger.js';

/**
 * Upload utility with Cloudinary support (when configured)
 * and local disk fallback.
 *
 * To enable Cloudinary:
 * 1. npm install cloudinary
 * 2. Add CLOUDINARY_URL env var (or CLOUD_NAME + CLOUD_API_KEY + CLOUD_API_SECRET)
 *
 * When Cloudinary is not configured, files are served from local disk via
 * the /uploads static route — this is fine for development but ephemeral
 * in production on platforms like Render.
 */

export interface UploadResult {
  url: string;
  publicId?: string;
}

async function uploadToLocal(filePath: string): Promise<UploadResult> {
  // Files are already saved to disk by multer — just return the URL path
  const filename = path.basename(filePath);
  return { url: `/uploads/cats/${filename}` };
}

async function uploadToCloudinary(filePath: string): Promise<UploadResult> {
  try {
    // Dynamic import of optional cloudinary package — @ts-expect-error because
    // cloudinary is NOT listed as a dependency and may not be installed.
    // When it IS installed (via `npm install cloudinary`), this works at runtime.
    // @ts-expect-error — cloudinary is an optional peer dependency
    const cloudinary = await import('cloudinary');
    const result = await cloudinary.v2.uploader.upload(filePath, {
      folder: 'catcare-utm/cats',
      resource_type: 'auto',
      allowed_formats: ['jpg', 'png', 'webp'],
    });
    // Remove local file after successful Cloudinary upload
    await fs.promises.unlink(filePath).catch(() => {});
    return { url: result.secure_url, publicId: result.public_id };
  } catch (err) {
    logger.warn({ err }, 'Cloudinary upload failed, falling back to local storage');
    return uploadToLocal(filePath);
  }
}

export async function uploadFile(filePath: string): Promise<UploadResult> {
  // Use Cloudinary if CLOUDINARY_URL is configured
  if (process.env.CLOUDINARY_URL || (process.env.CLOUD_NAME && process.env.CLOUD_API_KEY && process.env.CLOUD_API_SECRET)) {
    return uploadToCloudinary(filePath);
  }
  // Default: local disk storage
  return uploadToLocal(filePath);
}
