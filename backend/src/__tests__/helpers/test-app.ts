import request from 'supertest';
import app from '../../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/app.js';
import { db } from '../../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/database.js';

/**
 * Fetch a CSRF token from the /api/csrf-token endpoint.
 * Must be called after the supertest agent has been created so cookies are shared.
 */
export async function getCsrfToken(agent: ReturnType<typeof request.agent>): Promise<string> {
  const res = await agent.get('/api/csrf-token');
  return res.body.data.token;
}

/**
 * Create a supertest agent tied to the full Express app.
 * The agent persists cookies across requests, which is essential for:
 *   - CSRF double-submit cookie pattern
 *   - HttpOnly JWT cookies (token, refreshToken)
 */
export function createAgent(): ReturnType<typeof request.agent> {
  return request.agent(app);
}

/**
 * Close the database pool after all tests finish.
 * Call this in afterAll() of every integration test file.
 */
export async function closePool(): Promise<void> {
  await db.end();
}

export { app, db };
