/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-14.
 * Modificación: 2026-11-18. Estados de carga y vacío con superficie propia.
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
