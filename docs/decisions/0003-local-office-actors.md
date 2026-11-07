# 0003 — Un solo rol interno para los actores de Oficina Local

- **Estado:** confirmada por aclaración funcional del proyecto el 2026-11-06.
- **Fecha:** 2026-11-06

## Contexto

La especificación v0.7 distingue tres actores de Oficina Local: ACT-02 Profesional del EE.II., ACT-03 Equipo Interdisciplinario y ACT-04 Jefatura. La consolidación de autorización dejó abierto si esa distinción exigía capacidades distintas. El comportamiento implementado usa un único rol interno, `OFICINA_LOCAL`.

## Decisión

ACT-02, ACT-03 y ACT-04 comparten las mismas capacidades y permisos dentro de SIA-CENCINAI.

ACT-03 nombra al equipo formado por esos profesionales. No es un rol adicional ni un conjunto de permisos distinto. ACT-04 conserva funciones de liderazgo y coordinación, sin permisos adicionales ni restricciones distintas en el sistema.

El rol interno sigue siendo uno solo. No se crean subroles, jerarquías de permisos ni diferenciaciones de acceso entre estos actores.

Esta decisión no define la sesión de SIDINACC, la correspondencia de perfiles institucionales ni los demás pendientes de UTIC.

## Alternativas

| Opción | Motivo para no usarla |
| --- | --- |
| Subrol de equipo para valoración y resolución | La aclaración niega permisos distintos para ACT-03 |
| Subrol de jefatura con más o menos capacidades | La coordinación no cambia el permiso en el sistema |
| Mantener el punto como `NEEDS_VALIDATION` | La diferencia de acceso ya quedó confirmada |

## Consecuencias

Las capacidades de Oficina Local se conceden una vez, al rol `OFICINA_LOCAL`. Una historia futura no separa el permiso por ACT-02, ACT-03 o ACT-04.

El código de autorización no cambia: ya trataba a los tres actores con ese rol.

## Trazabilidad

ACT-02, ACT-03 y ACT-04. Sección 4 de `docs/functional/FUNCTIONAL_SPEC_v0.7.md`. RNF-002. Decisión registrada también en `docs/agent-workflow/sources-and-validation.md`.
