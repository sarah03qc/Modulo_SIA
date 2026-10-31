---
name: review-sql-server-schema
description: Revisa un diseño relacional propuesto para Microsoft SQL Server antes de implementarlo. Evalúa claves, constraints, tipos, índices, historización, concurrencia, consultas, seguridad y mantenibilidad.
---

# Review SQL Server Schema

## Propósito

Realizar una revisión técnica rigurosa de un modelo de datos destinado a Microsoft SQL Server antes de aprobar su implementación.

Esta skill NO sustituye el análisis funcional.

Debe ejecutarse después de comprender el dominio y preferiblemente después de seleccionar una arquitectura candidata.

---

# 1. Revisar claves

Para cada tabla revisar:

- PK adecuada;
- clave natural si existe;
- necesidad real de surrogate key;
- estabilidad de la clave;
- unicidad;
- posibilidad de colisiones;
- claves compuestas cuando aporten valor.

No usar GUID automáticamente.

No usar `IDENTITY` automáticamente.

Justificar la estrategia.

---

# 2. Revisar Foreign Keys

Comprobar:

- integridad referencial;
- cardinalidad;
- nulabilidad;
- cascadas;
- relaciones circulares;
- dependencias opcionales;
- entidades asociativas.

Evitar `ON DELETE CASCADE` en datos históricos o sensibles salvo justificación fuerte.

---

# 3. Revisar tipos SQL Server

Preferir tipos adecuados.

Revisar especialmente:

```text
nvarchar
varchar
date
datetime2
time
decimal
bit
int
bigint
uniqueidentifier
varbinary
rowversion
```

Evitar:

```text
float
text
ntext
image
datetime
```

cuando exista una alternativa moderna y apropiada.

No usar `nvarchar(max)` por defecto.

---

# 4. Revisar nulabilidad

Cada `NULL` debe tener significado.

Distinguir:

```text
UNKNOWN
NOT_APPLICABLE
NOT_CAPTURED
PENDING
```

cuando el dominio realmente lo requiera.

No convertir todos estos estados en strings si existe una representación relacional mejor.

---

# 5. Constraints

Valorar:

- UNIQUE;
- CHECK;
- FK;
- DEFAULT;
- índices filtrados;
- constraints de consistencia.

Las reglas simples de integridad que puedan protegerse en la BD deben considerarse.

No duplicar lógica compleja de negocio dentro de constraints ilegibles.

---

# 6. Historial y auditoría

Revisar si cada entidad necesita:

- created_at;
- created_by;
- updated_at;
- updated_by;
- version;
- status history;
- eventos;
- snapshot;
- temporal tables;
- soft delete.

No asumir que todas las tablas requieren soft delete.

No asumir que `deleted = 1` es una estrategia universal.

---

# 7. Fechas

Preferir:

```text
date
datetime2
```

según semántica.

Definir claramente:

- fecha efectiva del evento;
- fecha de registro;
- fecha de modificación.

No mezclarlas.

---

# 8. Índices

Derivar índices de patrones de consulta reales.

Revisar:

- filtros frecuentes;
- joins;
- ordenamientos;
- búsquedas por estado;
- búsquedas temporales;
- ámbito territorial;
- reporting.

No crear un índice por cada FK de forma automática sin analizar utilidad.

No sobreindexar tablas de alta escritura.

---

# 9. Reporterías

Validar que el diseño pueda responder razonablemente preguntas como:

- conteos por período;
- personas únicas;
- total de eventos/atenciones;
- estado actual;
- histórico;
- agrupaciones territoriales;
- filtros por disciplina;
- filtros por profesional;
- casos activos;
- casos sin actividad;
- motivos;
- traslados;
- continuidad.

No desnormalizar anticipadamente únicamente por miedo a consultas complejas.

---

# 10. Concurrencia

Identificar entidades susceptibles a edición simultánea.

Valorar:

```text
rowversion
```

u otro mecanismo de concurrencia optimista cuando sea apropiado.

No implementar locking manual sin necesidad.

---

# 11. Configuración y catálogos

Distinguir:

```text
enum técnico estable
```

de:

```text
catálogo institucional configurable
```

Los catálogos institucionales que puedan cambiar no deben quedar dispersos como strings hardcodeados.

Cuando sea relevante considerar:

- vigencia;
- versión;
- activación/desactivación;
- orden de presentación.

---

# 12. Datos derivados

Preguntar si un campo puede calcularse desde otros datos.

Evitar almacenar simultáneamente:

```text
fuente
+
resultado derivado
```

sin una razón de auditoría, rendimiento o histórico.

Si se almacena un valor derivado, documentar:

- origen;
- algoritmo/versión;
- fecha de cálculo;
- posibilidad de recalcular.

---

# 13. Funcionalidades de IA o recomendaciones

Mantener separados:

```text
dato institucional/profesional
```

y:

```text
resultado generado o sugerido por sistema/modelo
```

Si en el futuro existen recomendaciones:

- no sobrescribir la decisión profesional;
- conservar versión/metodología;
- conservar momento de generación;
- permitir distinguir sugerencia de decisión final.

No diseñar una tabla específica para un modelo de IA no confirmado si puede resolverse mediante una estructura extensible de resultados derivados.

---

# 14. Seguridad

Identificar:

- datos sensibles;
- datos personales;
- información contextual;
- documentos;
- auditoría.

Revisar que el modelo permita aplicar control de acceso por ámbito.

No confiar en que esconder una columna en frontend constituye seguridad.

---

# 15. SQL Server

Comprobar compatibilidad con:

- SQL Server;
- T-SQL;
- migraciones;
- constraints;
- índices;
- vistas cuando sean justificadas.

No utilizar características específicas de PostgreSQL, MySQL o SQLite.

---

# 16. Resultado de la revisión

Emitir:

## Hallazgos críticos

Problemas que deben corregirse antes de implementar.

## Hallazgos importantes

Mejoras que afectan mantenibilidad, rendimiento o integridad.

## Mejoras opcionales

Optimizaciones no bloqueantes.

## Decisión

```text
APPROVED
APPROVED_WITH_CHANGES
NEEDS_REDESIGN
```

## Cambios recomendados

Lista concreta de modificaciones.

---

# Regla principal

Una buena base de datos no es la que tiene más tablas ni la que utiliza más características de SQL Server.

Es la que protege la integridad del dominio, conserva la historia necesaria y permite evolucionar el sistema con complejidad razonable.