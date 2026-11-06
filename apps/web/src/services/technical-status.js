export async function loadTechnicalStatus(baseUrl, fetchImpl = globalThis.fetch) {
  const root = String(baseUrl || '').replace(/\/$/, '');
  if (!root) {
    throw new Error('Falta la dirección de la API.');
  }

  let healthResponse;
  let readyResponse;
  try {
    [healthResponse, readyResponse] = await Promise.all([
      fetchImpl(`${root}/health`),
      fetchImpl(`${root}/ready`)
    ]);
  } catch {
    throw new Error('No fue posible comunicarse con la API.');
  }

  if (!healthResponse.ok) {
    throw new Error('La API no respondió correctamente.');
  }

  const health = await healthResponse.json();
  const ready = await readyResponse.json();
  return {
    health,
    ready,
    dependenciesAvailable: readyResponse.ok && ready.status === 'ready',
    institutionalReadOnly: ready && ready.checks ? ready.checks.sidinacc?.readOnly : undefined
  };
}
