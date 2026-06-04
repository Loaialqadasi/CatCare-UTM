import app from './app.js';
import { env } from './env.js';
import { logger } from './logger.js';
import { runMigrations } from './migrate.js';

// MED-04 Fix: Process-level crash guards for unhandled rejections and exceptions
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection — shutting down');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception — shutting down');
  process.exit(1);
});

// MIN-7: Run pending database migrations before starting the server
runMigrations()
  .then(() => {
    logger.info('Migrations complete. Starting server...');
    app.listen(env.PORT, () => {
      logger.info({ port: env.PORT }, 'CatCare UTM API running');
    });
  })
  .catch((err) => {
    logger.error({ err }, 'Database migrations failed — server not started');
    process.exit(1);
  });
