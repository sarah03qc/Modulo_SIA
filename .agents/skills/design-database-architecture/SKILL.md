---
name: design-database-architecture
description: Diseña y compara arquitecturas de base de datos relacionales a partir de requerimientos funcionales confirmados, necesidades exploratorias, procesos, integraciones y patrones de consulta. Úsala antes de implementar o modificar el esquema definitivo de una base de datos.
---

# Design Database Architecture

## Propósito

Diseñar una arquitectura de datos coherente, normalizada, trazable, extensible y mantenible antes de escribir el DDL definitivo.

Esta skill NO debe comenzar creando tablas.

Primero debe comprender:

1. qué necesita hacer el sistema;
2. qué información ya existe en fuentes externas;
3. qué información pertenece al nuevo sistema;
4. qué eventos deben conservar historia;
5. qué relaciones existen entre procesos;
6. qué requerimientos están confirmados;
7. qué funcionalidades son exploratorias;
8. qué consultas y reporterías deberá soportar el modelo.

---

# 1. Leer las fuentes antes de diseñar

Revisar primero, según disponibilidad:

- Historias de Usuario.
- Requerimientos Funcionales.
- Casos de Uso.
- Reglas de negocio.
- Requerimientos no funcionales.
- Arquitectura existente.
- Esquemas externos.
- Integraciones.
- Código o prototipo relevante.
- Decisiones técnicas vigentes.

No inferir una regla institucional cuando la fuente no la confirma.

Clasificar cualquier punto relevante como:

- CONFIRMADO
- EXPLORATORIO
- NEEDS_VALIDATION
- FUERA_DE_ALCANCE

---

# 2. Separar propiedad de los datos

Para cada entidad o atributo identificar:

```text
SOURCE_OWNED
SYSTEM_OWNED
SNAPSHOT
DERIVED
CONFIGURATION
AUDIT
```

No duplicar datos maestros externos sin una razón explícita.

Cuando el sistema necesite conservar el estado histórico de un dato externo en el momento de un evento, valorar un snapshot en el dominio propio.

---

# 3. Derivar dominios antes que tablas

Primero identificar agregados o dominios funcionales.

Ejemplos:

```text
Identidad institucional
Referencia
Sesión
Valoración
Caso
Plan
Atención
Programación
Documento
Coordinación
Traslado
Reporte
Cierre
Configuración
Auditoría
```

Los nombres concretos dependen del proyecto.

No asumir que cada pantalla requiere una tabla.

No asumir que cada formulario requiere una entidad independiente.

---

# 4. Identificar cardinalidades

Para cada relación determinar explícitamente:

```text
1:1
1:N
N:M
opcional
obligatoria
histórica
versionada
dependiente del tiempo
```

Explicar especialmente las relaciones N:M.

Cuando una relación tenga atributos propios, utilizar una entidad asociativa.

---

# 5. Modelar historia correctamente

Preguntar para cada dato:

- ¿solo importa el valor actual?
- ¿debe conservarse el valor anterior?
- ¿el cambio constituye un evento?
- ¿el dato debe quedar congelado al ocurrir otra acción?
- ¿se necesita reconstruir la línea de tiempo?

No usar `updated_at` como sustituto de un historial real.

---

# 6. Distinguir estado actual de eventos

Analizar si cada proceso se representa mejor mediante:

### Estado mutable

```text
entity.status
```

### Historial de cambios

```text
entity_status_history
```

### Evento de dominio

```text
event
```

### Modelo híbrido

```text
current_state + immutable_history
```

No adoptar event sourcing completo salvo que sus beneficios superen claramente su complejidad.

---

# 7. Funcionalidades exploratorias

Las funcionalidades exploratorias deben ser consideradas durante el diseño, pero NO deben provocar sobreingeniería.

El diseño debe preguntar:

> ¿Existe una extensión razonable para incorporar esto posteriormente sin romper el modelo actual?

Preferir:

- relaciones extensibles;
- catálogos versionables;
- entidades de evidencia;
- modelos de recomendación desacoplados;
- tablas de resultados derivados;
- metadata controlada;

antes que crear estructuras especulativas completas.

No diseñar lógica de negocio no confirmada.

---

# 8. Evitar anti-patrones

Evitar salvo justificación explícita:

- una tabla gigante para todo;
- EAV generalizado;
- JSON para sustituir un modelo relacional estable;
- columnas `field1`, `field2`, etc.;
- duplicación masiva de datos maestros;
- estados almacenados únicamente como texto libre;
- relaciones sin FK cuando pueden modelarse correctamente;
- borrado físico de información histórica relevante;
- tablas creadas únicamente porque existe una pantalla;
- tablas separadas con estructuras idénticas que podrían compartir un modelo coherente.

---

# 9. Comparar múltiples arquitecturas

Antes de elegir una solución generar al menos **tres alternativas genuinamente distintas** cuando el problema lo permita.

Ejemplos de ejes de diferencia:

- modelo altamente normalizado;
- modelo relacional orientado a agregados;
- modelo híbrido estado + eventos;
- instrumentos versionados;
- separación longitudinal de caso y responsabilidad territorial;
- estrategia centralizada vs modular.

No crear alternativas artificialmente distintas.

---

# 10. Evaluación comparativa

Comparar las propuestas utilizando criterios como:

| Criterio |
| --- |
| Cobertura funcional |
| Claridad del modelo |
| Integridad referencial |
| Trazabilidad |
| Historial longitudinal |
| Manejo de traslados |
| Reporterías |
| Flexibilidad |
| Evolución de instrumentos |
| Compatibilidad con fuentes externas |
| Mantenibilidad |
| Complejidad de implementación |
| Rendimiento |
| Facilidad de consultas |
| Compatibilidad SQL Server |
| Potencial de funcionalidades exploratorias |

Explicar trade-offs.

No seleccionar una propuesta únicamente por tener más tablas o mayor sofisticación.

---

# 11. Propuesta ganadora

La propuesta seleccionada debe incluir:

## Arquitectura conceptual

Dominios y responsabilidades.

## Modelo lógico

Entidades, claves y relaciones.

## Ownership

Qué pertenece a la fuente externa y qué pertenece al sistema.

## Historial

Cómo se conserva trazabilidad.

## Extensibilidad

Cómo podría evolucionar sin rediseños destructivos.

## Reporterías

Cómo soporta los principales patrones de consulta.

## Exploratorios

Qué extensiones futuras soporta y cómo, sin implementarlas prematuramente.

---

# 12. Diagrama

Generar un diagrama ER de la propuesta ganadora.

Preferir:

1. DBML para el modelo detallado.
2. Mermaid ER para documentación legible.

El diagrama debe representar:

- PK;
- FK;
- entidades asociativas;
- cardinalidades;
- límites de dominio cuando sea útil.

No agregar tablas externas completas si solo se referencian mediante identificadores.

---

# 13. Validación final

Antes de considerar la propuesta terminada verificar:

- cada requerimiento confirmado tiene soporte;
- no se creó funcionalidad institucional inexistente;
- las relaciones N:M son correctas;
- el historial puede reconstruirse;
- los traslados no destruyen continuidad;
- las atenciones grupales no requieren duplicación;
- las fuentes externas permanecen claramente separadas;
- los estados derivados no se duplican innecesariamente;
- los exploratorios pueden añadirse sin alterar el núcleo;
- el modelo puede implementarse razonablemente en SQL Server.

---

# Regla principal

Diseñar la base de datos para representar correctamente el dominio.

No diseñarla para imitar la interfaz actual.