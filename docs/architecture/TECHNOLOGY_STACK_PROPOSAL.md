# Propuesta de requerimientos técnicos para iniciar el desarrollo

Propuesta de requerimientos técnicos para iniciar el desarrollo

**Módulo de Atención Interdisciplinaria (SIA-CENCINAI)**

Como parte del desarrollo del módulo, proponemos el siguiente stack tecnológico, alineado con estándares actuales de la industria y compatible con la infraestructura ya confirmada de la institución:

| Tecnología | Rol |
| --- | --- |
| React | Frontend (JavaScript) |
| Node.js | Backend: entorno de ejecución (JavaScript) |
| Express | Backend: framework (JavaScript) |
| SQL Server | Base de datos |
| — | Autenticación integrada con la sesión existente de SIDINACC |
| Docker | Contenedores |
| Jest | Pruebas (framework de pruebas para JavaScript) |
| GitHub | Control de versiones |
| Visual Studio Code | IDE |

Para poder comenzar la etapa de desarrollo, necesitamos que nos proporcionen lo siguiente:

1. **Acceso de solo lectura a la base de datos**: específicamente a las tablas relacionadas con el proceso de atención interdisciplinaria (identificación de casos, expedientes, tamizajes, referencias), idealmente sobre un ambiente de desarrollo o pruebas, no producción

1. **Diccionario de datos** de esas tablas específicas: estructura de columnas, tipos de datos, y relaciones entre ellas

1. **Mecanismo de validación de sesión**: para que el módulo pueda confirmar que un usuario ya inició sesión en SIDINACC. Esto puede resolverse de dos formas, según lo que sea más práctico de su lado:

- Un endpoint que permita validar si una sesión/token está activa, o
- La llave (secreto o clave pública) usada para firmar los tokens de sesión, para que el módulo pueda validarlos directamente, depende de como lo manejan ahorita para los demás módulos

Con cualquiera de las dos opciones, la autenticación queda completamente delegada a SIDINACC, el módulo nunca maneja contraseñas ni credenciales propias y el acceso queda automáticamente limitado a quien ya tenga sesión activa en el sistema institucional.

1. **Ambiente de desarrollo/pruebas**: con datos de prueba o anonimizados, separado de producción, para poder construir y validar el módulo sin ningún riesgo sobre datos reales

1. **Un punto de contacto técnico:** para lo que sería resolver dudas puntuales que pueden surgir sobre la estructura de datos durante el desarrollo
2. **Contrato de integración documentado:** además del diccionario de datos crudo, necesitamos que se especifiquen las reglas de negocio detrás de cada campo relevante por ejemplo, si un campo como “prioridad” es texto libre o un catálogo cerrado de valores, en qué formato exacto vienen las fechas, y qué campos son obligatorios u opcionales etc… Esto nos permite construir el módulo con datos simulados que repliquen completamente la estructura real desde el inicio y hacer una integración de prueba no tan tardía ojalá (aunque sea mínima) apenas esté disponible el ambiente de pruebas, así cualquier ajuste necesario se puede detectar apenas sea posible
