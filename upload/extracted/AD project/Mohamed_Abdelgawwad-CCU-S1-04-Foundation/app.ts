import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './config/logger';
import { success } from './shared/response';
import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/not-found.middleware';
import { authRoutes } from './modules/auth/auth.routes';
import { catsRoutes } from './modules/cats/cats.routes';
import { emergenciesRoutes } from './modules/emergencies/emergencies.routes';

const app = express();

// Log HTTP requests in non-test environments
if (env.NODE_ENV !== 'test') {
  app.use(pinoHttp());
}

// Security middleware: helmet for XSS, clickjacking, and other protections
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// CORS configuration: allow requests from frontend origin only
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Parse incoming JSON with size limit to prevent abuse
app.use(express.json({ limit: '1mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check endpoint for monitoring
app.get('/api/health', (_req, res) => {
  return success(res, { status: 'ok', service: 'catcare-utm-api' });
});

// Mount route modules
app.use('/api/auth', authRoutes);
app.use('/api/cats', catsRoutes);
app.use('/api/emergencies', emergenciesRoutes);

// Global error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
