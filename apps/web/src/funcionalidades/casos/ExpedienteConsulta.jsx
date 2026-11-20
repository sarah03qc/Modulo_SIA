/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * Modificación: 2026-11-18. Consulta por secciones, con regreso al listado.
 * HU-033 y HU-035. Expediente de consulta. No ofrece operaciones de Oficina Local.
 */
import { useState } from 'react';
import { Aviso, ClasePrioridad, Vacio } from '../../componentes/interfaz';

const SECCIONES = [
  ['resumen', 'Resumen'],
  ['plan', 'Plan de atención'],
  ['historial', 'Línea de tiempo']
];

export default function ExpedienteConsulta({ detalle, alCerrar }) {
  const [seccion, establecerSeccion] = useState('resumen');
  const plan = detalle.plan;
  return (
    <section className="expediente expediente-vista" aria-labelledby="titulo-consulta">
      <div className="expediente-encabezado">
        <div>
          <p className="contexto">Consulta del caso</p>
          <h2 id="titulo-consulta">{detalle.nombre || 'Nombre no disponible'}</h2>
          <p>Consulta de solo lectura.</p>
        </div>
        {alCerrar ? (
          <button type="button" className="secundario" onClick={alCerrar}>
            Volver al listado
          </button>
        ) : null}
      </div>
      <dl className="expediente-datos">
        <div>
          <dt>Caso</dt>
          <dd>{detalle.casoId}</dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd>{detalle.estado}</dd>
        </div>
        <div>
          <dt>Establecimiento</dt>
          <dd>{detalle.establecimientoNombre || detalle.establecimientoId}</dd>
        </div>
        <div>
          <dt>Apertura</dt>
          <dd>{detalle.fechaApertura}</dd>
        </div>
      </dl>
      <div className="pestanas" role="tablist" aria-label="Secciones de la consulta">
        {SECCIONES.map(([id, etiqueta]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={seccion === id}
            onClick={() => establecerSeccion(id)}
          >
            {etiqueta}
          </button>
        ))}
      </div>
      {seccion === 'resumen' ? (
        <div className="ficha">
          <p>
            Prioridad:{' '}
            <strong className={ClasePrioridad(detalle.prioridadCodigo)}>
              {detalle.prioridadEtiqueta || 'Sin prioridad registrada'}
            </strong>
          </p>
          <p>
            Última atención: {detalle.resumen.ultimaAtencion.mensaje
              || detalle.resumen.ultimaAtencion.fecha}
          </p>
        </div>
      ) : null}
      {seccion === 'plan' ? (
        <div className="ficha">
          {plan ? (
            <>
              <p>Frecuencia: {plan.frecuenciaEtiqueta}</p>
              <p>Estrategias: {plan.estrategias.join(', ') || 'Sin estrategias de catálogo.'}</p>
              <p>Disciplinas: {plan.disciplinas.join(', ') || 'Sin disciplinas de catálogo.'}</p>
            </>
          ) : <Vacio texto="No hay un plan vigente para mostrar." />}
        </div>
      ) : null}
      {seccion === 'historial' ? (
        <div className="ficha">
          {detalle.lineaTiempo && detalle.lineaTiempo.length > 0 ? (
            <ol>
              {detalle.lineaTiempo.map((evento) => (
                <li key={evento.clave}>{evento.fecha} — {evento.texto}</li>
              ))}
            </ol>
          ) : <Vacio texto="Todavía no hay eventos para mostrar." />}
        </div>
      ) : null}
      {(detalle.restricciones || []).map((texto) => (
        <Aviso key={texto} tipo="pendiente">{texto}</Aviso>
      ))}
    </section>
  );
}
