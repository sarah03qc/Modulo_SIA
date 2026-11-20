/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-14.
 * Modificación: 2026-11-18. Contador de resultados y panel plegable.
 */

export function Aviso({ tipo = 'error', children }) {
  const rol = tipo === 'error' ? 'alert' : 'status';
  return <p className={`aviso aviso-${tipo}`} role={rol}>{children}</p>;
}

export function Cargando({ texto = 'Cargando.' }) {
  return <p className="estado-carga" role="status">{texto}</p>;
}

export function Vacio({ texto }) {
  return <p className="vacio">{texto}</p>;
}

export function Campo({ id, etiqueta, children }) {
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      {children}
    </div>
  );
}

export function ResumenResultados({
  filtrados,
  totalAmbito,
  pagina = 1,
  tamano,
  hayFiltros = false
}) {
  const coincidencias = Number(filtrados) || 0;
  const ambito = Number.isFinite(Number(totalAmbito))
    ? Number(totalAmbito)
    : coincidencias;
  const texto = hayFiltros
    ? `${coincidencias} de ${ambito} resultados`
    : `${coincidencias} resultados`;
  const porPagina = Number(tamano);
  const muestraPagina = Number.isFinite(porPagina)
    && porPagina > 0
    && coincidencias > porPagina;
  const inicio = coincidencias === 0 ? 0 : ((pagina - 1) * porPagina) + 1;
  const fin = Math.min(pagina * porPagina, coincidencias);
  return (
    <p className="resumen-resultados">
      {texto}
      {muestraPagina ? (
        <span>{`Mostrando ${inicio}–${fin} de ${coincidencias}`}</span>
      ) : null}
    </p>
  );
}

export function PanelPlegable({ id, titulo, abierto, alAlternar, children }) {
  return (
    <section className={`panel-plegable${abierto ? ' abierto' : ''}`}>
      <h2>
        <button
          type="button"
          aria-expanded={abierto}
          aria-controls={id}
          onClick={alAlternar}
        >
          <span aria-hidden="true">{abierto ? '▾' : '▸'}</span>
          {titulo}
        </button>
      </h2>
      <div className="cuerpo" id={id} hidden={!abierto}>
        {children}
      </div>
    </section>
  );
}

export function ClasePrioridad(codigo) {
  if (codigo === 'ALTO') {
    return 'prioridad-alto';
  }
  if (codigo === 'MODERADO') {
    return 'prioridad-moderado';
  }
  if (codigo === 'BAJO') {
    return 'prioridad-bajo';
  }
  return undefined;
}
