export function calculateNPV(rate: number, cashFlows: number[]): number {
  return cashFlows.reduce((npv, cf, t) => npv + cf / Math.pow(1 + rate, t), 0);
}

export function calculateIRR(cashFlows: number[], guess = 0.1, maxIter = 1000, tol = 1e-7): number | null {
  let rate = guess;
  for (let i = 0; i < maxIter; i++) {
    let npv = 0;
    let dnpv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      const denom = Math.pow(1 + rate, t);
      npv += cashFlows[t] / denom;
      if (t > 0) dnpv -= t * cashFlows[t] / Math.pow(1 + rate, t + 1);
    }
    if (Math.abs(npv) < tol) return rate;
    if (Math.abs(dnpv) < tol) return null;
    rate -= npv / dnpv;
  }
  return Math.abs(calculateNPV(rate, cashFlows)) < 0.01 ? rate : null;
}

export interface YearInput {
  income: number;
  expenses: number;
}

export function buildCashFlows(
  initialInvestment: number,
  yearlyData: YearInput[],
  taxRate: number
): number[] {
  const flows = [-initialInvestment];
  for (const year of yearlyData) {
    const preTax = year.income - year.expenses;
    const tax = preTax > 0 ? preTax * taxRate : 0;
    flows.push(Math.round(preTax - tax));
  }
  return flows;
}

export function calculatePaybackPeriod(cashFlows: number[]): number | null {
  let cumulative = 0;
  for (let t = 0; t < cashFlows.length; t++) {
    cumulative += cashFlows[t];
    if (cumulative >= 0 && t > 0) {
      // Interpolate within the year
      const prevCumulative = cumulative - cashFlows[t];
      const fraction = -prevCumulative / cashFlows[t];
      return t - 1 + fraction;
    }
  }
  return null;
}

export type Currency = "USD" | "ARS" | "MXN" | "EUR" | "GBP" | "BRL" | "UYU" | "CLP" | "COP" | "PEN" | "PYG" | "BOB" | "CAD" | "JPY" | "CNY" | "CHF" | "AUD";

export const CURRENCY_CONFIG: Record<Currency, { locale: string; label: string; symbol: string }> = {
  USD: { locale: "en-US", label: "USD — Dólar estadounidense 🇺🇸", symbol: "$" },
  EUR: { locale: "de-DE", label: "EUR — Euro 🇪🇺", symbol: "€" },
  GBP: { locale: "en-GB", label: "GBP — Libra esterlina 🇬🇧", symbol: "£" },
  BRL: { locale: "pt-BR", label: "BRL — Real brasileño 🇧🇷", symbol: "R$" },
  ARS: { locale: "es-AR", label: "ARS — Peso argentino 🇦🇷", symbol: "$" },
  UYU: { locale: "es-UY", label: "UYU — Peso uruguayo 🇺🇾", symbol: "$U" },
  MXN: { locale: "es-MX", label: "MXN — Peso mexicano 🇲🇽", symbol: "$" },
  CLP: { locale: "es-CL", label: "CLP — Peso chileno 🇨🇱", symbol: "$" },
  COP: { locale: "es-CO", label: "COP — Peso colombiano 🇨🇴", symbol: "$" },
  PEN: { locale: "es-PE", label: "PEN — Sol peruano 🇵🇪", symbol: "S/" },
  PYG: { locale: "es-PY", label: "PYG — Guaraní paraguayo 🇵🇾", symbol: "₲" },
  BOB: { locale: "es-BO", label: "BOB — Boliviano 🇧🇴", symbol: "Bs" },
  CAD: { locale: "en-CA", label: "CAD — Dólar canadiense 🇨🇦", symbol: "C$" },
  AUD: { locale: "en-AU", label: "AUD — Dólar australiano 🇦🇺", symbol: "A$" },
  JPY: { locale: "ja-JP", label: "JPY — Yen japonés 🇯🇵", symbol: "¥" },
  CNY: { locale: "zh-CN", label: "CNY — Yuan chino 🇨🇳", symbol: "¥" },
  CHF: { locale: "de-CH", label: "CHF — Franco suizo 🇨🇭", symbol: "CHF" },
};

export function formatCurrency(value: number, currency: Currency = "USD"): string {
  return new Intl.NumberFormat(CURRENCY_CONFIG[currency].locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return (value * 100).toFixed(2) + '%';
}
