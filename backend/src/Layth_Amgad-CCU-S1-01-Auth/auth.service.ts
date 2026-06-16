import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/env.js';
import { AuthenticationError, ConflictError, ValidationError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';
import { logger } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/logger.js';
import { sendPasswordResetEmail } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/mailer.js';
import { authRepository } from './auth.repository.js';
import { AuthResult, LoginInput, RegisterInput, User, ForgotPasswordResult, ResetPasswordResult, RefreshTokenResult } from './auth.types.js';

// sign a JWT with the user's info — access token lasts however long JWT_EXPIRES_IN says
const signToken = (user: User, expiresIn?: string): string => {
  const exp = expiresIn ?? env.JWT_EXPIRES_IN;
  return jwt.sign(
    { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    env.JWT_SECRET,
    { expiresIn: exp as jwt.SignOptions['expiresIn'] }
  );
};

// sign a refresh token — 7 days by default
const signRefreshToken = (user: User): string => {
  const expiresIn = env.JWT_REFRESH_EXPIRES_IN;
  return jwt.sign(
    { id: user.id, type: 'refresh' },
    env.JWT_SECRET,
    { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
  );
};

// sign a verification token with a specific type claim
const signTypedToken = (userId: number, type: string, expiresIn: string): string => {
  return jwt.sign(
    { id: userId, type },
    env.JWT_SECRET,
    { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
  );
};

// verify a typed token (email_verification, refresh)
const verifyTypedToken = (token: string, expectedType: string): { id: number } => {
  const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload & { id: number; type?: string };
  if (payload.type !== expectedType) {
    throw new ValidationError(`Invalid token type. Expected "${expectedType}".`);
  }
  return { id: payload.id };
};

// Hash a raw token with SHA-256 for database storage
const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const email = input.email.toLowerCase();
    const existing = await authRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('This email is already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    // Email verification is disabled — all users are auto-verified on registration.
    const emailVerified = true;

    const user = await authRepository.create({
      fullName: input.fullName,
      email,
      passwordHash,
      role: 'student',
      emailVerified,
    });

    const token = signToken(user);
    const refreshToken = signRefreshToken(user);

    return { user, token, refreshToken };
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const email = input.email.toLowerCase();
    const user = await authRepository.findByEmail(email);
    if (!user) {
      throw new AuthenticationError('Invalid UTM email or password');
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new AuthenticationError('Invalid UTM email or password');
    }

    // never send the password hash back to the client
    const { passwordHash, ...safeUser } = user;
    const token = signToken(safeUser);
    const refreshToken = signRefreshToken(safeUser);
    return { user: safeUser, token, refreshToken };
  },

  async getMe(userId: number): Promise<User> {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new AuthenticationError('Invalid or expired token');
    }
    return user;
  },

  async forgotPassword(email: string): Promise<ForgotPasswordResult> {
    const user = await authRepository.findByEmail(email.toLowerCase());

    // Always return the same success message to prevent email enumeration
    if (!user) {
      return { message: 'If an account with that email exists, a reset link has been sent.' };
    }

    // Generate a cryptographically secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');

    // Store SHA-256 hash of the token in the password_resets table, expires in 1 hour
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await authRepository.createPasswordReset(user.id, tokenHash, expiresAt);

    // Clean up expired reset tokens (best-effort, non-blocking)
    authRepository.deleteExpiredResets().catch(() => {});

    // Send the reset email with the raw token (not the hash)
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;
    sendPasswordResetEmail(email, resetUrl).catch((err) => {
      logger.error({ err, email }, 'Failed to send password reset email (non-blocking)');
    });

    // In development, include the token in the response for testing
    if (env.NODE_ENV === 'development') {
      return { message: 'If an account with that email exists, a reset link has been sent.', token: rawToken };
    }

    return { message: 'If an account with that email exists, a reset link has been sent.' };
  },

  async resetPassword(token: string, newPassword: string): Promise<ResetPasswordResult> {
    // Hash the raw token with SHA-256 to look it up in the database
    const tokenHash = hashToken(token);

    // Find a valid (unused, not expired) reset record
    const reset = await authRepository.findValidReset(tokenHash);
    if (!reset) {
      throw new AuthenticationError('Invalid or expired reset link');
    }

    // Hash the new password with bcrypt cost 12
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update the user's password
    await authRepository.updatePasswordHash(reset.userId, newPasswordHash);

    // Mark the reset token as used so it can't be reused
    await authRepository.markResetUsed(tokenHash);

    return { message: 'Password has been reset successfully.' };
  },

  async refreshToken(token: string): Promise<RefreshTokenResult> {
    try {
      const { id } = verifyTypedToken(token, 'refresh');
      const user = await authRepository.findById(id);
      if (!user) {
        throw new AuthenticationError('Invalid refresh token');
      }

      const newAccessToken = signToken(user);
      return { token: newAccessToken };
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof ValidationError) {
        throw error;
      }
      throw new AuthenticationError('Invalid or expired refresh token');
    }
  },

  // ─── Admin: User Management ───

  async listUsers(): Promise<User[]> {
    return authRepository.listAll();
  },

  async adminCreateUser(input: { fullName: string; email: string; password: string; role: string }): Promise<User> {
    const email = input.email.toLowerCase();
    const existing = await authRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('This email is already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await authRepository.create({
      fullName: input.fullName,
      email,
      passwordHash,
      role: input.role as User['role'],
      emailVerified: true,
    });

    return user;
  },

  async updateUser(userId: number, data: { fullName?: string; email?: string }): Promise<User> {
    // If email is being changed, check for conflicts
    if (data.email) {
      const existing = await authRepository.findByEmail(data.email.toLowerCase());
      if (existing && existing.id !== userId) {
        throw new ConflictError('This email is already registered by another user');
      }
    }

    const user = await authRepository.updateDetails(userId, data);
    if (!user) {
      throw new AuthenticationError('User not found');
    }
    return user;
  },

  async updateUserRole(userId: number, role: string): Promise<User> {
    const user = await authRepository.updateRole(userId, role);
    if (!user) {
      throw new AuthenticationError('User not found');
    }
    return user;
  },

  async deleteUser(userId: number): Promise<void> {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }
    await authRepository.deleteById(userId);
  },
};
