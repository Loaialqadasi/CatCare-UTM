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
import { listCatsQuerySchema, catIdParamSchema } from '../cats.schemas.js';

// Build a minimal Express app with cats route validation logic only (no DB)
function createCatsTestApp() {
  const app = express();
  app.use(express.json());

  // GET /api/cats — validates query against listCatsQuerySchema
  app.get('/api/cats', validate({ query: listCatsQuerySchema }), (_req, res) => {
    res.json({ success: true, data: { items: [], pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 } } });
  });

  // GET /api/cats/:id — validates params against catIdParamSchema
  app.get('/api/cats/:id', validate({ params: catIdParamSchema }), (_req, res) => {
    res.json({ success: true, data: { id: Number(_req.params.id) } });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

describe('Cats Routes — Validation', () => {
  const app = createCatsTestApp();

  describe('GET /api/cats', () => {
    it('returns 200 with default query', async () => {
      const res = await request(app).get('/api/cats');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 200 with valid query params', async () => {
      const res = await request(app).get('/api/cats?page=1&pageSize=5&search=fluffy');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/cats/:id', () => {
    it('returns 200 with valid numeric id', async () => {
      const res = await request(app).get('/api/cats/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 400 with invalid id (non-numeric)', async () => {
      const res = await request(app).get('/api/cats/abc');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 with negative id', async () => {
      const res = await request(app).get('/api/cats/-1');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 with zero id', async () => {
      const res = await request(app).get('/api/cats/0');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
