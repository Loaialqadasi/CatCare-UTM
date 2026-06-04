import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535),
  DATABASE_HOST: z.string().min(1),
  DATABASE_PORT: z.coerce.number().int().min(1).max(65535),
  DATABASE_USER: z.string().min(1),
  DATABASE_PASSWORD: z.string().default(''),
  DATABASE_NAME: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().min(1),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().min(1),
  ENCRYPTION_KEY: z.string().regex(
    /^[0-9a-fA-F]{64}$/,
    'ENCRYPTION_KEY must be a 64-character hex string (run: openssl rand -hex 32)'
  ).optional(),
  CSRF_SECRET: z.string().min(32).optional(),
  LOGTAIL_TOKEN: z.string().optional(),

  // Cloudinary — persistent file uploads (images stored in cloud)
  // Optional: if not set, photo uploads will return a clear error in production.
  // In development, photos fall back to local disk storage.
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_URL: z.string().optional(),

  // Google Maps
  GOOGLE_MAPS_API_KEY: z.string().optional(),

  // SMTP — for sending password reset and email verification emails
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  // Frontend URL — used to construct email links (password reset, email verification)
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const message = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid environment configuration: ${message}`);
}

export const env = parsed.data;

// Startup check: warn if Cloudinary is not configured in production
// (photo uploads will fail with a clear error, but the server can still start)
if (env.NODE_ENV === 'production' && !env.CLOUDINARY_URL && (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET)) {
  console.warn(
    '⚠️  Cloudinary is not configured. Photo uploads will fail. ' +
    'Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET to enable image storage.'
  );
}
