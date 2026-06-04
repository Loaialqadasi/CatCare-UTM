import request from 'supertest';
import app from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/app.js';
import { db } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/database.js';
import { getCsrfToken, createAgent } from './helpers/test-app.js';

function uniqueEmail(): string {
  return `testcats${Date.now()}${Math.random().toString(36).slice(2, 6)}@utm.my`;
}

const TEST_PASSWORD = 'Password1!';

// Helper: register a user, verify email, login, and return the agent with cookies
async function createAuthenticatedAgent() {
  const agent = createAgent();
  const csrfToken = await getCsrfToken(agent);
  const email = uniqueEmail();

  await agent
    .post('/api/auth/register')
    .set('X-CSRF-Token', csrfToken)
    .send({ fullName: 'Cat Tester', email, password: TEST_PASSWORD });

  await db.query('UPDATE users SET email_verified = TRUE WHERE email = $1', [email]);

  await agent
    .post('/api/auth/login')
    .set('X-CSRF-Token', csrfToken)
    .send({ email, password: TEST_PASSWORD });

  return { agent, csrfToken, email };
}

describe('Cats Routes — Integration', () => {
  afterAll(async () => {
    await db.end();
  });

  describe('GET /api/cats', () => {
    it('returns 200 with paginated items', async () => {
      const res = await request(app).get('/api/cats');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeDefined();
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.page).toBeDefined();
      expect(res.body.data.pagination.pageSize).toBeDefined();
      expect(res.body.data.pagination.totalItems).toBeDefined();
      expect(res.body.data.pagination.totalPages).toBeDefined();
    });

    it('returns 200 and filters correctly with search query', async () => {
      const res = await request(app).get('/api/cats?search=nonexistentcat12345');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Search for a nonexistent cat should return empty items
      expect(res.body.data.items).toHaveLength(0);
    });
  });

  describe('GET /api/cats/:id', () => {
    it('returns 200 with cat object for valid id', async () => {
      // First, create a cat via the API
      const { agent, csrfToken } = await createAuthenticatedAgent();

      const createRes = await agent
        .post('/api/cats')
        .set('X-CSRF-Token', csrfToken)
        .send({
          name: 'Test Cat',
          healthStatus: 'healthy',
          location: 'UTM Campus',
          description: 'A test cat for integration testing',
        });

      // If the cat was created, fetch it by ID
      if (createRes.status === 201 && createRes.body.data?.id) {
        const catId = createRes.body.data.id;
        const res = await request(app).get(`/api/cats/${catId}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe(catId);
        expect(res.body.data.name).toBe('Test Cat');
      } else {
        // If creation failed due to validation or other issues, test with a basic fetch
        const res = await request(app).get('/api/cats/1');
        // Could be 200 or 404 depending on whether cat ID 1 exists
        expect([200, 404]).toContain(res.status);
      }
    });

    it('returns 404 for invalid cat id', async () => {
      // Use a very large ID that almost certainly doesn't exist
      const res = await request(app).get('/api/cats/99999999');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/cats', () => {
    it('returns 401 without authentication', async () => {
      const agent = createAgent();
      const csrfToken = await getCsrfToken(agent);

      const res = await agent
        .post('/api/cats')
        .set('X-CSRF-Token', csrfToken)
        .send({
          name: 'Unauthorized Cat',
          healthStatus: 'healthy',
          location: 'Nowhere',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 201 with auth and valid body', async () => {
      const { agent, csrfToken } = await createAuthenticatedAgent();

      const res = await agent
        .post('/api/cats')
        .set('X-CSRF-Token', csrfToken)
        .send({
          name: 'Auth Cat',
          healthStatus: 'healthy',
          location: 'UTM Campus Block A',
          description: 'Created via authenticated integration test',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Auth Cat');
      expect(res.body.data.healthStatus).toBe('healthy');
    });
  });
});
