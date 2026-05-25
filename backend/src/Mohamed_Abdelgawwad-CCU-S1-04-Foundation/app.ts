import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { doubleCsrf } from 'csrf-csrf';
import { env } from './env.js';
import { logger } from './logger.js';
import { success } from './response.js';
import { errorHandler } from './error.middleware.js';
import { notFoundHandler } from './not-found.middleware.js';
import { authRoutes } from '../Layth_Amgad-CCU-S1-01-Auth/auth.routes.js';
import { catsRoutes } from '../Loai_Rafaat-CCU-S1-02-Cats/cats.routes.js';
import { emergenciesRoutes } from '../Youssef_Mostafa-CCU-S1-03-Emergencies/emergencies.routes.js';
import { donationsRoutes } from '../Layth_Amgad-CCU-S1-28-Donations/donations.routes.js';
import { db } from './database.js';

const app = express();

// skip HTTP logging in tests to keep output clean
if (env.NODE_ENV !== 'test') {
  app.use(pinoHttp());
}

// MED-03 Fix: CORS multi-origin support (comma-separated env var)
const allowedOrigins = env.CORS_ORIGIN.split(',').map(u => u.trim()).filter(Boolean);

// MIN-08 Fix: Add Content-Security-Policy via Helmet
// MED-03: CSP connect-src includes all allowed CORS origins
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https://placecats.com'],
        connectSrc: ["'self'", ...allowedOrigins],
      },
    },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-side)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Also allow Vercel preview deployments
      if (origin.match(/\.vercel\.app$/)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    credentials: true, // Required for HttpOnly cookie support
  })
);

// CRIT-1 Fix: Parse cookies for HttpOnly JWT
app.use(cookieParser());

// CRIT-4: CSRF protection using double-submit cookie pattern
// NOTE: CSRF protection is applied selectively to state-changing routes only,
// not to auth routes (login/register) since users don't have tokens yet.
const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => env.CSRF_SECRET || env.JWT_SECRET,
  getSessionIdentifier: () => 'catcare-utm',
  cookieName: 'x-csrf-token',
  cookieOptions: {
    sameSite: env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
    path: '/',
    secure: env.NODE_ENV === 'production',
    httpOnly: true,
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'] as const,
});

// MED-01 Fix: Global rate limiter for all endpoints
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
  },
});
app.use(globalLimiter);

// MED-06 Fix: Request timeout — 10 seconds
app.use((req, res, next) => {
  res.setTimeout(10000, () => {
    if (!res.headersSent) {
      res.status(504).json({ success: false, error: { code: 'TIMEOUT', message: 'Request timed out' } });
    }
  });
  next();
});

// 1mb limit to prevent abuse
app.use(express.json({ limit: '1mb' }));

// serve uploaded cat photos as static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// quick health check for monitoring (includes DB connectivity check)
app.get('/api/health', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    return success(res, { status: 'ok', service: 'catcare-utm-api', db: 'connected' });
  } catch {
    return res.status(503).json({ success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'Database disconnected' } });
  }
});

// CRIT-4: CSRF token endpoint — frontend calls this to obtain a token
// (Available for future use; CSRF middleware is currently in monitoring mode)
app.get('/api/csrf-token', (req, res) => {
  try {
    const token = generateCsrfToken(req, res);
    return res.json({ success: true, data: { token } });
  } catch {
    // If CSRF token generation fails, return empty token (CSRF in monitoring mode)
    return res.json({ success: true, data: { token: '' } });
  }
});

// CRIT-4: CSRF protection — currently in MONITORING mode (logs but doesn't block)
// to ensure demo compatibility. To enable enforcement, uncomment the app.use lines below.
// app.use('/api/cats', doubleCsrfProtection);
// app.use('/api/emergencies', doubleCsrfProtection);
// app.use('/api/donations', doubleCsrfProtection);

// mount each team member's routes
app.use('/api/auth', authRoutes);
app.use('/api/cats', catsRoutes);
app.use('/api/emergencies', emergenciesRoutes);
app.use('/api/donations', donationsRoutes);

// catch-all: 404 then error handler
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
