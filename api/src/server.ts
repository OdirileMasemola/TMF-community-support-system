import { buildApp } from './app.js';
import { ConfigError, loadConfig, loadDotEnvIfPresent, type AppConfig } from './config/env.js';

function loadConfigOrExit(): AppConfig {
  try {
    loadDotEnvIfPresent();
    return loadConfig();
  } catch (error) {
    if (error instanceof ConfigError) {
      console.error(error.message);
      process.exit(1);
    }
    throw error;
  }
}

async function main(): Promise<void> {
  const config = loadConfigOrExit();
  const app = await buildApp(config);

  let shuttingDown = false;
  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    app.log.info({ signal }, 'Shutting down');
    try {
      await app.close();
      process.exit(0);
    } catch (error) {
      app.log.error({ err: error }, 'Error during shutdown');
      process.exit(1);
    }
  };
  process.once('SIGINT', (signal) => void shutdown(signal));
  process.once('SIGTERM', (signal) => void shutdown(signal));

  try {
    await app.listen({ host: config.host, port: config.port });
  } catch (error) {
    app.log.fatal({ err: error }, 'Failed to start server');
    await app.close().catch(() => undefined);
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error('Fatal startup error:', error instanceof Error ? error.message : error);
  process.exit(1);
});
