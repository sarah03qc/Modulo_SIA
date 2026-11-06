import { useCallback, useEffect, useRef, useState } from 'react';
import TechnicalStatus from '../../components/TechnicalStatus';
import { loadTechnicalStatus } from '../../services/technical-status';

const ENVIRONMENT_LABELS = {
  development: 'Desarrollo',
  test: 'Pruebas',
  production: 'Producción'
};

export default function TechnicalWelcome({
  apiBaseUrl,
  environmentMode,
  loadStatus = loadTechnicalStatus
}) {
  const [phase, setPhase] = useState('loading');
  const [message, setMessage] = useState('');
  const [institutionalReadOnly, setInstitutionalReadOnly] = useState(undefined);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const current = requestId.current + 1;
    requestId.current = current;
    setPhase('loading');
    setMessage('');
    setInstitutionalReadOnly(undefined);
    try {
      const detail = await loadStatus(apiBaseUrl);
      if (current !== requestId.current) {
        return;
      }
      setInstitutionalReadOnly(detail.institutionalReadOnly);
      setPhase(detail.dependenciesAvailable ? 'ready' : 'degraded');
    } catch (error) {
      if (current !== requestId.current) {
        return;
      }
      setPhase('error');
      setMessage(error instanceof Error ? error.message : 'No fue posible comunicarse con la API.');
    }
  }, [apiBaseUrl, loadStatus]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const environmentLabel = ENVIRONMENT_LABELS[environmentMode] || 'Desarrollo';

  return (
    <main className="welcome">
      <p className="eyebrow">Infraestructura inicial</p>
      <h1>SIA-CENCINAI</h1>
      <p className="lead">
        Sistema de apoyo a la Atención Interdisciplinaria. Esta pantalla confirma que la aplicación web está inicializada.
      </p>
      <section className="panel" aria-labelledby="status-title">
        <h2 id="status-title">Estado técnico</h2>
        <p>
          Ambiente: <strong>{environmentLabel}</strong>
        </p>
        <TechnicalStatus
          phase={phase}
          message={message}
          institutionalReadOnly={institutionalReadOnly}
        />
      </section>
      <button type="button" onClick={refresh}>Volver a comprobar</button>
    </main>
  );
}
