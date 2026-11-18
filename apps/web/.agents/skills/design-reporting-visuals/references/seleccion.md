# Matriz de selección de visualizaciones

| Pregunta | Patrón | Condición |
| --- | --- | --- |
| ¿Qué categorías tienen más casos? | Barras horizontales o verticales. | Horizontal si las etiquetas son largas. Conserva el orden cuando tenga significado. |
| ¿Cómo difieren dos series? | Barras agrupadas o tabla. | Misma unidad y corte, con comparación explícita. |
| ¿Cómo se compone un total? | Barras apiladas o donut con pocas partes. | Categorías excluyentes y partes aditivas de un total definido. |
| ¿Cómo cambia en el tiempo? | Línea o área. | Fechas reales ordenadas y huecos que no se confundan con ceros. |
| ¿Cuál es el valor exacto? | Tabla con encabezados o KPI. | En KPI presenta unidad y universo. Si es un porcentaje, conserva denominador y numerador cuando estén disponibles. |
| ¿Cómo se distribuyen las frecuencias? | Barras o tabla ordenada. | Una nube puede complementar el listado exacto; conserva texto, valores y orden accesible. |

Antes de proponer el gráfico prueba tres casos con datos sintéticos, uno vacío, uno con valor cero y otro con categorías largas o muchas categorías. Contrasta números, etiquetas, orden y estados contra la tabla equivalente. Para la implementación consulta [ECharts y sus importaciones modulares](https://echarts.apache.org/handbook/en/basics/import/).
