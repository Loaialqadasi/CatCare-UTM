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

  // Supabase — persistent file uploads (images stored in Supabase Storage)
  // Free tier: 1GB storage, no credit card required
  // Setup: https://supabase.com → Create project → Project Settings → API
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_BUCKET: z.string().default('uploads'),

  // Google Maps
  GOOGLE_MAPS_API_KEY: z.string().optional(),

  // SMTP — for sending password reset and email verification emails
  // UTM uses Microsoft 365 / Exchange Online. Recommended settings:
  //   SMTP_HOST = smtp.office365.com
  //   SMTP_PORT = 587  (STARTTLS — NOT port 465)
  //   SMTP_USER = your-utm-email@utm.my
  //   SMTP_PASS = your UTM password (or app password if MFA is enabled)
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

// Startup check: warn if Supabase is not configured in production
if (env.NODE_ENV === 'production' && (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)) {
  console.warn(
    '⚠️  Supabase Storage is not configured. Photo uploads will fall back to base64 data URLs (not recommended for production). ' +
    'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable persistent image storage.'
  );
}
