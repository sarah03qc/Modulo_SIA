# Matriz de revisión React y Vite

| Prioridad | Revisar | Comprobar |
| --- | --- | --- |
| 1 | Secuencias de red y esperas de ramas que salen temprano. Paraleliza solo peticiones independientes y autorizadas. | Cronología en red o prueba de orden, error y cambio de rol. |
| 2 | Importaciones que arrastran gráficos o módulos pesados. Considera importaciones específicas y carga por ruta. | Vite build antes y después, tamaño inicial y por ruta, estado de carga y recuperación. |
| 3 | Efectos que duplican datos derivados, listeners y observadores sin limpieza, respuestas antiguas tras filtros nuevos. | Conserva cálculos puros durante render. Prueba cambio rápido de filtros, desmontaje y limpieza. |
| 4 | Identidad de listas y componentes, suscripciones amplias y cómputo repetido. | Perfila primero. Usa claves de dominio estables y memoización cuando la medición la justifique. |
| 5 | Iteraciones repetidas sobre listas y recursos descartables. | Compara con un fixture grande y comprueba que orden, resultados y estados sean equivalentes. |

Ejemplo de comprobación de un efecto. Cambia de ámbito A a B, retrasa A y deja que B termine primero. Verifica que la respuesta tardía de A no sobrescriba el resultado de B. Usa solicitudes o fixtures sintéticos.
