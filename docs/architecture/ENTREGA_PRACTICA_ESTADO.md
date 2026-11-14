# Entrega de práctica — estado funcional

Fecha: 2026-11-14. Responsable: Sarah Priscilla Quesada Chaves.

Esta entrega no es la versión institucional definitiva ni está autorizada para producción.
La sesión productiva de SIDINACC sigue `NEEDS_VALIDATION`. En local se usa una identidad
sintética que el servidor ya asoció a un ámbito. El cliente no elige el rol.

## Cómo iniciar y demostrar

1. Tener Node.js 22 o superior y las bases locales ya migradas. No ejecutar migraciones desde la API.
2. Desde la raíz: `npm ci`. Copiar `apps/api/.env.example` a `apps/api/.env` y completar las contraseñas locales. No versionar ese archivo.
3. `npm run verify:config` y `npm run dev`. Abrir `http://127.0.0.1:5174`, no `localhost`, para que coincida el origen CORS.
4. Entrar con **Establecimiento de demostración** o **Oficina Local de demostración**.
5. Recorrido: Buscar persona → Nueva referencia → validar → confirmar el envío → en Oficina Local abrir Pendientes → Sesiones → asociar la referencia → valorar → decidir → abrir el caso → Casos.

Los datos de demostración son los de `database/sia-cencinai/seeds/`. No se ejecutan al arrancar
y esta entrega no los borra ni los vuelve a cargar. Las referencias nuevas se crean por la aplicación.

Las sesiones, valoraciones y casos nuevos usan tablas que la cuenta `sia_cencinai_app` todavía
no puede leer o escribir por completo. El script preparado, y no ejecutado, es
`database/sia-cencinai/security/030_grant_process_writes_to_app.sql`.
Una lectura del 2026-11-14, sin cambiar permisos, encontró referencias, la vista de casos,
dos disciplinas y una estrategia. Sesiones, instrumento vigente y matriz RN-009 respondieron
sin permiso. Hasta aplicar ese script, esas operaciones informan el bloqueo y no inventan cifras.

Si el instrumento, las disciplinas o las estrategias no están en el catálogo vigente, la pantalla
lo dice y no inventa factores ni opciones. La semilla confirmada no trae esos ítems; la semilla
sintética sí trae valores marcados como sintéticos.

## Historias de este lote

| HU | Estado | Evidencia | Dependencia o bloqueo |
| --- | --- | --- | --- |
| HU-001 | Implementada | `GET /api/proceso/resumen`, pantalla Inicio | El conteo de casos usa la vista ya concedida por `010_grant_case_list_to_app.sql` |
| HU-002 | Parcial | Mismos resumen y accesos; sesiones próximas reales | Posibles referencias, actividades vencidas y próximas acciones quedan `NO_DISPONIBLE`. Sesiones requieren el script `030` |
| HU-005 a HU-009 | Implementada | APIs institucionales ya existentes y pantalla Buscar persona | Réplica `SIDINACC_LOCAL` y periodo configurado |
| HU-013 a HU-014 | Implementada | `POST /api/references/validation`, `POST /api/references`, borradores y plantilla; formulario con confirmación | Catálogo de motivos ya sembrado |
| HU-015 a HU-017 | Implementada | `GET /api/references`, detalle y `GET /api/references/:id/document` | El diseño documental de la impresión sigue el pendiente previo del módulo |
| HU-018 | Implementada | Bandeja Pendientes sobre el listado existente; el estado cambia al resolver o abrir | Mismo ámbito que referencias |
| HU-019 | Parcial | `POST/GET /api/proceso/sesiones` y asociación por búsqueda | No hay borrador de sesión. Requiere script `030` y disciplinas vigentes para elegirlas |
| HU-020 | Parcial | `POST /api/proceso/valoraciones` y `POST /api/proceso/prioridad` | No confirma si falta el instrumento o si la matriz no coincide con RN-009. La revaloración actualiza la vigente y conserva las anteriores; no versiona el plan |
| HU-021 | Implementada | `POST /api/proceso/resoluciones`. No abre el caso sola | `No requiere A.I.` exige justificación y actualiza la referencia |
| HU-022 | Parcial | `POST /api/proceso/casos`, transacción, unicidad del caso activo y auditoría | Se detiene si no hay estrategias o disciplinas vigentes. No inventa esos catálogos |
| HU-023 | Implementada | `GET /api/proceso/casos` sin detalle interno ni exportación | Solo Establecimiento |
| HU-024 | Parcial | Mismo listado con filtros y `GET /api/proceso/casos/exportacion` | La exportación se limita a una página de 50 y pide precisar el corte |
| HU-025 | Parcial | `GET /api/proceso/casos/:casoId` | Historial de atenciones, grupos, coordinaciones, traslados y reportes no está en este lote. Establecimiento recibe 403 |

Quedan fuera de este lote, sin cifras ficticias: HU-003, HU-004, reportería regional y nacional,
asistente conversacional, posibles referencias automáticas y programación operativa.

## Pendientes no bloqueantes

- Autenticación productiva SIDINACC: `NEEDS_VALIDATION`.
- Nombres institucionales definitivos de disciplinas, estrategias y factores del instrumento.
  Hoy solo se usan filas ya almacenadas.
- Aplicar en local el script `030`. No forma parte del arranque.
- Borrador de sesión y nueva versión del plan en una revaloración.
- Zona horaria institucional de las fechas de resumen.

## Verificación de esta entrega

El 2026-11-14 se recorrió la aplicación en `http://127.0.0.1:5174` contra las bases locales.

- Establecimiento: el inicio mostró 5 referencias consultables y 2 personas con caso activo.
  Posibles referencias, actividades vencidas y próximas acciones quedaron como no disponibles.
- La búsqueda de `SYN-1100102-01` devolvió una persona sintética y su contexto.
- La validación de una referencia nueva bloqueó el envío porque esa persona ya tiene un caso activo.
  No se guardó esa referencia.
- La lista y el detalle de referencias, y la lista de casos sin botón de detalle, respondieron.
- Oficina Local: 14 pendientes, coincidentes con la bandeja, y 21 casos activos.
  Sesiones y próximas sesiones informan que la cuenta técnica no puede consultarlas.
- `npm run verify:config` quedó correcto. `npm run lint`, las pruebas de API y web, y `npm run build`
  se ejecutaron en esta entrega. Las pruebas de escritura en vivo siguen omitidas hasta autorizarlas.
  El script `030` no se ejecutó.
