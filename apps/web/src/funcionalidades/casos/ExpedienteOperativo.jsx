/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-18.
 * Modificación: 2026-11-18. Vista dedicada y categorías del expediente.
 * HU-025, HU-027, HU-028, HU-030 y HU-031.
 * Organiza el expediente que ya devuelve el detalle. No inventa actuaciones.
 */
import { useEffect, useRef, useState } from 'react';
import { Aviso, Campo, ClasePrioridad, Vacio } from '../../componentes/interfaz';
import { DescargarArchivo } from '../../servicios/cliente-api';
import CicloCaso from './CicloCaso';

const SECCIONES = [
  ['resumen', 'Resumen'],
  ['referencia', 'Referencia de origen'],
  ['valoraciones', 'Valoración'],
  ['plan', 'Plan de atención'],
  ['atenciones', 'Atenciones y seguimiento'],
  ['documentos', 'Documentos'],
  ['coordinaciones', 'Coordinaciones'],
  ['cierre', 'Cierre y traslado'],
  ['historial', 'Historial']
];

function Dato({ etiqueta, valor }) {
  return (
    <div>
      <dt>{etiqueta}</dt>
      <dd>{valor || 'No registrado'}</dd>
    </div>
  );
}

function TextoUltima(ultima) {
  if (!ultima) {
    return 'No registrada';
  }
  return ultima.mensaje || ultima.fecha || 'No registrada';
}

function ListaFactores(factores) {
  if (!factores || factores.length === 0) {
    return null;
  }
  return (
    <ul className="lista-acciones">
      {factores.map((item) => (
        <li key={`${item.valoracionId}-${item.etiqueta}`}>
          {item.etiqueta}
          {item.especificacion ? `. ${item.especificacion}` : ''}
        </li>
      ))}
    </ul>
  );
}

export default function ExpedienteOperativo({
  detalle,
  direccionApi,
  identidad,
  contexto,
  solicitarApi,
  alCerrar,
  alActualizar
}) {
  const [seccion, establecerSeccion] = useState('resumen');
  const [editando, establecerEditando] = useState(false);
  const [agregandoDocumento, establecerAgregandoDocumento] = useState(false);
  const [tipoDocumento, establecerTipoDocumento] = useState('Documento asociado');
  const [archivoDocumento, establecerArchivoDocumento] = useState(null);
  const [errorDocumento, establecerErrorDocumento] = useState('');
  const [mensajeDocumento, establecerMensajeDocumento] = useState('');
  const [cargandoDocumento, establecerCargandoDocumento] = useState(false);
  const [pendiente, establecerPendiente] = useState('');
  const titulo = useRef(null);
  const avisoSalida = useRef(null);
  const ingreso = detalle.contextoIngreso || {};

  useEffect(() => {
    establecerSeccion('resumen');
    establecerPendiente('');
    if (titulo.current) {
      titulo.current.focus();
    }
  }, [detalle.casoId]);

  useEffect(() => {
    if (pendiente && avisoSalida.current) {
      avisoSalida.current.focus();
    }
  }, [pendiente]);

  function IrASeccion(id) {
    if (id === seccion) {
      return;
    }
    if (editando) {
      establecerPendiente(id);
      return;
    }
    establecerSeccion(id);
  }

  function Salir() {
    if (editando) {
      establecerPendiente('cerrar');
      return;
    }
    alCerrar();
  }

  function ConfirmarSalida() {
    const destino = pendiente;
    establecerPendiente('');
    establecerEditando(false);
    if (destino === 'cerrar') {
      alCerrar();
      return;
    }
    establecerSeccion(destino);
  }

  function TeclaPestana(evento, indice) {
    let destino = indice;
    if (evento.key === 'ArrowRight') {
      destino = (indice + 1) % SECCIONES.length;
    } else if (evento.key === 'ArrowLeft') {
      destino = (indice + SECCIONES.length - 1) % SECCIONES.length;
    } else if (evento.key === 'Home') {
      destino = 0;
    } else if (evento.key === 'End') {
      destino = SECCIONES.length - 1;
    } else {
      return;
    }
    evento.preventDefault();
    const id = SECCIONES[destino][0];
    IrASeccion(id);
    if (!editando) {
      const boton = document.getElementById(`pestana-expediente-${id}`);
      if (boton) {
        boton.focus();
      }
    }
  }

  const ciclo = seccion === 'coordinaciones' || seccion === 'cierre';
  const puedeAdjuntar = Boolean(contexto && contexto.puedeAdjuntarDocumento)
    && detalle.estado === 'ACTIVO';

  async function ExportarExpediente() {
    establecerErrorDocumento('');
    try {
      const archivo = await solicitarApi(
        direccionApi,
        `/api/ciclo/casos/${detalle.casoId}/exportacion`,
        { identidad, archivo: true }
      );
      DescargarArchivo(archivo.blob, archivo.nombre);
    } catch (fallo) {
      establecerErrorDocumento(fallo.message);
    }
  }

  async function CargarDocumento(evento) {
    evento.preventDefault();
    establecerErrorDocumento('');
    establecerMensajeDocumento('');
    if (!archivoDocumento) {
      establecerErrorDocumento('Seleccione un archivo.');
      return;
    }
    establecerCargandoDocumento(true);
    try {
      const contenidoBase64 = await new Promise((resolver, rechazar) => {
        const lector = new FileReader();
        lector.onload = () => {
          const texto = String(lector.result || '');
          resolver(texto.includes(',') ? texto.split(',')[1] : '');
        };
        lector.onerror = () => rechazar(new Error('No se pudo leer el archivo.'));
        lector.readAsDataURL(archivoDocumento);
      });
      const clave = globalThis.crypto && globalThis.crypto.randomUUID
        ? globalThis.crypto.randomUUID()
        : `doc-${Date.now()}`;
      await solicitarApi(
        direccionApi,
        `/api/ciclo/casos/${detalle.casoId}/documentos`,
        {
          identidad,
          metodo: 'POST',
          json: {
            nombre: archivoDocumento.name,
            tipoTexto: tipoDocumento.trim() || 'Documento asociado',
            contenidoBase64,
            claveOperacion: clave
          }
        }
      );
      establecerMensajeDocumento('Documento asociado al caso.');
      establecerAgregandoDocumento(false);
      establecerArchivoDocumento(null);
      if (alActualizar) {
        await alActualizar();
      }
    } catch (fallo) {
      establecerErrorDocumento(fallo.message);
    } finally {
      establecerCargandoDocumento(false);
    }
  }

  async function AbrirDocumento(documentoId) {
    establecerErrorDocumento('');
    try {
      const archivo = await solicitarApi(
        direccionApi,
        `/api/ciclo/casos/${detalle.casoId}/documentos/${documentoId}`,
        { identidad, archivo: true }
      );
      DescargarArchivo(archivo.blob, archivo.nombre);
    } catch (fallo) {
      establecerErrorDocumento(fallo.message);
    }
  }

  return (
    <section className="expediente expediente-vista" aria-labelledby="titulo-caso">
      <div className="expediente-encabezado">
        <div>
          <p className="contexto">Expediente del caso</p>
          <h2 id="titulo-caso" tabIndex={-1} ref={titulo}>
            {detalle.nombre || 'Nombre no disponible'}
          </h2>
          <p>{detalle.identificacion}</p>
        </div>
        <div className="acciones">
          {contexto && contexto.puedeExportarExpediente ? (
            <button type="button" onClick={ExportarExpediente}>
              Exportar expediente
            </button>
          ) : null}
          <button type="button" className="secundario" onClick={Salir}>
            Volver al listado
          </button>
        </div>
      </div>
      {pendiente ? (
        <div
          className="aviso aviso-pendiente"
          role="status"
          tabIndex={-1}
          ref={avisoSalida}
        >
          <p>Hay un registro sin guardar en esta sección.</p>
          <div className="acciones">
            <button type="button" onClick={ConfirmarSalida}>
              Salir sin guardar
            </button>
            <button
              type="button"
              className="secundario"
              onClick={() => establecerPendiente('')}
            >
              Seguir editando
            </button>
          </div>
        </div>
      ) : null}
      <dl className="expediente-datos">
        <Dato etiqueta="Caso" valor={detalle.casoId} />
        <Dato etiqueta="Estado" valor={detalle.estado} />
        <Dato
          etiqueta="Establecimiento"
          valor={detalle.establecimientoNombre || detalle.establecimientoId}
        />
        <Dato etiqueta="Apertura" valor={detalle.fechaApertura} />
        <Dato
          etiqueta="Prioridad"
          valor={detalle.prioridadEtiqueta || 'Sin valoración vigente'}
        />
      </dl>
      <div
        className="pestanas"
        role="tablist"
        aria-label="Secciones del expediente"
      >
        {SECCIONES.map(([id, etiqueta], indice) => (
          <button
            key={id}
            id={`pestana-expediente-${id}`}
            type="button"
            role="tab"
            aria-selected={seccion === id}
            aria-controls={`panel-expediente-${id}`}
            tabIndex={seccion === id ? 0 : -1}
            onClick={() => IrASeccion(id)}
            onKeyDown={(evento) => TeclaPestana(evento, indice)}
          >
            {etiqueta}
          </button>
        ))}
      </div>
      <div
        className="ficha"
        role="tabpanel"
        id={`panel-expediente-${seccion}`}
        aria-labelledby={`pestana-expediente-${seccion}`}
      >
        {seccion === 'resumen' ? (
          <>
            <p>
              Prioridad vigente:{' '}
              <strong className={ClasePrioridad(detalle.prioridadCodigo)}>
                {detalle.prioridadEtiqueta || 'Sin valoración vigente'}
              </strong>
            </p>
            <p>
              Riesgo: {detalle.riesgoCodigo || 'No registrado'}.
              Protección: {detalle.proteccionCodigo || 'No registrada'}.
            </p>
            <p>Última atención: {TextoUltima(detalle.ultimaAtencion)}</p>
            {detalle.fechaCierre ? <p>Cierre: {detalle.fechaCierre}.</p> : null}
            {(detalle.pendientes || []).map((pendienteTexto) => (
              <Aviso key={pendienteTexto} tipo="pendiente">{pendienteTexto}</Aviso>
            ))}
          </>
        ) : null}
        {seccion === 'referencia' ? (
          <dl className="expediente-datos">
            <Dato etiqueta="Consecutivo" valor={detalle.consecutivo} />
            <Dato etiqueta="Encargado" valor={ingreso.encargado} />
            <Dato etiqueta="Relación" valor={ingreso.relacion} />
            <Dato etiqueta="Contacto" valor={ingreso.contacto} />
            <Dato etiqueta="Dirección" valor={ingreso.direccion} />
          </dl>
        ) : null}
        {seccion === 'valoraciones' ? (
          <>
            {detalle.valoraciones && detalle.valoraciones.length > 0 ? (
              <ul className="lista-acciones">
                {detalle.valoraciones.map((item) => (
                  <li key={item.valoracionId}>
                    {item.fecha} — {item.prioridadEtiqueta}
                    {item.vigente ? ' (vigente)' : ''} — {item.responsable}
                  </li>
                ))}
              </ul>
            ) : <Vacio texto="Todavía no hay valoraciones registradas." />}
            {ListaFactores(detalle.factores)}
          </>
        ) : null}
        {seccion === 'plan' ? (
          <>
            {detalle.consultaPlanes
              && detalle.consultaPlanes.disponibilidad !== 'DISPONIBLE' ? (
                <p>{detalle.consultaPlanes.mensaje}</p>
              ) : null}
            {detalle.consultaPlanes
              && detalle.consultaPlanes.disponibilidad !== 'DISPONIBLE' ? null : (
                detalle.plan ? (
                  <dl className="expediente-datos">
                    <Dato etiqueta="Frecuencia" valor={detalle.plan.frecuenciaEtiqueta} />
                    <Dato
                      etiqueta="Propósitos"
                      valor={(detalle.plan.propositos || []).join('; ')}
                    />
                    <Dato
                      etiqueta="Estrategias"
                      valor={(detalle.plan.estrategias || []).join(', ')}
                    />
                    <Dato
                      etiqueta="Disciplinas"
                      valor={(detalle.plan.disciplinas || []).join(', ')}
                    />
                  </dl>
                ) : <Vacio texto="Todavía no hay un plan vigente." />
              )}
            {detalle.planes && detalle.planes.length > 0 ? (
              <ul className="lista-acciones">
                {detalle.planes.map((item) => (
                  <li key={item.planId}>
                    Versión {item.numero} — {item.fecha}
                    {item.vigente ? ' (vigente)' : ''} — {item.frecuenciaEtiqueta}
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : null}
        {seccion === 'atenciones' ? (
          <>
            <h3>Individuales</h3>
            {detalle.consultaIndividual
              && detalle.consultaIndividual.disponibilidad !== 'DISPONIBLE' ? (
                <p>{detalle.consultaIndividual.mensaje}</p>
              ) : null}
            {detalle.consultaIndividual
              && detalle.consultaIndividual.disponibilidad === 'DISPONIBLE'
              && detalle.atenciones && detalle.atenciones.length > 0 ? (
                <ul className="lista-acciones">
                  {detalle.atenciones.map((item) => (
                    <li key={item.atencionId}>
                      {item.fechaAtencion}. {item.acciones}
                    </li>
                  ))}
                </ul>
              ) : null}
            {(!detalle.consultaIndividual
              || detalle.consultaIndividual.disponibilidad === 'DISPONIBLE')
              && (!detalle.atenciones || detalle.atenciones.length === 0) ? (
                <Vacio texto="Todavía no hay atenciones individuales." />
              ) : null}
            <h3>Grupales</h3>
            {detalle.consultaGrupal
              && detalle.consultaGrupal.disponibilidad !== 'DISPONIBLE' ? (
                <p>{detalle.consultaGrupal.mensaje}</p>
              ) : null}
            {detalle.consultaGrupal
              && detalle.consultaGrupal.disponibilidad === 'DISPONIBLE'
              && detalle.participacionesGrupales
              && detalle.participacionesGrupales.length > 0 ? (
                <ul className="lista-acciones">
                  {detalle.participacionesGrupales.map((item) => (
                    <li key={item.atencionGrupalId}>
                      {item.fechaAtencion} — {item.tema}
                      {item.asistio === true ? ' — asistió' : ''}
                      {item.asistio === false ? ' — no asistió' : ''}
                    </li>
                  ))}
                </ul>
              ) : null}
            {(!detalle.consultaGrupal
              || detalle.consultaGrupal.disponibilidad === 'DISPONIBLE')
              && (!detalle.participacionesGrupales
                || detalle.participacionesGrupales.length === 0) ? (
                <Vacio texto="Todavía no hay participaciones grupales." />
              ) : null}
            <p>Última atención: {TextoUltima(detalle.ultimaAtencion)}</p>
          </>
        ) : null}
        {seccion === 'documentos' ? (
          <>
            {detalle.documentos
              && detalle.documentos.disponibilidad !== 'DISPONIBLE' ? (
                <p>{detalle.documentos.mensaje}</p>
              ) : null}
            {detalle.documentos && detalle.documentos.cantidad > 0 ? (
              <p>{detalle.documentos.cantidad} documentos registrados.</p>
            ) : null}
            {detalle.documentos && detalle.documentos.registros
              && detalle.documentos.registros.length > 0 ? (
                <ul className="lista-acciones">
                  {detalle.documentos.registros.map((item) => (
                    <li key={item.documentoId}>
                      {item.fecha} — {item.nombre} — {item.tipo}
                      {item.responsable ? ` — ${item.responsable}` : ''}
                      <button
                        type="button"
                        className="secundario"
                        onClick={() => AbrirDocumento(item.documentoId)}
                      >
                        Abrir documento
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            {(!detalle.documentos
              || detalle.documentos.disponibilidad === 'DISPONIBLE')
              && !(detalle.documentos && detalle.documentos.cantidad > 0) ? (
                <Vacio texto="Todavía no hay documentos registrados." />
              ) : null}
            {errorDocumento ? <Aviso>{errorDocumento}</Aviso> : null}
            {mensajeDocumento ? <Aviso tipo="ok">{mensajeDocumento}</Aviso> : null}
            {puedeAdjuntar && !agregandoDocumento ? (
              <button type="button" onClick={() => establecerAgregandoDocumento(true)}>
                Agregar documento
              </button>
            ) : null}
            {puedeAdjuntar && agregandoDocumento ? (
              <form onSubmit={CargarDocumento}>
                <Campo id="tipo-documento" etiqueta="Tipo de documento">
                  <input
                    id="tipo-documento"
                    value={tipoDocumento}
                    onChange={(evento) => establecerTipoDocumento(evento.target.value)}
                  />
                </Campo>
                <Campo id="archivo-documento" etiqueta="Archivo">
                  <input
                    id="archivo-documento"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={(evento) => establecerArchivoDocumento(
                      evento.target.files && evento.target.files[0]
                        ? evento.target.files[0]
                        : null
                    )}
                  />
                </Campo>
                <div className="acciones">
                  <button type="submit" disabled={cargandoDocumento}>
                    Cargar documento
                  </button>
                  <button
                    type="button"
                    className="secundario"
                    onClick={() => establecerAgregandoDocumento(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : null}
          </>
        ) : null}
        {seccion === 'historial' ? (
          <>
            {detalle.lineaTiempo && detalle.lineaTiempo.length > 0 ? (
              <ol className="linea-tiempo">
                {detalle.lineaTiempo.map((evento) => (
                  <li key={evento.clave}>
                    {evento.fecha} — {evento.texto}
                    {evento.responsable ? ` — ${evento.responsable}` : ''}
                  </li>
                ))}
              </ol>
            ) : <Vacio texto="Todavía no hay eventos registrados." />}
            {detalle.historial && detalle.historial.length > 0 ? (
              <ul className="lista-acciones">
                {detalle.historial.map((item) => (
                  <li key={`${item.estado}-${item.ocurridoEn}`}>
                    {item.ocurridoEn} — {item.estado}
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : null}
        {ciclo ? (
          <CicloCaso
            key={seccion}
            direccionApi={direccionApi}
            identidad={identidad}
            contexto={contexto}
            detalle={detalle}
            solicitarApi={solicitarApi}
            alActualizar={alActualizar}
            alEditar={establecerEditando}
            seccion={seccion}
          />
        ) : null}
      </div>
    </section>
  );
}
