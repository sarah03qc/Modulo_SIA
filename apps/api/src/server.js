'use strict';

const { loadConfig } = require('./config/load-config');
const { createLogger } = require('./common/logger');
const { createApp } = require('./app');
const { createDatabaseGateway } = require('./infrastructure/database/sql-client');
const { createSidinaccAdapter } = require('./infrastructure/integrations/sidinacc-adapter');

function startServer(env = process.env) {
  const config = loadConfig(env);
  const logger = createLogger(config.logLevel);
  const databases = createDatabaseGateway(config);
  const adapter = createSidinaccAdapter(databases.sidinacc);
  const app = createApp({ config, databases, adapter, logger });

  if (config.sameDatabaseUser) {
    logger.warn(
      'Las conexiones SIA y SIDINACC usan el mismo usuario. El aislamiento de permisos no está verificado.'
    );
  }

  const server = app.listen(config.port, config.host, () => {
    logger.info('API escuchando', {
      host: config.host,
      port: config.port,
      environment: config.nodeEnv
    });
  });

  server.on('error', (error) => {
    logger.error('No se pudo escuchar', { driverCode: error.code || 'LISTEN_ERROR' });
    process.exit(1);
  });

  let closing = false;
  async function shutdown() {
    if (closing) {
      return;
    }
    closing = true;
    logger.info('Cierre ordenado iniciado');
    await new Promise((resolve) => {
      server.close(() => resolve());
    });
    await databases.close();
    logger.info('Cierre ordenado completado');
  }

  return { server, shutdown };
}

if (require.main === module) {
  try {
    const running = startServer();
    const stop = () => {
      running.shutdown().finally(() => process.exit(0));
    };
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Configuración inválida.';
    console.error(JSON.stringify({
      level: 'error',
      code: 'INVALID_CONFIGURATION',
      message
    }));
    process.exitCode = 1;
  }
}

module.exports = { startServer };
