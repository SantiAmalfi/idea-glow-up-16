import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatPercent, type Currency } from "./finance";
import type { Language } from "./i18n";

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
  preTax:         { en: "Pre-Tax",                 es: "Antes imp.",                  pt: "Pré-imp." },
  tax:            { en: "Tax",                     es: "Impuesto",                    pt: "Imposto" },
  netCF:          { en: "Net CF",                  es: "Flujo neto",                  pt: "Fluxo líq." },
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
};

function l(key: string, lang: Language): string {
  return labels[key]?.[lang] ?? labels[key]?.en ?? key;
}

export function exportToPdf(data: ExportData, lang: Language = "en") {
  const doc = new jsPDF();
  const c = data.currency;
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;

  // Header bar
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

  // Date
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`${l("reportDate", lang)}: ${new Date().toLocaleDateString()}`, pageW - margin, 22, { align: "right" });
  doc.text(`${l("currency", lang)}: ${c}`, pageW - margin, 30, { align: "right" });

  let y = 55;

  // Key metrics
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(l("keyMetrics", lang), margin, y);
  y += 4;

  const metrics = [
    [l("npv", lang), formatCurrency(data.npv, c)],
    [l("irr", lang), data.irr !== null ? formatPercent(data.irr) : "N/A"],
    [l("roi", lang), formatPercent(data.roi)],
    [l("totalReturn", lang), formatCurrency(data.totalReturn, c)],
    [l("payback", lang), data.paybackPeriod !== null ? `${data.paybackPeriod.toFixed(1)} ${l("years", lang)}` : l("never", lang)],
    [l("totalTax", lang), formatCurrency(data.totalTax, c)],
    [l("initialInv", lang), formatCurrency(data.investment, c)],
    [l("discountRate", lang), `${(data.discountRate * 100).toFixed(1)}%`],
    [l("taxRate", lang), `${(data.taxRate * 100).toFixed(0)}%`],
  ];

  autoTable(doc, {
    startY: y,
    head: [[l("metric", lang), l("value", lang)]],
    body: metrics,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 10 },
    bodyStyles: { fontSize: 10 },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
  });

  y = (doc as any).lastAutoTable.finalY + 14;

  // Cash flow table
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(l("yearlyCF", lang), margin, y);
  y += 4;

  let cumulative = -data.investment;
  const cfBody: string[][] = [];
  cfBody.push([`0 (${l("initial", lang)})`, "—", "—", "—", "—", formatCurrency(-data.investment, c), formatCurrency(cumulative, c)]);

  data.yearlyData.forEach((yr, i) => {
    const preTax = yr.income - yr.expenses;
    const tax = preTax > 0 ? preTax * data.taxRate : 0;
    const net = preTax - tax;
    cumulative += net;
    cfBody.push([
      `${l("year", lang)} ${i + 1}`,
      formatCurrency(yr.income, c),
      formatCurrency(yr.expenses, c),
      formatCurrency(preTax, c),
      formatCurrency(tax, c),
      formatCurrency(net, c),
      formatCurrency(cumulative, c),
    ]);
  });

  autoTable(doc, {
    startY: y,
    head: [[l("year", lang), l("income", lang), l("expenses", lang), l("preTax", lang), l("tax", lang), l("netCF", lang), l("cumulative", lang)]],
    body: cfBody,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" } },
  });

  y = (doc as any).lastAutoTable.finalY + 14;

  // NPV breakdown
  if (y > 240) { doc.addPage(); y = 20; }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(l("npvBreakdown", lang), margin, y);
  y += 4;

  const npvBody: string[][] = [];
  npvBody.push(["0", formatCurrency(-data.investment, c), "1.0000", formatCurrency(-data.investment, c)]);
  data.yearlyData.forEach((yr, i) => {
    const preTax = yr.income - yr.expenses;
    const tax = preTax > 0 ? preTax * data.taxRate : 0;
    const net = preTax - tax;
    const df = 1 / Math.pow(1 + data.discountRate, i + 1);
    const pv = net * df;
    npvBody.push([`${i + 1}`, formatCurrency(net, c), df.toFixed(4), formatCurrency(pv, c)]);
  });

  autoTable(doc, {
    startY: y,
    head: [[l("year", lang), l("netCashFlow", lang), l("discountFactor", lang), l("presentValue", lang)]],
    body: npvBody,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
  });

  y = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(data.npv >= 0 ? 16 : 220, data.npv >= 0 ? 185 : 38, data.npv >= 0 ? 129 : 38);
  doc.text(
    `${data.npv >= 0 ? l("conclusionPos", lang) : l("conclusionNeg", lang)} (${formatCurrency(data.npv, c)})`,
    margin, y, { maxWidth: pageW - margin * 2 }
  );

  // Footer on every page
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
