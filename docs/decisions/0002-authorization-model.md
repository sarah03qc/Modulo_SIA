# 0002 — Autorización interna por capacidades y ámbito

- **Estado:** aceptada para la consolidación pedida el 2026-11-06. Pendiente de revisión humana. No es una aprobación de UTIC.
- **Fecha:** 2026-11-06

## Contexto

El Lote 01 ya autentica identidades sintéticas en `development` y `test`, ignora encabezados de rol y filtra Establecimiento, Oficina Local, Región y Nacional. La sesión productiva de SIDINACC sigue sin mecanismo. Los lotes siguientes necesitan exigir permisos sin copiar esa política en cada historia.

Fuentes: `FUNCTIONAL_SPEC_v0.7.md` secciones 4 y 5, RF-012, RF-104, RNF-001, RNF-002 y `DEVELOPMENT_GUIDELINES_DNCC_DI_MET_02.md` sección 7.

## Decisión

Separar proveedor de identidad, adaptador, contexto interno, capacidades, ámbito y aplicación en ruta y servicio.

Las capacidades son códigos internos. Los cuatro roles del módulo conceden solo las operaciones que la sección 5 confirma. Lo no confirmado permanece denegado, incluida `catalog.manage`.

Varios establecimientos del mismo rol Establecimiento se unen. Combinar niveles distintos no fabrica un ámbito más amplio.

El contrato SIDINACC no interpreta credenciales. El registro sintético no se consulta fuera de `development` y `test` y no vive en una tabla.

No se agregan dependencias, tablas ni pantallas de administración.

## Alternativas

| Opción | Motivo para no usarla ahora |
| --- | --- |
| Repetir el filtro de ámbito en cada historia | Ya mostró duplicación y no nombra la operación |
| Usar los nombres de perfil de SIDINACC como permisos | Esos nombres y la correspondencia siguen en `NEEDS_VALIDATION` |
| Unir en una sola consulta los roles de distinto nivel | La especificación no confirma esa unión. Ampliaría datos |
| Tabla de roles o editor de permisos | No hace falta para declarar capacidades en código y abre escritura sensible |
| Librería externa de autorización | El stack no la autoriza y el catálogo actual cabe en módulos pequeños |

## Consecuencias

Las rutas del Lote 01 siguen iguales. Cada una exige ahora su capacidad, y el servicio la vuelve a exigir. Una identidad sin concesiones recibe `403`. Una credencial desconocida sigue en `401`.

Agregar una operación futura consiste en declarar la capacidad, concederla a los roles confirmados y exigirla en los dos puntos. El ámbito se reutiliza.

La composición entre niveles, la traducción del perfil institucional y el detalle visible para Región y Nacional quedan registrados como `NEEDS_VALIDATION` en `docs/architecture/AUTHORIZATION_MODEL.md`.

## Trazabilidad

RF-012, RF-104, RNF-001, RNF-002. HU-005 a HU-009 para las operaciones ya expuestas. ACT-01 a ACT-06 para la correspondencia de roles. CU-02 y CU-03.
