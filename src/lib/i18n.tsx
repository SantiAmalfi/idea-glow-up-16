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
