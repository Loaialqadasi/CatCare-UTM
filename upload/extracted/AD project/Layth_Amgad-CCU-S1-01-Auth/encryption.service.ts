import crypto from 'crypto';
import { env } from '../config/env';

// Encryption service for sensitive data at rest
// Uses AES-256-GCM for authenticated encryption
export const encryptionService = {
  // Encrypt sensitive data with authenticated encryption
  encrypt(plaintext: string): { ciphertext: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(env.ENCRYPTION_KEY, 'hex'), iv);

    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      ciphertext,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  },

  // Decrypt sensitive data with verification
  decrypt(ciphertext: string, iv: string, authTag: string): string {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(env.ENCRYPTION_KEY, 'hex'),
      Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  },

  // Hash sensitive data one-way for comparison
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  },

  // Generate secure random token for password reset
  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
};
