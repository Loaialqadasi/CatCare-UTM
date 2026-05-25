import { z } from 'zod';

// only @utm.my and @graduate.utm.my emails are allowed
const UTM_EMAIL_DOMAINS = ['@utm.my', '@graduate.utm.my'];
const normalizeSpaces = (value: string) => value.trim().replace(/\s+/g, ' ');

export const emailSchema = z
  .string()
  .trim()
  .email()
  .transform((value) => value.toLowerCase())
  .refine((value) => UTM_EMAIL_DOMAINS.some((domain) => value.endsWith(domain)), {
    message: 'Email must be from @utm.my or @graduate.utm.my domain'
  });

export const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters' })
  .refine(
    (value) => /[!@#$%^&*()_+\-=\[\]{};:'",./<>?\\|`~]/.test(value),
    { message: 'Password must contain at least one special character (!@#$%^&*...)' }
  );

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, { message: 'Full name is required' })
    .transform((value) => normalizeSpaces(value))
    .refine((value) => value.split(' ').length >= 2, {
      message: 'Full name must contain at least two words'
    }),
  email: emailSchema,
  password: passwordSchema
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: 'Password is required' })
});

// MED-9: Password reset schemas (skeleton — email sending not yet configured)
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
});
