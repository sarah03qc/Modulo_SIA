/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves
 * Primer registro del archivo en Git: 2026-11-06 (5fabddc)
 * Modificación del 2026-11-14: nomenclatura e invalidación al desmontar la pantalla
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import EstadoTecnico from '../../componentes/EstadoTecnico';
import { ConsultarEstadoTecnico } from '../../servicios/estado-tecnico';

const ETIQUETAS_AMBIENTE = {
  development: 'Desarrollo',
  test: 'Pruebas',
  production: 'Producción'
};

/**
 * Consulta el estado de la API al abrir y cuando se pide de nuevo.
 * Recibe la dirección de la API, el ambiente y la función de consulta.
 * Descarta resultados si cambia la consulta, se desmonta la pantalla o se vuelve a comprobar.
 */
export default function BienvenidaTecnica({
  direccionApi,
  ambiente,
  consultarEstado = ConsultarEstadoTecnico,
  embebida = false
}) {
  const [fase, establecerFase] = useState('cargando');
  const [mensaje, establecerMensaje] = useState('');
  const [lecturaInstitucionalVerificada, establecerLecturaVerificada] = useState(undefined);
  const numeroConsulta = useRef(0);

  /**
   * Actualiza la pantalla con el resultado de la comprobación vigente.
   */
  const ComprobarEstado = useCallback(async () => {
    const consulta = ++numeroConsulta.current;
    establecerFase('cargando');
    establecerMensaje('');
    establecerLecturaVerificada(undefined);
    try {
      const estado = await consultarEstado(direccionApi);
      if (consulta !== numeroConsulta.current) {
        return;
      }
      establecerLecturaVerificada(estado.lecturaInstitucionalVerificada);
      establecerFase(estado.dependenciasDisponibles ? 'disponible' : 'degradada');
    } catch (error) {
      if (consulta !== numeroConsulta.current) {
        return;
      }
      establecerFase('error');
      establecerMensaje(
        error instanceof Error ? error.message : 'No fue posible comunicarse con la API.'
      );
    }
  }, [direccionApi, consultarEstado]);

  useEffect(() => {
    ComprobarEstado();
    return () => {
      numeroConsulta.current += 1;
    };
  }, [ComprobarEstado]);

  const etiquetaAmbiente = Object.hasOwn(ETIQUETAS_AMBIENTE, ambiente)
    ? ETIQUETAS_AMBIENTE[ambiente]
    : ETIQUETAS_AMBIENTE.development;

  const Contenedor = embebida ? 'section' : 'main';

  return (
    <Contenedor className="bienvenida">
      <p className="encabezado">Infraestructura inicial</p>
      <h1>SIA-CENCINAI</h1>
      <p className="introduccion">
        Sistema de apoyo a la Atención Interdisciplinaria.
        Esta pantalla confirma que la aplicación web está inicializada.
      </p>
      <section className="panel" aria-labelledby="titulo-estado">
        <h2 id="titulo-estado">Estado técnico</h2>
        <p>
          Ambiente: <strong>{etiquetaAmbiente}</strong>
        </p>
        <EstadoTecnico
          fase={fase}
          mensaje={mensaje}
          lecturaInstitucionalVerificada={lecturaInstitucionalVerificada}
        />
      </section>
      <button type="button" onClick={ComprobarEstado}>Volver a comprobar</button>
    </Contenedor>
  );
}
