export default function TechnicalStatus({ phase, message, institutionalReadOnly }) {
  return (
    <div role="status" aria-live="polite" aria-busy={phase === 'loading'}>
      {phase === 'loading' && <p>Comprobando la API.</p>}
      {phase === 'error' && <p>{message}</p>}
      {phase === 'ready' && <p>API en ejecución y dependencias disponibles.</p>}
      {phase === 'ready' && institutionalReadOnly === false && (
        <p>El permiso de solo lectura de la fuente institucional no está verificado.</p>
      )}
      {phase === 'degraded' && (
        <p>API en ejecución. Una o más dependencias no están disponibles.</p>
      )}
    </div>
  );
}
