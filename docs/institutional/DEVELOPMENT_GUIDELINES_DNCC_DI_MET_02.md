# Lineamientos de desarrollo derivados de DNCC\-DI\-MET\-02

**Versión:** 0.2  
**Fecha:** 17 de septiembre de 2026  
**Estado:** Guía interna de desarrollo para Confluence  
**Fuente institucional:** *Metodología para el Desarrollo de Software*, código **DNCC-DI-MET-02**, versión 01, Dirección Nacional de CEN-CINAI, 2022.

> \[!IMPORTANT\]  
> Este documento resume y aterriza la metodología institucional al contexto del proyecto SIA-CENCINAI.
> 
> Se asume que la metodología entregada por UTIC es la referencia vigente para el proyecto. No se pretende reproducir de forma rígida cada decisión tecnológica histórica del documento, sino **cumplir sus principios, entregables, estándares y controles aplicables**, tomando decisiones técnicas propias cuando la metodología no imponga una restricción concreta.

---

# 1. Criterio general de aplicación

La metodología debe utilizarse como **marco institucional de trabajo**, no como una limitación innecesaria del diseño técnico.

Para SIA-CENCINAI se seguirá esta regla:

## Se adopta directamente cuando define

- fases del ciclo de desarrollo;
- documentación;
- levantamiento de requerimientos;
- casos de uso;
- escenarios;
- UML/modelado;
- diseño de base de datos;
- diccionario de datos;
- nomenclatura de BD;
- auditoría;
- seguridad;
- pruebas;
- manuales;
- mantenimiento;
- control de cambios.

## Se adapta cuando define

- convenciones generales de programación;
- estilo de nombres;
- comentarios;
- formato del código;
- herramientas de modelado;
- herramientas de desarrollo.

## Se decide libremente cuando no exista una restricción institucional explícita

- librerías;
- frameworks;
- organización interna del frontend;
- arquitectura de componentes;
- herramientas de lint/format;
- estrategia de ramas del repositorio independiente del proyecto;
- herramientas de desarrollo local;
- automatizaciones propias;
- detalles de implementación que no afecten la integración institucional.

La prioridad es construir un módulo:

- correcto;
- mantenible;
- integrable;
- documentado;
- seguro;
- alineado con los procesos de CEN-CINAI.

---

# 2. Modelo de desarrollo institucional

La metodología adopta formalmente el **Modelo Incremental**.

Esto coincide directamente con la forma de trabajo del proyecto:

```
Análisis
   ↓
Requerimientos
   ↓
Diseño
   ↓
Prototipo / incremento funcional
   ↓
Validación
   ↓
Corrección
   ↓
Siguiente incremento
```

## Aplicación al SIA-CENCINAI

El ciclo práctico será:

```
Descubrimiento
↓
HU + RF + Casos de Uso
↓
Diseño funcional / UX / datos
↓
Incremento funcional
↓
Validación con Alina / actores del proyecto
↓
Registro de cambios
↓
Actualización documental
↓
Nuevo incremento
```

**Decisión:** adoptar de forma directa.

---

# 3. Fases de trabajo que debemos conservar

La metodología institucional organiza el desarrollo en siete fases:

1. Planificación.
2. Identificación y análisis de requerimientos.
3. Diseño.
4. Desarrollo.
5. Integración y pruebas.
6. Implementación.
7. Mantenimiento.

Para el proyecto no es necesario ejecutar estas fases como bloques rígidos y únicos. En un modelo incremental pueden repetirse dentro de cada incremento.

---

# 4. Planificación

Debemos mantener documentados:

- objetivo;
- alcance;
- actores;
- responsables;
- antecedentes;
- justificación;
- productos;
- cronograma;
- recursos relevantes.

## Responsables funcionales del proyecto

Para efectos de validación funcional del módulo:

- **Alina Gamboa** — contraparte institucional / usuario experto.
- **Saúl Calderón** — asesor y responsable del proyecto desde TEC.
- **Sarah Quesada** — análisis, diseño y desarrollo del módulo.

No es necesario introducir procesos de aprobación adicionales que no formen parte de la dinámica real del proyecto.

---

# 5. Levantamiento de requerimientos

La metodología reconoce:

- entrevistas;
- cuestionarios;
- observación;
- experiencia del personal operativo;
- revisión documental;
- análisis de casos.

El proyecto ya utiliza estas técnicas.

## Evidencia que debemos conservar

```
Fuente
↓
Hallazgo
↓
Historia de Usuario
↓
Requerimiento Funcional
↓
Caso de Uso
↓
Pantalla / flujo
↓
Validación
↓
Cambio
```

Esto es más importante que producir documentación repetida sin utilidad práctica.

---

# 6. Requerimientos generales del sistema

La metodología establece como principios:

- disponibilidad;
- confidencialidad;
- integridad;
- acceso;
- crecimiento;
- multiusuario;
- privilegios según función;
- preferencia por plataforma Web.

## Aplicación SIA

Esto se traduce directamente en:

- aplicación Web;
- roles propios del módulo;
- acceso por nivel institucional;
- protección de datos sensibles;
- auditoría;
- arquitectura escalable;
- integración futura con SIDINACC.

---

# 7. Roles propios del módulo

El módulo necesita mantener sus propios roles funcionales porque sus permisos derivan directamente de los requerimientos del proceso de A.I.

Roles actuales:

```
Establecimiento
Oficina Local
Regional
Nacional
```

El acceso a pantallas, datos, filtros y acciones depende de estos roles.

## Integración futura con autenticación institucional

La autenticación principal seguirá perteneciendo al sistema institucional.

La arquitectura del módulo debe quedar preparada para recibir posteriormente un mecanismo como:

```
SIDINACC / sistema institucional
        ↓
sesión/token válido
        ↓
SIA-CENCINAI
        ↓
identificación de usuario
        ↓
rol funcional del módulo
```

El detalle técnico se resolverá durante la integración final.

No debe bloquear el desarrollo actual del módulo.

---

# 8. Plataforma y herramientas

La metodología menciona Visual Studio .NET 2019 y diversos lenguajes, incluyendo JavaScript, HTML5 y CSS.

## Criterio del proyecto

La herramienta IDE no es una restricción funcional.

El proyecto puede desarrollarse utilizando el entorno que resulte más eficiente, siempre que:

- el código cumpla los estándares acordados;
- el producto final sea integrable;
- la tecnología utilizada sea compatible con el entorno institucional;
- se mantenga documentación suficiente.

## Dirección tecnológica actual

El frontend se desarrollará utilizando **JavaScript** y tecnologías Web modernas.

El uso de **React** se considera una decisión válida de implementación mientras no exista una restricción institucional explícita en contra.

Se priorizarán, cuando sea razonable:

- herramientas abiertas;
- dependencias mantenidas;
- tecnologías ampliamente soportadas;
- bajo acoplamiento;
- facilidad de mantenimiento.

---

# 9. Casos de Uso y UML

La metodología exige:

- actores;
- casos de uso;
- escenarios;
- modelo conceptual;
- diagramas de clases;
- atributos;
- operaciones.

## Herramienta

La herramienta utilizada para producir UML no es relevante para la lógica del proyecto.

Puede utilizarse:

- <http://Draw.io> ;
- PlantUML;
- Mermaid;
- otra herramienta adecuada.

Lo importante es que los diagramas:

- sean correctos;
- estén actualizados;
- sean legibles;
- estén vinculados con la documentación funcional.

---

# 10. Formato institucional de Casos de Uso

El Anexo 1 define:

```
Proyecto
Nombre del Caso de Uso

1. Descripción breve

2. Flujo de eventos
   2.1 Precondiciones
   2.2 Flujo principal
   2.3 Flujos alternos
   2.4 Flujos de excepción
   2.5 Postcondiciones
```

Nuestros casos de uso deben mantenerse compatibles con esta estructura.

No es necesario convertir todos de inmediato; se priorizarán primero los casos P0.

---

# 11. Escenarios

El Anexo 2 solicita escenarios ejecutados paso a paso con datos ficticios.

Ejemplo:

```
CU: Crear Referencia A.I.

1. El usuario busca la identificación DEMO-001.
2. El sistema encuentra a la persona.
3. El usuario abre “Nueva referencia”.
4. Completa los motivos.
5. Revisa el resumen.
6. Remite la referencia.
7. El sistema registra la referencia.
8. Fin.
```

Estos escenarios servirán también para:

- pruebas;
- demostraciones;
- validación;
- documentación de usuario.

---

# 12. Diseño de Base de Datos

La metodología exige:

1. Diseño conceptual.
2. Diseño lógico.
3. Diseño físico.

Y establece llevar el diseño hasta **3NF**.

## Documentos esperados

- modelo conceptual;
- modelo lógico;
- modelo físico;
- diagrama ER;
- llaves;
- relaciones;
- diccionario de datos.

---

# 13. Estrategia de integración de datos del proyecto

Para el desarrollo del módulo se trabajará con dos conceptos separados.

## 13.1 Base institucional simulada / espejo estructural

Se recreará localmente una base con la **misma estructura necesaria** de la base institucional suministrada en la documentación técnica.

Su propósito será simular:

- consulta de personas;
- datos básicos;
- establecimientos;
- modalidades;
- datos ya existentes en otros módulos.

Se llenará únicamente con:

- datos ficticios;
- datos generados;
- datos de prueba.

No contendrá información real de personas usuarias.

## 13.2 Base propia del módulo SIA-CENCINAI

La información exclusiva de Atención Interdisciplinaria deberá almacenarse separadamente.

Ejemplos:

- casos A.I.;
- valoraciones;
- sesiones;
- planes;
- atenciones;
- programación;
- documentos;
- referencias externas;
- reportes;
- traslados;
- auditoría propia.

## 13.3 Relación conceptual

```
BD Institucional simulada
        │
        │ identificadores / datos maestros
        ▼
SIA-CENCINAI
        │
        ▼
BD propia del módulo
```

## Principio

Evitar duplicar datos maestros salvo cuando sea necesario para:

- rendimiento;
- snapshot histórico;
- independencia temporal;
- integridad del registro.

La integración real se resolverá después contra el entorno de pruebas institucional.

---

# 14. Estándares de Base de Datos

## Nombres generales

Los objetos deben ser:

- descriptivos;
- cortos;
- significativos;
- no ambiguos.

No utilizar:

- tildes;
- ñ;
- diéresis;
- espacios;
- caracteres especiales no permitidos.

---

## Tablas

- sustantivos en singular;
- mayúsculas;
- máximo 35 caracteres;
- máximo tres palabras adicionales al acrónimo.

Acrónimos:

```
CAT_  → catálogo
SYS_  → sistema
```

Las tablas generales utilizarán el acrónimo correspondiente a la BD/módulo.

---

## Orden de campos

1. PK.
2. FK.
3. otros campos.

---

## Llaves

Toda tabla debe poseer una PK, salvo la excepción documentada para ciertas tablas M.

Las FK deben quedar identificadas y documentadas.

---

## Stored Procedures

Prefijo:

```
SP_
```

Convención:

```
SP_Verbo_Sustantivo
```

Ejemplo:

```
SP_Obtener_Persona
SP_Crear_Caso
SP_Actualizar_Atencion
```

---

## Vistas

Prefijo:

```
uV_
```

---

## Triggers

Prefijo:

```
TR_
```

---

## Índices

Prefijo:

```
IX_
```

---

# 15. Uso de NULL

La metodología indica evitar NULL y utilizar valores explícitos.

En el diseño del proyecto se respetará este principio **cuando sea semánticamente correcto**, evitando convertir la ausencia de información en datos ambiguos.

Se deben distinguir conceptos como:

```
DESCONOCIDO
NO_APLICA
NO_INGRESADO
PENDIENTE
```

cuando tengan significado de negocio.

No se utilizarán valores arbitrarios que puedan confundirse con información real.

---

# 16. Auditoría

La metodología solicita registrar al menos:

- fecha de creación;
- creado por;
- fecha de modificación;
- modificado por;
- última actualización.

Para SIA-CENCINAI además interesa conservar:

- fecha real del evento;
- fecha de digitación;
- usuario digitador;
- profesional responsable;
- fuente del dato.

Esto debe considerarse desde el modelo de datos, no agregarse al final.

---

# 17. Comentarios en código

La metodología exige que el código pueda entenderse y mantenerse. (comentarios ojalá sin flechas o caracteres especiales, evitar usar ; y también evitar puntos finales .) (también evitar comentarios hablando directamente en segunda persona a alguien, cualquier cosa a decirme se me debe decir directamente, no dentro del código)

Debe documentarse cuando corresponda:

- propósito;
- entradas;
- salidas;
- autor/modificación en componentes donde el estándar institucional lo requiera;
- comportamiento no evidente;
- reglas de negocio;
- cambios importantes.

## Principio práctico

No llenar el código de comentarios redundantes.

Preferir:

```
código claro + nombres claros + comentarios donde agregan contexto
```

en lugar de:

```
comentarios que simplemente repiten la instrucción siguiente
```

## Para scripts y objetos de BD

Aplicar de forma más estricta los encabezados de documentación establecidos por la metodología.

---

# 18. Nomenclatura en código

Los nombres deben expresar el **qué**, no el detalle de implementación.

## Rutinas

Preferir verbo + sustantivo.

Ejemplos:

```
SearchPerson
CreateReferral
ScheduleAttention
GenerateReport
CloseCase
```

## Variables

- descriptivas;
- sin abreviaturas ambiguas;
- evitar nombres de una letra salvo índices;
- booleanos claros;
- evitar `Flag`;
- evitar números mágicos;
- usar constantes.

## Carpetas y archivos

Deben indicar claramente su función.

Ejemplo:

```
features/
  referrals/
  cases/
  attentions/
  scheduling/
  reporting/
```

---

# 19. Formato de código

Mantener:

- sangría consistente;
- estilo uniforme;
- líneas razonables;
- espacios alrededor de operadores;
- bloques lógicos separados;
- una instrucción por línea cuando sea posible;
- componentes pequeños;
- archivos divididos por responsabilidad.

## Automatización

Se recomienda utilizar:

- formatter;
- linter;
- reglas automáticas de estilo.

Esto es una buena práctica del proyecto y no requiere un proceso adicional de aprobación.

---

# 20. Seguridad (muy importante!)

Debe considerarse en:

- usuario;
- aplicación;
- red;
- base de datos;
- infraestructura.

En SIA debe reflejarse mediante:

- roles;
- ámbito territorial;
- permisos;
- datos sensibles;
- auditoría;
- exportaciones controladas;
- protección de secretos;
- sesiones válidas;
- acceso restringido a información especial.

---

# 21. Ambientes

La metodología distingue:

- Desarrollo.
- Pruebas.
- Producción.

## Estrategia del proyecto

### Desarrollo

Entorno propio con datos sintéticos.

### Pruebas

En una etapa posterior se utilizará el ambiente institucional habilitado para pruebas/integración.

### Producción

Fuera del alcance inmediato del prototipo; será parte de la etapa de integración final.

No es necesario resolver el despliegue de producción mientras todavía se construye y valida el módulo.

---

# 22. Repositorio y proceso de código

Durante la práctica el proyecto se mantiene en su repositorio independiente.

No se asume:

- repositorio Git institucional;
- Pull Requests institucionales;
- CI/CD institucional;
- flujo corporativo de ramas.

Esas decisiones pueden aparecer más adelante si el módulo entra en proceso formal de integración.

## Para el desarrollo actual

Mantener como mínimo:

- código formateado;
- documentación;
- cambios trazables.

---

# 23. Pruebas

La metodología exige validación con usuarios expertos. (pero esto se refiere más que todo al prototipo de validación funcional)

Para cada incremento se deben considerar:

## Pruebas funcionales

- flujo principal;
- alternos;
- excepciones;
- HU/RF/CU.

## Pruebas de roles

- Establecimiento;
- OL;
- Regional;
- Nacional.

## Pruebas de datos

- integridad;
- relaciones;
- duplicados;
- auditoría.

## Pruebas UX

- navegación;
- comprensión;
- eficiencia;
- errores.

## Pruebas de integración

Solo cuando existan las conexiones institucionales.

---

# 24. Minutas y evidencia

Las reuniones de validación deben seguir produciendo:

- minuta;
- participantes;
- observaciones;
- acuerdos;
- pendientes;
- cambios requeridos.

Estas minutas sirven como evidencia directa del proceso incremental.

---

# 25. Implementación y mantenimiento

Una versión no se considera lista únicamente porque “funciona”.

Debe existir:

1. requisito;
2. diseño;
3. implementación;
4. pruebas;
5. validación;
6. correcciones;
7. documentación;
8. versión identificable.

Los cambios posteriores vuelven a entrar al ciclo incremental.

---

# 26. Manuales que debemos construir

La metodología establece tres manuales mínimos:

## Manual Técnico

Debe documentar:

- arquitectura;
- módulos;
- stack;
- configuración;
- estructura del proyecto;
- integración;
- seguridad;
- despliegue;
- mantenimiento.

## Manual de Usuario

Debe documentar:

- roles;
- navegación;
- flujos;
- formularios;
- búsquedas;
- filtros;
- reportería;
- mensajes/errores.

## Manual de Base de Datos

Debe documentar:

- BD;
- estándares;
- modelo ER;
- tablas;
- vistas;
- triggers;
- SP;
- restricciones;
- tareas;
- respaldo.

---

# 27. Diccionario de datos

Por tabla se debe documentar:

- nombre;
- descripción;
- atributo;
- tipo;
- longitud;
- NULL/no NULL;
- PK/FK;
- Identity si aplica;
- métodos;
- relaciones;
- valores de catálogo.

Debe mantenerse desde el diseño.

---

# 28. Trabajo con Cursor

Cursor puede utilizarse como herramienta de desarrollo sin cambiar las obligaciones del proyecto.

Antes de implementar:

```
[ ] HU definida
[ ] RF definido
[ ] CU identificado
[ ] variables validadas
[ ] criterios de aceptación
[ ] impacto de datos conocido
```

Durante:

```
[ ] nombres claros
[ ] no inventar reglas
[ ] no hardcodear reglas provisionales
[ ] componentes pequeños
[ ] roles respetados
[ ] auditoría cuando corresponda
[ ] sin datos sensibles reales
[ ] sin secretos en código
[ ] pruebas actualizadas
```

Después:

```
[ ] funcionalidad probada
[ ] documentación actualizada
[ ] cambio trazable
[ ] lista para validación
```

---

# 29. Definition of Done adaptada

Un incremento se considera completo cuando:

1. implementa HU/RF/CU correspondientes;
2. cumple criterios de aceptación;
3. respeta roles;
4. respeta modelo de datos;
5. conserva trazabilidad;
6. maneja errores;
7. fue probado;
8. fue validado cuando corresponda;
9. documentación está actualizada;
10. no introduce información sensible en ambientes no autorizados.

---

# 30. Aspectos que se resolverán en el momento de integración

No necesitamos convertirlos ahora en preguntas ni bloquear el proyecto por ellos.

Se resolverán cuando sean necesarios:

- mecanismo exacto de token/sesión con SIDINACC;
- conexión al ambiente institucional de pruebas;
- despliegue institucional;
- acceso real a la BD de prueba;
- permisos técnicos de integración;
- forma exacta de promoción a producción.

Hasta entonces el módulo debe diseñarse para que esos componentes puedan sustituirse o conectarse con bajo acoplamiento.

---

# 31. Próximo paso: esquema real de Base de Datos

Al recibir el manual/esquema de BD se debe construir un segundo documento:

# SIA-CENCINAI — Arquitectura e Integración de Datos

Ese documento debe definir:

1. qué tablas institucionales necesitamos consultar;
2. cuáles identificadores se reutilizan;
3. qué campos son relevantes;
4. cómo recrear localmente el esquema de prueba;
5. qué datos serán sintéticos;
6. qué entidades nuevas requiere A.I.;
7. qué tablas pertenecen a la BD propia del módulo;
8. qué información se referencia y cuál se replica;
9. modelo conceptual;
10. modelo lógico;
11. ER;
12. diccionario de datos;
13. estándares de nombres;
14. estrategia futura de integración.

---

# 32. Conclusión

La metodología entregada por UTIC se adopta como referencia institucional vigente.

Nuestro objetivo no es detener el proyecto para validar decisiones que podemos tomar internamente, sino asegurarnos de que el producto:

- siga el proceso institucional;
- utilice sus estándares;
- quede bien documentado;
- sea mantenible;
- pueda integrarse posteriormente;
- no dependa innecesariamente de tecnologías cerradas o decisiones difíciles de cambiar.

La regla práctica será:

> **apegarnos estrictamente a lo que la metodología realmente exige y tomar buenas decisiones de ingeniería en todo lo que deja abierto.**
