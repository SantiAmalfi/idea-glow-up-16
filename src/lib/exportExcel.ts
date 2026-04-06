import * as XLSX from "xlsx";
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

export function exportToExcel(data: ExportData) {
  const wb = XLSX.utils.book_new();
  const c = data.currency;

  // Sheet 1: Summary
  const summary = [
    ["Investment Analysis Report"],
    ["Project", data.projectName || "Untitled"],
    ["Description", data.projectDescription || ""],
    ["Currency", c],
    ["Date", new Date().toLocaleDateString()],
    [],
    ["Key Metrics"],
    ["Net Present Value (NPV)", data.npv],
    ["Internal Rate of Return (IRR)", data.irr !== null ? data.irr : "N/A"],
    ["Return on Investment (ROI)", data.roi],
    ["Total Net Return", data.totalReturn],
    ["Payback Period", data.paybackPeriod !== null ? `${data.paybackPeriod.toFixed(1)} years` : "Never"],
    ["Total Tax Paid", data.totalTax],
    ["Initial Investment", data.investment],
    ["Discount Rate", data.discountRate],
    ["Tax Rate", data.taxRate],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(summary);
  ws1["!cols"] = [{ wch: 30 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Summary");

  // Sheet 2: Cash Flows
  const cfHeader = ["Year", "Income", "Expenses", "Pre-Tax Profit", "Tax", "Net Cash Flow", "Cumulative"];
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
  XLSX.utils.book_append_sheet(wb, ws2, "Cash Flows");

  // Sheet 3: NPV Breakdown
  const npvHeader = ["Year", "Net Cash Flow", "Discount Factor", "Present Value"];
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
  XLSX.utils.book_append_sheet(wb, ws3, "NPV Breakdown");

  XLSX.writeFile(wb, `${data.projectName || "investment-analysis"}.xlsx`);
}
