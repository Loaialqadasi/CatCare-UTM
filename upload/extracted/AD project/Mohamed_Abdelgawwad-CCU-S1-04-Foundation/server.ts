import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';

// Start API server on configured port
app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'CatCare UTM API running');
});
