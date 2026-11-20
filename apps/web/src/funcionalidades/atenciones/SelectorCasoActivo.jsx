/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-18.
 * HU-036 y HU-037. Diálogo para elegir un caso activo del ámbito por nombre o
 * identificación. No permite digitar identificadores internos de caso.
 */
import { useEffect, useRef, useState } from 'react';
import { Aviso, Campo, ResumenResultados, Vacio } from '../../componentes/interfaz';

const TAMANO_BUSQUEDA = 20;

/**
 * Consulta los casos activos del ámbito en el listado de casos existente.
 * El servidor vuelve a aplicar ámbito y capacidad.
 */
export async function BuscarCasosActivos({
  direccionApi,
  identidad,
  solicitarApi,
  modo,
  criterio,
  pagina = 1,
  tamano = TAMANO_BUSQUEDA
}) {
  const parametros = new URLSearchParams();
  parametros.set(modo === 'identificacion' ? 'identificacion' : 'nombre', criterio);
  parametros.set('estado', 'ACTIVO');
  parametros.set('pagina', String(pagina));
  parametros.set('tamano', String(tamano));
  const resultado = await solicitarApi(
    direccionApi,
    `/api/proceso/casos?${parametros.toString()}`,
    { identidad }
  );
  return {
    ...resultado,
    items: (resultado.items || []).filter((caso) => caso.estado === 'ACTIVO')
  };
}

/**
 * Selector accesible de casos activos.
 *
 * @param {string} titulo Título del diálogo.
 * @param {string} etiquetaAccion Texto del botón de cada resultado.
 * @param {Array<number>} excluidos Casos que ya no deben ofrecerse.
 * @param {Function} alSeleccionar Recibe el caso elegido; puede ser asíncrona.
 * @param {Function} alCerrar Cierra sin seleccionar.
 */
export default function SelectorCasoActivo({
  titulo,
  etiquetaAccion = 'Seleccionar',
  excluidos = [],
  direccionApi,
  identidad,
  solicitarApi,
  alSeleccionar,
  alCerrar
}) {
  const [modo, establecerModo] = useState('nombre');
  const [texto, establecerTexto] = useState('');
  const [corte, establecerCorte] = useState(null);
  const [pagina, establecerPagina] = useState(1);
  const [criterioAplicado, establecerCriterioAplicado] = useState(null);
  const [error, establecerError] = useState('');
  const [buscando, establecerBuscando] = useState(false);
  const [eligiendo, establecerEligiendo] = useState(null);
  const campoBusqueda = useRef(null);
  const cierre = useRef(alCerrar);

  useEffect(() => {
    cierre.current = alCerrar;
  }, [alCerrar]);

  useEffect(() => {
    const previo = document.activeElement;
    if (campoBusqueda.current) {
      campoBusqueda.current.focus();
    }
    function CerrarConEscape(evento) {
      if (evento.key === 'Escape') {
        cierre.current();
      }
    }
    document.addEventListener('keydown', CerrarConEscape);
    return () => {
      document.removeEventListener('keydown', CerrarConEscape);
      if (previo && previo.isConnected && typeof previo.focus === 'function') {
        previo.focus();
      }
    };
  }, []);

  async function Consultar(criterio, paginaSolicitada) {
    establecerError('');
    establecerBuscando(true);
    try {
      const resultado = await BuscarCasosActivos({
        direccionApi,
        identidad,
        solicitarApi,
        modo: criterio.modo,
        criterio: criterio.texto,
        pagina: paginaSolicitada
      });
      establecerCorte(resultado);
      establecerPagina(paginaSolicitada);
      establecerCriterioAplicado(criterio);
    } catch (fallo) {
      establecerError(fallo.message);
    } finally {
      establecerBuscando(false);
    }
  }

  function EnviarBusqueda(evento) {
    evento.preventDefault();
    const criterio = { modo, texto: texto.trim() };
    if (!criterio.texto) {
      establecerError(modo === 'nombre'
        ? 'Escriba el nombre o parte del nombre.'
        : 'Escriba la identificación.');
      return;
    }
    Consultar(criterio, 1);
  }

  async function Elegir(caso) {
    establecerError('');
    establecerEligiendo(caso.casoId);
    try {
      await alSeleccionar(caso);
    } catch (fallo) {
      establecerError(fallo.message);
    } finally {
      establecerEligiendo(null);
    }
  }

  const resultados = corte
    ? corte.items.filter((caso) => !excluidos.includes(caso.casoId))
    : [];
  return (
    <div className="dialogo-fondo" role="presentation">
      <div
        className="dialogo dialogo-amplio"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-selector-caso"
      >
        <h2 id="titulo-selector-caso">{titulo}</h2>
        <p className="introduccion">
          Solo aparecen casos activos de su ámbito. Busque por nombre o por identificación.
        </p>
        <form onSubmit={EnviarBusqueda} role="search" aria-label="Buscar caso activo">
          <Campo id="selector-caso-modo" etiqueta="Buscar por">
            <select
              id="selector-caso-modo"
              value={modo}
              onChange={(evento) => establecerModo(evento.target.value)}
            >
              <option value="nombre">Nombre</option>
              <option value="identificacion">Identificación</option>
            </select>
          </Campo>
          <Campo
            id="selector-caso-texto"
            etiqueta={modo === 'nombre' ? 'Nombre de la persona' : 'Identificación de la persona'}
          >
            <input
              id="selector-caso-texto"
              ref={campoBusqueda}
              value={texto}
              autoComplete="off"
              onChange={(evento) => establecerTexto(evento.target.value)}
            />
          </Campo>
          <div className="acciones">
            <button type="submit" disabled={buscando}>Buscar</button>
            <button type="button" className="secundario" onClick={alCerrar}>Cancelar</button>
          </div>
        </form>
        {error ? <Aviso>{error}</Aviso> : null}
        {buscando ? <p role="status">Buscando casos activos.</p> : null}
        {corte && resultados.length === 0 && !buscando ? (
          <Vacio texto="Ningún caso activo de su ámbito coincide con ese criterio." />
        ) : null}
        {resultados.length > 0 ? (
          <ul className="lista-acciones" aria-label="Casos activos encontrados">
            {resultados.map((caso) => (
              <li key={caso.casoId}>
                <span>
                  <strong>{caso.nombre || 'Nombre no disponible'}</strong>
                  {` — Identificación ${caso.identificacion} — Caso ${caso.casoId}`}
                </span>
                <button
                  type="button"
                  className="secundario"
                  disabled={eligiendo !== null}
                  aria-label={`${etiquetaAccion}: ${caso.nombre || caso.identificacion}`}
                  onClick={() => Elegir(caso)}
                >
                  {etiquetaAccion}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {corte ? (
          <ResumenResultados
            filtrados={corte.total}
            totalAmbito={corte.totalAmbito}
            pagina={pagina}
            tamano={corte.consulta && corte.consulta.tamano}
            hayFiltros
          />
        ) : null}
        {corte && corte.total > corte.devueltos ? (
          <div className="acciones">
            <button
              type="button"
              className="secundario"
              disabled={pagina <= 1 || buscando}
              onClick={() => Consultar(criterioAplicado, pagina - 1)}
            >
              Página anterior
            </button>
            <button
              type="button"
              className="secundario"
              disabled={pagina * TAMANO_BUSQUEDA >= corte.total || buscando}
              onClick={() => Consultar(criterioAplicado, pagina + 1)}
            >
              Página siguiente
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
