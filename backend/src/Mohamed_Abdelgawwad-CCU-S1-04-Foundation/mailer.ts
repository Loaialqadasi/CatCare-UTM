import nodemailer from 'nodemailer';
import { env } from './env.js';
import { logger } from './logger.js';

/**
 * Send a password reset email to the user.
 *
 * If SMTP environment variables are not configured, the reset URL is logged
 * to the console instead. This is the development/test fallback.
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    // Development fallback: log the reset URL so testers can use it
    logger.info({ to, resetUrl }, 'Password reset email (SMTP not configured — URL logged)');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: (env.SMTP_PORT ?? 587) === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  const fromAddress = env.SMTP_FROM ?? `"CatCare UTM" <${env.SMTP_USER}>`;

  try {
    await transporter.sendMail({
      from: fromAddress,
      to,
      subject: 'CatCare UTM — Password Reset',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested a password reset for your CatCare UTM account.</p>
          <p>Click the link below to set a new password. This link expires in 1 hour.</p>
          <p>
            <a href="${resetUrl}"
               style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
              Reset Password
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            If you did not request this, you can safely ignore this email.
            The link will expire automatically.
          </p>
        </div>
      `,
      text: `You requested a password reset for your CatCare UTM account.\n\nClick the link below to set a new password (expires in 1 hour):\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.`,
    });

    logger.info({ to }, 'Password reset email sent successfully');
  } catch (error) {
    logger.error({ error, to }, 'Failed to send password reset email');
    // Don't throw — we don't want email sending failures to break the forgot-password flow
    // The user will see the success message either way (prevents email enumeration)
  }
}

/**
 * Send an email verification email to the user.
 *
 * If SMTP environment variables are not configured, the verification URL is logged
 * to the console instead.
 */
export async function sendVerificationEmail(to: string, verificationUrl: string): Promise<void> {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    logger.info({ to, verificationUrl }, 'Email verification (SMTP not configured — URL logged)');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: (env.SMTP_PORT ?? 587) === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  const fromAddress = env.SMTP_FROM ?? `"CatCare UTM" <${env.SMTP_USER}>`;

  try {
    await transporter.sendMail({
      from: fromAddress,
      to,
      subject: 'CatCare UTM — Verify Your Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to CatCare UTM!</h2>
          <p>Please verify your email address to activate your account.</p>
          <p>
            <a href="${verificationUrl}"
               style="display: inline-block; padding: 12px 24px; background-color: #16a34a; color: white; text-decoration: none; border-radius: 6px;">
              Verify Email
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This link expires in 24 hours. If you did not create an account, you can ignore this email.
          </p>
        </div>
      `,
      text: `Please verify your email address for CatCare UTM.\n\nClick the link below (expires in 24 hours):\n${verificationUrl}\n\nIf you did not create an account, you can ignore this email.`,
    });

    logger.info({ to }, 'Verification email sent successfully');
  } catch (error) {
    logger.error({ error, to }, 'Failed to send verification email');
  }
}
