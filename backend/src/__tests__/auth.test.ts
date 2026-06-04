import request from 'supertest';
import app from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/app.js';
import { db } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/database.js';
import { getCsrfToken, createAgent } from './helpers/test-app.js';

/**
 * Integration tests for /api/auth routes.
 * These tests hit the real Express app with a real test database.
 * Each test uses supertest.agent() to persist cookies across requests.
 */

// Helper to create a unique email for each test run
function uniqueEmail(): string {
  return `testauth${Date.now()}${Math.random().toString(36).slice(2, 6)}@utm.my`;
}

// Standard test password that meets validation requirements
const TEST_PASSWORD = 'Password1!';

describe('Auth Routes — Integration', () => {
  afterAll(async () => {
    await db.end();
  });

  describe('POST /api/auth/register', () => {
    it('returns 201 with user data and sets HttpOnly cookie', async () => {
      const agent = createAgent();
      const csrfToken = await getCsrfToken(agent);
      const email = uniqueEmail();

      const res = await agent
        .post('/api/auth/register')
        .set('X-CSRF-Token', csrfToken)
        .send({
          fullName: 'Integration Test',
          email,
          password: TEST_PASSWORD,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(email);
      expect(res.body.data.user.passwordHash).toBeUndefined();

      // Verify HttpOnly cookie was set
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies;
      expect(cookieStr).toContain('token=');
      expect(cookieStr).toContain('HttpOnly');
    });

    it('returns 409 for duplicate email', async () => {
      const agent = createAgent();
      const csrfToken = await getCsrfToken(agent);
      const email = uniqueEmail();

      // First registration
      await agent
        .post('/api/auth/register')
        .set('X-CSRF-Token', csrfToken)
        .send({ fullName: 'First User', email, password: TEST_PASSWORD });

      // Second registration with same email
      const res = await agent
        .post('/api/auth/register')
        .set('X-CSRF-Token', csrfToken)
        .send({ fullName: 'Second User', email, password: TEST_PASSWORD });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 for invalid email domain', async () => {
      const agent = createAgent();
      const csrfToken = await getCsrfToken(agent);

      const res = await agent
        .post('/api/auth/register')
        .set('X-CSRF-Token', csrfToken)
        .send({
          fullName: 'Bad Email',
          email: 'user@gmail.com',
          password: TEST_PASSWORD,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns 200 with cookie for valid credentials', async () => {
      const agent = createAgent();
      const csrfToken = await getCsrfToken(agent);
      const email = uniqueEmail();

      // Register a user first
      await agent
        .post('/api/auth/register')
        .set('X-CSRF-Token', csrfToken)
        .send({ fullName: 'Login Test', email, password: TEST_PASSWORD });

      // Manually verify the email in DB so login is allowed
      await db.query('UPDATE users SET email_verified = TRUE WHERE email = $1', [email]);

      // Now login
      const res = await agent
        .post('/api/auth/login')
        .set('X-CSRF-Token', csrfToken)
        .send({ email, password: TEST_PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(email);

      // Verify HttpOnly cookie was set
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies;
      expect(cookieStr).toContain('token=');
    });

    it('returns 401 for wrong password', async () => {
      const agent = createAgent();
      const csrfToken = await getCsrfToken(agent);
      const email = uniqueEmail();

      // Register and verify
      await agent
        .post('/api/auth/register')
        .set('X-CSRF-Token', csrfToken)
        .send({ fullName: 'Wrong Pass', email, password: TEST_PASSWORD });
      await db.query('UPDATE users SET email_verified = TRUE WHERE email = $1', [email]);

      // Login with wrong password
      const res = await agent
        .post('/api/auth/login')
        .set('X-CSRF-Token', csrfToken)
        .send({ email, password: 'WrongPassword1!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns 200 with valid cookie', async () => {
      const agent = createAgent();
      const csrfToken = await getCsrfToken(agent);
      const email = uniqueEmail();

      // Register and verify
      await agent
        .post('/api/auth/register')
        .set('X-CSRF-Token', csrfToken)
        .send({ fullName: 'Me Test', email, password: TEST_PASSWORD });
      await db.query('UPDATE users SET email_verified = TRUE WHERE email = $1', [email]);

      // Login to get cookie
      await agent
        .post('/api/auth/login')
        .set('X-CSRF-Token', csrfToken)
        .send({ email, password: TEST_PASSWORD });

      // Access /me with the cookie
      const res = await agent.get('/api/auth/me');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(email);
    });

    it('returns 401 without cookie', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('returns 200 and clears cookies', async () => {
      const agent = createAgent();
      const csrfToken = await getCsrfToken(agent);

      const res = await agent
        .post('/api/auth/logout')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify cookies are cleared
      const cookies = res.headers['set-cookie'];
      if (cookies) {
        const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies;
        // Cleared cookies have expired Max-Age or a past date
        expect(cookieStr).toMatch(/token=;/);
      }
    });
  });
});
