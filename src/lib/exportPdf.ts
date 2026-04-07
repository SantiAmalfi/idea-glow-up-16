import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatPercent, type Currency, type DepreciationConfig, CURRENCY_CONFIG } from "./finance";
import type { Language } from "./i18n";

/**
 * PDF-safe currency formatter that avoids Unicode symbols
 * jsPDF's built-in Helvetica cannot render £, €, ₲, etc.
 */
function pdfCurrency(value: number, currency: Currency): string {
  const cfg = CURRENCY_CONFIG[currency];
  const num = new Intl.NumberFormat(cfg.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
  // Use ASCII-safe prefix: currency code for non-ASCII symbols
  const safeSymbol = /^[A-Za-z0-9$. /]+$/.test(cfg.symbol) ? cfg.symbol : currency;
  return `${safeSymbol} ${sanitize(num)}`;
}

/**
 * Replace Unicode chars that Helvetica can't render with ASCII equivalents
 */
function sanitize(text: string): string {
  return text
    .replace(/\u2212/g, "-")      // Unicode minus → ASCII minus
    .replace(/\u2013/g, "-")      // en-dash
    .replace(/\u2014/g, "-")      // em-dash
    .replace(/\u00A0/g, " ")      // non-breaking space
    .replace(/\u202F/g, " ")      // narrow no-break space
    .replace(/\u2009/g, " ")      // thin space
    .replace(/\u00D7/g, "x")      // multiplication sign
    .replace(/\u2264/g, "<=")     // ≤
    .replace(/\u2265/g, ">=")     // ≥
    .replace(/\u03A3/g, "Total")  // Σ → Total
    .replace(/[^\x00-\x7F]/g, ""); // strip any remaining non-ASCII
}

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
  parameters:     { en: "Analysis Parameters",     es: "Parámetros del análisis",     pt: "Parâmetros da análise" },
  depAsset:       { en: "Asset",                   es: "Activo",                      pt: "Ativo" },
  depValue:       { en: "Depreciable Value",       es: "Valor depreciable",           pt: "Valor depreciável" },
  depResidual:    { en: "Residual Value",          es: "Valor residual",              pt: "Valor residual" },
  depAnnual:      { en: "Annual Depreciation",     es: "Depreciación anual",          pt: "Depreciação anual" },
  depMethod:      { en: "Method: Straight-line",   es: "Método: Línea recta",         pt: "Método: Linha reta" },
  depTaxShield:   { en: "Tax Shield per Year",     es: "Escudo fiscal por año",       pt: "Escudo fiscal por ano" },
  noDepreciation: { en: "Depreciation not considered", es: "Depreciación no considerada", pt: "Depreciação não considerada" },
  taxableIncome:  { en: "Taxable Income",          es: "Ingreso imponible",           pt: "Renda tributável" },
  depreciation:   { en: "Depreciation",            es: "Depreciación",                pt: "Depreciação" },
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

  let y = 52;

  // ── Conclusion (at the top) ──
  const conclusionColor: [number, number, number] = data.npv >= 0 ? [16, 185, 129] : [220, 38, 38];
  doc.setFillColor(...conclusionColor);
  doc.roundedRect(margin, y, pageW - 2 * margin, 12, 2, 2, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(
    `${data.npv >= 0 ? l("conclusionPos", lang) : l("conclusionNeg", lang)} (${formatCurrency(data.npv, c)})`,
    margin + 4, y + 8, { maxWidth: pageW - 2 * margin - 8 }
  );
  y += 18;

  // ── Analysis Parameters ──
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(l("parameters", lang), margin, y);
  y += 4;

  const paramRows: string[][] = [
    [l("initialInv", lang), formatCurrency(data.investment, c)],
    [l("discountRate", lang), discPct],
    [l("taxRate", lang), taxPct],
    [`${l("year", lang)}s`, `${nYears}`],
  ];

  if (hasDep) {
    paramRows.push(
      [l("depAsset", lang), data.depreciation!.assetName || "—"],
      [l("depValue", lang), formatCurrency(data.depreciation!.depreciableValue, c)],
      [l("depResidual", lang), formatCurrency(data.depreciation!.residualValue, c)],
      [l("depAnnual", lang), `${formatCurrency(annualDep, c)} (${l("depMethod", lang)})`],
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

  // ── Key Metrics (no formula details) ──
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(l("keyMetrics", lang), margin, y);
  y += 4;

  const metrics: string[][] = [
    [l("npv", lang), formatCurrency(data.npv, c)],
    [l("irr", lang), data.irr !== null ? formatPercent(data.irr) : "N/A"],
    [l("roi", lang), formatPercent(data.roi)],
    [l("totalReturn", lang), formatCurrency(data.totalReturn, c)],
    [l("payback", lang), data.paybackPeriod !== null ? `${data.paybackPeriod.toFixed(1)} ${l("years", lang)}` : l("never", lang)],
    [l("totalTax", lang), formatCurrency(data.totalTax, c)],
  ];

  autoTable(doc, {
    startY: y,
    head: [[l("metric", lang), l("value", lang)]],
    body: metrics,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: "right", fontStyle: "bold" },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 14;

  // ── Cash Flow Table ──
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

  // ── NPV Breakdown (without formula column) ──
  if (y > 220) { doc.addPage(); y = 20; }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(l("npvBreakdown", lang), margin, y);
  y += 4;

  const npvBody: string[][] = [];
  npvBody.push(["0", formatCurrency(-data.investment, c), "1.0000", formatCurrency(-data.investment, c)]);

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
    ]);
  });

  npvBody.push(["Σ", "", "", formatCurrency(npvRunning, c)]);

  autoTable(doc, {
    startY: y,
    head: [[l("year", lang), l("netCashFlow", lang), l("discountFactor", lang), l("presentValue", lang)]],
    body: npvBody,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right", fontStyle: "bold" },
    },
  });

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
