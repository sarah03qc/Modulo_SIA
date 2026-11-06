import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './styles/global.css';

const rootElement = document.getElementById('root');

createRoot(rootElement).render(
  <StrictMode>
    <App
      apiBaseUrl={import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3001'}
      environmentMode={import.meta.env.MODE}
    />
  </StrictMode>
);
