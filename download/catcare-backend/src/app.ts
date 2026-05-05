import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { success } from './shared/response.js';
import { errorHandler } from './middleware/error.middleware.js';
import { notFoundHandler } from './middleware/not-found.middleware.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { catsRoutes } from './modules/cats/cats.routes.js';
import { emergenciesRoutes } from './modules/emergencies/emergencies.routes.js';

const app = express();

if (env.NODE_ENV !== 'test') {
  app.use(pinoHttp());
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '1mb' }));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/api/health', (_req, res) => {
  return success(res, { status: 'ok', service: 'catcare-utm-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/cats', catsRoutes);
app.use('/api/emergencies', emergenciesRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
