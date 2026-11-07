# Módulo de referencias

Lote 02. Historias HU-013 a HU-017. Casos de uso CU-04, CU-05 y la consulta de CU-06. No incluye sesiones, valoración ni apertura de caso.

## Capas

`apps/api/src/modules/references/`

| Pieza | Responsabilidad |
| --- | --- |
| `reference-routes.js` | HTTP. Exige la capacidad |
| `reference-validation.js` | DTO. Rechaza estado, comprobante y responsable sustituto |
| `reference-service.js` | Ámbito, persona, catálogo, envío, consulta, plantilla y documento |
| `reference-rules.js` | Consecutivo, motivos y textos |
| `reference-snapshot.js` | Contexto histórico tomado de la réplica antes de la transacción |
| `reference-repository.js` | SQL parametrizado y transacción de envío |
| `reference-template.js` | Libro Excel. No ejecuta fórmulas |
| `reference-document.js` | HTML imprimible. No modifica la referencia |

La autorización sigue en `capabilities.js` y `authorization-policy.js`. No hay un rol nuevo. Establecimiento recibe `referral.create`, `referral.read`, `referral.read.detail`, `referral.print` y `referral.import`. Oficina Local las hereda. ACT-02, ACT-03 y ACT-04 no se separan.

## API

Prefijo `/api/references`. La sesión sintética sigue limitada a `development` y `test`.

| Método y ruta | Capacidad | Efecto |
| --- | --- | --- |
| `GET /catalogs` | `referral.create` | Vías, orígenes y motivos vigentes |
| `GET /template` | `referral.import` | Descarga `SIA-REF-PLANTILLA-1` |
| `POST /template` | `referral.import` | Precarga. No envía ni reserva consecutivo |
| `POST /validation` | `referral.create` | Revisión. No escribe la referencia |
| `POST /` | `referral.create` | Envío transaccional |
| `GET /` | `referral.read` | Listado del ámbito, con total |
| `GET /:referenceId` | `referral.read.detail` | Detalle o `404` si está fuera del ámbito |
| `GET /:referenceId/document` | `referral.print` | HTML. Registra impresión |
| `GET /drafts`, `PUT /drafts`, `DELETE /drafts/:draftId` | `referral.create` | Borrador del autor |

El listado acepta `page`, `pageSize` (máximo 50), `name`, `identification`, `consecutive`, `status`, `attentionRoute`, `origin`, `category` y `establishmentId`. El ámbito no sale de esos parámetros: lo resuelve el contexto. Un recurso ajeno responde `404` con el mismo texto que uno inexistente.

Errores habituales: `400` de validación, `401` sin sesión, `403` sin capacidad, `409` por caso activo o consecutivo duplicado, `413` si el archivo supera 1 MB.

## Consecutivo

El sistema no lo genera ni exige correlatividad. Lo canónico es mayúsculas, sin espacios, con el patrón `DNCC-DRXX-OLXXX-{código}-REF-XXX-20XX`. Los códigos regionales aceptados son CS, HN, CH, HC, BR, CN, PC, CO y CE.

El segmento del establecimiento debe ser el de la persona referida. RF-115 no exige que el segmento de Oficina Local ni el regional coincidan con la ubicación de la persona. El identificador técnico es `referencia_id`.

## Envío

La lectura de SIDINACC termina antes de la transacción. Dentro de ella, con `READ COMMITTED`:

1. Bloquea o crea `vinculo_persona`.
2. Si existe un caso `ACTIVO`, revierte con el error `52110` y un mensaje fijo, sin columnas del expediente.
3. Inserta la referencia en `PENDIENTE_REVISION`, el contexto y los motivos.
4. Borra el borrador del autor para esa persona, si existe.
5. Inserta `aud_evento` con la acción `ENVIO`.
6. Confirma.

`enviada_en` y `creada_en` salen de `SYSUTCDATETIME()`. El responsable, quien envía y quien crea son el `principalId` del servidor. Un interbloqueo `1205` se reintenta hasta tres veces. El duplicado `2601` no se reintenta ni propone otro número. Una referencia pendiente no se trata como caso activo.

## Contexto histórico

`ref_contexto` guarda encargado, relación, contacto, dirección, servicios, nombres territoriales, edad y fecha de nacimiento disponibles al enviar. Esos valores se leen en el detalle y en el documento.

El nombre y el sexo no tienen columna. La respuesta los marca `CURRENT_INSTITUTIONAL` cuando la persona sigue en el ámbito, o `UNAVAILABLE` si no. No se escriben dentro de otro campo. Agregar `nombre_persona` y `sexo_informado` a `ref_contexto` queda propuesto y no ejecutado: sería una migración de esquema.

La edad usa la fecha de la referencia. La zona horaria institucional sigue `NEEDS_VALIDATION`; el instante persistido es UTC del motor.

## Plantilla

Versión técnica `SIA-REF-PLANTILLA-1`. Hoja `Referencia`, una fila de datos, encabezados fijos. `exceljs` 4.4.0 lee y escribe el libro. Se rechaza un paquete con macros, enlaces externos, fórmulas o texto enriquecido. El archivo máximo es 1 MB.

La precarga devuelve el mismo cuerpo que el envío manual, sin responsable. Confirmar llama a `submitReferral`. HU-014 sigue en propuesta de diseño validada: este libro no es el formulario gráfico definitivo.

Los factores de riesgo individual, hogar-familiar y comunitario no están en el catálogo vigente. El catálogo los informa como `NEEDS_VALIDATION` y el filtro `FACTORES_RIESGO` no devuelve filas. No se inventaron ítems.

## Documento

HTML autónomo, sin logotipo ni encabezado oficial. HU-017 sigue con diseño documental pendiente. La fecha de generación viaja en `X-Document-Generated-At` y en el cuerpo. La de envío no se reescribe. La impresión inserta `ref_impresion` y un evento `IMPRESION`. No hay `UPDATE` de `ref_referencia`.

## Borrador

`bor_captura` con flujo `REFERENCIA`. El servicio filtra por el autor. Otra persona de la misma oficina recibe `404`. Si una oficina puede ver el borrador de otra persona sigue `NEEDS_VALIDATION`; no se amplió el permiso. El borrador no tiene estado ni comprobante de envío.

## Auditoría

`aud_evento` guarda usuario, rol interno, acción, entidad, identificador, ámbito y código. No guarda narrativa clínica. En `development` y `test` el usuario es la identidad sintética del servidor. No es una identidad productiva de SIDINACC. El ámbito lo marca con `ID:SINTETICA`.

## Permisos SQL

Script `database/sia-cencinai/security/020_grant_reference_writes_to_app.sql`, aplicado en el ambiente local a `sia_cencinai_app`. No es migración. No concede `db_datawriter` ni membresía en `rol_aplicacion`. El detalle está en `SOFTWARE_ARCHITECTURE.md`.

La sonda de la API sigue en `readOnly: true` porque evalúa el `INSERT` de base, no el de estas tablas.

## Fuera de este lote

Sesiones, valoración, admisión, apertura y cierre de caso, posibles referencias automáticas y la navegación visual de etapas. El contrato de etapas viaja en la validación (`PERSON`, `REFERENCE_DATA`, `MOTIVES`, `NARRATIVE`, `CONSECUTIVE`, `REVIEW`) para una interfaz posterior.
