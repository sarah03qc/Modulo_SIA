/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * Modificación: 2026-11-16. La vista provisional no se conserva al cambiar de caso.
 * HU-025, HU-027, HU-028, HU-030 y HU-031.
 * Las reglas de cierre, traslado y reporte viven en la API.
 */
import { useEffect, useState } from 'react';
import { Aviso, Campo } from '../../componentes/interfaz';

function NuevaClave() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `ciclo-${Date.now()}`;
}

function Registros(bloque, vacio) {
  if (!bloque) {
    return <p>{vacio}</p>;
  }
  if (bloque.disponibilidad && bloque.disponibilidad !== 'DISPONIBLE') {
    return <p>{bloque.mensaje}</p>;
  }
  if (!bloque.registros || bloque.registros.length === 0) {
    return <p>{bloque.mensaje || vacio}</p>;
  }
  return null;
}

export default function CicloCaso({
  direccionApi,
  identidad,
  contexto,
  detalle,
  solicitarApi,
  alActualizar
}) {
  const activo = detalle.estado === 'ACTIVO';
  const puedeCoordinar = Boolean(contexto.puedeRegistrarCoordinacion) && activo;
  const puedeReportar = Boolean(contexto.puedeGenerarReporte) && activo;
  const puedeCerrar = Boolean(contexto.puedeCerrarCaso) && activo;
  const [catalogos, establecerCatalogos] = useState(null);
  const [errorCatalogo, establecerErrorCatalogo] = useState('');
  const [mensaje, establecerMensaje] = useState('');
  const [error, establecerError] = useState('');
  const [enviando, establecerEnviando] = useState(false);
  const [vista, establecerVista] = useState(null);
  const [claveCoordinacion, establecerClaveCoordinacion] = useState(NuevaClave);
  const [claveReporte, establecerClaveReporte] = useState(NuevaClave);
  const [claveCierre, establecerClaveCierre] = useState(NuevaClave);
  const [coordinacion, establecerCoordinacion] = useState({
    institucionTexto: '',
    institucionItemId: '',
    profesional: '',
    fecha: '',
    motivo: '',
    estadoTexto: '',
    estadoItemId: ''
  });
  const [reporte, establecerReporte] = useState({ tipoProposito: '', motivo: '' });
  const [cierre, establecerCierre] = useState({
    motivoItemId: '',
    explicacion: '',
    fechaCierre: '',
    destinoEstablecimientoId: '',
    destinoNombre: ''
  });

  useEffect(() => {
    establecerVista(null);
    establecerMensaje('');
    establecerError('');
  }, [detalle.casoId]);

  useEffect(() => {
    if (!puedeCoordinar && !puedeReportar && !puedeCerrar) {
      return undefined;
    }
    let vigente = true;
    solicitarApi(direccionApi, '/api/ciclo/catalogos', { identidad })
      .then((datos) => {
        if (vigente) {
          establecerCatalogos(datos);
        }
      })
      .catch((fallo) => {
        if (vigente) {
          establecerErrorCatalogo(fallo.message);
        }
      });
    return () => {
      vigente = false;
    };
  }, [
    direccionApi,
    identidad,
    puedeCerrar,
    puedeCoordinar,
    puedeReportar,
    solicitarApi
  ]);

  const motivoSeleccionado = catalogos && catalogos.motivosCierre
    ? catalogos.motivosCierre.items.find(
      (item) => String(item.itemId) === cierre.motivoItemId
    )
    : null;

  async function Enviar(ruta, cuerpo, renovarClave) {
    establecerError('');
    establecerMensaje('');
    establecerEnviando(true);
    try {
      const resultado = await solicitarApi(direccionApi, ruta, {
        identidad,
        metodo: 'POST',
        json: cuerpo
      });
      establecerMensaje(resultado.mensaje
        || (resultado.repetida
          ? 'La operación ya estaba registrada.'
          : 'La operación quedó registrada.'));
      if (resultado.vista) {
        establecerVista(resultado.vista);
      }
      renovarClave();
      await alActualizar();
    } catch (fallo) {
      establecerError(fallo.message);
    } finally {
      establecerEnviando(false);
    }
  }

  async function PrepararVista() {
    establecerError('');
    establecerMensaje('');
    establecerEnviando(true);
    try {
      establecerVista(await solicitarApi(
        direccionApi,
        `/api/ciclo/casos/${detalle.casoId}/vista-reporte`,
        { identidad }
      ));
    } catch (fallo) {
      establecerError(fallo.message);
    } finally {
      establecerEnviando(false);
    }
  }

  function GuardarCoordinacion(evento) {
    evento.preventDefault();
    const cuerpo = {
      casoId: detalle.casoId,
      fecha: coordinacion.fecha,
      motivo: coordinacion.motivo,
      profesional: coordinacion.profesional,
      claveOperacion: claveCoordinacion
    };
    if (catalogos && catalogos.instituciones.disponibilidad === 'DISPONIBLE') {
      cuerpo.institucionItemId = Number(coordinacion.institucionItemId);
    } else {
      cuerpo.institucionTexto = coordinacion.institucionTexto;
    }
    if (catalogos && catalogos.estadosCoordinacion.disponibilidad === 'DISPONIBLE') {
      cuerpo.estadoItemId = Number(coordinacion.estadoItemId);
    } else {
      cuerpo.estadoTexto = coordinacion.estadoTexto;
    }
    Enviar('/api/ciclo/coordinaciones', cuerpo, () => establecerClaveCoordinacion(NuevaClave()));
  }

  function GuardarReporte(evento) {
    evento.preventDefault();
    Enviar('/api/ciclo/reportes', {
      casoId: detalle.casoId,
      tipoProposito: reporte.tipoProposito,
      motivo: reporte.motivo,
      claveOperacion: claveReporte
    }, () => establecerClaveReporte(NuevaClave()));
  }

  function GuardarCierre(evento) {
    evento.preventDefault();
    const cuerpo = {
      casoId: detalle.casoId,
      motivoItemId: Number(cierre.motivoItemId),
      fechaCierre: cierre.fechaCierre,
      claveOperacion: claveCierre
    };
    if (motivoSeleccionado && motivoSeleccionado.requiereTexto) {
      cuerpo.explicacion = cierre.explicacion;
    }
    if (motivoSeleccionado && motivoSeleccionado.codigo === 'TRASLADO') {
      if (cierre.destinoEstablecimientoId) {
        cuerpo.destinoEstablecimientoId = Number(cierre.destinoEstablecimientoId);
      }
      if (cierre.destinoNombre) {
        cuerpo.destinoNombre = cierre.destinoNombre;
      }
    }
    Enviar('/api/ciclo/cierres', cuerpo, () => establecerClaveCierre(NuevaClave()));
  }

  return (
    <div className="ciclo-caso">
      <h3>Coordinaciones</h3>
      {Registros(detalle.coordinaciones, 'Sin coordinaciones registradas.')}
      {detalle.coordinaciones && detalle.coordinaciones.registros
        && detalle.coordinaciones.registros.length > 0 ? (
          <ul>
            {detalle.coordinaciones.registros.map((item) => (
              <li key={item.coordinacionId}>
                {item.fecha} — {item.institucion} — {item.estado}
                {' '}— {item.profesional}
                {item.digitador ? `. Registró ${item.digitador}` : ''}
                {item.motivo ? `. ${item.motivo}` : ''}
              </li>
            ))}
          </ul>
        ) : null}
      <h3>Reportes conservados</h3>
      {detalle.reportes && detalle.reportes.mensaje ? <p>{detalle.reportes.mensaje}</p> : null}
      {detalle.reportes && detalle.reportes.registros
        && detalle.reportes.registros.length > 0 ? (
          <ul>
            {detalle.reportes.registros.map((item) => (
              <li key={item.reporteId}>
                {item.fecha} — {item.tipoProposito} — {item.responsable}
                {item.motivo ? `. ${item.motivo}` : ''}
              </li>
            ))}
          </ul>
        ) : null}
      <h3>Cierre y traslado</h3>
      {detalle.cierre && detalle.cierre.mensaje ? <p>{detalle.cierre.mensaje}</p> : null}
      {detalle.cierre && detalle.cierre.registro ? (
        <>
          <p>
            {detalle.cierre.registro.fecha}
            {' '}— {detalle.cierre.registro.motivoEtiqueta}
            {' '}— {detalle.cierre.registro.responsable}
          </p>
          {detalle.cierre.registro.motivoCodigo === 'TRASLADO' ? (
            <p>
              Destino: {detalle.cierre.registro.destinoNombre
                || detalle.cierre.registro.destinoEstablecimientoId
                || 'registrado'}.
              {' '}No se creó un caso en el destino.
            </p>
          ) : null}
          {detalle.cierre.registro.explicacion ? (
            <p>Explicación: {detalle.cierre.registro.explicacion}</p>
          ) : null}
        </>
      ) : null}
      {detalle.estado !== 'ACTIVO' ? (
        <p>El caso no admite nuevas coordinaciones, reportes ni otro cierre.</p>
      ) : null}
      {errorCatalogo ? <Aviso>{errorCatalogo}</Aviso> : null}
      {error ? <Aviso>{error}</Aviso> : null}
      {mensaje ? <Aviso tipo="ok">{mensaje}</Aviso> : null}
      {puedeCoordinar ? (
        <form className="no-imprimir" onSubmit={GuardarCoordinacion}>
          <h4>Registrar coordinación</h4>
          {catalogos && catalogos.instituciones.disponibilidad === 'DISPONIBLE' ? (
            <Campo id="coordinacion-institucion" etiqueta="Institución">
              <select
                id="coordinacion-institucion"
                value={coordinacion.institucionItemId}
                onChange={(evento) => establecerCoordinacion({
                  ...coordinacion,
                  institucionItemId: evento.target.value
                })}
                required
              >
                <option value="">Seleccione</option>
                {catalogos.instituciones.items.map((item) => (
                  <option key={item.itemId} value={item.itemId}>{item.etiqueta}</option>
                ))}
              </select>
            </Campo>
          ) : (
            <Campo id="coordinacion-institucion-texto" etiqueta="Institución">
              <input
                id="coordinacion-institucion-texto"
                value={coordinacion.institucionTexto}
                onChange={(evento) => establecerCoordinacion({
                  ...coordinacion,
                  institucionTexto: evento.target.value
                })}
                required
              />
            </Campo>
          )}
          {catalogos && catalogos.instituciones.disponibilidad !== 'DISPONIBLE' ? (
            <p>{catalogos.instituciones.mensaje}</p>
          ) : null}
          <Campo id="coordinacion-profesional" etiqueta="Profesional responsable">
            <input
              id="coordinacion-profesional"
              value={coordinacion.profesional}
              onChange={(evento) => establecerCoordinacion({
                ...coordinacion,
                profesional: evento.target.value
              })}
            />
          </Campo>
          <p>Si no indica otro profesional, queda el usuario de la sesión.</p>
          <Campo id="coordinacion-fecha" etiqueta="Fecha">
            <input
              id="coordinacion-fecha"
              type="date"
              value={coordinacion.fecha}
              onChange={(evento) => establecerCoordinacion({
                ...coordinacion,
                fecha: evento.target.value
              })}
              required
            />
          </Campo>
          <Campo id="coordinacion-motivo" etiqueta="Motivo">
            <textarea
              id="coordinacion-motivo"
              value={coordinacion.motivo}
              onChange={(evento) => establecerCoordinacion({
                ...coordinacion,
                motivo: evento.target.value
              })}
              required
            />
          </Campo>
          {catalogos && catalogos.estadosCoordinacion.disponibilidad === 'DISPONIBLE' ? (
            <Campo id="coordinacion-estado" etiqueta="Estado">
              <select
                id="coordinacion-estado"
                value={coordinacion.estadoItemId}
                onChange={(evento) => establecerCoordinacion({
                  ...coordinacion,
                  estadoItemId: evento.target.value
                })}
                required
              >
                <option value="">Seleccione</option>
                {catalogos.estadosCoordinacion.items.map((item) => (
                  <option key={item.itemId} value={item.itemId}>{item.etiqueta}</option>
                ))}
              </select>
            </Campo>
          ) : (
            <Campo id="coordinacion-estado-texto" etiqueta="Estado registrado">
              <input
                id="coordinacion-estado-texto"
                value={coordinacion.estadoTexto}
                onChange={(evento) => establecerCoordinacion({
                  ...coordinacion,
                  estadoTexto: evento.target.value
                })}
                required
              />
            </Campo>
          )}
          {catalogos && catalogos.estadosCoordinacion.disponibilidad !== 'DISPONIBLE' ? (
            <p>{catalogos.estadosCoordinacion.mensaje}</p>
          ) : null}
          <button type="submit" disabled={enviando}>Registrar coordinación</button>
        </form>
      ) : null}
      {puedeReportar ? (
        <form className="no-imprimir" onSubmit={GuardarReporte}>
          <h4>Reporte del caso</h4>
          <p>Generar o conservar un reporte no cambia el estado del caso.</p>
          <Campo id="reporte-tipo" etiqueta="Tipo o propósito">
            <input
              id="reporte-tipo"
              value={reporte.tipoProposito}
              onChange={(evento) => establecerReporte({
                ...reporte,
                tipoProposito: evento.target.value
              })}
              required
            />
          </Campo>
          <Campo id="reporte-motivo" etiqueta="Motivo">
            <textarea
              id="reporte-motivo"
              value={reporte.motivo}
              onChange={(evento) => establecerReporte({
                ...reporte,
                motivo: evento.target.value
              })}
            />
          </Campo>
          <div className="acciones">
            <button type="button" className="secundario" onClick={PrepararVista} disabled={enviando}>
              Preparar la vista actual
            </button>
            <button type="submit" disabled={enviando}>Conservar el reporte</button>
          </div>
        </form>
      ) : null}
      {vista ? (
        <section className="reporte-provisional" aria-labelledby="titulo-reporte">
          <h4 id="titulo-reporte">Vista del reporte</h4>
          <p className="aviso aviso-pendiente" role="note">{vista.aviso}</p>
          <p>Fecha de esta vista: {vista.fechaVista}. Estado del caso: {vista.estadoCaso}.</p>
          {vista.secciones.map((seccion) => (
            <section key={seccion.titulo}>
              <h5>{seccion.titulo}</h5>
              {seccion.parrafos.map((parrafo, indice) => (
                <p key={`${seccion.titulo}-${indice}`}>{parrafo}</p>
              ))}
            </section>
          ))}
          <button type="button" className="secundario no-imprimir" onClick={() => window.print()}>
            Imprimir la vista provisional
          </button>
        </section>
      ) : null}
      {puedeCerrar && catalogos && catalogos.motivosCierre.disponibilidad === 'DISPONIBLE' ? (
        <form className="no-imprimir" onSubmit={GuardarCierre}>
          <h4>Cerrar la Atención Interdisciplinaria</h4>
          <p>El cierre no exige un reporte previo.</p>
          <Campo id="cierre-motivo" etiqueta="Motivo">
            <select
              id="cierre-motivo"
              value={cierre.motivoItemId}
              onChange={(evento) => establecerCierre({
                ...cierre,
                motivoItemId: evento.target.value
              })}
              required
            >
              <option value="">Seleccione</option>
              {catalogos.motivosCierre.items.map((item) => (
                <option key={item.itemId} value={item.itemId}>{item.etiqueta}</option>
              ))}
            </select>
          </Campo>
          {motivoSeleccionado && motivoSeleccionado.requiereTexto ? (
            <Campo id="cierre-explicacion" etiqueta="Explicación">
              <textarea
                id="cierre-explicacion"
                value={cierre.explicacion}
                onChange={(evento) => establecerCierre({
                  ...cierre,
                  explicacion: evento.target.value
                })}
                required
              />
            </Campo>
          ) : null}
          {motivoSeleccionado && motivoSeleccionado.codigo === 'TRASLADO' ? (
            <>
              <p>El traslado cierra este caso y no abre un caso en el destino.</p>
              <Campo id="cierre-destino-id" etiqueta="Establecimiento de destino">
                <input
                  id="cierre-destino-id"
                  inputMode="numeric"
                  value={cierre.destinoEstablecimientoId}
                  onChange={(evento) => establecerCierre({
                    ...cierre,
                    destinoEstablecimientoId: evento.target.value
                  })}
                />
              </Campo>
              <Campo id="cierre-destino-nombre" etiqueta="Nombre del destino">
                <input
                  id="cierre-destino-nombre"
                  value={cierre.destinoNombre}
                  onChange={(evento) => establecerCierre({
                    ...cierre,
                    destinoNombre: evento.target.value
                  })}
                />
              </Campo>
            </>
          ) : null}
          <Campo id="cierre-fecha" etiqueta="Fecha de cierre">
            <input
              id="cierre-fecha"
              type="date"
              value={cierre.fechaCierre}
              onChange={(evento) => establecerCierre({
                ...cierre,
                fechaCierre: evento.target.value
              })}
              required
            />
          </Campo>
          <button type="submit" disabled={enviando || !cierre.motivoItemId}>
            Confirmar cierre
          </button>
        </form>
      ) : null}
      {puedeCerrar && catalogos && catalogos.motivosCierre.disponibilidad !== 'DISPONIBLE' ? (
        <p>{catalogos.motivosCierre.mensaje}</p>
      ) : null}
    </div>
  );
}
