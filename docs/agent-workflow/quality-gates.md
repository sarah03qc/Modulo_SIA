# Quality gates

Para cada check registrar PASS, FAIL, NOT_APPLICABLE (motivo) o NOT_RUN
(causa). Adjuntar comando o revisión, resultado y ubicación de evidencia.
FAIL o NOT_RUN en un check obligatorio impiden aprobar el gate.
Un NOT_APPLICABLE no puede ocultar falta de fuentes o tooling requerido.

## GATE 1 — READY FOR DEVELOPMENT

- [ ] HU identificada.
- [ ] RF identificados.
- [ ] CU identificado cuando corresponda; justificar ausencia.
- [ ] Criterios de aceptación claros.
- [ ] Fuente funcional localizada y validada.
- [ ] Dependencias conocidas.
- [ ] Pendientes marcados.
- [ ] Sin contradicción funcional sin resolver en el alcance a implementar.
- [ ] Alcance y propietario definidos.

## GATE 2 — IMPLEMENTATION COMPLETE

- [ ] Compila con comando real del proyecto.
- [ ] Lint/static checks cuando existan.
- [ ] Tests unitarios pertinentes.
- [ ] Integración cuando corresponda; E2E si el riesgo lo requiere.
- [ ] Criterios de aceptación cubiertos por evidencia.
- [ ] Validación de errores y bordes.
- [ ] Permisos positivos y negativos verificados.
- [ ] Sin secretos.
- [ ] Sin datos sensibles en logs ni artefactos.
- [ ] Sin scope creep.
- [ ] Auditoría donde corresponda.
- [ ] Migraciones seguras/reversibles verificadas cuando correspondan.

## GATE 3 — READY FOR HUMAN REVIEW

- [ ] QA aprobado de forma independiente.
- [ ] Security review cuando aplica; justificar omisión.
- [ ] Code review independiente con hallazgos resueltos.
- [ ] Contratos compatibles.
- [ ] Migraciones verificadas.
- [ ] Documentación actualizada.
- [ ] Trazabilidad HU → RF → CU → código → tests (más RN/RNF aplicables).
- [ ] NEEDS_VALIDATION visibles y sin bloqueo crítico del alcance entregado.
- [ ] Sin documentar aspiraciones como comportamiento implementado.

## Bootstrap actual

No existe aplicación: build, lint de producto, unitarias de negocio, integración,
E2E, permisos runtime y migraciones son NOT_APPLICABLE a esta entrega de
configuración. La solicitud técnica sustituye identificadores funcionales solo
para infraestructura. Validar metadatos y enlaces con el script, revisar fuentes,
duplicaciones, secretos y límites, y obtener code review independiente.
El script no aprueba automáticamente ninguno de los tres gates de producto.
Descubrimiento runtime pendiente se registra NOT_RUN, no PASS. Gate 3 prepara
revisión humana del bootstrap con esta limitación visible.
