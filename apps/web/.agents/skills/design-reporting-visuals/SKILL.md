---
name: design-reporting-visuals
description: Diseñar o revisar gráficos, tablas e indicadores de SIA-CENCINAI con ECharts y criterios de visualización accesible, conservando las definiciones analíticas.
---

# Visualización de reportería

1. Lee `AGENTS.md`, la definición vigente del indicador y su contrato. Anota pregunta, unidad, corte, ámbito, filtros, denominador y estados. Conserva diferencias entre cero, ausencia y desconocido.
2. Usa la [matriz de selección de visualizaciones](references/seleccion.md). Elige por la pregunta que responde la serie y por los datos efectivamente disponibles.
3. Define título, unidad, cortes y alternativa tabular accesible con los valores de origen. Usa `Intl.NumberFormat('es-CR')` y señala qué significan las etiquetas y leyendas.
4. Si hay implementación autorizada, importa de `echarts/core`, registra módulos específicos, gestiona tamaño y destrucción de la instancia y trata etiquetas y tooltips como texto. Verifica reflujo, contraste, equivalencia y tamaño de la ruta.
5. Entrega la decisión con formato, evidencia de origen, casos límite y una comprobación independiente de correspondencia. Marca incompatibilidades de semántica como `NEEDS_VALIDATION`.

Consulta [las fuentes y revisiones](../../../../../docs/agent-workflow/visual-ui.md).
