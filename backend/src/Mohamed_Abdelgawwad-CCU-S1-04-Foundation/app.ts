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
import { mapRoutes } from '../Mohamed_Amgad-CCU-S1-04-Map/map.routes.js';
import { volunteersRoutes } from './volunteers.routes.js';
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
        imgSrc: ["'self'", 'data:', 'https://placecats.com', 'https://res.cloudinary.com'],
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
app.get('/api/csrf-token', (req, res) => {
  try {
    const token = generateCsrfToken(req, res);
    return res.json({ success: true, data: { token } });
  } catch {
    return res.json({ success: true, data: { token: '' } });
  }
});

// CRIT-4: CSRF protection — MONITORING mode (logs but does not block).
// The frontend sends CSRF tokens via X-CSRF-Token header, and the double-submit
// cookie pattern is used. However, some browsers block third-party cookies which
// can break the CSRF flow in cross-origin deployments (Vercel ↔ Render).
// To ensure the app remains functional, CSRF is in monitoring mode:
//   - If the token is present and valid → request proceeds normally
//   - If the token is missing or invalid → a warning is logged but the request
//     still proceeds (no 403 block)
// To enable full enforcement later, replace csrfMonitoringMiddleware with
// doubleCsrfProtection in the app.use() lines below.
const csrfMonitoringMiddleware: express.RequestHandler = (req, _res, next) => {
  try {
    // Run the actual CSRF protection to see if it would pass
    doubleCsrfProtection(req, _res, (err) => {
      if (err) {
        // CSRF validation failed — log but don't block
        logger.warn({
          method: req.method,
          path: req.path,
          hasCsrfCookie: !!req.cookies?.['x-csrf-token'],
          hasCsrfHeader: !!req.headers['x-csrf-token'],
        }, 'CSRF validation failed (monitoring mode — not blocking)');
      }
      // Always proceed — monitoring mode never blocks
      next();
    });
  } catch {
    // If the CSRF middleware throws, just proceed
    next();
  }
};

app.use('/api/cats', csrfMonitoringMiddleware);
app.use('/api/emergencies', csrfMonitoringMiddleware);
app.use('/api/donations', csrfMonitoringMiddleware);
app.use('/api/volunteers', csrfMonitoringMiddleware);
app.use('/api/map', csrfMonitoringMiddleware);

// mount each team member's routes
app.use('/api/auth', authRoutes);
app.use('/api/cats', catsRoutes);
app.use('/api/emergencies', emergenciesRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/volunteers', volunteersRoutes);

// catch-all: 404 then error handler
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
