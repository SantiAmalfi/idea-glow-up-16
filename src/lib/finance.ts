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

export type Currency = "USD" | "MXN" | "EUR";

export const CURRENCY_CONFIG: Record<Currency, { locale: string; symbol: string; label: string }> = {
  USD: { locale: "en-US", symbol: "$", label: "US Dollars (USD)" },
  MXN: { locale: "es-MX", symbol: "$", label: "Pesos Mexicanos (MXN)" },
  EUR: { locale: "de-DE", symbol: "€", label: "Euros (EUR)" },
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
