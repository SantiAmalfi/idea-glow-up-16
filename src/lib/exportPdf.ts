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
  reportTitle:    { en: "Investment Analysis",     es: "An\u00e1lisis de inversi\u00f3n",       pt: "An\u00e1lise de investimento" },
  generatedReport:{ en: "Generated report",        es: "Reporte generado",            pt: "Relat\u00f3rio gerado" },
  reportDate:     { en: "Report date",             es: "Fecha del reporte",           pt: "Data do relat\u00f3rio" },
  currency:       { en: "Currency",                es: "Moneda",                      pt: "Moeda" },
  keyMetrics:     { en: "Key Metrics",             es: "M\u00e9tricas clave",              pt: "M\u00e9tricas chave" },
  metric:         { en: "Metric",                  es: "M\u00e9trica",                     pt: "M\u00e9trica" },
  value:          { en: "Value",                   es: "Valor",                       pt: "Valor" },
  npv:            { en: "Net Present Value (NPV)", es: "Valor Actual Neto (VAN)",     pt: "Valor Presente L\u00edquido (VPL)" },
  irr:            { en: "Internal Rate of Return (IRR)", es: "Tasa Interna de Retorno (TIR)", pt: "Taxa Interna de Retorno (TIR)" },
  roi:            { en: "Return on Investment (ROI)", es: "Retorno sobre inversi\u00f3n (ROI)", pt: "Retorno sobre investimento (ROI)" },
  totalReturn:    { en: "Total Net Return",        es: "Retorno neto total",          pt: "Retorno l\u00edquido total" },
  payback:        { en: "Payback Period",          es: "Per\u00edodo de recuperaci\u00f3n",     pt: "Per\u00edodo de retorno" },
  totalTax:       { en: "Total Tax Paid",          es: "Impuestos totales",           pt: "Impostos totais" },
  initialInv:     { en: "Initial Investment",      es: "Inversi\u00f3n inicial",           pt: "Investimento inicial" },
  discountRate:   { en: "Discount Rate",           es: "Tasa de descuento",           pt: "Taxa de desconto" },
  taxRate:        { en: "Tax Rate",                es: "Tasa impositiva",             pt: "Taxa de impostos" },
  years:          { en: "years",                   es: "a\u00f1os",                        pt: "anos" },
  never:          { en: "Never",                   es: "Nunca",                       pt: "Nunca" },
  yearlyCF:       { en: "Yearly Cash Flow Breakdown", es: "Desglose anual de flujos de caja", pt: "Detalhamento anual de fluxos de caixa" },
  year:           { en: "Year",                    es: "A\u00f1o",                         pt: "Ano" },
  income:         { en: "Income",                  es: "Ingresos",                    pt: "Receita" },
  expenses:       { en: "Expenses",                es: "Gastos",                      pt: "Despesas" },
  preTax:         { en: "Pre-Tax Profit",          es: "Ganancia antes imp.",         pt: "Lucro pr\u00e9-imp." },
  tax:            { en: "Tax",                     es: "Impuesto",                    pt: "Imposto" },
  netCF:          { en: "Net Cash Flow",           es: "Flujo neto",                  pt: "Fluxo l\u00edquido" },
  cumulative:     { en: "Cumulative",              es: "Acumulado",                   pt: "Acumulado" },
  initial:        { en: "Initial",                 es: "Inicial",                     pt: "Inicial" },
  npvBreakdown:   { en: "NPV Breakdown",           es: "Desglose VAN",                pt: "Detalhamento VPL" },
  netCashFlow:    { en: "Net Cash Flow",           es: "Flujo neto",                  pt: "Fluxo l\u00edquido" },
  discountFactor: { en: "Discount Factor",         es: "Factor de descuento",         pt: "Fator de desconto" },
  presentValue:   { en: "Present Value",           es: "Valor presente",              pt: "Valor presente" },
  conclusionPos:  { en: "Conclusion: Positive NPV - the investment creates value.", es: "Conclusi\u00f3n: VAN positivo - la inversi\u00f3n crea valor.", pt: "Conclus\u00e3o: VPL positivo - o investimento cria valor." },
  conclusionNeg:  { en: "Conclusion: Negative NPV - the investment may destroy value.", es: "Conclusi\u00f3n: VAN negativo - la inversi\u00f3n puede destruir valor.", pt: "Conclus\u00e3o: VPL negativo - o investimento pode destruir valor." },
  footer:         { en: "Project Evaluator Report", es: "Reporte de Project Evaluator", pt: "Relat\u00f3rio de Project Evaluator" },
  page:           { en: "Page",                    es: "P\u00e1gina",                      pt: "P\u00e1gina" },
  of:             { en: "of",                      es: "de",                          pt: "de" },
  parameters:     { en: "Analysis Parameters",     es: "Par\u00e1metros del an\u00e1lisis",     pt: "Par\u00e2metros da an\u00e1lise" },
  depAsset:       { en: "Asset",                   es: "Activo",                      pt: "Ativo" },
  depValue:       { en: "Depreciable Value",       es: "Valor depreciable",           pt: "Valor depreci\u00e1vel" },
  depResidual:    { en: "Residual Value",          es: "Valor residual",              pt: "Valor residual" },
  depAnnual:      { en: "Annual Depreciation",     es: "Depreciaci\u00f3n anual",          pt: "Deprecia\u00e7\u00e3o anual" },
  depMethod:      { en: "Method: Straight-line",   es: "M\u00e9todo: L\u00ednea recta",         pt: "M\u00e9todo: Linha reta" },
  depTaxShield:   { en: "Tax Shield per Year",     es: "Escudo fiscal por a\u00f1o",       pt: "Escudo fiscal por ano" },
  noDepreciation: { en: "Depreciation not considered", es: "Depreciaci\u00f3n no considerada", pt: "Deprecia\u00e7\u00e3o n\u00e3o considerada" },
  taxableIncome:  { en: "Taxable Income",          es: "Ingreso imponible",           pt: "Renda tribut\u00e1vel" },
  depreciation:   { en: "Depreciation",            es: "Depreciaci\u00f3n",                pt: "Deprecia\u00e7\u00e3o" },
  reinvestment:   { en: "Reinvestment",            es: "Reinversi\u00f3n",                 pt: "Reinvestimento" },
  totalReinvest:  { en: "Total Reinvestment",      es: "Reinversi\u00f3n total",           pt: "Reinvestimento total" },
  noReinvest:     { en: "No reinvestment",         es: "Sin reinversi\u00f3n",             pt: "Sem reinvestimento" },
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

async function buildPdfDoc(data: ExportData, lang: Language, reportSettings?: ReportSettings): Promise<jsPDF> {
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

  const renderHeader = headerRenderers[rs.template_id] || renderHeader_professional;
  let y = renderHeader(doc, cfg, data, lang);

  const conclusionColor: [number, number, number] = data.npv >= 0 ? cfg.secondaryRgb : [220, 38, 38];
  const conclusionText = `${data.npv >= 0 ? l("conclusionPos", lang) : l("conclusionNeg", lang)} (${pdfCurrency(data.npv, c)})`;
  const maxTextW = pageW - 2 * margin - 8;
  doc.setFontSize(10);
  doc.setFont(cfg.font, "bold");
  const lines = doc.splitTextToSize(conclusionText, maxTextW);
  const boxH = Math.max(12, lines.length * 5 + 6);
  doc.setFillColor(...conclusionColor);
  doc.roundedRect(margin, y, pageW - 2 * margin, boxH, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.text(lines, margin + 4, y + 5 + 3);
  y += boxH + 6;

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

  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(...cfg.accentRgb);
    doc.text(cfg.headerTitle || l("footer", lang), margin, doc.internal.pageSize.getHeight() - 10);
    doc.text(`${l("page", lang)} ${p} ${l("of", lang)} ${pageCount}`, pageW - margin, doc.internal.pageSize.getHeight() - 10, { align: "right" });
  }

  return doc;
}

export async function exportToPdf(data: ExportData, lang: Language = "en", reportSettings?: ReportSettings) {
  const doc = await buildPdfDoc(data, lang, reportSettings);
  doc.save(`${data.projectName || "investment-analysis"}.pdf`);
}


export async function generatePdfBlob(data: ExportData, lang: Language = "en", reportSettings?: ReportSettings): Promise<Blob> {
  const doc = await buildPdfDoc(data, lang, reportSettings);
  return doc.output("blob");
}

export async function generatePdfDataUrl(data: ExportData, lang: Language = "en", reportSettings?: ReportSettings): Promise<string> {
  const doc = await buildPdfDoc(data, lang, reportSettings);
  return doc.output("dataurlstring");
}
