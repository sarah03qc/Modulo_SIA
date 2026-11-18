/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-18.
 * Modificación: 2026-11-18. Jerarquía del encabezado.
 * HU-049 y CU-37. Sección independiente. No envía la referencia.
 */
import { useEffect, useState } from 'react';
import { Aviso, Cargando, Campo, Vacio } from '../../componentes/interfaz';
import { SolicitarApi } from '../../servicios/cliente-api';

const ESTADOS = [
  ['', 'Todos'],
  ['PENDIENTE', 'Pendiente'],
  ['REFERENCIA_CREADA', 'Referencia creada']
];

function Consulta(filtros, pagina) {
  const parametros = new URLSearchParams();
  parametros.set('page', String(pagina));
  parametros.set('pageSize', '20');
  if (filtros.texto.trim()) {
    parametros.set('q', filtros.texto.trim());
  }
  if (filtros.fecha) {
    parametros.set('fecha', filtros.fecha);
  }
  if (filtros.estado) {
    parametros.set('estado', filtros.estado);
  }
  if (filtros.criterio.trim()) {
    parametros.set('criterio', filtros.criterio.trim());
  }
  if (filtros.establecimientoId.trim()) {
    parametros.set('establecimientoId', filtros.establecimientoId.trim());
  }
  return parametros.toString();
}

export default function PosiblesReferenciasPagina({
  direccionApi,
  identidad,
  contexto,
  navegar,
  solicitarApi = SolicitarApi
}) {
  const [filtros, establecerFiltros] = useState({
    texto: '',
    fecha: '',
    estado: 'PENDIENTE',
    criterio: '',
    establecimientoId: ''
  });
  const [aplicados, establecerAplicados] = useState(filtros);
  const [pagina, establecerPagina] = useState(1);
  const [lista, establecerLista] = useState(null);
  const [error, establecerError] = useState('');
  const [aviso, establecerAviso] = useState('');

  useEffect(() => {
    let vigente = true;
    establecerError('');
    solicitarApi(
      direccionApi,
      `/api/posibles-referencias?${Consulta(aplicados, pagina)}`,
      { identidad }
    )
      .then((datos) => {
        if (vigente) {
          establecerLista(datos);
        }
      })
      .catch((fallo) => {
        if (vigente) {
          establecerLista(null);
          establecerError(fallo.message);
        }
      });
    return () => {
      vigente = false;
    };
  }, [aplicados, direccionApi, identidad, pagina, solicitarApi]);

  async function Detectar() {
    establecerAviso('');
    establecerError('');
    try {
      const resultado = await solicitarApi(
        direccionApi,
        '/api/posibles-referencias/deteccion',
        { identidad, metodo: 'POST' }
      );
      establecerAviso(
        resultado.estado === 'CODIGOS_NO_VALIDADOS'
          ? 'Los códigos institucionales no están validados. No se generaron sugerencias.'
          : `Detección local terminada. Sugerencias nuevas: ${resultado.sugerenciasNuevas}.`
      );
      establecerAplicados({ ...aplicados });
    } catch (fallo) {
      establecerError(fallo.message);
    }
  }

  function Iniciar(item) {
    navegar('referencia-nueva', {
      personId: item.personId,
      posibleId: item.posibleId
    });
  }

  const total = lista ? lista.total : 0;
  const paginas = Math.max(1, Math.ceil(total / 20));

  return (
    <>
      <p className="contexto">Detección y referencia</p>
      <h1>Posibles referencias</h1>
      <p>
        Una señal no abre un caso ni envía la referencia.
        La confirmación sigue siendo humana.
      </p>
      {lista && lista.modo === 'SINTETICO' ? (
        <Aviso tipo="pendiente">
          El modo local usa códigos de demostración. No son un diagnóstico.
        </Aviso>
      ) : null}
      <form
        className="panel"
        onSubmit={(evento) => {
          evento.preventDefault();
          establecerPagina(1);
          establecerAplicados({ ...filtros });
        }}
      >
        <Campo id="posibles-q" etiqueta="Nombre o identificación">
          <input
            id="posibles-q"
            value={filtros.texto}
            onChange={(evento) => establecerFiltros({ ...filtros, texto: evento.target.value })}
          />
        </Campo>
        <Campo id="posibles-fecha" etiqueta="Fecha de detección">
          <input
            id="posibles-fecha"
            type="date"
            value={filtros.fecha}
            onChange={(evento) => establecerFiltros({ ...filtros, fecha: evento.target.value })}
          />
        </Campo>
        <Campo id="posibles-establecimiento" etiqueta="Establecimiento">
          <input
            id="posibles-establecimiento"
            value={filtros.establecimientoId}
            onChange={(evento) => establecerFiltros({
              ...filtros,
              establecimientoId: evento.target.value
            })}
          />
        </Campo>
        <Campo id="posibles-criterio" etiqueta="Criterio">
          <input
            id="posibles-criterio"
            value={filtros.criterio}
            onChange={(evento) => establecerFiltros({ ...filtros, criterio: evento.target.value })}
          />
        </Campo>
        <Campo id="posibles-estado" etiqueta="Estado de gestión">
          <select
            id="posibles-estado"
            value={filtros.estado}
            onChange={(evento) => establecerFiltros({ ...filtros, estado: evento.target.value })}
          >
            {ESTADOS.map(([valor, etiqueta]) => (
              <option key={valor || 'todos'} value={valor}>{etiqueta}</option>
            ))}
          </select>
        </Campo>
        <button type="submit">Aplicar filtros</button>
        {contexto && contexto.puedeCrearReferencia ? (
          <button type="button" className="secundario" onClick={Detectar}>
            Ejecutar detección local
          </button>
        ) : null}
      </form>
      {error ? <Aviso>{error}</Aviso> : null}
      {aviso ? <Aviso tipo="pendiente">{aviso}</Aviso> : null}
      {!lista && !error ? <Cargando texto="Cargando posibles referencias." /> : null}
      {lista && lista.items.length === 0 ? (
        <Vacio texto="No hay posibles referencias para este criterio." />
      ) : null}
      {lista && lista.items.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Persona</th>
              <th>Identificación</th>
              <th>Establecimiento</th>
              <th>Criterio detectado</th>
              <th>Sistema de origen</th>
              <th>Fecha de detección</th>
              <th>Estado de gestión</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {lista.items.map((item) => (
              <tr key={item.posibleId}>
                <td>{item.nombre || 'No disponible'}</td>
                <td>{item.personId}</td>
                <td>{item.establecimiento || item.establecimientoId}</td>
                <td>{item.criterioEtiqueta}</td>
                <td>{item.sistemaOrigen || 'No informado'}</td>
                <td>{item.fechaDeteccion}</td>
                <td>{item.estado === 'PENDIENTE' ? 'Pendiente' : 'Referencia creada'}</td>
                <td>
                  {item.puedeCrearReferencia && contexto && contexto.puedeCrearReferencia ? (
                    <button type="button" onClick={() => Iniciar(item)}>Crear referencia</button>
                  ) : item.referenciaId ? `Referencia ${item.referenciaId}` : 'No disponible'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {lista ? (
        <div className="acciones">
          <button
            type="button"
            className="secundario"
            disabled={pagina <= 1}
            onClick={() => establecerPagina(pagina - 1)}
          >
            Página anterior
          </button>
          <p>{pagina} de {paginas}</p>
          <button
            type="button"
            className="secundario"
            disabled={pagina >= paginas}
            onClick={() => establecerPagina(pagina + 1)}
          >
            Página siguiente
          </button>
        </div>
      ) : null}
    </>
  );
}
