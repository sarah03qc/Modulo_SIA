# Dependencias del bootstrap

Verificado con Node.js **24.20.0** y npm **11.19.0** en el entorno local. El motor mínimo declarado es Node.js 22 y npm 10. No se cambió la instalación del sistema.

El gestor es npm, con workspaces `apps/api` y `apps/web`. Un solo `package-lock.json` en la raíz. La instalación reproducible es `npm ci`.

## Runtime

| Paquete | Versión | Área | Finalidad | Justificación |
| --- | --- | --- | --- | --- |
| `express` | 5.3.0 | API | Servidor HTTP | Framework backend seleccionado. La versión 5 es la estable actual. |
| `mssql` | 12.7.14 | API | Pools y consultas parametrizadas a SQL Server | Cliente mantenido para el motor ya elegido. No se agregó un ORM. |
| `react` | 19.3.1 | Web | Interfaz | Frontend seleccionado. |
| `react-dom` | 19.3.1 | Web | Renderizado en el navegador | Acompaña a React 19. |

`mssql` usa `tedious` de forma transitiva. No se declara `tedious` otra vez.

## Desarrollo y pruebas

| Paquete | Versión | Área | Finalidad | Justificación |
| --- | --- | --- | --- | --- |
| `vite` | 8.3.6 | Web | Servidor de desarrollo y build | Create React App no es una opción vigente. Vite no sustituye a React. |
| `@vitejs/plugin-react` | 6.2.1 | Web | JSX en Vite | Requerido por Vite para React. |
| `jest` | 30.5.2 | API y web | Pruebas | Framework de pruebas seleccionado. No se usó Vitest. |
| `jest-environment-jsdom` | 30.5.2 | Web | DOM de prueba | Necesario para renderizar React en Jest. |
| `supertest` | 7.3.1 | API | Peticiones HTTP en memoria | Evita abrir un puerto en las pruebas de Express. |
| `@swc/core` | 1.16.22 | Web | Transformación de JSX | Permite Jest sin introducir Babel en la aplicación. |
| `@swc/jest` | 0.2.39 | Web | Puente Jest–SWC | La aplicación la compila Vite; Jest necesita su propia transformación. |
| `@testing-library/react` | 16.3.3 | Web | Renderizado y consultas accesibles | Pruebas por rol y texto, compatibles con React 19. |
| `@testing-library/jest-dom` | 7.0.1 | Web | Aserciones del DOM | Complemento de Testing Library. |
| `@testing-library/user-event` | 14.6.8 | Web | Teclado | Cubre la comprobación básica de foco y Enter. |
| `jest-axe` | 11.0.0 | Web | Subconjunto automático de reglas de accesibilidad | No certifica WCAG. |
| `eslint` | 9.39.5 | API, web y scripts | Análisis estático | Ver advertencia de compatibilidad. |
| `@eslint/js` | 9.39.5 | Igual | Reglas recomendadas | Acompaña a ESLint 9. |
| `globals` | 17.14.0 | Igual | Globales de Node, navegador y Jest | Evita declararlas a mano. |
| `eslint-plugin-react` | 7.37.5 | Web | Reglas JSX | El paquete no declara soporte para ESLint 10. |
| `eslint-plugin-react-hooks` | 7.1.1 | Web | Reglas de hooks | Compatible con ESLint 9. |

## Variables de entorno

No se instaló `dotenv`. Node.js 22+ carga `--env-file` y `--env-file-if-exists`. Las pruebas de la API arrancan con ese mecanismo para heredar `apps/api/.env` sin imprimirlo.

## No incorporadas

| Herramienta | Motivo |
| --- | --- |
| TypeScript, NestJS, Next.js, ORM, Redis, colas | Fuera del stack autorizado. |
| Helmet | Las cabeceras necesarias de este bootstrap son cuatro y están en la aplicación. |
| Biblioteca de componentes | La pantalla técnica no la necesita. |
| Prettier | ESLint cubre el análisis. El formato queda en el código con un estilo único. |
| Concurrently | `scripts/dev-environment.js` arranca y detiene los dos procesos. |
| Contenedor de Node o Kubernetes | El SQL Server ya está publicado en el host. |
| ESLint 10.14.0 | Es la versión actual del registro, pero `eslint-plugin-react` 7.37.5 declara como par máximo ESLint `^9.7`. Se usa ESLint 9.39.5, última de la línea 9. |

## Compatibilidad

Las versiones directas anteriores son las publicadas en el registro al instalar. El lockfile fija también las transitivas. La auditoría de seguridad ejecutada queda en el informe de bootstrap, no como una promesa permanente: hay que repetir `npm audit` cuando cambien dependencias.

## Auditoría del 2026-11-06

`npm audit` reportó 19 avisos: 3 bajos y 16 moderados. Ninguno alto o crítico. No aparecen `express`, `mssql`, `react` ni `react-dom`. El árbol afectado es el de desarrollo de Jest (`glob`, `minimatch`, `deepmerge` y paquetes que dependen de ellos). La corrección que propone el auditor baja Jest a 25.1.0. No se aplicó: rompe el framework de pruebas vigente y no corrige el runtime.

`npm` también advierte que ESLint 9.39.5 ya no está en la ventana de soporte publicada por el proyecto ESLint. Se mantiene en esa versión porque `eslint-plugin-react` 7.37.5 no declara ESLint 10. Queda pendiente subir ESLint cuando el plugin de React lo permita.

## Advertencias

- El aislamiento de SQL no lo aporta ningún paquete. Depende del login configurado.
- `jest-axe` no reemplaza la revisión de contraste, teclado y ampliación.
- `mssql` puede reconectar dentro del pool; un error de login no debe reintentarse contra otra base. La configuración no hace eso.
