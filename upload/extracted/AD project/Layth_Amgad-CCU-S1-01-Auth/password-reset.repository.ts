import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { db } from '../../config/database';
import { PasswordResetToken } from './password-reset.types';

interface PasswordResetTokenRow extends RowDataPacket {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

const mapPasswordResetToken = (row: PasswordResetTokenRow): PasswordResetToken => ({
  id: row.id,
  userId: row.user_id,
  token: row.token,
  expiresAt: row.expires_at,
  usedAt: row.used_at,
  createdAt: row.created_at
});

export const passwordResetRepository = {
  // Create password reset token
  async createToken(userId: number, token: string, expiresAt: string): Promise<PasswordResetToken> {
    const [result] = await db.execute<ResultSetHeader>(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [userId, token, expiresAt]
    );

    const [rows] = await db.execute<PasswordResetTokenRow[]>(
      'SELECT id, user_id, token, expires_at, used_at, created_at FROM password_reset_tokens WHERE id = ? LIMIT 1',
      [result.insertId]
    );

    return mapPasswordResetToken(rows[0]);
  },

  // Find valid password reset token
  async findToken(token: string): Promise<PasswordResetToken | null> {
    const [rows] = await db.execute<PasswordResetTokenRow[]>(
      'SELECT id, user_id, token, expires_at, used_at, created_at FROM password_reset_tokens WHERE token = ? AND expires_at > NOW() AND used_at IS NULL LIMIT 1',
      [token]
    );

    if (rows.length === 0) return null;
    return mapPasswordResetToken(rows[0]);
  },

  // Mark token as used
  async markTokenAsUsed(tokenId: number): Promise<void> {
    await db.execute(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?',
      [tokenId]
    );
  },

  // Invalidate all tokens for user
  async invalidateUserTokens(userId: number): Promise<void> {
    await db.execute(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
      [userId]
    );
  }
};
