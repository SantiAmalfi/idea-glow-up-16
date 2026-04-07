import * as XLSX from "xlsx";
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
  reportTitle:  { en: "Investment Analysis Report", es: "Reporte de Análisis de Inversión", pt: "Relatório de Análise de Investimento" },
  project:      { en: "Project",         es: "Proyecto",           pt: "Projeto" },
  description:  { en: "Description",     es: "Descripción",        pt: "Descrição" },
  currency:     { en: "Currency",         es: "Moneda",             pt: "Moeda" },
  date:         { en: "Date",             es: "Fecha",              pt: "Data" },
  keyMetrics:   { en: "Key Metrics",      es: "Métricas clave",     pt: "Métricas chave" },
  npv:          { en: "Net Present Value (NPV)", es: "Valor Actual Neto (VAN)", pt: "Valor Presente Líquido (VPL)" },
  irr:          { en: "Internal Rate of Return (IRR)", es: "Tasa Interna de Retorno (TIR)", pt: "Taxa Interna de Retorno (TIR)" },
  roi:          { en: "Return on Investment (ROI)", es: "Retorno sobre inversión (ROI)", pt: "Retorno sobre investimento (ROI)" },
  totalReturn:  { en: "Total Net Return", es: "Retorno neto total",  pt: "Retorno líquido total" },
  payback:      { en: "Payback Period",   es: "Período de recuperación", pt: "Período de retorno" },
  totalTax:     { en: "Total Tax Paid",   es: "Impuestos totales",  pt: "Impostos totais" },
  initialInv:   { en: "Initial Investment", es: "Inversión inicial", pt: "Investimento inicial" },
  discountRate: { en: "Discount Rate",    es: "Tasa de descuento",  pt: "Taxa de desconto" },
  taxRate:      { en: "Tax Rate",         es: "Tasa impositiva",    pt: "Taxa de impostos" },
  years:        { en: "years",            es: "años",               pt: "anos" },
  never:        { en: "Never",            es: "Nunca",              pt: "Nunca" },
  year:         { en: "Year",             es: "Año",                pt: "Ano" },
  income:       { en: "Income",           es: "Ingresos",           pt: "Receita" },
  expenses:     { en: "Expenses",         es: "Gastos",             pt: "Despesas" },
  preTax:       { en: "Pre-Tax Profit",   es: "Ganancia antes imp.", pt: "Lucro pré-imp." },
  tax:          { en: "Tax",              es: "Impuesto",           pt: "Imposto" },
  netCF:        { en: "Net Cash Flow",    es: "Flujo neto",         pt: "Fluxo líquido" },
  cumulative:   { en: "Cumulative",       es: "Acumulado",          pt: "Acumulado" },
  cashFlows:    { en: "Cash Flows",       es: "Flujos de caja",     pt: "Fluxos de caixa" },
  summary:      { en: "Summary",          es: "Resumen",            pt: "Resumo" },
  npvBreakdown: { en: "NPV Breakdown",    es: "Desglose VAN",       pt: "Detalhamento VPL" },
  discountFactor:{ en: "Discount Factor", es: "Factor de descuento", pt: "Fator de desconto" },
  presentValue: { en: "Present Value",    es: "Valor presente",     pt: "Valor presente" },
};

function l(key: string, lang: Language): string {
  return labels[key]?.[lang] ?? labels[key]?.en ?? key;
}

export function exportToExcel(data: ExportData, lang: Language = "en") {
  const wb = XLSX.utils.book_new();
  const c = data.currency;

  // Sheet 1: Summary
  const summary = [
    [l("reportTitle", lang)],
    [l("project", lang), data.projectName || "—"],
    [l("description", lang), data.projectDescription || ""],
    [l("currency", lang), c],
    [l("date", lang), new Date().toLocaleDateString()],
    [],
    [l("keyMetrics", lang)],
    [l("npv", lang), data.npv],
    [l("irr", lang), data.irr !== null ? data.irr : "N/A"],
    [l("roi", lang), data.roi],
    [l("totalReturn", lang), data.totalReturn],
    [l("payback", lang), data.paybackPeriod !== null ? `${data.paybackPeriod.toFixed(1)} ${l("years", lang)}` : l("never", lang)],
    [l("totalTax", lang), data.totalTax],
    [l("initialInv", lang), data.investment],
    [l("discountRate", lang), data.discountRate],
    [l("taxRate", lang), data.taxRate],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(summary);
  ws1["!cols"] = [{ wch: 35 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, ws1, l("summary", lang));

  // Sheet 2: Cash Flows
  const cfHeader = [l("year", lang), l("income", lang), l("expenses", lang), l("preTax", lang), l("tax", lang), l("netCF", lang), l("cumulative", lang)];
  const cfRows: (string | number)[][] = [cfHeader];

  let cumulative = -data.investment;
  cfRows.push([0, 0, 0, 0, 0, -data.investment, cumulative]);

  data.yearlyData.forEach((yr, i) => {
    const preTax = yr.income - yr.expenses;
    const tax = preTax > 0 ? preTax * data.taxRate : 0;
    const net = preTax - tax;
    cumulative += net;
    cfRows.push([i + 1, yr.income, yr.expenses, preTax, tax, net, cumulative]);
  });

  const ws2 = XLSX.utils.aoa_to_sheet(cfRows);
  ws2["!cols"] = Array(7).fill({ wch: 18 });
  XLSX.utils.book_append_sheet(wb, ws2, l("cashFlows", lang));

  // Sheet 3: NPV Breakdown
  const npvHeader = [l("year", lang), l("netCF", lang), l("discountFactor", lang), l("presentValue", lang)];
  const npvRows: (string | number)[][] = [npvHeader];
  npvRows.push([0, -data.investment, 1, -data.investment]);

  data.yearlyData.forEach((yr, i) => {
    const preTax = yr.income - yr.expenses;
    const tax = preTax > 0 ? preTax * data.taxRate : 0;
    const net = preTax - tax;
    const df = 1 / Math.pow(1 + data.discountRate, i + 1);
    npvRows.push([i + 1, net, Number(df.toFixed(6)), Number((net * df).toFixed(2))]);
  });

  const ws3 = XLSX.utils.aoa_to_sheet(npvRows);
  ws3["!cols"] = Array(4).fill({ wch: 20 });
  XLSX.utils.book_append_sheet(wb, ws3, l("npvBreakdown", lang));

  XLSX.writeFile(wb, `${data.projectName || "investment-analysis"}.xlsx`);
}
