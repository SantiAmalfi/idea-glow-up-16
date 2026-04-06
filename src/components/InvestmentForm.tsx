import { useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, Calendar, TrendingUp, Percent } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface InvestmentFormProps {
  onAnalyze: (data: {
    investment: number;
    annualReturn: number;
    years: number;
    discountRate: number;
  }) => void;
}

export default function InvestmentForm({ onAnalyze }: InvestmentFormProps) {
  const [investment, setInvestment] = useState("100000");
  const [annualReturn, setAnnualReturn] = useState("25000");
  const [years, setYears] = useState("7");
  const [discountRate, setDiscountRate] = useState("10");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze({
      investment: Number(investment),
      annualReturn: Number(annualReturn),
      years: Number(years),
      discountRate: Number(discountRate) / 100,
    });
  };

  const fields = [
    { label: "Initial Investment", value: investment, set: setInvestment, icon: DollarSign, prefix: "$", placeholder: "100,000" },
    { label: "Expected Annual Return", value: annualReturn, set: setAnnualReturn, icon: TrendingUp, prefix: "$", placeholder: "25,000" },
    { label: "Timeline (Years)", value: years, set: setYears, icon: Calendar, prefix: "", placeholder: "7" },
    { label: "Discount Rate (%)", value: discountRate, set: setDiscountRate, icon: Percent, prefix: "", placeholder: "10" },
  ];

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
        <p className="text-sm text-muted-foreground mt-1">Enter your investment details below</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {fields.map((f, i) => (
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
                min={f.label.includes("Timeline") ? 1 : 0}
              />
            </div>
          </motion.div>
        ))}
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
