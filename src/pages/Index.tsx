import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import InvestmentForm from "@/components/InvestmentForm";
import ResultsPanel from "@/components/ResultsPanel";
import CashFlowChart from "@/components/CashFlowChart";
import { calculateNPV, calculateIRR, generateCashFlows } from "@/lib/finance";

interface AnalysisResult {
  npv: number;
  irr: number | null;
  totalReturn: number;
  roi: number;
  investment: number;
  cashFlows: number[];
}

export default function Index() {
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = (data: {
    investment: number;
    annualReturn: number;
    years: number;
    discountRate: number;
  }) => {
    const cashFlows = generateCashFlows(data.investment, data.annualReturn, data.years);
    const npv = calculateNPV(data.discountRate, cashFlows);
    const irr = calculateIRR(cashFlows);
    const totalReturn = data.annualReturn * data.years;
    const roi = (totalReturn - data.investment) / data.investment;

    setResult({ npv, irr, totalReturn, roi, investment: data.investment, cashFlows });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        {/* Header */}
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
            Calculate NPV, IRR, and ROI to make data-driven decisions about your projects and ideas.
          </p>
        </motion.div>

        {/* Form */}
        <InvestmentForm onAnalyze={handleAnalyze} />

        {/* Results */}
        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 space-y-6"
          >
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
            />

            <CashFlowChart cashFlows={result.cashFlows} />

            {/* Verdict */}
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
