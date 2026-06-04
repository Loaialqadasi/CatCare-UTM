import request from 'supertest';
import express from 'express';

// Mock env module to avoid requiring real env vars
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

import { validate } from '../../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/validate.middleware.js';
import { errorHandler } from '../../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/error.middleware.js';
import { notFoundHandler } from '../../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/not-found.middleware.js';
import { listEmergenciesQuerySchema, emergencyIdParamSchema } from '../emergencies.schemas.js';

// Build a minimal Express app with emergencies route validation logic only (no DB)
function createEmergenciesTestApp() {
  const app = express();
  app.use(express.json());

  // GET /api/emergencies — validates query against listEmergenciesQuerySchema
  app.get('/api/emergencies', validate({ query: listEmergenciesQuerySchema }), (_req, res) => {
    res.json({ success: true, data: { items: [], pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 } } });
  });

  // GET /api/emergencies/priority-feed — no validation needed (public)
  app.get('/api/emergencies/priority-feed', (_req, res) => {
    res.json({ success: true, data: [] });
  });

  // GET /api/emergencies/:id — validates params
  app.get('/api/emergencies/:id', validate({ params: emergencyIdParamSchema }), (_req, res) => {
    res.json({ success: true, data: { id: Number(_req.params.id) } });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

describe('Emergencies Routes — Validation', () => {
  const app = createEmergenciesTestApp();

  describe('GET /api/emergencies', () => {
    it('returns 200 with default query', async () => {
      const res = await request(app).get('/api/emergencies');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 200 with valid query params', async () => {
      const res = await request(app).get('/api/emergencies?status=open&priority=high&page=1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/emergencies/priority-feed', () => {
    it('returns 200', async () => {
      const res = await request(app).get('/api/emergencies/priority-feed');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/emergencies/:id', () => {
    it('returns 200 with valid numeric id', async () => {
      const res = await request(app).get('/api/emergencies/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 400 with invalid id (non-numeric)', async () => {
      const res = await request(app).get('/api/emergencies/abc');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
