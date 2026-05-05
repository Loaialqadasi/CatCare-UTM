import crypto from 'crypto';
import { env } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/env.js';

// AES-256-GCM encryption for anything sensitive we need to store
export const encryptionService = {
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

  // one-way hash for comparing things like reset tokens
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  },

  // generate a random hex token (e.g. for password resets)
  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
};
