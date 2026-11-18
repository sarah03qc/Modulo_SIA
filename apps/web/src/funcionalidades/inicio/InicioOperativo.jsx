/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-14.
 * Modificación: 2026-11-16. Alerta de actividades vencidas, programación
 * y acceso a casos de Región y Nacional.
 * HU-001 y HU-002. Un indicador ausente no se muestra como cero.
 */
import { useEffect, useState } from 'react';
import { Aviso, Cargando } from '../../componentes/interfaz';
import { SolicitarApi } from '../../servicios/cliente-api';

function Tarjeta({ titulo, indicador, accion, textoAccion }) {
  const conCantidad = indicador && (
    indicador.disponibilidad === 'DISPONIBLE' || indicador.disponibilidad === 'PARCIAL'
  );
  return (
    <section className="panel">
      <h2>{titulo}</h2>
      {conCantidad ? <p>{indicador.cantidad}</p> : null}
      {indicador && indicador.motivo ? <Aviso tipo="pendiente">{indicador.motivo}</Aviso> : null}
      {indicador && !conCantidad && !indicador.motivo
        ? <Aviso tipo="pendiente">No disponible.</Aviso>
        : null}
      {accion ? <button type="button" onClick={accion}>{textoAccion}</button> : null}
    </section>
  );
}

export default function InicioOperativo({ direccionApi, identidad, contexto, navegar, solicitarApi = SolicitarApi }) {
  const [resumen, establecerResumen] = useState(null);
  const [error, establecerError] = useState('');

  useEffect(() => {
    let vigente = true;
    solicitarApi(direccionApi, '/api/proceso/resumen', { identidad })
      .then((datos) => {
        if (vigente) {
          establecerResumen(datos);
        }
      })
      .catch((fallo) => {
        if (vigente) {
          establecerError(fallo.message);
        }
      });
    return () => {
      vigente = false;
    };
  }, [direccionApi, identidad, solicitarApi]);

  if (error) {
    return <Aviso>{error}</Aviso>;
  }
  if (!resumen) {
    return <Cargando texto="Cargando el resumen." />;
  }
  if (resumen.mensaje) {
    const puedeCasos = contexto.puedeVerCasosRegion || contexto.puedeVerCasosNacional;
    return (
      <>
        <h1>Inicio</h1>
        <Aviso tipo="pendiente">{resumen.mensaje}</Aviso>
        {puedeCasos ? (
          <button type="button" onClick={() => navegar('casos')}>Consultar casos</button>
        ) : null}
      </>
    );
  }
  const esOficina = contexto.nivel === 'OFICINA_LOCAL';
  return (
    <>
      <h1>Inicio</h1>
      <div className="rejilla">
        <Tarjeta
          titulo={esOficina ? 'Referencias pendientes' : 'Referencias del ámbito'}
          indicador={esOficina ? resumen.referenciasPendientes : resumen.referencias}
          accion={contexto.puedeConsultarReferencias ? () => navegar(esOficina ? 'bandeja' : 'referencias') : null}
          textoAccion="Ver referencias"
        />
        <Tarjeta
          titulo={esOficina ? 'Casos activos' : 'Personas con caso activo'}
          indicador={esOficina
            ? resumen.casosActivos
            : {
              disponibilidad: resumen.casosActivos.disponibilidad,
              cantidad: resumen.casosActivos.personas,
              motivo: resumen.casosActivos.motivo
            }}
          accion={contexto.puedeVerCasosOficina || contexto.puedeVerListaSimplificada
            ? () => navegar('casos')
            : null}
          textoAccion="Ver casos"
        />
        {esOficina ? (
          <section className="panel">
            <h2>Próximas sesiones</h2>
            {resumen.proximasSesiones && resumen.proximasSesiones.disponibilidad === 'DISPONIBLE'
              && resumen.proximasSesiones.items.length === 0
              ? <p>No hay sesiones próximas.</p>
              : null}
            {resumen.proximasSesiones && resumen.proximasSesiones.disponibilidad === 'DISPONIBLE'
              ? (
                <ul>
                  {resumen.proximasSesiones.items.map((sesion) => (
                    <li key={sesion.sesionId}>
                      <button type="button" className="secundario" onClick={() => navegar('sesion', { sesionId: sesion.sesionId })}>
                        {sesion.fecha} {sesion.horaInicio} {sesion.lugar || 'Sin lugar'}
                      </button>
                    </li>
                  ))}
                </ul>
              )
              : <Aviso tipo="pendiente">{resumen.proximasSesiones && resumen.proximasSesiones.motivo}</Aviso>}
          </section>
        ) : null}
        <Tarjeta
          titulo="Posibles referencias"
          indicador={resumen.posiblesReferencias}
          accion={contexto.puedeConsultarPosibles ? () => navegar('posibles') : null}
          textoAccion="Ver posibles referencias"
        />
        <Tarjeta
          titulo="Atenciones individuales registradas"
          indicador={resumen.atencionesRegistradas}
        />
        <Tarjeta
          titulo="Actividades vencidas"
          indicador={resumen.actividadesVencidas}
          accion={contexto.puedeConsultarProgramacion ? () => navegar('programacion') : null}
          textoAccion="Resolver en programación"
        />
        <Tarjeta titulo="Próximas acciones" indicador={resumen.proximasAcciones} />
      </div>
      {resumen.actividadesVencidas && resumen.actividadesVencidas.disponibilidad === 'DISPONIBLE'
        && resumen.actividadesVencidas.cantidad > 0 ? (
          <p className="alerta-vencida" role="status">
            Vencida: {resumen.actividadesVencidas.cantidad} actividades siguen programadas
            después de su fecha. Puede resolverlas como realizada, reprogramada o cancelada.
          </p>
        ) : null}
      {resumen.proximasAcciones && resumen.proximasAcciones.disponibilidad === 'DISPONIBLE'
        && resumen.proximasAcciones.items && resumen.proximasAcciones.items.length > 0 ? (
          <section className="panel">
            <h2>Detalle de próximas acciones</h2>
            <ul>
              {resumen.proximasAcciones.items.map((item) => (
                <li key={`${item.casoId}-${item.fecha}`}>
                  <button
                    type="button"
                    className="secundario"
                    onClick={() => navegar('casos', { casoId: item.casoId })}
                  >
                    {item.fecha} — caso {item.casoId} — {item.accion}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      <div className="acciones">
        {contexto.puedeCrearReferencia
          ? <button type="button" onClick={() => navegar('referencia-nueva')}>Nueva referencia</button>
          : null}
        {contexto.puedeVerListaSimplificada || contexto.puedeVerCasosOficina
          ? <button type="button" className="secundario" onClick={() => navegar('casos')}>Lista de A.I.</button>
          : null}
      </div>
    </>
  );
}
