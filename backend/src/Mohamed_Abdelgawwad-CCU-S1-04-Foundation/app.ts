import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './env.js';
import { logger } from './logger.js';
import { success } from './response.js';
import { errorHandler } from './error.middleware.js';
import { notFoundHandler } from './not-found.middleware.js';
import { generalLimiter } from '../Layth_Amgad-CCU-S1-01-Auth/rate-limiter.middleware.js';
import { authRoutes } from '../Layth_Amgad-CCU-S1-01-Auth/auth.routes.js';
import { catsRoutes } from '../Loai_Rafaat-CCU-S1-02-Cats/cats.routes.js';
import { emergenciesRoutes } from '../Youssef_Mostafa-CCU-S1-03-Emergencies/emergencies.routes.js';
// ── Donation modules (merged from SCRUM-27 / 28 / 29 / 30) ──────────────
import { donationsRoutes as scrum27DonationsRoutes } from '../Youssef_Mostafa-CCU-S1-05-Donations/donations.routes.js';
import { donationsRoutes as scrum28DonationsRoutes } from '../Layth_Amgad-CCU-S1-28-Donations/donations.routes.js';
import { donationsRoutes as scrum29DonationsRoutes } from '../Mohamed_Abdelgawwad-CCU-S1-05-Donations/donations.routes.js';
import { donationsRoutes as scrum30DonationsRoutes } from '../Loai_Rafaat-CCU-S1-05-Donations/donations.routes.js';
import { db } from './database.js';

const app = express();

// skip HTTP logging in tests to keep output clean
if (env.NODE_ENV !== 'test') {
  // Redact any sensitive query params from HTTP access logs.
  app.use(pinoHttp({
    redact: { paths: ['req.query.password', 'req.headers.authorization'], censor: '[REDACTED]' },
  }));
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// 1mb limit to prevent abuse
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// global rate limiter — prevents brute-force and DoS on all endpoints
app.use(generalLimiter);

// Serve cat photos publicly — they are intentionally public-facing content.
// IMPORTANT: receipts are stored in uploads/receipts/ and are NOT served here.
// Receipt files contain sensitive payment proof and must only be accessed via
// the admin review UI (authenticated API). Separating paths enforces this.
app.use('/uploads/cats', (_req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(process.cwd(), 'uploads', 'cats')));

// quick health check for monitoring — verifies database connectivity
app.get('/api/health', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    return success(res, { status: 'ok', service: 'catcare-utm-api', db: 'connected' });
  } catch {
    return res.status(503).json({ success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'Database unreachable' } });
  }
});

// mount each team member's routes
app.use('/api/auth', authRoutes);
app.use('/api/cats', catsRoutes);
app.use('/api/emergencies', emergenciesRoutes);

// ── Donation route mounts (each module on its own path) ─────────────────
// SCRUM-27: Youssef Mostafa — base donation submission + receipt upload
app.use('/api/donations', scrum27DonationsRoutes);
// SCRUM-28: Layth Amgad — admin review & approval workflow
app.use('/api/donations/admin', scrum28DonationsRoutes);
// SCRUM-29: Mohamed Abdelgawwad — donation review + progress tracking
app.use('/api/donations/review', scrum29DonationsRoutes);
// SCRUM-30: Loai Rafaat — encrypted receipts + receipt upload middleware
app.use('/api/donations/receipts', scrum30DonationsRoutes);

// catch-all: 404 then error handler
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
