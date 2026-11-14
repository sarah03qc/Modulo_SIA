/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves
 * Primer registro del archivo en Git: 2026-11-06 (5fabddc)
 * Modificación del 2026-11-14: nomenclatura de la aplicación y sus propiedades
 */

import BienvenidaTecnica from '../funcionalidades/bienvenida/BienvenidaTecnica';

/**
 * Punto de entrada visible. Hoy solo muestra la comprobación técnica.
 */
export default function Aplicacion({ direccionApi, ambiente, consultarEstado }) {
  return (
    <BienvenidaTecnica
      direccionApi={direccionApi}
      ambiente={ambiente}
      consultarEstado={consultarEstado}
    />
  );
}
