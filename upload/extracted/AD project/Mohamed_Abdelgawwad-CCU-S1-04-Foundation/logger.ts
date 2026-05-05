import pino from 'pino';
import { env } from './env';

// Configure logger based on environment (production=info, development=debug)
export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug'
});
