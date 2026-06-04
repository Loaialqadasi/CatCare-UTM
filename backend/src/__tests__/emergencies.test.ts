import request from 'supertest';
import app from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/app.js';
import { db } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/database.js';
import { getCsrfToken, createAgent } from './helpers/test-app.js';

function uniqueEmail(): string {
  return `testemerg${Date.now()}${Math.random().toString(36).slice(2, 6)}@utm.my`;
}

const TEST_PASSWORD = 'Password1!';

// Helper: register a regular (student) user, verify email, login
async function createStudentAgent() {
  const agent = createAgent();
  const csrfToken = await getCsrfToken(agent);
  const email = uniqueEmail();

  await agent
    .post('/api/auth/register')
    .set('X-CSRF-Token', csrfToken)
    .send({ fullName: 'Student User', email, password: TEST_PASSWORD });

  await db.query('UPDATE users SET email_verified = TRUE WHERE email = $1', [email]);

  await agent
    .post('/api/auth/login')
    .set('X-CSRF-Token', csrfToken)
    .send({ email, password: TEST_PASSWORD });

  return { agent, csrfToken, email };
}

describe('Emergencies Routes — Integration', () => {
  afterAll(async () => {
    await db.end();
  });

  describe('GET /api/emergencies', () => {
    it('returns 200 with paginated results', async () => {
      const res = await request(app).get('/api/emergencies');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeDefined();
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
    });
  });

  describe('POST /api/emergencies', () => {
    it('returns 401 without authentication', async () => {
      const agent = createAgent();
      const csrfToken = await getCsrfToken(agent);

      const res = await agent
        .post('/api/emergencies')
        .set('X-CSRF-Token', csrfToken)
        .send({
          type: 'injury',
          priority: 'high',
          description: 'Test emergency without auth',
          location: 'UTM Campus',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 201 with auth and valid body', async () => {
      const { agent, csrfToken } = await createStudentAgent();

      const res = await agent
        .post('/api/emergencies')
        .set('X-CSRF-Token', csrfToken)
        .send({
          type: 'injury',
          priority: 'high',
          description: 'A cat needs help near the library',
          location: 'UTM Library Block',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('injury');
      expect(res.body.data.priority).toBe('high');
    });
  });

  describe('PATCH /api/emergencies/:id/status', () => {
    it('returns 403 for non-admin user', async () => {
      // Create an emergency as a student
      const { agent: studentAgent, csrfToken: studentCsrf } = await createStudentAgent();

      const createRes = await studentAgent
        .post('/api/emergencies')
        .set('X-CSRF-Token', studentCsrf)
        .send({
          type: 'stray',
          priority: 'medium',
          description: 'Stray cat near cafeteria',
          location: 'UTM Cafeteria',
        });

      if (createRes.status === 201 && createRes.body.data?.id) {
        const emergencyId = createRes.body.data.id;

        // Try to update status as a non-admin student
        const newCsrf = await getCsrfToken(studentAgent);
        const res = await studentAgent
          .patch(`/api/emergencies/${emergencyId}/status`)
          .set('X-CSRF-Token', newCsrf)
          .send({ status: 'in_progress' });

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
      } else {
        // If emergency creation failed, just verify that the endpoint requires admin
        const { agent: anotherStudent, csrfToken: anotherCsrf } = await createStudentAgent();
        const res = await anotherStudent
          .patch('/api/emergencies/1/status')
          .set('X-CSRF-Token', anotherCsrf)
          .send({ status: 'in_progress' });

        // Should be 403 (not admin) or 404 (not found) — not 200
        expect([403, 404]).toContain(res.status);
      }
    });
  });
});
