import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DollarSign, Calendar, Percent, Plus, Minus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export interface YearData {
  income: number;
  expenses: number;
}

interface InvestmentFormProps {
  onAnalyze: (data: {
    investment: number;
    years: number;
    discountRate: number;
    taxRate: number;
    yearlyData: YearData[];
  }) => void;
}

export default function InvestmentForm({ onAnalyze }: InvestmentFormProps) {
  const [investment, setInvestment] = useState("100000");
  const [years, setYears] = useState("5");
  const [discountRate, setDiscountRate] = useState("10");
  const [taxRate, setTaxRate] = useState("25");
  const [yearlyData, setYearlyData] = useState<{ income: string; expenses: string }[]>([]);

  const numYears = Math.max(1, Math.min(30, Number(years) || 1));

  useEffect(() => {
    setYearlyData((prev) => {
      const next = [...prev];
      while (next.length < numYears) next.push({ income: "30000", expenses: "10000" });
      return next.slice(0, numYears);
    });
  }, [numYears]);

  const updateYear = (index: number, field: "income" | "expenses", value: string) => {
    setYearlyData((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze({
      investment: Number(investment),
      years: numYears,
      discountRate: Number(discountRate) / 100,
      taxRate: Number(taxRate) / 100,
      yearlyData: yearlyData.map((y) => ({
        income: Number(y.income),
        expenses: Number(y.expenses),
      })),
    });
  };

  const applyToAll = (field: "income" | "expenses", value: string) => {
    setYearlyData((prev) => prev.map((y) => ({ ...y, [field]: value })));
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6"
    >
      <div>
        <h2 className="text-xl font-semibold text-foreground">Project Parameters</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your investment details, yearly projections, and tax rate
        </p>
      </div>

      {/* Top-level inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Initial Investment", value: investment, set: setInvestment, icon: DollarSign, placeholder: "100000", min: 0 },
          { label: "Timeline (Years)", value: years, set: setYears, icon: Calendar, placeholder: "5", min: 1 },
          { label: "Discount Rate (%)", value: discountRate, set: setDiscountRate, icon: Percent, placeholder: "10", min: 0 },
          { label: "Tax Rate (%)", value: taxRate, set: setTaxRate, icon: Percent, placeholder: "25", min: 0 },
        ].map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
          >
            <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">
              {f.label}
            </Label>
            <div className="relative">
              <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                className="pl-10 bg-secondary border-border font-mono text-foreground h-12"
                placeholder={f.placeholder}
                required
                min={f.min}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Per-year income & expenses */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">
            Yearly Income & Expenses
          </Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => {
                if (yearlyData[0]) applyToAll("income", yearlyData[0].income);
              }}
            >
              Apply Year 1 income to all
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => {
                if (yearlyData[0]) applyToAll("expenses", yearlyData[0].expenses);
              }}
            >
              Apply Year 1 expenses to all
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-[80px_1fr_1fr_120px] gap-3 text-xs text-muted-foreground uppercase tracking-wider px-1">
            <span>Year</span>
            <span>Income</span>
            <span>Expenses</span>
            <span className="text-right">Net (pre-tax)</span>
          </div>

          {yearlyData.map((y, i) => {
            const net = Number(y.income) - Number(y.expenses);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.03 * i }}
                className="grid grid-cols-[80px_1fr_1fr_120px] gap-3 items-center"
              >
                <span className="text-sm font-mono text-muted-foreground pl-1">Year {i + 1}</span>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="number"
                    value={y.income}
                    onChange={(e) => updateYear(i, "income", e.target.value)}
                    className="pl-8 bg-secondary border-border font-mono text-foreground h-10 text-sm"
                    required
                    min={0}
                  />
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="number"
                    value={y.expenses}
                    onChange={(e) => updateYear(i, "expenses", e.target.value)}
                    className="pl-8 bg-secondary border-border font-mono text-foreground h-10 text-sm"
                    required
                    min={0}
                  />
                </div>
                <span
                  className={`text-sm font-mono text-right pr-1 ${
                    net >= 0 ? "text-primary" : "text-destructive"
                  }`}
                >
                  {net >= 0 ? "+" : ""}
                  {net.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-12 bg-primary text-primary-foreground font-semibold text-base hover:brightness-110 transition-all"
      >
        Analyze Investment
      </Button>
    </motion.form>
  );
}
