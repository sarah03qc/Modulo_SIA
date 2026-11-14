/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves
 * Primer registro del archivo en Git: 2026-11-06 (5fabddc)
 * Modificación del 2026-11-14: nomenclatura del punto de montaje
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Aplicacion from './aplicacion/Aplicacion';
import './estilos/global.css';

/**
 * Monta la aplicación en el navegador.
 * La dirección de la API sale de la configuración o, en local, de 127.0.0.1 en el puerto 3001.
 */
const elementoRaiz = document.getElementById('root');

createRoot(elementoRaiz).render(
  <StrictMode>
    <Aplicacion
      direccionApi={import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3001'}
      ambiente={import.meta.env.MODE}
    />
  </StrictMode>
);
