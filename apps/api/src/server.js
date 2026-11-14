'use strict';

const { CargarConfiguracion } = require('./config/load-config');
const { CrearRegistro } = require('./common/logger');
const { CrearAplicacion } = require('./app');
const { CrearPasarelaBases } = require('./infrastructure/database/sql-client');
const { CrearAdaptadorSidinacc } = require('./infrastructure/integrations/sidinacc-adapter');

/**
 * Arranca la API con la configuración del entorno.
 *
 * Abre las dos bases, conecta el adaptador de la réplica y escucha en local.
 * Si SIA y SIDINACC usan el mismo usuario, deja una advertencia:
 * el aislamiento de permisos no queda demostrado.
 */
function IniciarServidor(env = process.env) {
  const config = CargarConfiguracion(env);
  const logger = CrearRegistro(config.logLevel);
  const databases = CrearPasarelaBases(config);
  const adapter = CrearAdaptadorSidinacc(databases.sidinacc);
  const app = CrearAplicacion({ config, databases, adapter, logger });

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
  /**
   * Cierra el puerto y las dos bases. Una segunda señal no repite el cierre.
   */
  async function DetenerServidor() {
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

  return { server, DetenerServidor };
}

if (require.main === module) {
  try {
    const running = IniciarServidor();
    const stop = () => {
      running.DetenerServidor().finally(() => process.exit(0));
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

module.exports = { IniciarServidor };
