/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-18.
 * Patrón listado → detalle. El padre deja de mostrar el listado mientras
 * el detalle está abierto; este componente lleva el foco al título y ofrece
 * una sola acción clara para regresar.
 */
import { useEffect, useRef } from 'react';
import './vista-detalle.css';

/**
 * Vista independiente de un elemento seleccionado.
 *
 * @param {string} titulo Título visible del elemento.
 * @param {string} etiquetaVolver Texto del botón de regreso, por ejemplo «Volver a sesiones».
 * @param {Function} alVolver Regresa al listado conservando filtros y página.
 * @param {React.ReactNode} acciones Acciones autorizadas del elemento.
 * @param {React.ReactNode} subtitulo Contexto breve bajo el título.
 */
export default function VistaDetalle({
  titulo,
  subtitulo = null,
  etiquetaVolver = 'Volver al listado',
  alVolver,
  acciones = null,
  children
}) {
  const encabezado = useRef(null);

  useEffect(() => {
    if (encabezado.current) {
      encabezado.current.focus();
    }
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      try {
        window.scrollTo({ top: 0 });
      } catch {
        // jsdom no implementa el desplazamiento.
      }
    }
  }, [titulo]);

  return (
    <section className="vista-detalle" aria-labelledby="vista-detalle-titulo">
      <div className="vista-detalle-barra no-imprimir">
        <button type="button" className="secundario volver" onClick={alVolver}>
          <span aria-hidden="true">←</span> {etiquetaVolver}
        </button>
      </div>
      <header className="vista-detalle-encabezado">
        <div>
          <h2 id="vista-detalle-titulo" tabIndex={-1} ref={encabezado}>{titulo}</h2>
          {subtitulo ? <p className="vista-detalle-subtitulo">{subtitulo}</p> : null}
        </div>
        {acciones ? <div className="acciones vista-detalle-acciones">{acciones}</div> : null}
      </header>
      <div className="vista-detalle-cuerpo">{children}</div>
    </section>
  );
}

/**
 * Sección legible dentro del detalle.
 */
export function SeccionDetalle({ titulo, children }) {
  return (
    <section className="seccion-detalle">
      <h3>{titulo}</h3>
      {children}
    </section>
  );
}

/**
 * Lista de pares etiqueta/valor. Los valores vacíos se muestran como «No registrado».
 *
 * @param {Array<{etiqueta: string, valor: React.ReactNode}>} datos Pares a mostrar.
 */
export function DatosDetalle({ datos }) {
  return (
    <dl className="datos-detalle">
      {datos.map((dato) => (
        <div key={dato.etiqueta}>
          <dt>{dato.etiqueta}</dt>
          <dd>
            {dato.valor === null || dato.valor === undefined || dato.valor === ''
              ? 'No registrado'
              : dato.valor}
          </dd>
        </div>
      ))}
    </dl>
  );
}
