import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Activity, BarChart3, Clock, Receipt } from "lucide-react";
import { formatCurrency, formatPercent, type Currency } from "@/lib/finance";
import { useI18n } from "@/lib/i18n";

interface ResultsPanelProps {
  npv: number;
  irr: number | null;
  totalReturn: number;
  roi: number;
  investment: number;
  paybackPeriod: number | null;
  totalTax: number;
  currency: Currency;
}

export default function ResultsPanel({ npv, irr, totalReturn, roi, investment, paybackPeriod, totalTax, currency }: ResultsPanelProps) {
  const { t } = useI18n();
  const isPositiveNPV = npv >= 0;

  const metrics = [
    {
      label: t("results.npv"),
      value: formatCurrency(npv, currency),
      positive: isPositiveNPV,
      icon: isPositiveNPV ? TrendingUp : TrendingDown,
      description: isPositiveNPV ? t("results.createsValue") : t("results.destroysValue"),
    },
    {
      label: t("results.irr"),
      value: irr !== null ? formatPercent(irr) : "N/A",
      positive: irr !== null && irr > 0,
      icon: Activity,
      description: irr !== null ? (irr > 0 ? t("results.aboveBreakeven") : t("results.belowBreakeven")) : t("results.cannotCompute"),
    },
    {
      label: t("results.totalReturn"),
      value: formatCurrency(totalReturn, currency),
      positive: totalReturn > investment,
      icon: BarChart3,
      description: t("results.onInvested", { amount: formatCurrency(investment, currency) }),
    },
    {
      label: t("results.roi"),
      value: formatPercent(roi),
      positive: roi > 0,
      icon: TrendingUp,
      description: roi > 0 ? t("results.netGain") : t("results.netLoss"),
    },
    {
      label: t("results.payback"),
      value: paybackPeriod !== null ? `${paybackPeriod.toFixed(1)} ${t("results.years")}` : t("results.never"),
      positive: paybackPeriod !== null,
      icon: Clock,
      description: paybackPeriod !== null ? t("results.timeToRecover") : t("results.notRecovered"),
    },
    {
      label: t("results.totalTax"),
      value: formatCurrency(totalTax, currency),
      positive: true,
      icon: Receipt,
      description: t("results.estimatedTax"),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {metrics.map((m, i) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 * i, duration: 0.4 }}
          className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-2"
        >
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${m.positive ? "bg-primary/10" : "bg-destructive/10"}`}>
              <m.icon className={`h-4 w-4 ${m.positive ? "text-primary" : "text-destructive"}`} />
            </div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">{m.label}</span>
          </div>
          <span className={`text-2xl font-mono font-bold ${m.positive ? "text-primary" : "text-destructive"}`}>
            {m.value}
          </span>
          <span className="text-xs text-muted-foreground">{m.description}</span>
        </motion.div>
      ))}
    </div>
  );
}
