/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves
 * Primer registro del archivo en Git: 2026-11-06 (5fabddc)
 * Modificación del 2026-11-14: nomenclatura y tratamiento de respuestas no válidas
 */

/**
 * Consulta los dos puntos de comprobación técnica de la API.
 * @param {string} direccionApi Dirección base de la API.
 * @param {Function} consultar Función con la interfaz de fetch.
 * @returns {Promise<object>} Estado de las dependencias y de la lectura institucional.
 * @throws {Error} Si falta la dirección o la API no devuelve un estado interpretable.
 */
export async function ConsultarEstadoTecnico(direccionApi, consultar = globalThis.fetch) {
  const direccionBase = String(direccionApi || '').replace(/\/$/, '');
  if (!direccionBase) {
    throw new Error('Falta la dirección de la API.');
  }

  let respuestaSalud;
  let respuestaDisponibilidad;
  try {
    [respuestaSalud, respuestaDisponibilidad] = await Promise.all([
      consultar(`${direccionBase}/health`),
      consultar(`${direccionBase}/ready`)
    ]);
  } catch {
    throw new Error('No fue posible comunicarse con la API.');
  }

  if (!respuestaSalud.ok) {
    throw new Error('La API no respondió correctamente.');
  }

  let disponibilidad;
  try {
    await respuestaSalud.json();
    disponibilidad = await respuestaDisponibilidad.json();
  } catch {
    // Los errores del analizador JSON pueden incluir fragmentos de la respuesta.
    throw new Error('La API no respondió correctamente.');
  }

  if (respuestaDisponibilidad.ok && disponibilidad === null) {
    throw new Error('La API no respondió correctamente.');
  }

  return {
    dependenciasDisponibles:
      respuestaDisponibilidad.ok && disponibilidad?.status === 'ready',
    lecturaInstitucionalVerificada: disponibilidad?.checks?.sidinacc?.readOnly
  };
}
