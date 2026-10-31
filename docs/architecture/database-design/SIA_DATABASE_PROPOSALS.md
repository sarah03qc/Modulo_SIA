# Tres alternativas de base de datos para SIA-CENCINAI

**Uso:** documento de reunión. No es una decisión aprobada.  
**Estado de esta etapa:** análisis + modelado lógico. Sin migrations, sin ORM, sin cambios a SIDINACC_LOCAL ni a la spec.  
**Detalle por alternativa:** [PROPOSAL_A.md](./PROPOSAL_A.md) · [PROPOSAL_B.md](./PROPOSAL_B.md) · [PROPOSAL_C.md](./PROPOSAL_C.md)  
**ERD:** `database/proposals/proposal_{A,B,C}.mmd` y `.dbml`

---

## 1. Contexto

SIA-CENCINAI debe persistir el proceso de Atención Interdisciplinaria **en una base propia**, conceptualmente separada de SIDINACC/CAH. SIDINACC es la fuente de persona, familia, territorio y servicios. SIA no debe copiar esos maestros ni mezclar traslado CAH, prioridad CAH o referencia a servicios con los conceptos de A.I. (`CONFIRMADO`: `SIDINACC_LOCAL_REPLICA_SPEC`, análisis SIDINACC/CAH, RF-011, RF-104, RNF-020).

El proceso institucional vigente (`PRO.D-AI-P-01`, mayo 2026) y la especificación funcional v0.4 coinciden en lo sustancial: referencia ≠ caso; el E.I. de OL decide el ingreso; una sesión analiza N situaciones; valoración con factores protectores/riesgo/alerta; atenciones individuales y grupales; reporte ≠ cierre; traslado cierra responsabilidad de origen y destino confirma continuidad.

El **Segundo Informe** documentó una propuesta relacional preliminar que **sí copiaba** persona/territorio/profesional en SIA. Esa propuesta es antecedente, no arquitectura obligatoria. Informe 11 pidió **tres alternativas** comparables.

Las tres opciones cubren el mismo alcance funcional. Difieren en **dónde está la verdad**, **qué es un “caso”** y **cómo se consultan los indicadores**.

---

## 2. Criterios de evaluación

| Criterio | Qué se mira en esta decisión |
| --- | --- |
| Claridad del modelo | ¿Un profesional/desarrollador entiende qué fila es el expediente? |
| Normalización | ¿El esquema refleja cardinalidades del proceso o diluye hechos en JSON/eventos? |
| Separación de dominios | ¿Ingreso, sesión, caso, atención y reportería están acoplados? |
| Mantenibilidad | Costo de cambiar boletas, catálogos y reglas sin rehacer el núcleo |
| Trazabilidad / histórico | Autor, digitador, fecha evento vs digitación, no overwrite (P-07, RNF-005/006, RF-097) |
| Reportería | Casos, referencias, personas únicas, atenciones, consolidaciones OL→Nacional (P-11, RF-087/088) |
| Integración SIDINACC | Solo IDs lógicos; sin FK cruzadas; sin maestros duplicados |
| Flexibilidad ante el procedimiento | Vías emergencia/urgencia; boletas que UIVCD puede ajustar |
| Complejidad backend / consultas | Write path, invariantes, joins, proyecciones |
| Escalabilidad | De OL a consolidado nacional sin cargar el cliente |
| Riesgo de duplicación | Personas, territorio, indicadores, atenciones grupales |
| Auditoría | Accesos y cambios sensibles (RNF-003) aparte o mezclados con el negocio |

---

## 3. Propuesta A — Caso operativo 3NF

**Diagrama:** `database/proposals/proposal_A.mmd`

**Concepto.** El expediente es `caso_ai` y sus hijas. Estado vigente en la fila; histórico en satélites; línea de tiempo como **índice derivado**. Sin tablas de persona/territorio.

**Qué la diferencia.** La verdad es relacional y mutable (con hist). Un traslado **parte** el expediente en caso origen + caso destino. Reportería = SQL sobre OLTP.

**Ventajas.** Encaje directo con HU/RF; transacciones SQL naturales; menor curva; no copia SIDINACC (a diferencia del Segundo Informe).

**Costo principal.** El esquema se parece a la boleta actual: cambiar valoración/factores cuesta más. El hilo post-traslado es una cadena de casos. El índice de línea de tiempo puede desfasarse.

---

## 4. Propuesta B — Ledger de eventos

**Diagrama:** `database/proposals/proposal_B.mmd`

**Concepto.** La verdad es `evento_ai` inmutable. `proceso_ai` es el hilo de la persona. `snap_*` se reconstruye. La línea de tiempo **es** el ledger.

**Qué la diferencia.** No hay `UPDATE` de negocio. Un no-ingreso, una anulación y un traslado son hechos del mismo stream. El caso visible es proyección.

**Ventajas.** RNF-005 por construcción; longitudinal intacto entre OLs; nuevos tipos de evento sin rediseñar el núcleo.

**Costo principal.** Backend de comandos + proyecciones; invariantes (unicidad, un cierre) en aplicación; reportería nacional débil hasta snapshots de corte.

---

## 5. Propuesta C — Necesidad / responsabilidad + instrumentos + mart

**Diagrama:** `database/proposals/proposal_C.mmd`

**Concepto.** `necesidad_ai` (hilo) ≠ `responsabilidad_ol` (caso que gestiona una OL). Boletas en `instrumento_*` versionados. Tableros leen `sia_consulta`, no las tablas de captura.

**Qué la diferencia.** El traslado cierra un **período** y abre otro sobre la misma necesidad. La reportería es un modelo distinto. La valoración no es un árbol 3NF de la boleta de mayo 2026.

**Ventajas.** P-16 queda explícito; boletas pueden evolucionar; consolidaciones nacionales no pelean con el OLTP.

**Costo principal.** Más conceptos y dualidad operación/consulta (latencia o dual-write). Riesgo de JSON opaco si no se llena `instrumento_item`.

---

## 6. Comparación

| Criterio | Propuesta A | Propuesta B | Propuesta C |
| --- | --- | --- | --- |
| Complejidad inicial | Baja-media: tablas de dominio conocidas | Alta: ledger, correlación, replay | Media-alta: dos modelos (núcleo + mart) y instrumentos |
| Normalización | Alta en hechos de proceso; catálogos 3NF | Baja en el hecho (payload); alta en el ledger como bitácora | Alta en núcleo; media en instrumentos (payload + ítems) |
| Trazabilidad | Buena si se disciplina satélites + auditoría | Máxima en escrituras; lecturas van aparte | Buena en períodos e instancias confirmadas; no hay replay total |
| Histórico | Satélites + índice; riesgo de campos sin hist | Append-only; reconstrucción a fecha T | Períodos cerrados + versiones de instrumento; mart insert-only |
| Reportería | Viable en OL; nacional = joins SIA+SIDINACC en servicio | Débil hasta proyección de corte | Diseñada para RF-087/095; costo de mantener el mart |
| Integración SIDINACC | IDs congelados; igual frontera en las tres | Igual frontera; PII extra puede colarse en payload | Igual frontera; nombres territoriales solo en dim snapshot |
| Flexibilidad | Catálogos sí; forma de boleta rígida | Alta vía nuevos tipos/esquemas de evento | Alta vía `instrumento_version` sin tocar núcleo |
| Mantenibilidad | Alta mientras el procedimiento no cambie de forma | Alta para historia; cara en invariantes y versiones de payload | Alta si hay gobierno de instrumentos; si no, caos de formularios |
| Facilidad de implementación | La más directa en SQL Server + API CRUD | La menos directa para el equipo actual | Intermedia: se puede nacer sin mart físico (vistas) |
| Claridad “qué es el caso” | Una fila `caso_ai` | Un id lógico en snapshots del proceso | La `responsabilidad_ol` activa; la necesidad es el hilo |
| Riesgo | Drift de línea de tiempo; cadena de traslados opaca | Snapshots desfasados (RNF-007); event washing | Mart ≠ bandeja; denuncia/cierre mal colgados al hilo vs período |
| Duplicación | Baja de maestros; grupal bien modelada | Baja si se respeta un evento grupal + N participaciones | Baja de maestros; riesgo de copiar nombres al mart sin política |

Las tres: misma cobertura funcional (referencia → sesión → decisión → caso/período → atenciones N:M → documentos, coordinaciones, acción externa, programación, reporte sin cierre, cierre, traslado, autoría, catálogos, reportería). Ninguna quita capacidades para “ganar” la comparación.

---

## 7. Diferencias fundamentales

**La decisión no es de nombres de tablas. Es esta:**

### ¿Dónde vive la verdad operativa?

| Si el equipo elige… | Está decidiendo que… |
| --- | --- |
| **A** | La fila actual del caso (y sus hijas) es la verdad. Historia = satélites. UI y reportes leen el OLTP. |
| **B** | El hecho inmutable es la verdad. El caso es una proyección. Corregir = nuevo evento. |
| **C** | El núcleo (necesidad + responsabilidad + actividad) es la verdad de proceso; las boletas son instrumentos versionados; los tableros leen otro modelo. |

### A vs B (estructural, no cosmético)

1. **Grano de persistencia:** entidad mutable vs evento append-only.  
2. **Línea de tiempo:** índice derivado vs fuente.  
3. **Traslado:** dos `caso_ai` enlazados vs un `proceso_ai` que no se parte.  
4. *(extra)* Invariantes en FK SQL vs invariantes en reducción de eventos.

### A vs C

1. **Caso:** un expediente-fila vs período de responsabilidad sobre un hilo.  
2. **Valoración/motivos/plan:** tablas 3NF de la boleta actual vs `instrumento_instancia` + ítems.  
3. **Reportería:** queries al OLTP vs mart (`hecho_*` / `dim_*`).  
4. *(extra)* Atención grupal hija-opcional del caso vs actividad de un dominio de atención.

### B vs C

1. **Historia universal:** todo es evento vs solo períodos + instancias confirmadas.  
2. **Consulta analítica:** reducir eventos o snapshot genérico vs estrella diseñada para RF-087.  
3. **Evolución:** nuevo `tipo_evento` vs nuevo `instrumento_version` con campos gobernados.  
4. *(extra)* B no tiene “caso” canónico; C sí (`responsabilidad_ol`), distinto del hilo.

Si no se puede articular al menos estos contrastes, las alternativas estarían demasiado cerca. Aquí no lo están.

**Antecedente explícito.** Elegir A **no** es adoptar el Segundo Informe: aquella versión materializaba `region`, `local_office`, `establishment`, `person`, `professional`, `system_user` dentro de SIA. Las tres alternativas de este paquete **rechazan** esa copia.

---

## 8. Recomendación técnica

*No es decisión institucional ni ADR.*

### Hechos (documentos)

- SIA propia ≠ SIDINACC (`CONFIRMADO`).
- Referencia no abre caso; decisión del E.I.; grupal 1 registro; reporte ≠ cierre; traslado ≠ fin de la necesidad (`CONFIRMADO` RN/RF y procedimiento).
- Clave de persona de trabajo actual: `PER_idPersona`; alternativa `RCS_idPersona` sin confirmar (`PENDIENTE DE VALIDACIÓN`).
- Contratos de identidad funcionaria, establecimientos autorizados y mecanismo real de integración: no definidos (`PENDIENTE DE VALIDACIÓN` / RF-104).
- Procedimiento añade vías de emergencia, contra-referencia, denuncia, sesión de permanencia/cierre y rol de ATE; RN-023 limita edición regional (`PENDIENTE DE VALIDACIÓN` el choque).
- Informe 11 pide comparar separación de dominios, mantenibilidad, trazabilidad e integración.

### Inferencias técnicas

- Un 3NF de captura es el camino más corto a P0 transaccional en SQL Server.
- Event sourcing resuelve historia, no acelera bandejas ni tableros.
- Un mart físico desde el día 1 es prematuro si el volumen aún es el de un módulo nuevo; las **vistas** pueden simular C-consulta.
- Versionar catálogos (RF-099/100) hace falta en **cualquier** elección; versionar la **forma** de la boleta es el diferencial de C.
- Distinguir hilo vs responsabilidad (C) expresa P-16 mejor que la cadena de casos de A.

### Recomendación

**Partir de A como modelo de implementación inicial**, y **adoptar dos piezas de C sin construir C completo:**

1. Congelar IDs territoriales en cada hecho (las tres ya lo hacen; no crear maestros).  
2. Diseñar `caso` de forma que un `id_hilo` o equivalente permita encadenar traslados **desde el inicio** (evitar el callejón de A pura). Eso es un injerto mínimo de `necesidad_ai`, no el mart.  
3. Catálogos versionados ya en A.  
4. Dejar el mart como fase 2 (vistas → tablas `hecho_*` cuando Regional/Nacional lo exijan en volumen).  
5. **No** iniciar con B salvo que UTIC o auditoría institucional exijan libro de hechos reconstruible como requisito de arquitectura, no como preferencia de diseño.

Si la reunión anticipa cambios frecuentes de anexos (valoración, boleta de referencia) **antes** del primer release, subir el peso de C (instrumentos) y no rigidizar `valoracion_factor` como está hoy.

---

## 9. Preguntas para validar en reunión

Solo las que **cambiarían el esquema**:

1. **¿La clave estable de persona será `PER_idPersona` o `RCS_idPersona`?** Define el tipo y la unicidad de todo sujeto SIA.  
2. **Traslado: ¿el “caso” digital es un período por OL (C) o un expediente que se cierra y se crea otro (spec RF-063 / A)?** Hay que alinear lenguaje del procedimiento (“cierre del caso”) con P-16.  
3. **¿ATE registra atenciones/resoluciones en el módulo o solo consulta?** El procedimiento las incluye; RN-023 las excluye de edición. Cambia actores y ámbito de escritura.  
4. **¿Denuncia y contra-referencia son entidades de SIA o documentos/acciones ligadas al período?** El procedimiento las trata con boletas propias y expediente de denuncias.  
5. **Vía emergencia: ¿genera referencia + atención inmediata sin sesión, y el ingreso a caso queda para después?** Cambia obligatoriedad de `sesion_analisis` / eventos de apertura.  
6. **¿Se autoriza guardar snapshot de nombre de persona/territorio en SIA (listados/mart) o siempre se resuelve en vivo contra SIDINACC?** Cambia PII, caída de integración y reportería histórica.  
7. **¿La reportería P0 debe leer el operativo el mismo día o admite un corte proyectado?** Decide mart (C) vs SQL sobre A/B.  
8. **¿Quién publica versiones de catálogo/instrumento (ACT-07) y con qué proceso?** Sin eso, C no es operable y A tampoco versiona de verdad.

Fuera de diseño de SIA (no bloquean elegir A/B/C, sí bloquean implementación): contrato de sesión SIDINACC, establecimientos autorizados, ambiente UTIC.
