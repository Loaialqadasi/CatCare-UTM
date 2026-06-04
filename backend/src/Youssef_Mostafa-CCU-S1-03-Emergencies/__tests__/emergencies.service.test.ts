// Mock env and database modules to avoid requiring real env vars / DB connection
jest.mock('../../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 3001,
    DATABASE_HOST: 'localhost',
    DATABASE_PORT: 5432,
    DATABASE_USER: 'test',
    DATABASE_PASSWORD: 'test',
    DATABASE_NAME: 'test',
    JWT_SECRET: 'test-secret-that-is-at-least-32-chars-long!!',
    JWT_EXPIRES_IN: '1h',
    CORS_ORIGIN: 'http://localhost:3000',
    CLOUDINARY_CLOUD_NAME: 'test',
    CLOUDINARY_API_KEY: 'test',
    CLOUDINARY_API_SECRET: 'test',
  },
}));

jest.mock('../../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/database.js', () => ({
  db: {
    query: jest.fn(),
    on: jest.fn(),
  },
}));

import { isValidStatusTransition } from '../emergencies.service.js';

describe('isValidStatusTransition', () => {
  // ── open ──────────────────────────────────────────────────────
  describe('from "open"', () => {
    it('open -> in_progress: valid', () => {
      expect(isValidStatusTransition('open', 'in_progress')).toBe(true);
    });
    it('open -> resolved: valid', () => {
      expect(isValidStatusTransition('open', 'resolved')).toBe(true);
    });
    it('open -> cancelled: valid', () => {
      expect(isValidStatusTransition('open', 'cancelled')).toBe(true);
    });
    it('open -> open: valid (no-op)', () => {
      expect(isValidStatusTransition('open', 'open')).toBe(true);
    });
  });

  // ── in_progress ───────────────────────────────────────────────
  describe('from "in_progress"', () => {
    it('in_progress -> open: valid', () => {
      expect(isValidStatusTransition('in_progress', 'open')).toBe(true);
    });
    it('in_progress -> resolved: valid', () => {
      expect(isValidStatusTransition('in_progress', 'resolved')).toBe(true);
    });
    it('in_progress -> cancelled: valid', () => {
      expect(isValidStatusTransition('in_progress', 'cancelled')).toBe(true);
    });
    it('in_progress -> in_progress: valid (no-op)', () => {
      expect(isValidStatusTransition('in_progress', 'in_progress')).toBe(true);
    });
  });

  // ── resolved ──────────────────────────────────────────────────
  describe('from "resolved"', () => {
    it('resolved -> open: valid', () => {
      expect(isValidStatusTransition('resolved', 'open')).toBe(true);
    });
    it('resolved -> in_progress: valid', () => {
      expect(isValidStatusTransition('resolved', 'in_progress')).toBe(true);
    });
    it('resolved -> cancelled: valid', () => {
      expect(isValidStatusTransition('resolved', 'cancelled')).toBe(true);
    });
    it('resolved -> resolved: valid (no-op)', () => {
      expect(isValidStatusTransition('resolved', 'resolved')).toBe(true);
    });
  });

  // ── cancelled ─────────────────────────────────────────────────
  describe('from "cancelled"', () => {
    it('cancelled -> open: INVALID', () => {
      expect(isValidStatusTransition('cancelled', 'open')).toBe(false);
    });
    it('cancelled -> in_progress: INVALID', () => {
      expect(isValidStatusTransition('cancelled', 'in_progress')).toBe(false);
    });
    it('cancelled -> resolved: INVALID', () => {
      expect(isValidStatusTransition('cancelled', 'resolved')).toBe(false);
    });
    it('cancelled -> cancelled: valid (no-op)', () => {
      expect(isValidStatusTransition('cancelled', 'cancelled')).toBe(true);
    });
  });
});
