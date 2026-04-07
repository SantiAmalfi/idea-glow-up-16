import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatPercent, type Currency, type DepreciationConfig } from "./finance";
import type { Language } from "./i18n";
import { drawCashFlowBarChart, drawCumulativeChart, drawIncomeExpensesChart } from "./pdfCharts";

interface ExportData {
  projectName: string;
  projectDescription: string;
  currency: Currency;
  investment: number;
  discountRate: number;
  taxRate: number;
  npv: number;
  irr: number | null;
  totalReturn: number;
  roi: number;
  paybackPeriod: number | null;
  totalTax: number;
  yearlyData: { income: number; expenses: number }[];
  cashFlows: number[];
  depreciation?: DepreciationConfig;
}

const labels: Record<string, Record<Language, string>> = {
  reportTitle:    { en: "Investment Analysis",     es: "Análisis de inversión",       pt: "Análise de investimento" },
  generatedReport:{ en: "Generated report",        es: "Reporte generado",            pt: "Relatório gerado" },
  reportDate:     { en: "Report date",             es: "Fecha del reporte",           pt: "Data do relatório" },
  currency:       { en: "Currency",                es: "Moneda",                      pt: "Moeda" },
  keyMetrics:     { en: "Key Metrics",             es: "Métricas clave",              pt: "Métricas chave" },
  metric:         { en: "Metric",                  es: "Métrica",                     pt: "Métrica" },
  value:          { en: "Value",                   es: "Valor",                       pt: "Valor" },
  detail:         { en: "Detail",                  es: "Detalle",                     pt: "Detalhe" },
  npv:            { en: "Net Present Value (NPV)", es: "Valor Actual Neto (VAN)",     pt: "Valor Presente Líquido (VPL)" },
  irr:            { en: "Internal Rate of Return (IRR)", es: "Tasa Interna de Retorno (TIR)", pt: "Taxa Interna de Retorno (TIR)" },
  roi:            { en: "Return on Investment (ROI)", es: "Retorno sobre inversión (ROI)", pt: "Retorno sobre investimento (ROI)" },
  totalReturn:    { en: "Total Net Return",        es: "Retorno neto total",          pt: "Retorno líquido total" },
  payback:        { en: "Payback Period",          es: "Período de recuperación",     pt: "Período de retorno" },
  totalTax:       { en: "Total Tax Paid",          es: "Impuestos totales",           pt: "Impostos totais" },
  initialInv:     { en: "Initial Investment",      es: "Inversión inicial",           pt: "Investimento inicial" },
  discountRate:   { en: "Discount Rate",           es: "Tasa de descuento",           pt: "Taxa de desconto" },
  taxRate:        { en: "Tax Rate",                es: "Tasa impositiva",             pt: "Taxa de impostos" },
  years:          { en: "years",                   es: "años",                        pt: "anos" },
  never:          { en: "Never",                   es: "Nunca",                       pt: "Nunca" },
  yearlyCF:       { en: "Yearly Cash Flow Breakdown", es: "Desglose anual de flujos de caja", pt: "Detalhamento anual de fluxos de caixa" },
  year:           { en: "Year",                    es: "Año",                         pt: "Ano" },
  income:         { en: "Income",                  es: "Ingresos",                    pt: "Receita" },
  expenses:       { en: "Expenses",                es: "Gastos",                      pt: "Despesas" },
  preTax:         { en: "Pre-Tax Profit",          es: "Ganancia antes imp.",         pt: "Lucro pré-imp." },
  tax:            { en: "Tax",                     es: "Impuesto",                    pt: "Imposto" },
  netCF:          { en: "Net Cash Flow",           es: "Flujo neto",                  pt: "Fluxo líquido" },
  cumulative:     { en: "Cumulative",              es: "Acumulado",                   pt: "Acumulado" },
  initial:        { en: "Initial",                 es: "Inicial",                     pt: "Inicial" },
  npvBreakdown:   { en: "NPV Breakdown",           es: "Desglose VAN",                pt: "Detalhamento VPL" },
  netCashFlow:    { en: "Net Cash Flow",           es: "Flujo neto",                  pt: "Fluxo líquido" },
  discountFactor: { en: "Discount Factor",         es: "Factor de descuento",         pt: "Fator de desconto" },
  presentValue:   { en: "Present Value",           es: "Valor presente",              pt: "Valor presente" },
  conclusionPos:  { en: "Conclusion: Positive NPV — the investment creates value.", es: "Conclusión: VAN positivo — la inversión crea valor.", pt: "Conclusão: VPL positivo — o investimento cria valor." },
  conclusionNeg:  { en: "Conclusion: Negative NPV — the investment may destroy value.", es: "Conclusión: VAN negativo — la inversión puede destruir valor.", pt: "Conclusão: VPL negativo — o investimento pode destruir valor." },
  footer:         { en: "Investment Analyzer Report", es: "Reporte del Analizador de Inversiones", pt: "Relatório do Analisador de Investimentos" },
  page:           { en: "Page",                    es: "Página",                      pt: "Página" },
  of:             { en: "of",                      es: "de",                          pt: "de" },
  project:        { en: "Project",                 es: "Proyecto",                    pt: "Projeto" },
  parameters:     { en: "Analysis Parameters",     es: "Parámetros del análisis",     pt: "Parâmetros da análise" },
  depSection:     { en: "Depreciation & Amortization", es: "Depreciación y Amortización", pt: "Depreciação e Amortização" },
  depAsset:       { en: "Asset",                   es: "Activo",                      pt: "Ativo" },
  depValue:       { en: "Depreciable Value",       es: "Valor depreciable",           pt: "Valor depreciável" },
  depResidual:    { en: "Residual Value",          es: "Valor residual",              pt: "Valor residual" },
  depAnnual:      { en: "Annual Depreciation",     es: "Depreciación anual",          pt: "Depreciação anual" },
  depMethod:      { en: "Method: Straight-line",   es: "Método: Línea recta",         pt: "Método: Linha reta" },
  depTaxShield:   { en: "Tax Shield per Year",     es: "Escudo fiscal por año",       pt: "Escudo fiscal por ano" },
  depFormula:     { en: "Formula",                 es: "Fórmula",                     pt: "Fórmula" },
  noDepreciation: { en: "Depreciation not considered", es: "Depreciación no considerada", pt: "Depreciação não considerada" },
  chartSection:   { en: "Visual Analysis",            es: "Análisis visual",             pt: "Análise visual" },
  chartCF:        { en: "Net Cash Flow by Year",      es: "Flujo neto por año",          pt: "Fluxo líquido por ano" },
  chartCum:       { en: "Cumulative Cash Flow & Payback", es: "Flujo acumulado y recuperación", pt: "Fluxo acumulado e retorno" },
  chartIncExp:    { en: "Income vs Expenses by Year", es: "Ingresos vs Gastos por año",  pt: "Receita vs Despesas por ano" },
  taxableIncome:  { en: "Taxable Income",          es: "Ingreso imponible",           pt: "Renda tributável" },
  depreciation:   { en: "Depreciation",            es: "Depreciación",                pt: "Depreciação" },
  taxShield:      { en: "Tax Shield",              es: "Escudo fiscal",               pt: "Escudo fiscal" },
  residualVal:    { en: "Residual Value",          es: "Valor residual",              pt: "Valor residual" },
  npvDetailNote:  {
    en: "Each cash flow is discounted using the formula: PV = CF / (1 + r)^t, where r = discount rate and t = year",
    es: "Cada flujo se descuenta con la fórmula: VP = FC / (1 + r)^t, donde r = tasa de descuento y t = año",
    pt: "Cada fluxo é descontado pela fórmula: VP = FC / (1 + r)^t, onde r = taxa de desconto e t = ano",
  },
  roiFormula:     {
    en: "ROI = (Total Net Return − Investment) / Investment",
    es: "ROI = (Retorno Neto Total − Inversión) / Inversión",
    pt: "ROI = (Retorno Líquido Total − Investimento) / Investimento",
  },
  sumAfterTax:    {
    en: "Sum of all after-tax cash flows (years 1 to N)",
    es: "Suma de todos los flujos después de impuestos (años 1 a N)",
    pt: "Soma de todos os fluxos após impostos (anos 1 a N)",
  },
  paybackNote:    {
    en: "Year when cumulative cash flow turns positive (interpolated)",
    es: "Año en que el flujo acumulado se vuelve positivo (interpolado)",
    pt: "Ano em que o fluxo acumulado se torna positivo (interpolado)",
  },
  irrNote:        {
    en: "Rate at which NPV = 0 (Newton-Raphson method)",
    es: "Tasa a la cual VAN = 0 (método Newton-Raphson)",
    pt: "Taxa na qual VPL = 0 (método Newton-Raphson)",
  },
};

function l(key: string, lang: Language): string {
  return labels[key]?.[lang] ?? labels[key]?.en ?? key;
}

export function exportToPdf(data: ExportData, lang: Language = "en") {
  const doc = new jsPDF();
  const c = data.currency;
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  const taxPct = `${(data.taxRate * 100).toFixed(0)}%`;
  const discPct = `${(data.discountRate * 100).toFixed(1)}%`;
  const nYears = data.yearlyData.length;
  const hasDep = data.depreciation?.enabled ?? false;
  const annualDep = hasDep
    ? (data.depreciation!.depreciableValue - data.depreciation!.residualValue) / nYears
    : 0;
  const taxShieldPerYear = annualDep * data.taxRate;

  // ── Header bar ──
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 45, "F");
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 42, pageW, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(data.projectName || l("reportTitle", lang), margin, 22);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(data.projectDescription || l("generatedReport", lang), margin, 33, { maxWidth: pageW - margin * 2 });

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`${l("reportDate", lang)}: ${new Date().toLocaleDateString()}`, pageW - margin, 22, { align: "right" });
  doc.text(`${l("currency", lang)}: ${c}`, pageW - margin, 30, { align: "right" });

  let y = 55;

  // ── Analysis Parameters ──
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(l("parameters", lang), margin, y);
  y += 4;

  const paramRows: string[][] = [
    [l("initialInv", lang), formatCurrency(data.investment, c)],
    [l("discountRate", lang), `${discPct}`],
    [l("taxRate", lang), `${taxPct}`],
    [`${l("year", lang)}s`, `${nYears}`],
  ];

  if (hasDep) {
    paramRows.push(
      [l("depAsset", lang), data.depreciation!.assetName || "—"],
      [l("depValue", lang), formatCurrency(data.depreciation!.depreciableValue, c)],
      [l("depResidual", lang), formatCurrency(data.depreciation!.residualValue, c)],
      [l("depAnnual", lang), `${formatCurrency(annualDep, c)} (${l("depMethod", lang)})`],
      [l("depFormula", lang), `(${formatCurrency(data.depreciation!.depreciableValue, c)} − ${formatCurrency(data.depreciation!.residualValue, c)}) / ${nYears}`],
      [l("depTaxShield", lang), `${formatCurrency(taxShieldPerYear, c)} (${formatCurrency(annualDep, c)} × ${taxPct})`],
    );
  } else {
    paramRows.push([l("depreciation", lang), l("noDepreciation", lang)]);
  }

  autoTable(doc, {
    startY: y,
    body: paramRows,
    margin: { left: margin, right: margin },
    theme: "plain",
    bodyStyles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 }, 1: { halign: "right" } },
    alternateRowStyles: { fillColor: [241, 245, 249] },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // ── Key Metrics (with explanatory details) ──
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(l("keyMetrics", lang), margin, y);
  y += 4;

  const metrics: string[][] = [
    [
      l("npv", lang),
      formatCurrency(data.npv, c),
      `${l("npvDetailNote", lang)} (r = ${discPct})`,
    ],
    [
      l("irr", lang),
      data.irr !== null ? formatPercent(data.irr) : "N/A",
      l("irrNote", lang),
    ],
    [
      l("roi", lang),
      formatPercent(data.roi),
      `${l("roiFormula", lang)}: (${formatCurrency(data.totalReturn, c)} − ${formatCurrency(data.investment, c)}) / ${formatCurrency(data.investment, c)}`,
    ],
    [
      l("totalReturn", lang),
      formatCurrency(data.totalReturn, c),
      l("sumAfterTax", lang) + ` (${taxPct})`,
    ],
    [
      l("payback", lang),
      data.paybackPeriod !== null ? `${data.paybackPeriod.toFixed(1)} ${l("years", lang)}` : l("never", lang),
      l("paybackNote", lang),
    ],
    [
      l("totalTax", lang),
      formatCurrency(data.totalTax, c),
      hasDep
        ? `${taxPct} × ${l("taxableIncome", lang)} (${l("preTax", lang)} − ${l("depreciation", lang)})`
        : `${taxPct} × ${l("preTax", lang)}`,
    ],
  ];

  autoTable(doc, {
    startY: y,
    head: [[l("metric", lang), l("value", lang), l("detail", lang)]],
    body: metrics,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 8.5 },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { halign: "right", fontStyle: "bold", cellWidth: 35 },
      2: { fontSize: 7.5, textColor: [100, 116, 139] },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 14;

  // ── Cash Flow Table (with depreciation columns if applicable) ──
  if (y > 220) { doc.addPage(); y = 20; }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(l("yearlyCF", lang), margin, y);
  y += 4;

  let cumulative = -data.investment;
  const cfBody: string[][] = [];

  if (hasDep) {
    cfBody.push([
      `0 (${l("initial", lang)})`, "—", "—", "—", "—", "—", "—",
      formatCurrency(-data.investment, c), formatCurrency(cumulative, c),
    ]);
  } else {
    cfBody.push([
      `0 (${l("initial", lang)})`, "—", "—", "—",
      "—", formatCurrency(-data.investment, c), formatCurrency(cumulative, c),
    ]);
  }

  data.yearlyData.forEach((yr, i) => {
    const preTax = yr.income - yr.expenses;
    const taxableIncome = preTax - annualDep;
    const tax = taxableIncome > 0 ? taxableIncome * data.taxRate : 0;
    const net = preTax - tax;
    const isLast = i === nYears - 1;
    const residualAdd = (isLast && hasDep) ? data.depreciation!.residualValue : 0;
    const finalNet = net + residualAdd;
    cumulative += finalNet;

    if (hasDep) {
      cfBody.push([
        `${l("year", lang)} ${i + 1}`,
        formatCurrency(yr.income, c),
        formatCurrency(yr.expenses, c),
        formatCurrency(preTax, c),
        formatCurrency(annualDep, c),
        formatCurrency(taxableIncome, c),
        `${formatCurrency(tax, c)} (${taxPct})`,
        formatCurrency(finalNet, c) + (residualAdd > 0 ? ` +${formatCurrency(residualAdd, c)} res.` : ""),
        formatCurrency(cumulative, c),
      ]);
    } else {
      cfBody.push([
        `${l("year", lang)} ${i + 1}`,
        formatCurrency(yr.income, c),
        formatCurrency(yr.expenses, c),
        formatCurrency(preTax, c),
        `${formatCurrency(tax, c)} (${taxPct})`,
        formatCurrency(finalNet, c),
        formatCurrency(cumulative, c),
      ]);
    }
  });

  const cfHead = hasDep
    ? [[
        l("year", lang), l("income", lang), l("expenses", lang), l("preTax", lang),
        l("depreciation", lang), l("taxableIncome", lang),
        `${l("tax", lang)} (${taxPct})`, l("netCF", lang), l("cumulative", lang),
      ]]
    : [[
        l("year", lang), l("income", lang), l("expenses", lang), l("preTax", lang),
        `${l("tax", lang)} (${taxPct})`, l("netCF", lang), l("cumulative", lang),
      ]];

  autoTable(doc, {
    startY: y,
    head: cfHead,
    body: cfBody,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7 },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: Object.fromEntries(
      Array.from({ length: hasDep ? 9 : 7 }, (_, i) => [i, i > 0 ? { halign: "right" as const } : {}])
    ),
  });

  y = (doc as any).lastAutoTable.finalY + 14;

  // ── NPV Breakdown ──
  if (y > 220) { doc.addPage(); y = 20; }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(l("npvBreakdown", lang), margin, y);
  y += 2;

  // Explanatory note
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`${l("npvDetailNote", lang)} (r = ${discPct})`, margin, y + 4);
  doc.setTextColor(15, 23, 42);
  y += 8;

  const npvBody: string[][] = [];
  npvBody.push(["0", formatCurrency(-data.investment, c), "1.0000", formatCurrency(-data.investment, c), `1 / (1 + ${discPct})^0 = 1`]);

  let npvRunning = -data.investment;
  data.yearlyData.forEach((yr, i) => {
    const preTax = yr.income - yr.expenses;
    const taxableIncome = preTax - annualDep;
    const tax = taxableIncome > 0 ? taxableIncome * data.taxRate : 0;
    const net = preTax - tax;
    const isLast = i === nYears - 1;
    const residualAdd = (isLast && hasDep) ? data.depreciation!.residualValue : 0;
    const finalNet = net + residualAdd;
    const df = 1 / Math.pow(1 + data.discountRate, i + 1);
    const pv = finalNet * df;
    npvRunning += pv;
    npvBody.push([
      `${i + 1}`,
      formatCurrency(finalNet, c),
      df.toFixed(4),
      formatCurrency(pv, c),
      `1 / (1 + ${discPct})^${i + 1} = ${df.toFixed(4)}`,
    ]);
  });

  // Totals row
  npvBody.push([
    "Σ", "", "", formatCurrency(npvRunning, c),
    `NPV = ${formatCurrency(npvRunning, c)}`,
  ]);

  autoTable(doc, {
    startY: y,
    head: [[l("year", lang), l("netCashFlow", lang), l("discountFactor", lang), l("presentValue", lang), l("depFormula", lang)]],
    body: npvBody,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right", fontStyle: "bold" },
      4: { fontSize: 7, textColor: [100, 116, 139] },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;
  if (y > 270) { doc.addPage(); y = 20; }

  // ── Charts Page ──
  doc.addPage();
  y = 20;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(l("chartSection", lang), margin, y);
  y += 10;

  // Chart 1: Net Cash Flow bars
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(l("chartCF", lang), margin, y);
  y += 4;
  y = drawCashFlowBarChart(doc, data.cashFlows, c, y, margin, pageW, {
    year: l("year", lang),
    initial: l("initial", lang),
  });

  y += 4;

  // Chart 2: Cumulative cash flow with payback marker
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(l("chartCum", lang), margin, y);
  y += 4;
  y = drawCumulativeChart(doc, data.cashFlows, c, y, margin, pageW, data.paybackPeriod, {
    year: l("year", lang),
    initial: l("initial", lang),
    payback: l("payback", lang),
  });

  y += 4;

  // Chart 3: Income vs Expenses
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(l("chartIncExp", lang), margin, y);
  y += 4;
  y = drawIncomeExpensesChart(doc, data.yearlyData, c, y, margin, pageW, {
    income: l("income", lang),
    expenses: l("expenses", lang),
  });

  y += 8;

  // ── Conclusion ──
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(data.npv >= 0 ? 16 : 220, data.npv >= 0 ? 185 : 38, data.npv >= 0 ? 129 : 38);
  doc.text(
    `${data.npv >= 0 ? l("conclusionPos", lang) : l("conclusionNeg", lang)} (${formatCurrency(data.npv, c)})`,
    margin, y, { maxWidth: pageW - margin * 2 }
  );

  // ── Footer on every page ──
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(l("footer", lang), margin, doc.internal.pageSize.getHeight() - 10);
    doc.text(`${l("page", lang)} ${p} ${l("of", lang)} ${pageCount}`, pageW - margin, doc.internal.pageSize.getHeight() - 10, { align: "right" });
  }

  doc.save(`${data.projectName || "investment-analysis"}.pdf`);
}
