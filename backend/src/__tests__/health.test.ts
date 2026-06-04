import request from 'supertest';
import app from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/app.js';
import { db } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/database.js';

describe('GET /api/health', () => {
  afterAll(async () => {
    await db.end();
  });

  it('returns 200 with status ok and db connected', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.db).toBe('connected');
  });
});
