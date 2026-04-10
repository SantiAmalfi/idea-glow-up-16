import React, { createContext, useContext, useState, type ReactNode } from "react";

export type Language = "en" | "es" | "pt";

export const LANGUAGE_CONFIG: Record<Language, { label: string; flag: string }> = {
  en: { label: "English", flag: "🇺🇸" },
  es: { label: "Español", flag: "🇪🇸" },
  pt: { label: "Português", flag: "🇧🇷" },
};

const translations = {
  // Header / Hero
  "hero.badge": { en: "Free · No Sign-Up Required", es: "Gratis · Sin registro", pt: "Grátis · Sem cadastro" },
  "hero.title1": { en: "Make smarter", es: "Toma decisiones de", pt: "Tome decisões de" },
  "hero.title2": { en: "investment decisions", es: "inversión más inteligentes", pt: "investimento mais inteligentes" },
  "hero.subtitle": {
    en: "Calculate NPV, IRR, and ROI in seconds. Model scenarios, compare currencies, and export professional reports.",
    es: "Calcula VAN, TIR y ROI en segundos. Modela escenarios, compara monedas y exporta reportes profesionales.",
    pt: "Calcule VPL, TIR e ROI em segundos. Modele cenários, compare moedas e exporte relatórios profissionais.",
  },
  "hero.currencies": { en: "17 Currencies", es: "17 Monedas", pt: "17 Moedas" },
  "hero.scenarios": { en: "3 Scenarios", es: "3 Escenarios", pt: "3 Cenários" },
  "hero.cta": { en: "Start Analyzing", es: "Comenzar análisis", pt: "Começar análise" },

  // Nav
  "nav.analyzer": { en: "Analyzer", es: "Analizador", pt: "Analisador" },
  "nav.features": { en: "Features", es: "Funciones", pt: "Recursos" },

  // Form
  "form.title": { en: "Project Parameters", es: "Parámetros del proyecto", pt: "Parâmetros do projeto" },
  "form.subtitle": {
    en: "Pick a scenario to auto-estimate income & expenses, then fine-tune as needed",
    es: "Elige un escenario para estimar ingresos y gastos, luego ajusta según necesites",
    pt: "Escolha um cenário para estimar receitas e despesas, depois ajuste conforme necessário",
  },
  "form.projectName": { en: "Project Name", es: "Nombre del proyecto", pt: "Nome do projeto" },
  "form.projectNamePlaceholder": { en: "e.g. New Factory Expansion", es: "ej. Expansión de nueva fábrica", pt: "ex. Expansão da nova fábrica" },
  "form.currency": { en: "Currency", es: "Moneda", pt: "Moeda" },
  "form.description": { en: "Project Description", es: "Descripción del proyecto", pt: "Descrição do projeto" },
  "form.descriptionPlaceholder": {
    en: "Brief description of the investment project...",
    es: "Breve descripción del proyecto de inversión...",
    pt: "Breve descrição do projeto de investimento...",
  },
  "form.investment": { en: "Initial Investment", es: "Inversión inicial", pt: "Investimento inicial" },
  "form.years": { en: "Timeline (Years)", es: "Plazo (Años)", pt: "Prazo (Anos)" },
  "form.discountRate": { en: "Discount Rate (%)", es: "Tasa de descuento (%)", pt: "Taxa de desconto (%)" },
  "form.taxRate": { en: "Tax Rate (%)", es: "Tasa impositiva (%)", pt: "Taxa de impostos (%)" },
  "form.scenario": { en: "Growth Scenario", es: "Escenario de crecimiento", pt: "Cenário de crescimento" },
  "form.optimistic": { en: "Optimistic", es: "Optimista", pt: "Otimista" },
  "form.optimisticDesc": { en: "High growth, strong margins", es: "Alto crecimiento, buenos márgenes", pt: "Alto crescimento, boas margens" },
  "form.base": { en: "Base", es: "Base", pt: "Base" },
  "form.baseDesc": { en: "Moderate growth, typical costs", es: "Crecimiento moderado, costos típicos", pt: "Crescimento moderado, custos típicos" },
  "form.pessimistic": { en: "Pessimistic", es: "Pesimista", pt: "Pessimista" },
  "form.pessimisticDesc": { en: "Slow growth, high costs", es: "Crecimiento lento, costos altos", pt: "Crescimento lento, custos altos" },
  "form.yearlyTitle": { en: "Estimated Yearly Income & Expenses", es: "Ingresos y gastos estimados por año", pt: "Receitas e despesas estimadas por ano" },
  "form.yearlyHint": { en: "Edit any value to customize", es: "Edita cualquier valor para personalizar", pt: "Edite qualquer valor para personalizar" },
  "form.year": { en: "Year", es: "Año", pt: "Ano" },
  "form.income": { en: "Income", es: "Ingresos", pt: "Receita" },
  "form.expenses": { en: "Expenses", es: "Gastos", pt: "Despesas" },
  "form.netPreTax": { en: "Net (pre-tax)", es: "Neto (antes imp.)", pt: "Líquido (pré-imp.)" },
  "form.analyze": { en: "Analyze Investment", es: "Analizar inversión", pt: "Analisar investimento" },
  "form.addItem": { en: "Add item", es: "Agregar ítem", pt: "Adicionar item" },
  "form.itemName": { en: "Name", es: "Nombre", pt: "Nome" },
  "form.itemValue": { en: "Value", es: "Valor", pt: "Valor" },
  "form.removeItem": { en: "Remove", es: "Eliminar", pt: "Remover" },
  "form.selectCurrency": { en: "Select currency", es: "Seleccionar moneda", pt: "Selecionar moeda" },
  "form.incomeDetails": { en: "Income breakdown", es: "Detalle de ingresos", pt: "Detalhamento de receitas" },
  "form.expenseDetails": { en: "Expense breakdown", es: "Detalle de gastos", pt: "Detalhamento de despesas" },

  // Year 1 detail
  "form.year1Income": { en: "Year 1 — Income Sources", es: "Año 1 — Fuentes de ingreso", pt: "Ano 1 — Fontes de receita" },
  "form.year1IncomeDesc": {
    en: "List each revenue stream for the first year. These will be projected for subsequent years based on the selected scenario.",
    es: "Lista cada fuente de ingreso del primer año. Se proyectarán para los años siguientes según el escenario elegido.",
    pt: "Liste cada fonte de receita do primeiro ano. Serão projetadas para os anos seguintes conforme o cenário escolhido.",
  },
  "form.year1Costs": { en: "Year 1 — Costs", es: "Año 1 — Costos", pt: "Ano 1 — Custos" },
  "form.year1CostsDesc": {
    en: "Separate fixed costs (rent, salaries, insurance) from variable costs (materials, commissions) that depend on volume.",
    es: "Separa costos fijos (alquiler, sueldos, seguros) de costos variables (materiales, comisiones) que dependen del volumen.",
    pt: "Separe custos fixos (aluguel, salários, seguros) de custos variáveis (materiais, comissões) que dependem do volume.",
  },
  "form.fixedCosts": { en: "Fixed Costs", es: "Costos fijos", pt: "Custos fixos" },
  "form.variableCosts": { en: "Variable Costs", es: "Costos variables", pt: "Custos variáveis" },
  "form.itemDescription": { en: "Description", es: "Descripción", pt: "Descrição" },
  "form.unitCost": { en: "Unit cost", es: "Costo unitario", pt: "Custo unitário" },
  "form.units": { en: "Units", es: "Unidades", pt: "Unidades" },
  "form.subtotal": { en: "Subtotal", es: "Subtotal", pt: "Subtotal" },
  "form.totalIncome": { en: "Total Income Year 1", es: "Total ingresos Año 1", pt: "Receita total Ano 1" },
  "form.totalCosts": { en: "Total Costs Year 1", es: "Total costos Año 1", pt: "Custos totais Ano 1" },
  "form.addIncome": { en: "Add income source", es: "Agregar fuente de ingreso", pt: "Adicionar fonte de receita" },
  "form.addFixedCost": { en: "Add fixed cost", es: "Agregar costo fijo", pt: "Adicionar custo fixo" },
  "form.addVariableCost": { en: "Add variable cost", es: "Agregar costo variable", pt: "Adicionar custo variável" },

  // Scenario projection
  "form.scenarioProjection": { en: "Scenario & Projection", es: "Escenario y proyección", pt: "Cenário e projeção" },
  "form.scenarioProjectionDesc": {
    en: "Choose a scenario to project Year 1 data across {years} years. You can fine-tune any projected value.",
    es: "Elige un escenario para proyectar los datos del Año 1 a lo largo de {years} años. Podés ajustar cualquier valor proyectado.",
    pt: "Escolha um cenário para projetar os dados do Ano 1 ao longo de {years} anos. Você pode ajustar qualquer valor projetado.",
  },
  "form.optimisticDetail": {
    en: "Income +15%/yr · Fixed costs +3%/yr (inflation) · Variable units +10%/yr",
    es: "Ingresos +15%/año · Costos fijos +3%/año (inflación) · Unidades variables +10%/año",
    pt: "Receita +15%/ano · Custos fixos +3%/ano (inflação) · Unidades variáveis +10%/ano",
  },
  "form.baseDetail": {
    en: "Income +5%/yr · Fixed costs +5%/yr · Variable units +3%/yr",
    es: "Ingresos +5%/año · Costos fijos +5%/año · Unidades variables +3%/año",
    pt: "Receita +5%/ano · Custos fixos +5%/ano · Unidades variáveis +3%/ano",
  },
  "form.pessimisticDetail": {
    en: "Income −5%/yr · Fixed costs +8%/yr · Variable units −5%/yr",
    es: "Ingresos −5%/año · Costos fijos +8%/año · Unidades variables −5%/año",
    pt: "Receita −5%/ano · Custos fixos +8%/ano · Unidades variáveis −5%/ano",
  },
  "form.projectedSummary": { en: "Projected Summary", es: "Resumen proyectado", pt: "Resumo projetado" },

  // PDF Preview
  "preview.title": { en: "PDF Preview", es: "Vista previa del PDF", pt: "Pré-visualização do PDF" },
  "preview.refresh": { en: "Refresh", es: "Actualizar", pt: "Atualizar" },
  "preview.generating": { en: "Generating preview...", es: "Generando vista previa...", pt: "Gerando pré-visualização..." },
  "preview.error": { en: "Could not generate preview", es: "No se pudo generar la vista previa", pt: "Não foi possível gerar a pré-visualização" },
  "preview.button": { en: "Preview PDF", es: "Vista previa PDF", pt: "Pré-visualizar PDF" },

  // Results
  "results.title": { en: "Analysis Results", es: "Resultados del análisis", pt: "Resultados da análise" },
  "results.downloadPdf": { en: "Download PDF", es: "Descargar PDF", pt: "Baixar PDF" },
  "results.downloadExcel": { en: "Download Excel", es: "Descargar Excel", pt: "Baixar Excel" },
  "results.npv": { en: "Net Present Value", es: "Valor Actual Neto", pt: "Valor Presente Líquido" },
  "results.irr": { en: "Internal Rate of Return", es: "Tasa Interna de Retorno", pt: "Taxa Interna de Retorno" },
  "results.totalReturn": { en: "Total Net Return", es: "Retorno neto total", pt: "Retorno líquido total" },
  "results.roi": { en: "Return on Investment", es: "Retorno sobre inversión", pt: "Retorno sobre investimento" },
  "results.payback": { en: "Payback Period", es: "Período de recuperación", pt: "Período de retorno" },
  "results.totalTax": { en: "Total Tax Paid", es: "Impuestos totales", pt: "Impostos totais" },
  "results.createsValue": { en: "Project creates value", es: "El proyecto crea valor", pt: "O projeto cria valor" },
  "results.destroysValue": { en: "Project destroys value", es: "El proyecto destruye valor", pt: "O projeto destrói valor" },
  "results.aboveBreakeven": { en: "Above break-even", es: "Por encima del punto de equilibrio", pt: "Acima do ponto de equilíbrio" },
  "results.belowBreakeven": { en: "Below break-even", es: "Por debajo del punto de equilibrio", pt: "Abaixo do ponto de equilíbrio" },
  "results.cannotCompute": { en: "Cannot compute", es: "No se puede calcular", pt: "Não é possível calcular" },
  "results.onInvested": { en: "On {amount} invested", es: "Sobre {amount} invertidos", pt: "Sobre {amount} investidos" },
  "results.netGain": { en: "Net gain", es: "Ganancia neta", pt: "Ganho líquido" },
  "results.netLoss": { en: "Net loss", es: "Pérdida neta", pt: "Perda líquida" },
  "results.years": { en: "years", es: "años", pt: "anos" },
  "results.never": { en: "Never", es: "Nunca", pt: "Nunca" },
  "results.timeToRecover": { en: "Time to recover investment", es: "Tiempo para recuperar inversión", pt: "Tempo para recuperar investimento" },
  "results.notRecovered": { en: "Investment not recovered", es: "Inversión no recuperada", pt: "Investimento não recuperado" },
  "results.estimatedTax": { en: "Estimated total taxes over period", es: "Impuestos totales estimados", pt: "Impostos totais estimados" },
  "results.positive": {
    en: "✅ This investment looks promising — positive NPV indicates value creation.",
    es: "✅ Esta inversión es prometedora — un VAN positivo indica creación de valor.",
    pt: "✅ Este investimento parece promissor — VPL positivo indica criação de valor.",
  },
  "results.negative": {
    en: "⚠️ This investment may not be viable — negative NPV suggests value loss.",
    es: "⚠️ Esta inversión puede no ser viable — un VAN negativo sugiere pérdida de valor.",
    pt: "⚠️ Este investimento pode não ser viável — VPL negativo sugere perda de valor.",
  },

  // Chart
  "chart.title": { en: "Cash Flow Timeline", es: "Línea temporal de flujos", pt: "Linha do tempo de fluxos" },
  "chart.subtitle": { en: "Projected cash flows over the investment period", es: "Flujos de caja proyectados durante el período", pt: "Fluxos de caixa projetados durante o período" },
  "chart.initial": { en: "Initial", es: "Inicial", pt: "Inicial" },
  "chart.yearLabel": { en: "Year", es: "Año", pt: "Ano" },
  "chart.cashFlow": { en: "Cash Flow", es: "Flujo de caja", pt: "Fluxo de caixa" },

  // Calculation Details
  "calc.title": { en: "Calculation Details", es: "Detalles del cálculo", pt: "Detalhes do cálculo" },
  "calc.subtitle": { en: "Step-by-step breakdown of how NPV and IRR are computed", es: "Desglose paso a paso de cómo se calculan VAN y TIR", pt: "Detalhamento passo a passo de como VPL e TIR são calculados" },
  "calc.cashFlows": { en: "Cash Flows", es: "Flujos de caja", pt: "Fluxos de caixa" },
  "calc.npvBreakdown": { en: "NPV Breakdown", es: "Desglose VAN", pt: "Detalhamento VPL" },
  "calc.formulas": { en: "Formulas", es: "Fórmulas", pt: "Fórmulas" },
  "calc.preTax": { en: "Pre-Tax", es: "Antes imp.", pt: "Pré-imp." },
  "calc.tax": { en: "Tax", es: "Impuesto", pt: "Imposto" },
  "calc.netCF": { en: "Net Cash Flow", es: "Flujo neto", pt: "Fluxo líquido" },
  "calc.cumulative": { en: "Cumulative", es: "Acumulado", pt: "Acumulado" },
  "calc.total": { en: "Total", es: "Total", pt: "Total" },
  "calc.discountFactor": { en: "Discount Factor", es: "Factor de descuento", pt: "Fator de desconto" },
  "calc.presentValue": { en: "Present Value", es: "Valor presente", pt: "Valor presente" },
  "calc.npvFormula": { en: "Net Present Value (NPV)", es: "Valor Actual Neto (VAN)", pt: "Valor Presente Líquido (VPL)" },
  "calc.npvDesc": {
    en: "A positive NPV means the project earns more than the discount rate.",
    es: "Un VAN positivo significa que el proyecto genera más que la tasa de descuento.",
    pt: "Um VPL positivo significa que o projeto rende mais que a taxa de desconto.",
  },
  "calc.irrFormula": { en: "Internal Rate of Return (IRR)", es: "Tasa Interna de Retorno (TIR)", pt: "Taxa Interna de Retorno (TIR)" },
  "calc.irrDesc": {
    en: "IRR is the discount rate that makes NPV exactly zero. Solved iteratively using the Newton-Raphson method.",
    es: "La TIR es la tasa de descuento que hace el VAN exactamente cero. Se resuelve iterativamente con Newton-Raphson.",
    pt: "A TIR é a taxa de desconto que torna o VPL exatamente zero. Resolvida iterativamente usando Newton-Raphson.",
  },
  "calc.irrAbove": {
    en: "If IRR > discount rate, the project adds value.",
    es: "Si TIR > tasa de descuento, el proyecto agrega valor.",
    pt: "Se TIR > taxa de desconto, o projeto agrega valor.",
  },
  "calc.netCFFormula": { en: "Net Cash Flow per Year", es: "Flujo de caja neto por año", pt: "Fluxo de caixa líquido por ano" },
  "calc.netCFDesc": {
    en: "Tax is only applied when pre-tax profit is positive (no tax on losses).",
    es: "El impuesto solo se aplica cuando la ganancia antes de impuestos es positiva.",
    pt: "O imposto só é aplicado quando o lucro pré-impostos é positivo.",
  },
  "calc.roiFormula": { en: "Return on Investment (ROI)", es: "Retorno sobre inversión (ROI)", pt: "Retorno sobre investimento (ROI)" },
  "calc.roiDesc": {
    en: "Simple measure of profitability as a percentage of the initial investment. Does not account for the time value of money.",
    es: "Medida simple de rentabilidad como porcentaje de la inversión inicial. No considera el valor del dinero en el tiempo.",
    pt: "Medida simples de rentabilidade como porcentagem do investimento inicial. Não considera o valor do dinheiro no tempo.",
  },
  "calc.couldNotConverge": { en: "Could not converge", es: "No convergió", pt: "Não convergiu" },
  "calc.result": { en: "Result", es: "Resultado", pt: "Resultado" },
  "calc.discountNote": {
    en: "Each future cash flow is divided by (1 + r)^t to find its present value.",
    es: "Cada flujo futuro se divide por (1 + r)^t para encontrar su valor presente.",
    pt: "Cada fluxo futuro é dividido por (1 + r)^t para encontrar seu valor presente.",
  },

  // Features section
  "features.title": { en: "Everything you need to evaluate investments", es: "Todo lo que necesitas para evaluar inversiones", pt: "Tudo que você precisa para avaliar investimentos" },
  "features.subtitle": {
    en: "Built for analysts, founders, and finance teams who need fast, reliable projections.",
    es: "Diseñado para analistas, fundadores y equipos financieros que necesitan proyecciones rápidas.",
    pt: "Desenvolvido para analistas, fundadores e equipes financeiras que precisam de projeções rápidas.",
  },
  "features.npvTitle": { en: "NPV, IRR & ROI", es: "VAN, TIR y ROI", pt: "VPL, TIR e ROI" },
  "features.npvDesc": {
    en: "Industry-standard financial metrics computed instantly with step-by-step breakdowns.",
    es: "Métricas financieras estándar calculadas al instante con desgloses paso a paso.",
    pt: "Métricas financeiras padrão calculadas instantaneamente com detalhamentos passo a passo.",
  },
  "features.currencyTitle": { en: "Multi-Currency", es: "Multi-moneda", pt: "Multi-moeda" },
  "features.currencyDesc": {
    en: "Analyze in USD, ARS, MXN, EUR, or GBP with locale-aware formatting.",
    es: "Analiza en USD, ARS, MXN, EUR o GBP con formato regional.",
    pt: "Analise em USD, ARS, MXN, EUR ou GBP com formatação regional.",
  },
  "features.exportTitle": { en: "PDF & Excel Export", es: "Exportar PDF y Excel", pt: "Exportar PDF e Excel" },
  "features.exportDesc": {
    en: "Download professional reports ready for board presentations or further analysis.",
    es: "Descarga reportes profesionales listos para presentaciones o análisis adicional.",
    pt: "Baixe relatórios profissionais prontos para apresentações ou análise adicional.",
  },
  "features.scenarioTitle": { en: "Scenario Modeling", es: "Modelado de escenarios", pt: "Modelagem de cenários" },
  "features.scenarioDesc": {
    en: "Toggle between optimistic, base, and pessimistic growth scenarios instantly.",
    es: "Alterna entre escenarios de crecimiento optimista, base y pesimista.",
    pt: "Alterne entre cenários de crescimento otimista, base e pessimista.",
  },
  "features.taxTitle": { en: "Tax-Aware", es: "Con impuestos", pt: "Com impostos" },
  "features.taxDesc": {
    en: "Accounts for tax rates in cash flow calculations with loss carryforward logic.",
    es: "Considera tasas impositivas en cálculos de flujo con lógica de pérdidas.",
    pt: "Considera taxas de impostos nos cálculos de fluxo com lógica de perdas.",
  },
  "features.instantTitle": { en: "Instant Results", es: "Resultados al instante", pt: "Resultados instantâneos" },
  "features.instantDesc": {
    en: "No sign-up required. Enter your data and get results in milliseconds.",
    es: "Sin registro. Ingresa tus datos y obtén resultados en milisegundos.",
    pt: "Sem cadastro. Insira seus dados e obtenha resultados em milissegundos.",
  },

  // Footer
  "footer.disclaimer": {
    en: "Professional investment analysis tool. All calculations are for informational purposes only.",
    es: "Herramienta profesional de análisis de inversión. Todos los cálculos son con fines informativos.",
    pt: "Ferramenta profissional de análise de investimento. Todos os cálculos são apenas informativos.",
  },

  // Depreciation
  "form.depreciation": { en: "Depreciation / Amortization", es: "Depreciación / Amortización", pt: "Depreciação / Amortização" },
  "form.depreciationToggle": { en: "Consider depreciation?", es: "¿Considerar depreciación?", pt: "Considerar depreciação?" },
  "form.depreciationDesc": {
    en: "Depreciation creates a tax shield that reduces your tax burden without being an actual cash outflow.",
    es: "La depreciación genera un escudo fiscal que reduce la carga impositiva sin ser una salida real de efectivo.",
    pt: "A depreciação cria um escudo fiscal que reduz a carga tributária sem ser uma saída real de caixa.",
  },
  "form.assetName": { en: "Asset Name", es: "Nombre del activo", pt: "Nome do ativo" },
  "form.assetNamePlaceholder": { en: "e.g. Industrial Machinery", es: "ej. Maquinaria industrial", pt: "ex. Maquinário industrial" },
  "form.depreciableValue": { en: "Depreciable Value", es: "Valor depreciable", pt: "Valor depreciável" },
  "form.residualValue": { en: "Residual Value", es: "Valor residual", pt: "Valor residual" },
  "form.residualValueHint": {
    en: "Estimated value at the end of useful life (added to last year's cash flow)",
    es: "Valor estimado al final de la vida útil (se suma al flujo del último año)",
    pt: "Valor estimado no final da vida útil (adicionado ao fluxo do último ano)",
  },
  "form.annualDepreciation": { en: "Annual Depreciation", es: "Depreciación anual", pt: "Depreciação anual" },
  "form.taxShield": { en: "Tax Shield / year", es: "Escudo fiscal / año", pt: "Escudo fiscal / ano" },

  "calc.depreciation": { en: "Depreciation", es: "Depreciación", pt: "Depreciação" },
  "calc.taxShield": { en: "Tax Shield", es: "Escudo fiscal", pt: "Escudo fiscal" },
  "calc.residualValue": { en: "Residual Value", es: "Valor residual", pt: "Valor residual" },
  "calc.depreciationFormula": { en: "Depreciation (Straight-Line)", es: "Depreciación (Línea recta)", pt: "Depreciação (Linha reta)" },
  "calc.depreciationFormulaDesc": {
    en: "Annual Depreciation = (Depreciable Value − Residual Value) / Years. The tax shield = Depreciation × Tax Rate, which reduces actual taxes paid each year.",
    es: "Depreciación anual = (Valor depreciable − Valor residual) / Años. El escudo fiscal = Depreciación × Tasa impositiva, que reduce los impuestos reales pagados cada año.",
    pt: "Depreciação anual = (Valor depreciável − Valor residual) / Anos. O escudo fiscal = Depreciação × Taxa de impostos, que reduz os impostos reais pagos a cada ano.",
  },
  "results.depreciation": { en: "Annual Depreciation", es: "Depreciación anual", pt: "Depreciação anual" },
  "results.depreciationDesc": { en: "Straight-line on {asset}", es: "Línea recta sobre {asset}", pt: "Linha reta sobre {asset}" },
  "results.totalTaxShield": { en: "Total Tax Shield", es: "Escudo fiscal total", pt: "Escudo fiscal total" },
  "results.totalTaxShieldDesc": { en: "Tax savings from depreciation", es: "Ahorro fiscal por depreciación", pt: "Economia fiscal por depreciação" },

  // Reinvestment
  "form.reinvestToggle": { en: "Include reinvestment in later years?", es: "¿Incluir reinversión en años posteriores?", pt: "Incluir reinvestimento em anos posteriores?" },
  "form.reinvestDesc": {
    en: "Add additional investment amounts in specific years that reduce cash flow.",
    es: "Agrega montos de inversión adicional en años específicos que reducen el flujo de caja.",
    pt: "Adicione valores de investimento adicional em anos específicos que reduzem o fluxo de caixa.",
  },
  "form.reinvestPerYearDesc": {
    en: "Enter the reinvestment amount for each year. Leave at 0 for years with no reinvestment.",
    es: "Ingresa el monto de reinversión para cada año. Deja en 0 los años sin reinversión.",
    pt: "Insira o valor de reinvestimento para cada ano. Deixe em 0 para anos sem reinvestimento.",
  },
  "form.totalReinvestment": { en: "Total Reinvestment", es: "Reinversión total", pt: "Reinvestimento total" },
  "form.newAnalysis": { en: "New Analysis", es: "Nuevo análisis", pt: "Nova análise" },
  "form.newAnalysisStarted": { en: "Form cleared. Start a new analysis.", es: "Formulario limpio. Comenzá un nuevo análisis.", pt: "Formulário limpo. Comece uma nova análise." },
  "settings.analysisLoaded": { en: "Analysis loaded. Adjust and re-evaluate.", es: "Análisis cargado. Ajustá los datos y volvé a evaluar.", pt: "Análise carregada. Ajuste e reavalie." },

  // Inflation
  "form.inflationToggle": { en: "Include inflation projection?", es: "¿Incluir proyección de inflación?", pt: "Incluir projeção de inflação?" },
  "form.inflationDesc": {
    en: "Apply annual inflation rates that increase costs over time.",
    es: "Aplica tasas de inflación anuales que incrementan los costos con el tiempo.",
    pt: "Aplica taxas de inflação anuais que aumentam os custos ao longo do tempo.",
  },
  "form.inflationRate": { en: "Annual Inflation (%)", es: "Inflación anual (%)", pt: "Inflação anual (%)" },
  "form.inflationPerYearDesc": {
    en: "Set a different inflation rate for each year. Year 1 is the base (no inflation applied).",
    es: "Define una tasa de inflación diferente para cada año. El año 1 es la base (sin inflación aplicada).",
    pt: "Defina uma taxa de inflação diferente para cada ano. O ano 1 é a base (sem inflação aplicada).",
  },
  "form.inflationYear1Note": {
    en: "Base year",
    es: "Año base",
    pt: "Ano base",
  },

  // Editable growth rates
  "form.customRates": { en: "Custom Growth Rates", es: "Tasas de crecimiento personalizadas", pt: "Taxas de crescimento personalizadas" },
  "form.customRatesDesc": {
    en: "Fine-tune the growth percentages for the selected scenario.",
    es: "Ajusta los porcentajes de crecimiento del escenario seleccionado.",
    pt: "Ajuste as porcentagens de crescimento do cenário selecionado.",
  },
  "form.incomeGrowth": { en: "Income Growth (%/yr)", es: "Crecimiento ingresos (%/año)", pt: "Crescimento receita (%/ano)" },
  "form.fixedCostGrowth": { en: "Fixed Cost Growth (%/yr)", es: "Crecimiento costos fijos (%/año)", pt: "Crescimento custos fixos (%/ano)" },
  "form.variableUnitsGrowth": { en: "Variable Units Growth (%/yr)", es: "Crecimiento unidades var. (%/año)", pt: "Crescimento unidades var. (%/ano)" },

  // Auth
  "auth.signIn": { en: "Sign In", es: "Iniciar sesión", pt: "Entrar" },
  "auth.signUp": { en: "Sign Up", es: "Registrarse", pt: "Cadastrar" },
  "auth.signOut": { en: "Sign Out", es: "Cerrar sesión", pt: "Sair" },
  "auth.signInDesc": { en: "Access your account to continue", es: "Accede a tu cuenta para continuar", pt: "Acesse sua conta para continuar" },
  "auth.signUpDesc": { en: "Create an account to start analyzing", es: "Crea una cuenta para comenzar a analizar", pt: "Crie uma conta para começar a analisar" },
  "auth.email": { en: "Email", es: "Correo electrónico", pt: "E-mail" },
  "auth.password": { en: "Password", es: "Contraseña", pt: "Senha" },
  "auth.name": { en: "Full Name", es: "Nombre completo", pt: "Nome completo" },
  "auth.namePlaceholder": { en: "John Doe", es: "Juan Pérez", pt: "João Silva" },
  "auth.hasAccount": { en: "Already have an account? Sign in", es: "¿Ya tenés cuenta? Iniciá sesión", pt: "Já tem conta? Entre" },
  "auth.noAccount": { en: "Don't have an account? Sign up", es: "¿No tenés cuenta? Registrate", pt: "Não tem conta? Cadastre-se" },
  "auth.checkEmail": { en: "Check your email for the confirmation link", es: "Revisá tu correo para el enlace de confirmación", pt: "Verifique seu e-mail para o link de confirmação" },
  "auth.backHome": { en: "Back to home", es: "Volver al inicio", pt: "Voltar ao início" },
  "auth.remaining": { en: "analyses left", es: "análisis restantes", pt: "análises restantes" },
  "auth.loginRequired": { en: "Sign in to analyze projects", es: "Iniciá sesión para analizar proyectos", pt: "Entre para analisar projetos" },
  "auth.limitReached": { en: "Free limit reached. Upgrade to Premium for unlimited analyses.", es: "Límite gratuito alcanzado. Actualizá a Premium para análisis ilimitados.", pt: "Limite gratuito atingido. Atualize para Premium para análises ilimitadas." },
  "auth.continueGoogle": { en: "Continue with Google", es: "Continuar con Google", pt: "Continuar com Google" },
  "auth.orEmail": { en: "or continue with email", es: "o continuar con email", pt: "ou continuar com email" },
  "auth.verificationNote": { en: "A verification link will be sent to your email to complete registration.", es: "Se enviará un enlace de verificación a tu correo para completar el registro.", pt: "Um link de verificação será enviado ao seu e-mail para completar o cadastro." },
  "auth.forgotPassword": { en: "Forgot your password?", es: "¿Olvidaste tu contraseña?", pt: "Esqueceu sua senha?" },
  "auth.resetPassword": { en: "Reset Password", es: "Restablecer contraseña", pt: "Redefinir senha" },
  "auth.resetPasswordDesc": { en: "Enter your email to receive a reset link", es: "Ingresá tu correo para recibir un enlace de restablecimiento", pt: "Digite seu e-mail para receber um link de redefinição" },
  "auth.sendResetLink": { en: "Send reset link", es: "Enviar enlace", pt: "Enviar link" },
  "auth.resetLinkSent": { en: "Check your email for the reset link", es: "Revisá tu correo para el enlace de restablecimiento", pt: "Verifique seu e-mail para o link de redefinição" },
  "auth.newPassword": { en: "New Password", es: "Nueva contraseña", pt: "Nova senha" },
  "auth.confirmNewPassword": { en: "Confirm New Password", es: "Confirmar nueva contraseña", pt: "Confirmar nova senha" },
  "auth.updatePassword": { en: "Update Password", es: "Actualizar contraseña", pt: "Atualizar senha" },
  "auth.passwordUpdated": { en: "Password updated! Redirecting...", es: "¡Contraseña actualizada! Redirigiendo...", pt: "Senha atualizada! Redirecionando..." },
  "auth.passwordMismatch": { en: "Passwords do not match", es: "Las contraseñas no coinciden", pt: "As senhas não coincidem" },
  "preview.premiumOnly": { en: "PDF Preview is a Premium feature", es: "La vista previa PDF es una función Premium", pt: "A pré-visualização PDF é um recurso Premium" },

  // Pricing
  "pricing.badge": { en: "Plans", es: "Planes", pt: "Planos" },
  "pricing.title": { en: "Choose your plan", es: "Elegí tu plan", pt: "Escolha seu plano" },
  "pricing.subtitle": { en: "Start free, upgrade when you need more", es: "Empezá gratis, actualizá cuando necesites más", pt: "Comece grátis, atualize quando precisar de mais" },
  "pricing.free": { en: "Free", es: "Gratis", pt: "Grátis" },
  "pricing.forever": { en: "forever", es: "siempre", pt: "sempre" },
  "pricing.monthly": { en: "Monthly", es: "Mensual", pt: "Mensal" },
  "pricing.annual": { en: "Annual", es: "Anual", pt: "Anual" },
  "pricing.perMonth": { en: "month", es: "mes", pt: "mês" },
  "pricing.perYear": { en: "year", es: "año", pt: "ano" },
  "pricing.save17": { en: "Save 17%", es: "Ahorrá 17%", pt: "Economize 17%" },
  "pricing.current": { en: "Current", es: "Actual", pt: "Atual" },
  "pricing.upgrade": { en: "Upgrade", es: "Mejorar plan", pt: "Melhorar plano" },
  "pricing.manage": { en: "Manage subscription", es: "Gestionar suscripción", pt: "Gerenciar assinatura" },
  "pricing.signUpFirst": { en: "Sign up to upgrade", es: "Registrate para mejorar", pt: "Cadastre-se para melhorar" },
  "pricing.getStarted": { en: "Get started", es: "Comenzar", pt: "Começar" },
  "pricing.freeFeature1": { en: "3 analyses per month", es: "3 análisis por mes", pt: "3 análises por mês" },
  "pricing.freeFeature2": { en: "Basic PDF export", es: "Exportación PDF básica", pt: "Exportação PDF básica" },
  "pricing.freeFeature3": { en: "All financial metrics (NPV, IRR, ROI)", es: "Todas las métricas financieras (VAN, TIR, ROI)", pt: "Todas as métricas financeiras (VPL, TIR, ROI)" },
  "pricing.premFeature1": { en: "Unlimited analyses", es: "Análisis ilimitados", pt: "Análises ilimitadas" },
  "pricing.premFeature2": { en: "4 premium PDF templates with custom branding", es: "4 plantillas PDF premium con marca personalizada", pt: "4 modelos PDF premium com marca personalizada" },
  "pricing.premFeature3": { en: "Custom logo, colors & fonts on reports", es: "Logo, colores y fuentes personalizados en reportes", pt: "Logo, cores e fontes personalizados nos relatórios" },
  "pricing.premFeature4": { en: "Excel export & priority support", es: "Exportación Excel y soporte prioritario", pt: "Exportação Excel e suporte prioritário" },

  // Nav pricing
  "nav.pricing": { en: "Pricing", es: "Planes", pt: "Planos" },

  // Settings
  "nav.settings": { en: "Settings", es: "Configuración", pt: "Configurações" },
  "settings.profile": { en: "Profile", es: "Perfil", pt: "Perfil" },
  "settings.plan": { en: "Current Plan", es: "Plan actual", pt: "Plano atual" },
  "settings.analysesUsed": { en: "Analyses Used", es: "Análisis realizados", pt: "Análises realizadas" },
  "settings.subscription": { en: "Subscription", es: "Suscripción", pt: "Assinatura" },
  "settings.premiumActive": { en: "Premium subscription active", es: "Suscripción Premium activa", pt: "Assinatura Premium ativa" },
  "settings.renewsOn": { en: "Renews on", es: "Se renueva el", pt: "Renova em" },
  "settings.upgradeDesc": { en: "Upgrade to Premium for unlimited analyses and priority support.", es: "Actualizá a Premium para análisis ilimitados y soporte prioritario.", pt: "Atualize para Premium para análises ilimitadas e suporte prioritário." },
  "settings.myAnalyses": { en: "My Evaluations", es: "Mis evaluaciones", pt: "Minhas avaliações" },
  "settings.loading": { en: "Loading...", es: "Cargando...", pt: "Carregando..." },
  "settings.noAnalyses": { en: "No evaluations yet. Run your first analysis!", es: "Sin evaluaciones aún. ¡Realizá tu primer análisis!", pt: "Sem avaliações ainda. Faça sua primeira análise!" },
  "settings.untitledProject": { en: "Untitled Project", es: "Proyecto sin nombre", pt: "Projeto sem nome" },
  "settings.loadAnalysis": { en: "Load & Edit", es: "Cargar y editar", pt: "Carregar e editar" },
  "settings.noDataSaved": { en: "No data saved for this analysis", es: "No hay datos guardados para este análisis", pt: "Sem dados salvos para esta análise" },
  "settings.cancelSub": { en: "Cancel subscription", es: "Cancelar suscripción", pt: "Cancelar assinatura" },
  "settings.changePlan": { en: "Change plan", es: "Cambiar plan", pt: "Mudar plano" },

  // Report customization
  "report.premiumOnly": { en: "Premium Feature", es: "Función Premium", pt: "Recurso Premium" },
  "report.premiumOnlyDesc": { en: "Upgrade to customize your PDF reports with logos, colors, and templates.", es: "Actualizá para personalizar tus reportes PDF con logos, colores y templates.", pt: "Atualize para personalizar seus relatórios PDF com logos, cores e templates." },
  "report.customizeReport": { en: "Customize Report", es: "Personalizar reporte", pt: "Personalizar relatório" },
  "report.save": { en: "Save", es: "Guardar", pt: "Salvar" },
  "report.template": { en: "Report Template", es: "Plantilla de reporte", pt: "Modelo de relatório" },
  "report.tplProfessional": { en: "Professional", es: "Profesional", pt: "Profissional" },
  "report.tplProfessionalDesc": { en: "Dark header with accent bar", es: "Encabezado oscuro con barra de color", pt: "Cabeçalho escuro com barra de cor" },
  "report.tplModern": { en: "Modern", es: "Moderno", pt: "Moderno" },
  "report.tplModernDesc": { en: "Rounded card-style header", es: "Encabezado estilo tarjeta redondeado", pt: "Cabeçalho estilo cartão arredondado" },
  "report.tplMinimal": { en: "Minimal", es: "Minimalista", pt: "Minimalista" },
  "report.tplMinimalDesc": { en: "Clean text with subtle line", es: "Texto limpio con línea sutil", pt: "Texto limpo com linha sutil" },
  "report.tplCorporate": { en: "Corporate", es: "Corporativo", pt: "Corporativo" },
  "report.tplCorporateDesc": { en: "Side bar with top accent", es: "Barra lateral con acento superior", pt: "Barra lateral com destaque superior" },
  "report.companyLogo": { en: "Company Logo", es: "Logo de empresa", pt: "Logo da empresa" },
  "report.uploadLogo": { en: "Upload logo (max 2MB)", es: "Subir logo (máx 2MB)", pt: "Enviar logo (máx 2MB)" },
  "report.removeLogo": { en: "Remove", es: "Eliminar", pt: "Remover" },
  "report.logoTooLarge": { en: "Logo must be under 2MB", es: "El logo debe ser menor a 2MB", pt: "O logo deve ter menos de 2MB" },
  "report.logoUploaded": { en: "Logo uploaded successfully", es: "Logo subido correctamente", pt: "Logo enviado com sucesso" },
  "report.headerCustom": { en: "Report Header", es: "Encabezado del reporte", pt: "Cabeçalho do relatório" },
  "report.headerTitlePh": { en: "Custom report title...", es: "Título personalizado del reporte...", pt: "Título personalizado do relatório..." },
  "report.headerSubtitlePh": { en: "Custom subtitle or company name...", es: "Subtítulo o nombre de empresa...", pt: "Subtítulo ou nome da empresa..." },
  "report.colors": { en: "Colors", es: "Colores", pt: "Cores" },
  "report.primaryColor": { en: "Primary", es: "Primario", pt: "Primário" },
  "report.secondaryColor": { en: "Secondary", es: "Secundario", pt: "Secundário" },
  "report.accentColor": { en: "Accent", es: "Acento", pt: "Destaque" },
  "report.font": { en: "Font", es: "Tipografía", pt: "Fonte" },
} as const;

type TranslationKey = keyof typeof translations;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, vars?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("investcalc-lang");
    if (saved && (saved === "en" || saved === "es" || saved === "pt")) return saved;
    return "en";
  });

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("investcalc-lang", lang);
  };

  const t = (key: TranslationKey, vars?: Record<string, string>): string => {
    const entry = translations[key];
    if (!entry) return key;
    let text: string = entry[language] || entry.en;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
