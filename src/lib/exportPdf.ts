import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatPercent, type Currency, type DepreciationConfig, CURRENCY_CONFIG } from "./finance";
import type { Language } from "./i18n";
import type { ReportSettings } from "@/components/ReportSettingsPanel";

function pdfCurrency(value: number, currency: Currency): string {
  const cfg = CURRENCY_CONFIG[currency];
  const num = new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
  const safeSymbol = /^[A-Za-z0-9$. /]+$/.test(cfg.symbol) ? cfg.symbol : currency;
  return `${safeSymbol} ${sanitize(num)}`;
}

function sanitize(text: string): string {
  return text
    .replace(/\u2212/g, "-")
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "-")
    .replace(/\u00A0/g, " ")
    .replace(/\u202F/g, " ")
    .replace(/\u2009/g, " ")
    .replace(/\u00D7/g, "x")
    .replace(/\u2264/g, "<=")
    .replace(/\u2265/g, ">=")
    .replace(/\u03A3/g, "Total")
    .replace(/[^\x00-\xFF]/g, "");
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
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
  reinvestments?: number[];
}

const labels: Record<string, Record<Language, string>> = {
  reportTitle:    { en: "Investment Analysis",     es: "Analisis de inversion",       pt: "Analise de investimento" },
  generatedReport:{ en: "Generated report",        es: "Reporte generado",            pt: "Relatorio gerado" },
  reportDate:     { en: "Report date",             es: "Fecha del reporte",           pt: "Data do relatorio" },
  currency:       { en: "Currency",                es: "Moneda",                      pt: "Moeda" },
  keyMetrics:     { en: "Key Metrics",             es: "Metricas clave",              pt: "Metricas chave" },
  metric:         { en: "Metric",                  es: "Metrica",                     pt: "Metrica" },
  value:          { en: "Value",                   es: "Valor",                       pt: "Valor" },
  npv:            { en: "Net Present Value (NPV)", es: "Valor Actual Neto (VAN)",     pt: "Valor Presente Liquido (VPL)" },
  irr:            { en: "Internal Rate of Return (IRR)", es: "Tasa Interna de Retorno (TIR)", pt: "Taxa Interna de Retorno (TIR)" },
  roi:            { en: "Return on Investment (ROI)", es: "Retorno sobre inversion (ROI)", pt: "Retorno sobre investimento (ROI)" },
  totalReturn:    { en: "Total Net Return",        es: "Retorno neto total",          pt: "Retorno liquido total" },
  payback:        { en: "Payback Period",          es: "Periodo de recuperacion",     pt: "Periodo de retorno" },
  totalTax:       { en: "Total Tax Paid",          es: "Impuestos totales",           pt: "Impostos totais" },
  initialInv:     { en: "Initial Investment",      es: "Inversion inicial",           pt: "Investimento inicial" },
  discountRate:   { en: "Discount Rate",           es: "Tasa de descuento",           pt: "Taxa de desconto" },
  taxRate:        { en: "Tax Rate",                es: "Tasa impositiva",             pt: "Taxa de impostos" },
  years:          { en: "years",                   es: "anos",                        pt: "anos" },
  never:          { en: "Never",                   es: "Nunca",                       pt: "Nunca" },
  yearlyCF:       { en: "Yearly Cash Flow Breakdown", es: "Desglose anual de flujos de caja", pt: "Detalhamento anual de fluxos de caixa" },
  year:           { en: "Year",                    es: "Ano",                         pt: "Ano" },
  income:         { en: "Income",                  es: "Ingresos",                    pt: "Receita" },
  expenses:       { en: "Expenses",                es: "Gastos",                      pt: "Despesas" },
  preTax:         { en: "Pre-Tax Profit",          es: "Ganancia antes imp.",         pt: "Lucro pre-imp." },
  tax:            { en: "Tax",                     es: "Impuesto",                    pt: "Imposto" },
  netCF:          { en: "Net Cash Flow",           es: "Flujo neto",                  pt: "Fluxo liquido" },
  cumulative:     { en: "Cumulative",              es: "Acumulado",                   pt: "Acumulado" },
  initial:        { en: "Initial",                 es: "Inicial",                     pt: "Inicial" },
  npvBreakdown:   { en: "NPV Breakdown",           es: "Desglose VAN",                pt: "Detalhamento VPL" },
  netCashFlow:    { en: "Net Cash Flow",           es: "Flujo neto",                  pt: "Fluxo liquido" },
  discountFactor: { en: "Discount Factor",         es: "Factor de descuento",         pt: "Fator de desconto" },
  presentValue:   { en: "Present Value",           es: "Valor presente",              pt: "Valor presente" },
  conclusionPos:  { en: "Conclusion: Positive NPV - the investment creates value.", es: "Conclusion: VAN positivo - la inversion crea valor.", pt: "Conclusao: VPL positivo - o investimento cria valor." },
  conclusionNeg:  { en: "Conclusion: Negative NPV - the investment may destroy value.", es: "Conclusion: VAN negativo - la inversion puede destruir valor.", pt: "Conclusao: VPL negativo - o investimento pode destruir valor." },
  footer:         { en: "Project Evaluator Report", es: "Reporte de Project Evaluator", pt: "Relatorio de Project Evaluator" },
  page:           { en: "Page",                    es: "Pagina",                      pt: "Pagina" },
  of:             { en: "of",                      es: "de",                          pt: "de" },
  parameters:     { en: "Analysis Parameters",     es: "Parametros del analisis",     pt: "Parametros da analise" },
  depAsset:       { en: "Asset",                   es: "Activo",                      pt: "Ativo" },
  depValue:       { en: "Depreciable Value",       es: "Valor depreciable",           pt: "Valor depreciavel" },
  depResidual:    { en: "Residual Value",          es: "Valor residual",              pt: "Valor residual" },
  depAnnual:      { en: "Annual Depreciation",     es: "Depreciacion anual",          pt: "Depreciacao anual" },
  depMethod:      { en: "Method: Straight-line",   es: "Metodo: Linea recta",         pt: "Metodo: Linha reta" },
  depTaxShield:   { en: "Tax Shield per Year",     es: "Escudo fiscal por ano",       pt: "Escudo fiscal por ano" },
  noDepreciation: { en: "Depreciation not considered", es: "Depreciacion no considerada", pt: "Depreciacao nao considerada" },
  taxableIncome:  { en: "Taxable Income",          es: "Ingreso imponible",           pt: "Renda tributavel" },
  depreciation:   { en: "Depreciation",            es: "Depreciacion",                pt: "Depreciacao" },
  reinvestment:   { en: "Reinvestment",            es: "Reinversion",                 pt: "Reinvestimento" },
  totalReinvest:  { en: "Total Reinvestment",      es: "Reinversion total",           pt: "Reinvestimento total" },
  noReinvest:     { en: "No reinvestment",         es: "Sin reinversion",             pt: "Sem reinvestimento" },
};

function l(key: string, lang: Language): string {
  return labels[key]?.[lang] ?? labels[key]?.en ?? key;
}

// ─── Template renderers ───

interface TemplateConfig {
  primaryRgb: [number, number, number];
  secondaryRgb: [number, number, number];
  accentRgb: [number, number, number];
  font: string;
  headerTitle: string;
  headerSubtitle: string;
  logoUrl: string | null;
  logoImg: HTMLImageElement | null;
}

function renderHeader_professional(doc: jsPDF, cfg: TemplateConfig, _data: ExportData, lang: Language) {
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;

  doc.setFillColor(...cfg.primaryRgb);
  doc.rect(0, 0, pageW, 45, "F");
  doc.setFillColor(...cfg.secondaryRgb);
  doc.rect(0, 42, pageW, 3, "F");

  let textX = margin;
  if (cfg.logoImg) {
    const logoH = 20;
    const logoW = (cfg.logoImg.naturalWidth / cfg.logoImg.naturalHeight) * logoH;
    doc.addImage(cfg.logoImg, "PNG", margin, 12, Math.min(logoW, 40), logoH);
    textX = margin + Math.min(logoW, 40) + 6;
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont(cfg.font, "bold");
  doc.text(cfg.headerTitle, textX, 22, { maxWidth: pageW - textX - margin });
  doc.setFontSize(10);
  doc.setFont(cfg.font, "normal");
  doc.text(cfg.headerSubtitle, textX, 33, { maxWidth: pageW - textX - margin });

  doc.setFontSize(9);
  doc.setTextColor(...cfg.accentRgb);
  doc.text(`${l("reportDate", lang)}: ${new Date().toLocaleDateString()}`, pageW - margin, 22, { align: "right" });
  doc.text(`${l("currency", lang)}: ${_data.currency}`, pageW - margin, 30, { align: "right" });

  return 52;
}

function renderHeader_modern(doc: jsPDF, cfg: TemplateConfig, _data: ExportData, lang: Language) {
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;

  // Gradient-like effect with two rectangles
  doc.setFillColor(...cfg.secondaryRgb);
  doc.rect(0, 0, pageW, 50, "F");
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin - 5, 5, pageW - 2 * margin + 10, 40, 4, 4, "F");

  let textX = margin + 5;
  if (cfg.logoImg) {
    const logoH = 18;
    const logoW = (cfg.logoImg.naturalWidth / cfg.logoImg.naturalHeight) * logoH;
    doc.addImage(cfg.logoImg, "PNG", margin + 5, 13, Math.min(logoW, 35), logoH);
    textX = margin + Math.min(logoW, 35) + 12;
  }

  doc.setTextColor(...cfg.primaryRgb);
  doc.setFontSize(20);
  doc.setFont(cfg.font, "bold");
  doc.text(cfg.headerTitle, textX, 22, { maxWidth: pageW - textX - margin - 50 });
  doc.setFontSize(9);
  doc.setFont(cfg.font, "normal");
  doc.setTextColor(...cfg.accentRgb);
  doc.text(cfg.headerSubtitle, textX, 32, { maxWidth: pageW - textX - margin - 50 });

  doc.setFontSize(8);
  doc.text(`${new Date().toLocaleDateString()} | ${_data.currency}`, pageW - margin, 25, { align: "right" });

  return 58;
}

function renderHeader_minimal(doc: jsPDF, cfg: TemplateConfig, _data: ExportData, lang: Language) {
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;

  let textX = margin;
  if (cfg.logoImg) {
    const logoH = 16;
    const logoW = (cfg.logoImg.naturalWidth / cfg.logoImg.naturalHeight) * logoH;
    doc.addImage(cfg.logoImg, "PNG", margin, 15, Math.min(logoW, 35), logoH);
    textX = margin + Math.min(logoW, 35) + 6;
  }

  doc.setTextColor(...cfg.primaryRgb);
  doc.setFontSize(18);
  doc.setFont(cfg.font, "bold");
  doc.text(cfg.headerTitle, textX, 22);

  doc.setFontSize(9);
  doc.setFont(cfg.font, "normal");
  doc.setTextColor(...cfg.accentRgb);
  doc.text(cfg.headerSubtitle, textX, 30);

  doc.setDrawColor(...cfg.accentRgb);
  doc.setLineWidth(0.5);
  doc.line(margin, 36, pageW - margin, 36);

  doc.setFontSize(8);
  doc.text(`${new Date().toLocaleDateString()} | ${_data.currency}`, pageW - margin, 22, { align: "right" });

  return 44;
}

function renderHeader_corporate(doc: jsPDF, cfg: TemplateConfig, _data: ExportData, lang: Language) {
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;

  doc.setFillColor(...cfg.primaryRgb);
  doc.rect(0, 0, 8, doc.internal.pageSize.getHeight(), "F");
  doc.setFillColor(...cfg.secondaryRgb);
  doc.rect(0, 0, pageW, 6, "F");

  let textX = 16 + margin;
  if (cfg.logoImg) {
    const logoH = 18;
    const logoW = (cfg.logoImg.naturalWidth / cfg.logoImg.naturalHeight) * logoH;
    doc.addImage(cfg.logoImg, "PNG", 16 + margin, 14, Math.min(logoW, 40), logoH);
    textX = 16 + margin + Math.min(logoW, 40) + 6;
  }

  doc.setTextColor(...cfg.primaryRgb);
  doc.setFontSize(20);
  doc.setFont(cfg.font, "bold");
  doc.text(cfg.headerTitle, textX, 22);
  doc.setFontSize(9);
  doc.setFont(cfg.font, "normal");
  doc.setTextColor(...cfg.accentRgb);
  doc.text(cfg.headerSubtitle, textX, 32);

  doc.setFontSize(8);
  doc.text(`${l("reportDate", lang)}: ${new Date().toLocaleDateString()}`, pageW - margin, 18, { align: "right" });
  doc.text(`${l("currency", lang)}: ${_data.currency}`, pageW - margin, 26, { align: "right" });

  return 46;
}

const headerRenderers: Record<string, typeof renderHeader_professional> = {
  professional: renderHeader_professional,
  modern: renderHeader_modern,
  minimal: renderHeader_minimal,
  corporate: renderHeader_corporate,
};

async function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function exportToPdf(data: ExportData, lang: Language = "en", reportSettings?: ReportSettings) {
  const rs = reportSettings || {
    template_id: "professional",
    header_title: "",
    header_subtitle: "",
    primary_color: "#0f172a",
    secondary_color: "#10b981",
    accent_color: "#94a3b8",
    font_family: "helvetica",
    logo_url: null,
  };

  const cfg: TemplateConfig = {
    primaryRgb: hexToRgb(rs.primary_color),
    secondaryRgb: hexToRgb(rs.secondary_color),
    accentRgb: hexToRgb(rs.accent_color),
    font: rs.font_family,
    headerTitle: rs.header_title || data.projectName || l("reportTitle", lang),
    headerSubtitle: rs.header_subtitle || data.projectDescription || l("generatedReport", lang),
    logoUrl: rs.logo_url,
    logoImg: rs.logo_url ? await loadImage(rs.logo_url) : null,
  };

  const doc = new jsPDF();
  const c = data.currency;
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  const taxPct = `${(data.taxRate * 100).toFixed(0).replace('.', ',')}%`;
  const discPct = `${(data.discountRate * 100).toFixed(1).replace('.', ',')}%`;
  const nYears = data.yearlyData.length;
  const hasDep = data.depreciation?.enabled ?? false;
  const annualDep = hasDep
    ? (data.depreciation!.depreciableValue - data.depreciation!.residualValue) / nYears
    : 0;
  const taxShieldPerYear = annualDep * data.taxRate;
  const reinvestments = data.reinvestments ?? Array(nYears).fill(0);
  const hasReinvest = reinvestments.some(r => r > 0);
  const totalReinvest = reinvestments.reduce((s, r) => s + r, 0);

  // ── Render header based on template ──
  const renderHeader = headerRenderers[rs.template_id] || renderHeader_professional;
  let y = renderHeader(doc, cfg, data, lang);

  // ── Conclusion ──
  const conclusionColor: [number, number, number] = data.npv >= 0 ? cfg.secondaryRgb : [220, 38, 38];
  doc.setFillColor(...conclusionColor);
  doc.roundedRect(margin, y, pageW - 2 * margin, 12, 2, 2, "F");
  doc.setFontSize(10);
  doc.setFont(cfg.font, "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(
    `${data.npv >= 0 ? l("conclusionPos", lang) : l("conclusionNeg", lang)} (${pdfCurrency(data.npv, c)})`,
    margin + 4, y + 8, { maxWidth: pageW - 2 * margin - 8 }
  );
  y += 18;

  // ── Analysis Parameters ──
  doc.setTextColor(...cfg.primaryRgb);
  doc.setFontSize(14);
  doc.setFont(cfg.font, "bold");
  doc.text(l("parameters", lang), margin, y);
  y += 4;

  const paramRows: string[][] = [
    [l("initialInv", lang), pdfCurrency(data.investment, c)],
    [l("discountRate", lang), discPct],
    [l("taxRate", lang), taxPct],
    [`${l("year", lang)}s`, `${nYears}`],
  ];

  if (hasDep) {
    paramRows.push(
      [l("depAsset", lang), data.depreciation!.assetName || "-"],
      [l("depValue", lang), pdfCurrency(data.depreciation!.depreciableValue, c)],
      [l("depResidual", lang), pdfCurrency(data.depreciation!.residualValue, c)],
      [l("depAnnual", lang), `${pdfCurrency(annualDep, c)} (${l("depMethod", lang)})`],
      [l("depTaxShield", lang), `${pdfCurrency(taxShieldPerYear, c)} (${pdfCurrency(annualDep, c)} x ${taxPct})`],
    );
  } else {
    paramRows.push([l("depreciation", lang), l("noDepreciation", lang)]);
  }

  if (hasReinvest) {
    paramRows.push([l("totalReinvest", lang), pdfCurrency(totalReinvest, c)]);
    reinvestments.forEach((r, i) => {
      if (r > 0) paramRows.push([`  ${l("reinvestment", lang)} ${l("year", lang)} ${i + 1}`, pdfCurrency(r, c)]);
    });
  } else {
    paramRows.push([l("reinvestment", lang), l("noReinvest", lang)]);
  }

  autoTable(doc, {
    startY: y,
    body: paramRows,
    margin: { left: margin, right: margin },
    theme: "plain",
    bodyStyles: { fontSize: 9, cellPadding: 2, font: cfg.font },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 }, 1: { halign: "right" } },
    alternateRowStyles: { fillColor: [241, 245, 249] },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // ── Key Metrics ──
  doc.setTextColor(...cfg.primaryRgb);
  doc.setFontSize(14);
  doc.setFont(cfg.font, "bold");
  doc.text(l("keyMetrics", lang), margin, y);
  y += 4;

  const metrics: string[][] = [
    [l("npv", lang), pdfCurrency(data.npv, c)],
    [l("irr", lang), data.irr !== null ? formatPercent(data.irr) : "N/A"],
    [l("roi", lang), formatPercent(data.roi)],
    [l("totalReturn", lang), pdfCurrency(data.totalReturn, c)],
    [l("payback", lang), data.paybackPeriod !== null ? `${data.paybackPeriod.toFixed(1).replace('.', ',')} ${l("years", lang)}` : l("never", lang)],
    [l("totalTax", lang), pdfCurrency(data.totalTax, c)],
  ];

  autoTable(doc, {
    startY: y,
    head: [[l("metric", lang), l("value", lang)]],
    body: metrics,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: { fillColor: cfg.secondaryRgb, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9, font: cfg.font },
    bodyStyles: { fontSize: 9, font: cfg.font },
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
  doc.setFont(cfg.font, "bold");
  doc.setTextColor(...cfg.primaryRgb);
  doc.text(l("yearlyCF", lang), margin, y);
  y += 4;

  const showReinvCol = hasReinvest;
  let cumulative = -data.investment;
  const cfBody: string[][] = [];

  if (hasDep && showReinvCol) {
    cfBody.push([`0 (${l("initial", lang)})`, "-", "-", "-", "-", "-", "-", "-", pdfCurrency(-data.investment, c), pdfCurrency(cumulative, c)]);
  } else if (hasDep) {
    cfBody.push([`0 (${l("initial", lang)})`, "-", "-", "-", "-", "-", "-", pdfCurrency(-data.investment, c), pdfCurrency(cumulative, c)]);
  } else if (showReinvCol) {
    cfBody.push([`0 (${l("initial", lang)})`, "-", "-", "-", "-", "-", pdfCurrency(-data.investment, c), pdfCurrency(cumulative, c)]);
  } else {
    cfBody.push([`0 (${l("initial", lang)})`, "-", "-", "-", "-", pdfCurrency(-data.investment, c), pdfCurrency(cumulative, c)]);
  }

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

    const row: string[] = [`${l("year", lang)} ${i + 1}`, pdfCurrency(yr.income, c), pdfCurrency(yr.expenses, c), pdfCurrency(preTax, c)];
    if (hasDep) row.push(pdfCurrency(annualDep, c), pdfCurrency(taxableIncome, c));
    row.push(`${pdfCurrency(tax, c)} (${taxPct})`);
    if (showReinvCol) row.push(reinv > 0 ? pdfCurrency(reinv, c) : "-");
    row.push(pdfCurrency(finalNet, c) + (residualAdd > 0 ? ` +res.` : ""));
    row.push(pdfCurrency(cumulative, c));
    cfBody.push(row);
  });

  const cfHead: string[] = [l("year", lang), l("income", lang), l("expenses", lang), l("preTax", lang)];
  if (hasDep) cfHead.push(l("depreciation", lang), l("taxableIncome", lang));
  cfHead.push(`${l("tax", lang)} (${taxPct})`);
  if (showReinvCol) cfHead.push(l("reinvestment", lang));
  cfHead.push(l("netCF", lang), l("cumulative", lang));

  autoTable(doc, {
    startY: y,
    head: [cfHead],
    body: cfBody,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: { fillColor: cfg.primaryRgb, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7, font: cfg.font },
    bodyStyles: { fontSize: 7, font: cfg.font },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: Object.fromEntries(
      Array.from({ length: cfHead.length }, (_, i) => [i, i > 0 ? { halign: "right" as const } : {}])
    ),
  });

  y = (doc as any).lastAutoTable.finalY + 14;

  // ── NPV Breakdown ──
  if (y > 220) { doc.addPage(); y = 20; }

  doc.setFontSize(14);
  doc.setFont(cfg.font, "bold");
  doc.setTextColor(...cfg.primaryRgb);
  doc.text(l("npvBreakdown", lang), margin, y);
  y += 4;

  const npvBody: string[][] = [];
  npvBody.push(["0", pdfCurrency(-data.investment, c), "1.0000", pdfCurrency(-data.investment, c)]);

  let npvRunning = -data.investment;
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
    const pv = finalNet * df;
    npvRunning += pv;
    npvBody.push([`${i + 1}`, pdfCurrency(finalNet, c), df.toFixed(4).replace('.', ','), pdfCurrency(pv, c)]);
  });

  npvBody.push(["Total", "", "", pdfCurrency(npvRunning, c)]);

  autoTable(doc, {
    startY: y,
    head: [[l("year", lang), l("netCashFlow", lang), l("discountFactor", lang), l("presentValue", lang)]],
    body: npvBody,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: { fillColor: cfg.secondaryRgb, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9, font: cfg.font },
    bodyStyles: { fontSize: 9, font: cfg.font },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right", fontStyle: "bold" },
    },
  });

  // ── Footer ──
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(...cfg.accentRgb);
    doc.text(cfg.headerTitle || l("footer", lang), margin, doc.internal.pageSize.getHeight() - 10);
    doc.text(`${l("page", lang)} ${p} ${l("of", lang)} ${pageCount}`, pageW - margin, doc.internal.pageSize.getHeight() - 10, { align: "right" });
  }

  doc.save(`${data.projectName || "investment-analysis"}.pdf`);
}
