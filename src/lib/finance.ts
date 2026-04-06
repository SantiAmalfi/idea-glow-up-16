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

type Scenario = "optimistic" | "base" | "pessimistic";

const SCENARIO_RATES: Record<Scenario, number> = {
  optimistic: 0.30,
  base: 0.15,
  pessimistic: 0.05,
};

export function generateCashFlows(
  initialInvestment: number,
  years: number,
  scenario: Scenario
): number[] {
  const rate = SCENARIO_RATES[scenario];
  const flows = [-initialInvestment];
  for (let i = 1; i <= years; i++) {
    // Simulates growing returns: year 1 starts lower, ramps up
    const yearReturn = initialInvestment * rate * (0.6 + 0.4 * (i / years));
    flows.push(Math.round(yearReturn));
  }
  return flows;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return (value * 100).toFixed(2) + '%';
}
