# 0001 — Monolito modular con frontend y backend separados

- **Estado:** aceptada para el bootstrap por la solicitud de implementación del 2026-11-06. Pendiente de revisión humana de arquitectura.
- **Fecha:** 2026-11-06

## Contexto

El repositorio tenía especificación funcional v0.7, bases `SIA_CENCINAI` y `SIDINACC_LOCAL`, y ninguna aplicación. Hacía falta una estructura ejecutable para implementar historias por incrementos, sin microservicios ni un rediseño de datos.

## Decisión

Un monolito modular: `apps/web` (React) y `apps/api` (Express), instalados con npm workspaces. El navegador solo habla con la API. La API mantiene dos clientes SQL distintos. Los módulos funcionales se agregan cuando exista una historia, no como carpetas vacías.

No hay paquetes compartidos, ORM, colas ni un segundo SQL Server.

## Alternativas

| Opción | Motivo para no usarla ahora |
| --- | --- |
| Microservicios | No hay un límite de despliegue que lo exija y aumentan la operación. |
| Un solo proyecto Node que sirva el frontend | Mezcla el ciclo de la interfaz con el de la API. |
| ORM | El acceso previsto es SQL explícito y parametrizado. No está autorizado. |
| Contenedor nuevo para Node | El proceso local ya llega a `127.0.0.1:1433`. Un contenedor de aplicación no aporta en este paso. |

## Consecuencias

La autenticación institucional queda como frontera que rechaza `/api` hasta conocer el mecanismo de SIDINACC. El login de lectura de la réplica no está operativo para la aplicación: ver `SOFTWARE_ARCHITECTURE.md`.

## Trazabilidad

No implementa una HU. La especificación vigente es `docs/functional/FUNCTIONAL_SPEC_v0.7.md`.
