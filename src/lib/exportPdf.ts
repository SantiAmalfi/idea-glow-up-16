import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatPercent, type Currency } from "./finance";

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

export function exportToPdf(data: ExportData) {
  const doc = new jsPDF();
  const c = data.currency;
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;

  // Header bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageW, 45, "F");
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 42, pageW, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(data.projectName || "Investment Analysis", margin, 22);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    data.projectDescription || "Generated report",
    margin,
    33,
    { maxWidth: pageW - margin * 2 }
  );

  // Date
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`Report date: ${new Date().toLocaleDateString()}`, pageW - margin, 22, { align: "right" });
  doc.text(`Currency: ${c}`, pageW - margin, 30, { align: "right" });

  let y = 55;

  // Key metrics
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Key Metrics", margin, y);
  y += 4;

  const metrics = [
    ["Net Present Value (NPV)", formatCurrency(data.npv, c)],
    ["Internal Rate of Return (IRR)", data.irr !== null ? formatPercent(data.irr) : "N/A"],
    ["Return on Investment (ROI)", formatPercent(data.roi)],
    ["Total Net Return", formatCurrency(data.totalReturn, c)],
    ["Payback Period", data.paybackPeriod !== null ? `${data.paybackPeriod.toFixed(1)} years` : "Never"],
    ["Total Tax Paid", formatCurrency(data.totalTax, c)],
    ["Initial Investment", formatCurrency(data.investment, c)],
    ["Discount Rate", `${(data.discountRate * 100).toFixed(1)}%`],
    ["Tax Rate", `${(data.taxRate * 100).toFixed(0)}%`],
  ];

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
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
  doc.text("Yearly Cash Flow Breakdown", margin, y);
  y += 4;

  let cumulative = -data.investment;
  const cfBody: string[][] = [];

  cfBody.push(["0 (Initial)", "—", "—", "—", "—", formatCurrency(-data.investment, c), formatCurrency(cumulative, c)]);

  data.yearlyData.forEach((yr, i) => {
    const preTax = yr.income - yr.expenses;
    const tax = preTax > 0 ? preTax * data.taxRate : 0;
    const net = preTax - tax;
    cumulative += net;
    cfBody.push([
      `Year ${i + 1}`,
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
    head: [["Year", "Income", "Expenses", "Pre-Tax", "Tax", "Net CF", "Cumulative"]],
    body: cfBody,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 14;

  // NPV breakdown
  if (y > 240) { doc.addPage(); y = 20; }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("NPV Breakdown", margin, y);
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
    head: [["Year", "Net Cash Flow", "Discount Factor", "Present Value"]],
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
    data.npv >= 0
      ? `Conclusion: Positive NPV (${formatCurrency(data.npv, c)}) — the investment creates value.`
      : `Conclusion: Negative NPV (${formatCurrency(data.npv, c)}) — the investment may destroy value.`,
    margin, y
  );

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Investment Analyzer Report", margin, doc.internal.pageSize.getHeight() - 10);
    doc.text(`Page ${p} of ${pageCount}`, pageW - margin, doc.internal.pageSize.getHeight() - 10, { align: "right" });
  }

  doc.save(`${data.projectName || "investment-analysis"}.pdf`);
}
