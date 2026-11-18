# Patrones por tarea

| Tarea | Patrón | Prueba de aceptación |
| --- | --- | --- |
| Orientarse | Encabezado contextual, ubicación actual y ámbito visible donde afecta la tarea. | La persona reconoce la vista y su acción principal sin navegar. |
| Buscar un caso | Búsqueda etiquetada, filtros activos visibles, cantidad y restablecimiento si existe. | Dos filtros aplicados se pueden explicar y una búsqueda vacía se distingue de un error. |
| Completar un formulario | Campos en orden de tarea, etiquetas persistentes, grupos semánticos y ayuda junto a la decisión. | Se llega por teclado a cada campo y se puede corregir el primer error desde el aviso. |
| Comparar registros | Encabezados semánticos, cifras alineadas por unidad y acción de fila con nombre contextual. | A 390 px los controles siguen accesibles y cada dato se puede asociar a su encabezado. |
| Retomar trabajo | Primero los pendientes accionables, después el contexto. Expresar estado mediante texto y, cuando ayude, color. | Se entiende qué significa cada cifra y hacia dónde lleva su acción. |
| Confirmar una acción | Nombrar acción y consecuencia aprobada. Controlar el retorno de foco al cerrar. | Cancelar deja la tarea en el estado esperado y el foco vuelve a un punto lógico. |

Entrega un esquema compacto con objetivo, acción primaria, grupos de contenido y estados. Para cada decisión describe la evidencia que la motiva y una comprobación que detectaría un resultado incorrecto.
