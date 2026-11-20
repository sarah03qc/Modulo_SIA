/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * Modificación: 2026-11-18. Acciones dentro de la sección del expediente.
 * Los formularios de coordinación, reporte, cierre y traslado se abren al pedirlos.
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
  if (!bloque || (bloque.disponibilidad && bloque.disponibilidad !== 'DISPONIBLE')) {
    return <p>{bloque && bloque.mensaje ? bloque.mensaje : vacio}</p>;
  }
  if (!bloque.registros || bloque.registros.length === 0) {
    return <p className="vacio">{vacio}</p>;
  }
  return null;
}

export default function CicloCaso({
  direccionApi,
  identidad,
  contexto,
  detalle,
  solicitarApi,
  alActualizar,
  alEditar,
  seccion = 'todo'
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
    estadoItemId: '',
    modalidadItemId: '',
    observaciones: ''
  });
  const [reporte, establecerReporte] = useState({ tipoProposito: '', motivo: '' });
  const [formulario, establecerFormulario] = useState('');
  const [confirmado, establecerConfirmado] = useState(false);
  const [destinos, establecerDestinos] = useState([]);
  const [cierre, establecerCierre] = useState({
    motivoItemId: '',
    explicacion: '',
    fechaCierre: '',
    destinoEstablecimientoId: '',
    destinoNombre: ''
  });

  useEffect(() => {
    if (formulario !== 'traslado') {
      return undefined;
    }
    let vigente = true;
    solicitarApi(direccionApi, '/api/institutional/territory/options', { identidad })
      .then((datos) => {
        if (!vigente) {
          return;
        }
        const lista = datos && datos.filters && datos.filters.establishment
          ? datos.filters.establishment.options || []
          : [];
        establecerDestinos(lista);
      })
      .catch(() => {
        if (vigente) {
          establecerDestinos([]);
        }
      });
    return () => {
      vigente = false;
    };
  }, [direccionApi, formulario, identidad, solicitarApi]);

  useEffect(() => {
    establecerVista(null);
    establecerMensaje('');
    establecerError('');
    establecerFormulario('');
    establecerConfirmado(false);
  }, [detalle.casoId]);

  useEffect(() => {
    if (typeof alEditar === 'function') {
      alEditar(formulario !== '');
    }
    return () => {
      if (typeof alEditar === 'function') {
        alEditar(false);
      }
    };
  }, [alEditar, formulario]);

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

  const motivoTraslado = catalogos && catalogos.motivosCierre
    ? (catalogos.motivosCierre.items || []).find((item) => item.codigo === 'TRASLADO')
    : null;
  const forzarTraslado = formulario === 'traslado' || seccion === 'traslado';
  const motivoEfectivoId = forzarTraslado && motivoTraslado
    ? String(motivoTraslado.itemId)
    : cierre.motivoItemId;
  const motivoSeleccionado = catalogos && catalogos.motivosCierre
    ? (catalogos.motivosCierre.items || []).find(
      (item) => String(item.itemId) === motivoEfectivoId
    )
    : null;
  const instituciones = catalogos && catalogos.instituciones
    && catalogos.instituciones.disponibilidad === 'DISPONIBLE'
    ? catalogos.instituciones.items
    : [];
  const institucionElegida = instituciones.find(
    (item) => String(item.itemId) === String(coordinacion.institucionItemId)
  ) || null;
  const modalidades = catalogos && catalogos.modalidades
    && catalogos.modalidades.disponibilidad === 'DISPONIBLE'
    ? catalogos.modalidades.items
    : [];
  const modalidadElegida = modalidades.find(
    (item) => String(item.itemId) === String(coordinacion.modalidadItemId)
  ) || null;
  const intercambioFormal = Boolean(
    modalidadElegida && modalidadElegida.ambito === 'INTERCAMBIO_FORMAL'
  );

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
      observaciones: coordinacion.observaciones || null,
      profesional: coordinacion.profesional || identidad,
      claveOperacion: claveCoordinacion
    };
    if (catalogos && catalogos.instituciones.disponibilidad === 'DISPONIBLE') {
      cuerpo.institucionItemId = Number(coordinacion.institucionItemId);
      if (institucionElegida && institucionElegida.requiereTexto) {
        cuerpo.institucionTexto = coordinacion.institucionTexto;
      }
    } else {
      cuerpo.institucionTexto = coordinacion.institucionTexto;
    }
    if (modalidadElegida) {
      cuerpo.modalidadItemId = Number(coordinacion.modalidadItemId);
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
      motivoItemId: Number(motivoEfectivoId),
      fechaCierre: cierre.fechaCierre,
      claveOperacion: claveCierre
    };
    if ((motivoSeleccionado && motivoSeleccionado.requiereTexto)
      || (motivoSeleccionado && motivoSeleccionado.codigo === 'TRASLADO')) {
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
      {errorCatalogo ? <Aviso>{errorCatalogo}</Aviso> : null}
      {error ? <Aviso>{error}</Aviso> : null}
      {mensaje ? <Aviso tipo="ok">{mensaje}</Aviso> : null}
      <div hidden={seccion !== 'todo' && seccion !== 'coordinaciones'}>
      <h3>Coordinaciones</h3>
      {Registros(detalle.coordinaciones, 'Todavía no hay coordinaciones registradas.')}
      {detalle.coordinaciones && detalle.coordinaciones.registros
        && detalle.coordinaciones.registros.length > 0 ? (
          <ul>
            {detalle.coordinaciones.registros.map((item) => (
              <li key={item.coordinacionId}>
                {item.fecha} — {item.institucion}
                {item.modalidad ? ` — ${item.modalidad}` : ''}
                {` — ${item.estado}`}
                {item.observaciones ? `. ${item.observaciones}` : ''}
                {' '}— {item.profesional}
                {item.digitador ? `. Registró ${item.digitador}` : ''}
                {item.motivo ? `. ${item.motivo}` : ''}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div hidden>
      <h3>Reportes</h3>
      {detalle.reportes && detalle.reportes.disponibilidad
        && detalle.reportes.disponibilidad !== 'DISPONIBLE' ? (
          <p>{detalle.reportes.mensaje}</p>
        ) : null}
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
      {!(detalle.reportes && detalle.reportes.disponibilidad
        && detalle.reportes.disponibilidad !== 'DISPONIBLE')
        && !(detalle.reportes && detalle.reportes.registros
          && detalle.reportes.registros.length > 0) ? (
          <p className="vacio">Todavía no hay reportes registrados.</p>
        ) : null}
      </div>
      <div hidden={seccion !== 'todo' && seccion !== 'cierre' && seccion !== 'traslado'}>
      <h3>{seccion === 'traslado' ? 'Traslado' : 'Cierre y traslado'}</h3>
      {detalle.cierre && detalle.cierre.disponibilidad
        && detalle.cierre.disponibilidad !== 'DISPONIBLE' ? (
          <p>{detalle.cierre.mensaje}</p>
        ) : null}
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
              {' '}No se abrió otro caso en el destino.
            </p>
          ) : null}
          {detalle.cierre.registro.explicacion ? (
            <p>Explicación: {detalle.cierre.registro.explicacion}</p>
          ) : null}
        </>
      ) : null}
      {!(detalle.cierre && detalle.cierre.disponibilidad
        && detalle.cierre.disponibilidad !== 'DISPONIBLE')
        && !(detalle.cierre && detalle.cierre.registro) ? (
          <p className="vacio">
            {seccion === 'traslado'
              ? 'Todavía no hay un traslado registrado.'
              : 'Todavía no hay un cierre ni un traslado registrado.'}
          </p>
        ) : null}
      {detalle.estado !== 'ACTIVO'
        && (seccion === 'cierre' || seccion === 'traslado' || seccion === 'todo') ? (
        <p>El caso no admite nuevas coordinaciones, reportes ni otro cierre.</p>
      ) : null}
      </div>
      {puedeCoordinar && (seccion === 'todo' || seccion === 'coordinaciones')
        && formulario !== 'coordinacion' && seccion !== 'todo' ? (
          <button type="button" onClick={() => establecerFormulario('coordinacion')}>
            Registrar coordinación
          </button>
        ) : null}
      {puedeCoordinar && (seccion === 'todo'
        || (seccion === 'coordinaciones' && formulario === 'coordinacion')) ? (
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
          {institucionElegida && institucionElegida.requiereTexto ? (
            <Campo id="coordinacion-institucion-otra" etiqueta="Nombre de la institución">
              <input
                id="coordinacion-institucion-otra"
                value={coordinacion.institucionTexto}
                onChange={(evento) => establecerCoordinacion({
                  ...coordinacion,
                  institucionTexto: evento.target.value
                })}
                required
              />
            </Campo>
          ) : null}
          {catalogos && catalogos.instituciones.disponibilidad !== 'DISPONIBLE' ? (
            <p className="ayuda">Escriba el nombre de la institución.</p>
          ) : null}
          <Campo id="coordinacion-profesional" etiqueta="Profesional responsable">
            <input
              id="coordinacion-profesional"
              readOnly
              value={coordinacion.profesional || identidad}
              onChange={(evento) => establecerCoordinacion({
                ...coordinacion,
                profesional: evento.target.value
              })}
            />
          </Campo>
          <p className="ayuda">Si lo deja vacío, queda a su nombre.</p>
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
          {modalidades.length > 0 ? (
            <Campo id="coordinacion-modalidad" etiqueta="Modalidad">
              <select
                id="coordinacion-modalidad"
                value={coordinacion.modalidadItemId}
                onChange={(evento) => establecerCoordinacion({
                  ...coordinacion,
                  modalidadItemId: evento.target.value,
                  estadoItemId: ''
                })}
              >
                <option value="">Seleccione</option>
                {modalidades.map((item) => (
                  <option key={item.itemId} value={item.itemId}>{item.etiqueta}</option>
                ))}
              </select>
            </Campo>
          ) : null}
          <Campo id="coordinacion-observaciones" etiqueta="Observaciones o resultado">
            <textarea
              id="coordinacion-observaciones"
              value={coordinacion.observaciones}
              onChange={(evento) => establecerCoordinacion({
                ...coordinacion,
                observaciones: evento.target.value
              })}
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
                {catalogos.estadosCoordinacion.items
                  .filter((item) => intercambioFormal || item.ambito !== 'INTERCAMBIO_FORMAL')
                  .map((item) => (
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
            <p className="ayuda">Escriba el estado de la coordinación.</p>
          ) : null}
          <button type="submit" disabled={enviando}>Registrar coordinación</button>
          <button type="button" className="secundario" onClick={() => establecerFormulario('')}>
            Cancelar
          </button>
        </form>
      ) : null}
      {puedeReportar && seccion === 'reportes' && formulario !== 'reporte' ? (
        <div className="acciones">
          <button
            type="button"
            className="secundario"
            onClick={PrepararVista}
            disabled={enviando}
          >
            Preparar la vista actual
          </button>
          <button type="button" onClick={() => establecerFormulario('reporte')}>
            Conservar reporte
          </button>
        </div>
      ) : null}
      {puedeReportar && (seccion === 'todo'
        || (seccion === 'reportes' && formulario === 'reporte')) ? (
        <form className="no-imprimir" onSubmit={GuardarReporte}>
          <h4>Reporte del caso</h4>
          <p className="ayuda">El reporte no cambia el estado del caso.</p>
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
            <button type="button" className="secundario" onClick={() => establecerFormulario('')}>
              Cancelar
            </button>
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
            Imprimir esta vista
          </button>
        </section>
      ) : null}
      {puedeCerrar && seccion === 'traslado' && formulario !== 'traslado' ? (
        <button type="button" onClick={() => {
          establecerConfirmado(false);
          establecerFormulario('traslado');
        }}
        >
          Cerrar por traslado
        </button>
      ) : null}
      {puedeCerrar && seccion === 'cierre'
        && formulario !== 'cierre' && formulario !== 'traslado' ? (
          <div className="acciones">
            <button type="button" onClick={() => {
              establecerConfirmado(false);
              establecerFormulario('cierre');
            }}
            >
              Cerrar caso
            </button>
            <button type="button" onClick={() => {
              establecerConfirmado(false);
              establecerFormulario('traslado');
            }}
            >
              Trasladar caso
            </button>
          </div>
        ) : null}
      {puedeCerrar && catalogos && catalogos.motivosCierre.disponibilidad === 'DISPONIBLE'
        && (seccion === 'todo' || (
          (seccion === 'cierre' || seccion === 'traslado')
          && (formulario === 'cierre' || formulario === 'traslado')
        )) ? (
        <form className="no-imprimir" onSubmit={GuardarCierre}>
          <h4>Cerrar la Atención Interdisciplinaria</h4>
          <p className="ayuda">Puede cerrar aunque todavía no haya un reporte.</p>
          <Campo id="cierre-motivo" etiqueta="Motivo">
            <select
              id="cierre-motivo"
              value={motivoEfectivoId}
              disabled={forzarTraslado}
              onChange={(evento) => establecerCierre({
                ...cierre,
                motivoItemId: evento.target.value
              })}
              required
            >
              <option value="">Seleccione</option>
              {catalogos.motivosCierre.items
                .filter((item) => {
                  if (forzarTraslado) {
                    return item.codigo === 'TRASLADO';
                  }
                  if (formulario === 'cierre' || seccion === 'cierre') {
                    return item.codigo !== 'TRASLADO';
                  }
                  return true;
                })
                .map((item) => (
                <option key={item.itemId} value={item.itemId}>{item.etiqueta}</option>
              ))}
            </select>
          </Campo>
          {motivoSeleccionado && (motivoSeleccionado.requiereTexto
            || motivoSeleccionado.codigo === 'TRASLADO') ? (
            <Campo
              id="cierre-explicacion"
              etiqueta={motivoSeleccionado.codigo === 'TRASLADO'
                ? 'Motivo del traslado'
                : 'Explicación'}
            >
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
              <p>
                El traslado cierra este caso. No abre un caso en el destino
                ni marca una recepción que no se haya registrado.
              </p>
              <Campo id="origen-caso" etiqueta="Establecimiento de origen">
                <input
                  id="origen-caso"
                  readOnly
                  value={detalle.establecimientoNombre || detalle.establecimientoId || ''}
                />
              </Campo>
              <Campo id="cierre-destino-id" etiqueta="Establecimiento de destino">
                <select
                  id="cierre-destino-id"
                  required
                  value={cierre.destinoEstablecimientoId}
                  onChange={(evento) => {
                    const opcion = destinos.find(
                      (item) => String(item.id) === evento.target.value
                    );
                    establecerCierre({
                      ...cierre,
                      destinoEstablecimientoId: evento.target.value,
                      destinoNombre: opcion ? (opcion.name || opcion.nombre || '') : ''
                    });
                  }}
                >
                  <option value="">Seleccione</option>
                  {destinos
                    .filter((item) => Number(item.id) !== Number(detalle.establecimientoId))
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name || item.nombre}
                      </option>
                    ))}
                </select>
              </Campo>
              <p className="ayuda">
                La Oficina Local y la región de destino se derivan del establecimiento.
              </p>
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
          <Campo id="cierre-confirmar" etiqueta="Confirmación">
            <label>
              <input
                id="cierre-confirmar"
                type="checkbox"
                checked={confirmado}
                onChange={(evento) => establecerConfirmado(evento.target.checked)}
                required
              />
              Confirmo el cierre de la Atención Interdisciplinaria.
            </label>
          </Campo>
          <button type="submit" disabled={enviando || !motivoEfectivoId || !confirmado}>
            Confirmar cierre
          </button>
          {seccion !== 'todo' ? (
            <button type="button" className="secundario" onClick={() => establecerFormulario('')}>
              Cancelar
            </button>
          ) : null}
        </form>
      ) : null}
      {puedeCerrar && catalogos && catalogos.motivosCierre.disponibilidad !== 'DISPONIBLE' ? (
        <p>{catalogos.motivosCierre.mensaje}</p>
      ) : null}
    </div>
  );
}
