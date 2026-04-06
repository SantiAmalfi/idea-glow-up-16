import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import InvestmentForm from "@/components/InvestmentForm";
import type { YearData, Scenario } from "@/components/InvestmentForm";
import ResultsPanel from "@/components/ResultsPanel";
import CashFlowChart from "@/components/CashFlowChart";
import CalculationDetails from "@/components/CalculationDetails";
import { calculateNPV, calculateIRR, buildCashFlows, calculatePaybackPeriod, type Currency } from "@/lib/finance";

interface AnalysisResult {
  projectName: string;
  projectDescription: string;
  currency: Currency;
  npv: number;
  irr: number | null;
  totalReturn: number;
  roi: number;
  investment: number;
  cashFlows: number[];
  paybackPeriod: number | null;
  totalTax: number;
  discountRate: number;
  taxRate: number;
  yearlyData: YearData[];
}

export default function Index() {
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = (data: {
    projectName: string;
    projectDescription: string;
    currency: Currency;
    investment: number;
    years: number;
    discountRate: number;
    taxRate: number;
    yearlyData: YearData[];
    scenario: Scenario;
  }) => {
    const cashFlows = buildCashFlows(data.investment, data.yearlyData, data.taxRate);
    const npv = calculateNPV(data.discountRate, cashFlows);
    const irr = calculateIRR(cashFlows);
    const totalReturn = cashFlows.slice(1).reduce((sum, cf) => sum + cf, 0);
    const roi = (totalReturn - data.investment) / data.investment;
    const paybackPeriod = calculatePaybackPeriod(cashFlows);

    const totalTax = data.yearlyData.reduce((sum, y) => {
      const preTax = y.income - y.expenses;
      return sum + (preTax > 0 ? preTax * data.taxRate : 0);
    }, 0);

    setResult({
      projectName: data.projectName,
      projectDescription: data.projectDescription,
      currency: data.currency,
      npv, irr, totalReturn, roi,
      investment: data.investment,
      cashFlows, paybackPeriod, totalTax,
      discountRate: data.discountRate,
      taxRate: data.taxRate,
      yearlyData: data.yearlyData,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-secondary text-xs text-muted-foreground uppercase tracking-widest mb-6">
            <Sparkles className="h-3 w-3 text-primary" />
            Investment Analyzer
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            Analyze Your
            <span className="text-primary"> Investment</span>
          </h1>
          <p className="text-muted-foreground mt-4 text-lg max-w-lg mx-auto">
            Calculate NPV, IRR, and ROI with detailed yearly income, expenses, and tax projections.
          </p>
        </motion.div>

        <InvestmentForm onAnalyze={handleAnalyze} />

        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 space-y-6"
          >
            {(result.projectName || result.projectDescription) && (
              <div className="rounded-2xl border border-border bg-card p-6">
                {result.projectName && (
                  <h2 className="text-2xl font-bold text-foreground">{result.projectName}</h2>
                )}
                {result.projectDescription && (
                  <p className="text-sm text-muted-foreground mt-1">{result.projectDescription}</p>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 mb-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground uppercase tracking-widest">Analysis Results</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <ResultsPanel
              npv={result.npv}
              irr={result.irr}
              totalReturn={result.totalReturn}
              roi={result.roi}
              investment={result.investment}
              paybackPeriod={result.paybackPeriod}
              totalTax={result.totalTax}
              currency={result.currency}
            />

            <CashFlowChart cashFlows={result.cashFlows} currency={result.currency} />

            <CalculationDetails
              investment={result.investment}
              discountRate={result.discountRate}
              taxRate={result.taxRate}
              yearlyData={result.yearlyData}
              cashFlows={result.cashFlows}
              npv={result.npv}
              irr={result.irr}
              currency={result.currency}
            />

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={`rounded-2xl border p-6 text-center ${
                result.npv >= 0
                  ? "border-primary/30 bg-primary/5"
                  : "border-destructive/30 bg-destructive/5"
              }`}
            >
              <p className={`text-lg font-semibold ${result.npv >= 0 ? "text-primary" : "text-destructive"}`}>
                {result.npv >= 0
                  ? "✅ This investment looks promising — positive NPV indicates value creation."
                  : "⚠️ This investment may not be viable — negative NPV suggests value loss."}
              </p>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
