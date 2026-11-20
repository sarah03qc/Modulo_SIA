# Guía corta de demostración — versión de práctica

Responsable: Sarah Priscilla Quesada Chaves. Fecha: 2026-11-16.
Modificación: 2026-11-18. Contador de casos y expediente por categorías.

Esta guía usa datos sintéticos ya cargados. No vuelve a sembrar las bases.
No cierra ni traslada los casos reservados 1, 5, 1092, 1304, 1305, 1435,
1775, 1776, 1817 ni 10089. No incluye contraseñas.

Abrir `http://127.0.0.1:5174` después de `npm run dev`.
Elegir la identidad y pulsar Continuar. El servidor fija el ámbito.

## Establecimiento de demostración

Pantallas: Inicio, Buscar persona, Nueva referencia, Referencias y Casos.

Resultado esperado:

- La navegación no muestra Pendientes, Sesiones, Atenciones, Programación
  ni Reportería.
- Casos muestra «6 resultados», sin botón de expediente ni exportación.
- El expediente del caso 10089 responde 403 en la API.
- Crear un caso o consultar la reportería de Oficina Local responde 403.

Para la búsqueda, usar un criterio sintético de al menos dos caracteres.
La lista de referencias ya existente confirma la consulta. No hace falta
enviar una referencia nueva durante la demostración. Nueva referencia recorre
cuatro pasos y ofrece los veinte motivos del catálogo local, agrupados en
Crecimiento, Desarrollo, Salud y Factores de riesgo.

## Oficina Local de demostración

Corresponde a Hatillo, oficina 101, región Central Sur.

Pantallas: Pendientes, Sesiones, Casos, Atenciones, Sin atención,
Programación y Reportería.

Resultado esperado, año 2026:

- Casos: «40 resultados». Con un filtro, «N de 40 resultados».
  El expediente se recorre por categorías; las acciones se abren al pedirlas.
- Reportería: doce visualizaciones y cobertura 8 de 18, 44.4 %.
- Personas únicas atendidas: 15. Atenciones: 17, de ellas 13 individuales
  y 4 grupales.
- Descargar consolidación entrega `consolidacion-oficina-local.xlsx`.
- Generar reporte abre el asistente HU-050. Exige cinco visualizaciones,
  un análisis redactado y un título.
- Los informes históricos 10005 y 10008 siguen descargables para esta
  oficina. Otra región recibe 403.

El inicio muestra sesiones y próximas acciones ya registradas, incluido
el caso 10089. Recorrer esas pantallas en consulta. No registrar un cierre
ni un traslado sobre los casos reservados.

## Nivel regional, Región Central Sur

Pantallas: Inicio, Buscar persona, Casos y Reportería.

Resultado esperado:

- Casos de la región: 259.
- Filtrar Oficina Local Hatillo y abrir un expediente. La vista es de solo
  lectura. No muestra el relato clínico.
- Reportería regional, año 2026: doce visualizaciones y cobertura 45 de 135.
- Filtrar Hatillo deja la cobertura en 8 de 18, igual que Oficina Local.
- La región se muestra como Central Sur y no hay selector de otra región.
- Enviar `regionId` de otra región responde 400.
- Descargar consolidación entrega `consolidacion-region.xlsx`.
- No aparece Generar reporte.
- Programación, atención y apertura de caso responden 403.

## Nivel regional, Región Brunca

Sirve para el aislamiento. Sus casos son 220. El caso 10089, de Central Sur,
responde 404. La cobertura de 2026 es 46 de 130.

## Nivel nacional

Pantallas: Inicio, Buscar persona, Casos y Reportería.

Resultado esperado, año 2026:

- Casos: 1793. La exportación CSV tiene el encabezado y 1793 filas.
- Reportería nacional: cobertura 333 de 1009 y 407 personas únicas atendidas.
- Elegir Región Central Sur deja la cobertura en 45 de 135.
- Al cambiar a Brunca, la Oficina Local y el establecimiento quedan vacíos
  y la cobertura pasa a 46 de 130.
- Región 1 con Oficina Local 501 responde 400.
- Descargar consolidación entrega `consolidacion-nacional.xlsx`.
- Abrir caso, registrar atención y generar el informe HU-050 no están
  disponibles. Un POST de caso responde 403.

## Lo que debe decirse en voz alta

- RN-040 y RF-129 siguen pendientes de ratificación. El porcentaje no es
  una decisión profesional.
- La sesión productiva de SIDINACC no está integrada.
- Regional y Nacional no ven el texto clínico del expediente.
- El asistente HU-050 y su historia conservada existen solo en Oficina Local.
- Si una exportación supera 2000 filas, la API la rechaza completa.
- Sexo y edad no se calculan cuando el universo supera 2000 personas.
  En ese caso la pantalla informa que no hay dato. No muestra cero.
