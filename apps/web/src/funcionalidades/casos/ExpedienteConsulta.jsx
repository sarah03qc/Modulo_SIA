/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * HU-033 y HU-035. Expediente de consulta. No ofrece operaciones de Oficina Local.
 */
import { Aviso, ClasePrioridad } from '../../componentes/interfaz';

export default function ExpedienteConsulta({ detalle }) {
  const plan = detalle.plan;
  return (
    <section className="panel" aria-labelledby="titulo-consulta">
      <h2 id="titulo-consulta">Expediente en consulta</h2>
      <p>Esta vista es de solo lectura. No registra ni modifica la gestión del caso.</p>
      <p>{detalle.nombre || 'Nombre no disponible'} — {detalle.identificacion}</p>
      <p>
        Caso {detalle.casoId}. Consecutivo: {detalle.consecutivo || 'No registrado'}.
      </p>
      <p>
        Establecimiento: {detalle.establecimientoNombre || detalle.establecimientoId}.
        Oficina Local: {detalle.oficinaLocalId}. Región: {detalle.regionId}.
      </p>
      <p>
        Estado: {detalle.estado}. Apertura: {detalle.fechaApertura}.
        {detalle.fechaCierre ? ` Cierre: ${detalle.fechaCierre}.` : ''}
      </p>
      <p>
        Prioridad vigente:{' '}
        <strong className={ClasePrioridad(detalle.prioridadCodigo)}>
          {detalle.prioridadEtiqueta || 'Sin prioridad registrada'}
        </strong>
      </p>
      <h3>Resumen permitido</h3>
      <p>
        {detalle.resumen.estado}. Prioridad {detalle.resumen.prioridadEtiqueta || 'no registrada'}.
        Apertura {detalle.resumen.fechaApertura}.
      </p>
      <p>
        Última atención: {detalle.resumen.ultimaAtencion.mensaje
          || detalle.resumen.ultimaAtencion.fecha}
      </p>
      <h3>Plan vigente permitido</h3>
      {plan ? (
        <>
          <p>Frecuencia: {plan.frecuenciaEtiqueta}</p>
          <p>Estrategias: {plan.estrategias.join(', ') || 'Sin estrategias de catálogo.'}</p>
          <p>Disciplinas: {plan.disciplinas.join(', ') || 'Sin disciplinas de catálogo.'}</p>
        </>
      ) : <p>No hay plan vigente autorizado para mostrar.</p>}
      <h3>Línea de tiempo autorizada</h3>
      {detalle.lineaTiempo && detalle.lineaTiempo.length > 0 ? (
        <ol>
          {detalle.lineaTiempo.map((evento) => (
            <li key={evento.clave}>{evento.fecha} — {evento.texto}</li>
          ))}
        </ol>
      ) : <p>Sin eventos autorizados para mostrar.</p>}
      {(detalle.restricciones || []).map((texto) => (
        <Aviso key={texto} tipo="pendiente">{texto}</Aviso>
      ))}
    </section>
  );
}
