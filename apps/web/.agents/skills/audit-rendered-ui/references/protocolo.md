# Protocolo de auditoría

| Comprobación | Cómo comprobarla | Criterio |
| --- | --- | --- |
| Orden y foco | Recorre Tab y Shift+Tab. Prueba Enter, Espacio, Escape o flechas según el patrón. Abre y cierra un diálogo si aplica. | Foco visible y retorno lógico. WCAG 2.4.3, 2.4.7 y 2.4.11. |
| Semántica | Revisa regiones, encabezados, nombres de iconos, etiquetas persistentes y asociaciones de ayuda y error. | Nombre, rol y descripción correctos. WCAG 1.3.1, 2.5.3, 3.3.1 y 4.1.2. |
| Contraste | Mide colores computados de reposo, foco y error. | Texto normal 4,5:1, grande 3:1 y elementos no textuales aplicables 3:1. WCAG 1.4.3 y 1.4.11. |
| Reflujo y objetivos | Prueba 1440, 768 y 390 px y revisa reflujo a 320 px CSS. Mide objetivos pequeños y verifica las excepciones normativas. | Controles operables y lectura sin pérdida. WCAG 1.4.10 y 2.5.8. |
| Formularios y avisos | Envía vacío o inválido y corrige con teclado. Revisa carga, vacío, error y éxito. | Etiquetas, anuncios y recuperación. WCAG 3.3.2 y 4.1.3. |
| Datos y permisos | Recorre un rol autorizado y uno de menor alcance. Compara tabla, cifras, unidades y leyenda. | Registra visibilidad y, si el alcance incluye autorización, verifica el servicio con las pruebas existentes. |
| Recursos y movimiento | Revisa consola, solicitudes fallidas y comportamiento con movimiento reducido. | Registra ruta, paso y mensaje observado. |

Registra `PASS`, `FAIL`, `NOT_RUN` o `NOT_APPLICABLE` por comprobación. Conserva el selector o línea y los datos sintéticos necesarios para reproducir cada hallazgo.
