import TechnicalWelcome from '../features/welcome/TechnicalWelcome';

export default function App({ apiBaseUrl, environmentMode, loadStatus }) {
  return (
    <TechnicalWelcome
      apiBaseUrl={apiBaseUrl}
      environmentMode={environmentMode}
      loadStatus={loadStatus}
    />
  );
}
