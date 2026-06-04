import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

// Only configure Cloudinary if credentials are present
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

/** Returns true if Cloudinary credentials are configured. */
export const isCloudinaryConfigured = (): boolean =>
  !!(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

export { cloudinary };