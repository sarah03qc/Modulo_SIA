'use strict';

const LEVELS = { error: 0, warn: 1, info: 2 };
const SECRET_KEY = /password|secret|token|connectionstring|pwd/i;

/**
 * Oculta valores cuyas claves parecen contraseñas, secretos o tokens.
 * El resto del detalle se conserva para el diagnóstico.
 */
function RedactarValor(value) {
  if (Array.isArray(value)) {
    return value.map(RedactarValor);
  }
  if (value && typeof value === 'object') {
    const output = {};
    for (const [key, item] of Object.entries(value)) {
      output[key] = SECRET_KEY.test(key) ? '[redacted]' : RedactarValor(item);
    }
    return output;
  }
  return value;
}

/**
 * Crea un registrador en JSON. Solo escribe niveles iguales o más graves
 * que el configurado. Los errores van a la salida de error.
 */
function CrearRegistro(levelName) {
  const threshold = LEVELS[levelName] ?? LEVELS.info;

  function write(level, message, details) {
    if (LEVELS[level] > threshold) {
      return;
    }
    const entry = {
      time: new Date().toISOString(),
      level,
      message
    };
    if (details) {
      entry.details = RedactarValor(details);
    }
    const line = JSON.stringify(entry);
    if (level === 'error') {
      console.error(line);
      return;
    }
    console.log(line);
  }

  return {
    error(message, details) {
      write('error', message, details);
    },
    warn(message, details) {
      write('warn', message, details);
    },
    info(message, details) {
      write('info', message, details);
    }
  };
}

module.exports = { CrearRegistro, RedactarValor };
