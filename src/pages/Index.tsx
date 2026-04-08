import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, FileDown, FileSpreadsheet, ArrowDown, TrendingUp } from "lucide-react";
import InvestmentForm from "@/components/InvestmentForm";
import type { YearData, Scenario } from "@/components/InvestmentForm";
import ResultsPanel from "@/components/ResultsPanel";
import CashFlowChart from "@/components/CashFlowChart";
import CalculationDetails from "@/components/CalculationDetails";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FeaturesSection from "@/components/FeaturesSection";
import { Button } from "@/components/ui/button";
import { calculateNPV, calculateIRR, buildCashFlows, calculatePaybackPeriod, type Currency, type DepreciationConfig } from "@/lib/finance";
import { exportToPdf } from "@/lib/exportPdf";
import { exportToExcel } from "@/lib/exportExcel";
import { useI18n } from "@/lib/i18n";

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
  depreciation: DepreciationConfig;
  reinvestments: number[];
}

export default function Index() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { t, language } = useI18n();

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
    depreciation: DepreciationConfig;
    reinvestments: number[];
  }) => {
    const cashFlows = buildCashFlows(data.investment, data.yearlyData, data.taxRate, data.depreciation, data.reinvestments);
    const npv = calculateNPV(data.discountRate, cashFlows);
    const irr = calculateIRR(cashFlows);
    const totalReturn = cashFlows.slice(1).reduce((sum, cf) => sum + cf, 0);
    const roi = (totalReturn - data.investment) / data.investment;
    const paybackPeriod = calculatePaybackPeriod(cashFlows);

    const annualDep = data.depreciation.enabled
      ? (data.depreciation.depreciableValue - data.depreciation.residualValue) / data.years
      : 0;

    const totalTax = data.yearlyData.reduce((sum, y) => {
      const preTax = y.income - y.expenses;
      const taxableIncome = preTax - annualDep;
      return sum + (taxableIncome > 0 ? taxableIncome * data.taxRate : 0);
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
      depreciation: data.depreciation,
      reinvestments: data.reinvestments,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 right-0 w-[300px] h-[300px] bg-primary/3 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 pt-20 pb-12 md:pt-28 md:pb-16 relative">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs text-primary uppercase tracking-widest mb-6">
              <Sparkles className="h-3 w-3" />
              {t("hero.badge")}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight leading-[1.1]">
              {t("hero.title1")}
              <br />
              <span className="text-primary">{t("hero.title2")}</span>
            </h1>
            <p className="text-muted-foreground mt-5 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
              {t("hero.subtitle")}
            </p>

            <div className="flex items-center justify-center gap-6 mt-8 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                {t("hero.currencies")}
              </span>
              <span className="h-3 w-px bg-border" />
              <span className="flex items-center gap-1.5">
                <FileDown className="h-3.5 w-3.5 text-primary" />
                PDF & Excel
              </span>
              <span className="h-3 w-px bg-border" />
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                {t("hero.scenarios")}
              </span>
            </div>

            <motion.a
              href="#analyzer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="inline-flex items-center gap-2 mt-10 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
            >
              {t("hero.cta")}
              <ArrowDown className="h-4 w-4" />
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* Analyzer */}
      <section id="analyzer" className="max-w-5xl mx-auto px-4 py-8">
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
              <span className="text-xs text-muted-foreground uppercase tracking-widest">{t("results.title")}</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => exportToPdf(result, language)}
                variant="outline"
                className="flex-1 gap-2 border-primary/30 text-primary hover:bg-primary/10"
              >
                <FileDown className="h-4 w-4" />
                {t("results.downloadPdf")}
              </Button>
              <Button
                onClick={() => exportToExcel(result, language)}
                variant="outline"
                className="flex-1 gap-2 border-primary/30 text-primary hover:bg-primary/10"
              >
                <FileSpreadsheet className="h-4 w-4" />
                {t("results.downloadExcel")}
              </Button>
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
              depreciation={result.depreciation}
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
                {result.npv >= 0 ? t("results.positive") : t("results.negative")}
              </p>
            </motion.div>
          </motion.div>
        )}
      </section>

      <FeaturesSection />
      <Footer />
    </div>
  );
}
