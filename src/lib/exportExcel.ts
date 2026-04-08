import * as XLSX from "xlsx";
import { formatPercent, type Currency, type DepreciationConfig } from "./finance";
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
  depreciation?: DepreciationConfig;
  reinvestments?: number[];
}

const labels: Record<string, Record<Language, string>> = {
  reportTitle:  { en: "Investment Analysis Report", es: "Reporte de Analisis de Inversion", pt: "Relatorio de Analise de Investimento" },
  project:      { en: "Project",         es: "Proyecto",           pt: "Projeto" },
  description:  { en: "Description",     es: "Descripcion",        pt: "Descricao" },
  currency:     { en: "Currency",         es: "Moneda",             pt: "Moeda" },
  date:         { en: "Date",             es: "Fecha",              pt: "Data" },
  keyMetrics:   { en: "Key Metrics",      es: "Metricas clave",     pt: "Metricas chave" },
  npv:          { en: "Net Present Value (NPV)", es: "Valor Actual Neto (VAN)", pt: "Valor Presente Liquido (VPL)" },
  irr:          { en: "Internal Rate of Return (IRR)", es: "Tasa Interna de Retorno (TIR)", pt: "Taxa Interna de Retorno (TIR)" },
  roi:          { en: "Return on Investment (ROI)", es: "Retorno sobre inversion (ROI)", pt: "Retorno sobre investimento (ROI)" },
  totalReturn:  { en: "Total Net Return", es: "Retorno neto total",  pt: "Retorno liquido total" },
  payback:      { en: "Payback Period",   es: "Periodo de recuperacion", pt: "Periodo de retorno" },
  totalTax:     { en: "Total Tax Paid",   es: "Impuestos totales",  pt: "Impostos totais" },
  initialInv:   { en: "Initial Investment", es: "Inversion inicial", pt: "Investimento inicial" },
  discountRate: { en: "Discount Rate",    es: "Tasa de descuento",  pt: "Taxa de desconto" },
  taxRate:      { en: "Tax Rate",         es: "Tasa impositiva",    pt: "Taxa de impostos" },
  years:        { en: "years",            es: "anos",               pt: "anos" },
  never:        { en: "Never",            es: "Nunca",              pt: "Nunca" },
  year:         { en: "Year",             es: "Ano",                pt: "Ano" },
  income:       { en: "Income",           es: "Ingresos",           pt: "Receita" },
  expenses:     { en: "Expenses",         es: "Gastos",             pt: "Despesas" },
  preTax:       { en: "Pre-Tax Profit",   es: "Ganancia antes imp.", pt: "Lucro pre-imp." },
  tax:          { en: "Tax",              es: "Impuesto",           pt: "Imposto" },
  netCF:        { en: "Net Cash Flow",    es: "Flujo neto",         pt: "Fluxo liquido" },
  cumulative:   { en: "Cumulative",       es: "Acumulado",          pt: "Acumulado" },
  cashFlows:    { en: "Cash Flows",       es: "Flujos de caja",     pt: "Fluxos de caixa" },
  summary:      { en: "Summary",          es: "Resumen",            pt: "Resumo" },
  npvBreakdown: { en: "NPV Breakdown",    es: "Desglose VAN",       pt: "Detalhamento VPL" },
  discountFactor:{ en: "Discount Factor", es: "Factor de descuento", pt: "Fator de desconto" },
  presentValue: { en: "Present Value",    es: "Valor presente",     pt: "Valor presente" },
  depreciation: { en: "Depreciation",     es: "Depreciacion",       pt: "Depreciacao" },
  taxableIncome:{ en: "Taxable Income",   es: "Ingreso imponible",  pt: "Renda tributavel" },
  depAsset:     { en: "Asset",            es: "Activo",             pt: "Ativo" },
  depValue:     { en: "Depreciable Value",es: "Valor depreciable",  pt: "Valor depreciavel" },
  depResidual:  { en: "Residual Value",   es: "Valor residual",     pt: "Valor residual" },
  depAnnual:    { en: "Annual Depreciation", es: "Depreciacion anual", pt: "Depreciacao anual" },
  reinvestment: { en: "Reinvestment",     es: "Reinversion",        pt: "Reinvestimento" },
  totalReinvest:{ en: "Total Reinvestment", es: "Reinversion total", pt: "Reinvestimento total" },
};

function l(key: string, lang: Language): string {
  return labels[key]?.[lang] ?? labels[key]?.en ?? key;
}

export function exportToExcel(data: ExportData, lang: Language = "en") {
  const wb = XLSX.utils.book_new();
  const c = data.currency;
  const nYears = data.yearlyData.length;
  const hasDep = data.depreciation?.enabled ?? false;
  const annualDep = hasDep
    ? (data.depreciation!.depreciableValue - data.depreciation!.residualValue) / nYears
    : 0;
  const reinvestments = data.reinvestments ?? Array(nYears).fill(0);
  const hasReinvest = reinvestments.some(r => r > 0);
  const totalReinvest = reinvestments.reduce((s, r) => s + r, 0);

  // Sheet 1: Summary
  const summary: (string | number)[][] = [
    [l("reportTitle", lang)],
    [l("project", lang), data.projectName || "-"],
    [l("description", lang), data.projectDescription || ""],
    [l("currency", lang), c],
    [l("date", lang), new Date().toLocaleDateString()],
    [],
    [l("keyMetrics", lang)],
    [l("npv", lang), data.npv],
    [l("irr", lang), data.irr !== null ? data.irr : "N/A"],
    [l("roi", lang), data.roi],
    [l("totalReturn", lang), data.totalReturn],
    [l("payback", lang), data.paybackPeriod !== null ? `${data.paybackPeriod.toFixed(1).replace('.', ',')} ${l("years", lang)}` : l("never", lang)],
    [l("totalTax", lang), data.totalTax],
    [l("initialInv", lang), data.investment],
    [l("discountRate", lang), data.discountRate],
    [l("taxRate", lang), data.taxRate],
  ];

  if (hasDep) {
    summary.push(
      [],
      [l("depreciation", lang)],
      [l("depAsset", lang), data.depreciation!.assetName || "-"],
      [l("depValue", lang), data.depreciation!.depreciableValue],
      [l("depResidual", lang), data.depreciation!.residualValue],
      [l("depAnnual", lang), Math.round(annualDep)],
    );
  }

  if (hasReinvest) {
    summary.push([], [l("totalReinvest", lang), totalReinvest]);
    reinvestments.forEach((r, i) => {
      if (r > 0) {
        summary.push([`  ${l("reinvestment", lang)} ${l("year", lang)} ${i + 1}`, r]);
      }
    });
  }

  const ws1 = XLSX.utils.aoa_to_sheet(summary);
  ws1["!cols"] = [{ wch: 35 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, ws1, l("summary", lang));

  // Sheet 2: Cash Flows
  const cfHeader: string[] = [l("year", lang), l("income", lang), l("expenses", lang), l("preTax", lang)];
  if (hasDep) cfHeader.push(l("depreciation", lang), l("taxableIncome", lang));
  cfHeader.push(l("tax", lang));
  if (hasReinvest) cfHeader.push(l("reinvestment", lang));
  cfHeader.push(l("netCF", lang), l("cumulative", lang));

  const cfRows: (string | number)[][] = [cfHeader];

  let cumulative = -data.investment;
  const initRow: (string | number)[] = [0];
  for (let i = 1; i < cfHeader.length - 2; i++) initRow.push(0);
  initRow.push(-data.investment, cumulative);
  cfRows.push(initRow);

  data.yearlyData.forEach((yr, i) => {
    const preTax = yr.income - yr.expenses;
    const taxableIncome = preTax - annualDep;
    const tax = taxableIncome > 0 ? taxableIncome * data.taxRate : 0;
    let net = preTax - tax;
    const reinv = reinvestments[i] || 0;
    net -= reinv;
    const isLast = i === nYears - 1;
    const residualAdd = (isLast && hasDep) ? data.depreciation!.residualValue : 0;
    const finalNet = net + residualAdd;
    cumulative += finalNet;

    const row: (string | number)[] = [i + 1, yr.income, yr.expenses, Math.round(preTax)];
    if (hasDep) row.push(Math.round(annualDep), Math.round(taxableIncome));
    row.push(Math.round(tax));
    if (hasReinvest) row.push(reinv);
    row.push(Math.round(finalNet), Math.round(cumulative));
    cfRows.push(row);
  });

  const ws2 = XLSX.utils.aoa_to_sheet(cfRows);
  ws2["!cols"] = Array(cfHeader.length).fill({ wch: 18 });
  XLSX.utils.book_append_sheet(wb, ws2, l("cashFlows", lang));

  // Sheet 3: NPV Breakdown
  const npvHeader = [l("year", lang), l("netCF", lang), l("discountFactor", lang), l("presentValue", lang)];
  const npvRows: (string | number)[][] = [npvHeader];
  npvRows.push([0, -data.investment, 1, -data.investment]);

  data.yearlyData.forEach((yr, i) => {
    const preTax = yr.income - yr.expenses;
    const taxableIncome = preTax - annualDep;
    const tax = taxableIncome > 0 ? taxableIncome * data.taxRate : 0;
    let net = preTax - tax;
    const reinv = reinvestments[i] || 0;
    net -= reinv;
    const isLast = i === nYears - 1;
    const residualAdd = (isLast && hasDep) ? data.depreciation!.residualValue : 0;
    const finalNet = net + residualAdd;
    const df = 1 / Math.pow(1 + data.discountRate, i + 1);
    npvRows.push([i + 1, Math.round(finalNet), Number(df.toFixed(6)), Number((finalNet * df).toFixed(2))]);
    // Note: Excel handles number formatting via cell format, raw numbers kept for calculations
  });

  const ws3 = XLSX.utils.aoa_to_sheet(npvRows);
  ws3["!cols"] = Array(4).fill({ wch: 20 });
  XLSX.utils.book_append_sheet(wb, ws3, l("npvBreakdown", lang));

  XLSX.writeFile(wb, `${data.projectName || "investment-analysis"}.xlsx`);
}
