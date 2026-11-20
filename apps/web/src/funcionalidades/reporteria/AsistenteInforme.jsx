/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * Modificación: 2026-11-20. La ruta del informe sigue el ámbito.
 * HU-050 y CU-38. El análisis lo escribe el profesional.
 * No recalcula indicadores ni descarga la consolidación de HU-039.
 */
import { useEffect, useRef, useState } from 'react';
import { Aviso } from '../../componentes/interfaz';
import { DescargarArchivo } from '../../servicios/cliente-api';
import GraficoReporteria from './GraficosReporteria';

const INSTRUCCION_SELECCION = 'Seleccione al menos 5 visualizaciones de las '
  + 'siguientes para incluir en su reporte';
const INSTRUCCION_ANALISIS = 'Por favor, redacte su análisis asociado a la '
  + 'visualización mostrada';

function ClaveOperacion() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `informe-${Date.now()}`;
}

function Disponible(visualizacion) {
  return visualizacion.autorizada !== false
    && visualizacion.estado !== 'NO_DISPONIBLE';
}

function Reiniciar() {
  return {
    paso: 'seleccion',
    elegidas: [],
    textos: {},
    indice: 0,
    titulo: '',
    clave: '',
    error: '',
    listo: ''
  };
}

export default function AsistenteInforme({
  abierto,
  resultado,
  consulta,
  direccionApi,
  identidad,
  solicitarApi,
  rutaInforme = '/api/reporteria/oficina/informe',
  alCerrar
}) {
  const corteRef = useRef('');
  const abiertoRef = useRef(false);
  const [fijo, establecerFijo] = useState(null);
  const [avisoCorte, establecerAvisoCorte] = useState('');
  const [paso, establecerPaso] = useState('seleccion');
  const [elegidas, establecerElegidas] = useState([]);
  const [textos, establecerTextos] = useState({});
  const [indice, establecerIndice] = useState(0);
  const [titulo, establecerTitulo] = useState('');
  const [clave, establecerClave] = useState('');
  const [error, establecerError] = useState('');
  const [generando, establecerGenerando] = useState(false);
  const [listo, establecerListo] = useState('');

  useEffect(() => {
    if (!abierto) {
      abiertoRef.current = false;
      return;
    }
    const acabaDeAbrir = !abiertoRef.current;
    const corteDistinto = corteRef.current !== consulta;
    if (acabaDeAbrir || corteDistinto) {
      const limpio = Reiniciar();
      establecerPaso(limpio.paso);
      establecerElegidas(limpio.elegidas);
      establecerTextos(limpio.textos);
      establecerIndice(limpio.indice);
      establecerTitulo(limpio.titulo);
      establecerClave(limpio.clave);
      establecerError(limpio.error);
      establecerListo(limpio.listo);
      corteRef.current = consulta;
      establecerAvisoCorte(acabaDeAbrir
        ? ''
        : 'El corte cambió. La selección se descartó para no mezclar resultados.');
      if (!resultado) {
        establecerFijo(null);
      }
    }
    if (resultado) {
      establecerFijo(resultado);
    }
    abiertoRef.current = true;
  }, [abierto, consulta, resultado]);

  if (!abierto) {
    return null;
  }

  if (!fijo) {
    return (
      <div className="dialogo-fondo">
        <div
          className="dialogo dialogo-asistente"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-informe"
        >
          <h2 id="titulo-informe">Generar reporte</h2>
          <p>Actualizando el corte. La selección anterior no se conserva.</p>
        </div>
      </div>
    );
  }

  const visualizaciones = fijo.visualizaciones || [];
  const disponibles = visualizaciones.filter(Disponible);
  const seleccionadas = elegidas
    .map((numero) => visualizaciones.find((item) => item.numero === numero))
    .filter(Boolean);
  const actual = seleccionadas[indice] || null;
  const totalPasos = seleccionadas.length >= 5
    ? seleccionadas.length + 3
    : 0;
  const numeroPaso = paso === 'seleccion'
    ? 1
    : paso === 'analisis'
      ? 2 + indice
      : paso === 'titulo'
        ? seleccionadas.length + 2
        : totalPasos;
  const progreso = totalPasos > 0
    ? `Paso ${numeroPaso} de ${totalPasos}`
    : 'Paso 1. Selección';
  const identificacion = fijo.identificacion || {};

  function Alternar(numero) {
    establecerError('');
    establecerElegidas((previas) => {
      if (previas.includes(numero)) {
        return previas.filter((item) => item !== numero);
      }
      return [...previas, numero].sort((a, b) => a - b);
    });
  }

  function IrAnalisis(siguiente) {
    establecerError('');
    establecerIndice(siguiente);
    establecerPaso('analisis');
  }

  function ContinuarSeleccion() {
    if (disponibles.length < 5) {
      establecerError('Hay menos de cinco visualizaciones disponibles.');
      return;
    }
    if (elegidas.length < 5) {
      establecerError('Seleccione al menos cinco visualizaciones disponibles.');
      return;
    }
    IrAnalisis(0);
  }

  function ContinuarAnalisis() {
    const texto = actual ? (textos[actual.numero] || '') : '';
    if (texto.trim().length === 0) {
      establecerError('Redacte el análisis. No se genera una interpretación automática.');
      return;
    }
    if (indice + 1 < seleccionadas.length) {
      IrAnalisis(indice + 1);
      return;
    }
    establecerError('');
    establecerPaso('titulo');
  }

  function ContinuarTitulo() {
    if (titulo.trim().length === 0) {
      establecerError('El título del informe es obligatorio.');
      return;
    }
    if (!clave) {
      establecerClave(ClaveOperacion());
    }
    establecerError('');
    establecerPaso('revision');
  }

  async function Confirmar() {
    establecerError('');
    establecerGenerando(true);
    const operacion = clave || ClaveOperacion();
    if (!clave) {
      establecerClave(operacion);
    }
    try {
      const archivo = await solicitarApi(
        direccionApi,
        `${rutaInforme}?${consulta}`,
        {
          identidad,
          metodo: 'POST',
          archivo: true,
          json: {
            titulo: titulo.trim(),
            claveOperacion: operacion,
            huellaCorte: fijo.huellaCorte,
            visualizaciones: seleccionadas.map((item) => ({
              numero: item.numero,
              analisis: (textos[item.numero] || '').trim()
            }))
          }
        }
      );
      DescargarArchivo(archivo.blob, archivo.nombre);
      if (archivo.persistencia === 'REGISTRADO') {
        establecerListo(archivo.informeId
          ? `El informe quedó registrado con el identificador ${archivo.informeId}.`
          : 'El informe quedó registrado.');
      } else if (archivo.persistencia === 'PENDIENTE_TABLA') {
        establecerListo('El archivo contiene la instantánea y los análisis. '
          + 'El registro histórico no se guardó: la tabla del informe no está '
          + 'disponible. No se ejecutó un script.');
      } else {
        establecerListo('El archivo contiene la instantánea y los análisis. '
          + 'El registro histórico no se guardó: falta el permiso de escritura. '
          + 'No se ejecutó un script.');
      }
    } catch (fallo) {
      establecerError(fallo.message);
    } finally {
      establecerGenerando(false);
    }
  }

  return (
    <div className="dialogo-fondo">
      <div
        className="dialogo dialogo-asistente"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-informe"
      >
        <p className="progreso">{progreso}</p>
        <h2 id="titulo-informe">Generar reporte</h2>
        <p>
          Este informe recoge su análisis. No sustituye el consolidado descargable.
          ni el reporte individual de un caso.
        </p>
        {avisoCorte ? <Aviso>{avisoCorte}</Aviso> : null}
        {error ? <Aviso>{error}</Aviso> : null}
        {listo ? <p role="status">{listo}</p> : null}

        {paso === 'seleccion' ? (
          <>
            <p>{fijo.informeAnalitico?.instruccionSeleccion || INSTRUCCION_SELECCION}</p>
            {disponibles.length < 5 ? (
              <Aviso>
                Hay menos de cinco visualizaciones disponibles.
                No se puede continuar.
              </Aviso>
            ) : null}
            <fieldset>
              <legend>Visualizaciones del catálogo</legend>
              <ul className="seleccion-visualizaciones">
                {visualizaciones.map((item) => {
                  const usable = Disponible(item);
                  return (
                    <li key={item.numero}>
                      <label>
                        <input
                          type="checkbox"
                          checked={elegidas.includes(item.numero)}
                          disabled={!usable}
                          onChange={() => Alternar(item.numero)}
                        />
                        {` ${item.numero}. ${item.titulo}`}
                        {usable ? '' : ' — no disponible'}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
            <p>{elegidas.length} seleccionadas. Disponibles: {disponibles.length}.</p>
            <div className="acciones-asistente">
              <button type="button" className="secundario" onClick={alCerrar}>
                Cerrar
              </button>
              <button
                type="button"
                onClick={ContinuarSeleccion}
                disabled={disponibles.length < 5 || elegidas.length < 5}
              >
                Siguiente
              </button>
            </div>
          </>
        ) : null}

        {paso === 'analisis' && actual ? (
          <>
            <p>
              {fijo.informeAnalitico?.instruccionAnalisis || INSTRUCCION_ANALISIS}
            </p>
            <p>Análisis {indice + 1} de {seleccionadas.length}</p>
            <h3>{actual.numero}. {actual.titulo}</h3>
            <p>{actual.fechaAplicada}</p>
            <GraficoReporteria visualizacion={actual} />
            <label htmlFor="analisis-informe">Análisis</label>
            <textarea
              id="analisis-informe"
              value={textos[actual.numero] || ''}
              onChange={(evento) => {
                const valor = evento.target.value;
                establecerTextos((previos) => ({ ...previos, [actual.numero]: valor }));
              }}
              rows={6}
            />
            <div className="acciones-asistente">
              <button
                type="button"
                className="secundario"
                onClick={() => (indice === 0
                  ? establecerPaso('seleccion')
                  : IrAnalisis(indice - 1))}
              >
                Anterior
              </button>
              <button type="button" onClick={ContinuarAnalisis}>Siguiente</button>
            </div>
          </>
        ) : null}

        {paso === 'titulo' ? (
          <>
            <label htmlFor="titulo-informe-texto">Título</label>
            <input
              id="titulo-informe-texto"
              value={titulo}
              onChange={(evento) => establecerTitulo(evento.target.value)}
            />
            <dl>
              <dt>Responsable</dt>
              <dd>{identificacion.responsable}</dd>
              <dt>Rol</dt>
              <dd>{identificacion.rol}</dd>
              <dt>Unidad</dt>
              <dd>{identificacion.unidad}</dd>
              <dt>Oficina local</dt>
              <dd>{identificacion.oficinaLocalId}</dd>
              <dt>Región</dt>
              <dd>{identificacion.regionId}</dd>
              <dt>Período</dt>
              <dd>{fijo.anio}</dd>
              <dt>Fecha del corte</dt>
              <dd>{fijo.fechaConsulta}</dd>
            </dl>
            <p>
              La fecha y hora se registran al confirmar el informe.
            </p>
            <div className="acciones-asistente">
              <button
                type="button"
                className="secundario"
                onClick={() => IrAnalisis(seleccionadas.length - 1)}
              >
                Anterior
              </button>
              <button type="button" onClick={ContinuarTitulo}>Siguiente</button>
            </div>
          </>
        ) : null}

        {paso === 'revision' ? (
          <>
            <h3>{titulo.trim()}</h3>
            <dl>
              <dt>Responsable</dt>
              <dd>{identificacion.responsable}</dd>
              <dt>Unidad</dt>
              <dd>{identificacion.unidad}</dd>
              <dt>Período</dt>
              <dd>{fijo.anio}</dd>
              <dt>Fecha del corte</dt>
              <dd>{fijo.fechaConsulta}</dd>
            </dl>
            <ul>
              {(fijo.filtrosActivos || []).map((filtro) => (
                <li key={filtro.codigo}>{filtro.etiqueta}</li>
              ))}
            </ul>
            {seleccionadas.map((item) => (
              <article key={item.numero}>
                <h3>{item.numero}. {item.titulo}</h3>
                <p className="analisis-previo">{textos[item.numero]}</p>
              </article>
            ))}
            <div className="acciones-asistente">
              <button
                type="button"
                className="secundario"
                onClick={() => establecerPaso('titulo')}
              >
                Anterior
              </button>
              <button type="button" onClick={Confirmar} disabled={generando}>
                {generando ? 'Generando informe…' : 'Confirmar y descargar'}
              </button>
              <button type="button" className="secundario" onClick={alCerrar}>
                Cerrar
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
