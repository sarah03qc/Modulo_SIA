/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves
 * Primer registro del archivo en Git: 2026-11-06 (5fabddc)
 * Modificación del 2026-11-14: nomenclatura del componente y sus propiedades
 */

/**
 * Presenta la fase y, cuando corresponde, el mensaje de error de la comprobación.
 * Muestra un aviso si la API informa false para la lectura institucional.
 */
export default function EstadoTecnico({ fase, mensaje, lecturaInstitucionalVerificada }) {
  return (
    <div role="status" aria-live="polite" aria-busy={fase === 'cargando'}>
      {fase === 'cargando' && <p>Comprobando la API.</p>}
      {fase === 'error' && <p>{mensaje}</p>}
      {fase === 'disponible' && <p>API en ejecución y dependencias disponibles.</p>}
      {fase === 'disponible' && lecturaInstitucionalVerificada === false && (
        <p>El permiso de solo lectura de la fuente institucional no está verificado.</p>
      )}
      {fase === 'degradada' && (
        <p>API en ejecución. Una o más dependencias no están disponibles.</p>
      )}
    </div>
  );
}
