import jsPDF from "jspdf";
import { formatCurrency, type Currency } from "./finance";

const COLORS = {
  green: [16, 185, 129] as [number, number, number],
  red: [220, 38, 38] as [number, number, number],
  blue: [59, 130, 246] as [number, number, number],
  orange: [249, 115, 22] as [number, number, number],
  slate: [100, 116, 139] as [number, number, number],
  dark: [15, 23, 42] as [number, number, number],
  gridLine: [226, 232, 240] as [number, number, number],
  lightBg: [248, 250, 252] as [number, number, number],
};

interface ChartArea {
  x: number;
  y: number;
  w: number;
  h: number;
}

function drawChartBox(doc: jsPDF, title: string, area: ChartArea) {
  // Background
  doc.setFillColor(...COLORS.lightBg);
  doc.roundedRect(area.x - 4, area.y - 14, area.w + 8, area.h + 22, 3, 3, "F");
  doc.setDrawColor(...COLORS.gridLine);
  doc.roundedRect(area.x - 4, area.y - 14, area.w + 8, area.h + 22, 3, 3, "S");

  // Title
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.dark);
  doc.text(title, area.x, area.y - 4);
}

function drawGridLines(doc: jsPDF, area: ChartArea, minVal: number, maxVal: number, currency: Currency, steps = 5) {
  doc.setDrawColor(...COLORS.gridLine);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.slate);

  for (let i = 0; i <= steps; i++) {
    const yPos = area.y + area.h - (i / steps) * area.h;
    const val = minVal + (i / steps) * (maxVal - minVal);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(area.x, yPos, area.x + area.w, yPos);
    doc.text(formatCurrency(val, currency), area.x - 2, yPos + 1, { align: "right" });
  }
  doc.setLineDashPattern([], 0);
}

/**
 * Bar chart: yearly net cash flows (green positive, red negative)
 */
export function drawCashFlowBarChart(
  doc: jsPDF,
  cashFlows: number[],
  currency: Currency,
  startY: number,
  margin: number,
  pageW: number,
  labels: { year: string; initial: string }
): number {
  const area: ChartArea = { x: margin + 30, y: startY, w: pageW - 2 * margin - 35, h: 70 };
  drawChartBox(doc, "", area);

  const maxVal = Math.max(...cashFlows, 0) * 1.1;
  const minVal = Math.min(...cashFlows, 0) * 1.1;
  const range = maxVal - minVal || 1;

  drawGridLines(doc, area, minVal, maxVal, currency, 4);

  // Zero line
  const zeroY = area.y + area.h - ((0 - minVal) / range) * area.h;
  doc.setDrawColor(...COLORS.dark);
  doc.setLineDashPattern([], 0);
  doc.line(area.x, zeroY, area.x + area.w, zeroY);

  const barCount = cashFlows.length;
  const barW = Math.min((area.w / barCount) * 0.7, 14);
  const gap = area.w / barCount;

  cashFlows.forEach((cf, i) => {
    const barX = area.x + i * gap + (gap - barW) / 2;
    const barH = (Math.abs(cf) / range) * area.h;
    const color = cf >= 0 ? COLORS.green : COLORS.red;
    doc.setFillColor(...color);

    if (cf >= 0) {
      doc.roundedRect(barX, zeroY - barH, barW, barH, 1, 1, "F");
    } else {
      doc.roundedRect(barX, zeroY, barW, barH, 1, 1, "F");
    }

    // X-axis label
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.slate);
    const lbl = i === 0 ? labels.initial : `${i}`;
    doc.text(lbl, barX + barW / 2, area.y + area.h + 5, { align: "center" });
  });

  return area.y + area.h + 12;
}

/**
 * Line chart: cumulative cash flow with payback period marker
 */
export function drawCumulativeChart(
  doc: jsPDF,
  cashFlows: number[],
  currency: Currency,
  startY: number,
  margin: number,
  pageW: number,
  paybackPeriod: number | null,
  labels: { year: string; initial: string; payback: string }
): number {
  const area: ChartArea = { x: margin + 30, y: startY, w: pageW - 2 * margin - 35, h: 70 };
  drawChartBox(doc, "", area);

  // Calculate cumulative values
  const cumulative: number[] = [];
  let sum = 0;
  cashFlows.forEach((cf) => {
    sum += cf;
    cumulative.push(sum);
  });

  const maxVal = Math.max(...cumulative, 0) * 1.15;
  const minVal = Math.min(...cumulative, 0) * 1.15;
  const range = maxVal - minVal || 1;

  drawGridLines(doc, area, minVal, maxVal, currency, 4);

  // Zero line
  const zeroY = area.y + area.h - ((0 - minVal) / range) * area.h;
  doc.setDrawColor(...COLORS.slate);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(area.x, zeroY, area.x + area.w, zeroY);
  doc.setLineDashPattern([], 0);

  const gap = area.w / (cumulative.length - 1 || 1);

  // Fill area under curve
  const points: [number, number][] = cumulative.map((val, i) => [
    area.x + i * gap,
    area.y + area.h - ((val - minVal) / range) * area.h,
  ]);

  // Draw line
  doc.setDrawColor(...COLORS.blue);
  doc.setLineWidth(0.8);
  for (let i = 1; i < points.length; i++) {
    doc.line(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1]);
  }
  doc.setLineWidth(0.2);

  // Draw dots
  points.forEach(([px, py], i) => {
    const color = cumulative[i] >= 0 ? COLORS.green : COLORS.red;
    doc.setFillColor(...color);
    doc.circle(px, py, 1.5, "F");

    // X-axis label
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.slate);
    const lbl = i === 0 ? labels.initial : `${i}`;
    doc.text(lbl, px, area.y + area.h + 5, { align: "center" });
  });

  // Payback period marker
  if (paybackPeriod !== null && paybackPeriod > 0) {
    const pbX = area.x + paybackPeriod * gap;
    doc.setDrawColor(...COLORS.orange);
    doc.setLineDashPattern([2, 1], 0);
    doc.line(pbX, area.y, pbX, area.y + area.h);
    doc.setLineDashPattern([], 0);

    doc.setFontSize(6);
    doc.setTextColor(...COLORS.orange);
    doc.text(`${labels.payback}: ${paybackPeriod.toFixed(1)}`, pbX + 2, area.y + 5);
  }

  return area.y + area.h + 12;
}

/**
 * Grouped bar chart: Income vs Expenses per year
 */
export function drawIncomeExpensesChart(
  doc: jsPDF,
  yearlyData: { income: number; expenses: number }[],
  currency: Currency,
  startY: number,
  margin: number,
  pageW: number,
  labels: { income: string; expenses: string }
): number {
  const area: ChartArea = { x: margin + 30, y: startY, w: pageW - 2 * margin - 35, h: 70 };
  drawChartBox(doc, "", area);

  const allVals = yearlyData.flatMap((d) => [d.income, d.expenses]);
  const maxVal = Math.max(...allVals, 0) * 1.1;

  drawGridLines(doc, area, 0, maxVal, currency, 4);

  const n = yearlyData.length;
  const groupW = area.w / n;
  const barW = Math.min(groupW * 0.3, 10);

  yearlyData.forEach((yr, i) => {
    const gx = area.x + i * groupW + groupW / 2;

    // Income bar
    const incH = (yr.income / maxVal) * area.h;
    doc.setFillColor(...COLORS.green);
    doc.roundedRect(gx - barW - 1, area.y + area.h - incH, barW, incH, 1, 1, "F");

    // Expenses bar
    const expH = (yr.expenses / maxVal) * area.h;
    doc.setFillColor(...COLORS.red);
    doc.roundedRect(gx + 1, area.y + area.h - expH, barW, expH, 1, 1, "F");

    // Label
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.slate);
    doc.text(`${i + 1}`, gx, area.y + area.h + 5, { align: "center" });
  });

  // Legend
  const legX = area.x + area.w - 50;
  const legY = area.y - 8;
  doc.setFillColor(...COLORS.green);
  doc.rect(legX, legY - 2, 4, 4, "F");
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.dark);
  doc.text(labels.income, legX + 6, legY + 1);

  doc.setFillColor(...COLORS.red);
  doc.rect(legX + 28, legY - 2, 4, 4, "F");
  doc.text(labels.expenses, legX + 34, legY + 1);

  return area.y + area.h + 12;
}
