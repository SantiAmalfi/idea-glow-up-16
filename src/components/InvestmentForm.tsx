import { useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, Calendar, Percent } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export type Scenario = "optimistic" | "base" | "pessimistic";

interface InvestmentFormProps {
  onAnalyze: (data: {
    investment: number;
    years: number;
    discountRate: number;
    scenario: Scenario;
  }) => void;
}

const scenarios: { value: Scenario; label: string; description: string; color: string }[] = [
  { value: "optimistic", label: "Optimistic", description: "High growth, ~30% annual return", color: "text-primary border-primary bg-primary/10" },
  { value: "base", label: "Base", description: "Moderate growth, ~15% annual return", color: "text-chart-neutral border-chart-neutral bg-chart-neutral/10" },
  { value: "pessimistic", label: "Pessimistic", description: "Conservative, ~5% annual return", color: "text-destructive border-destructive bg-destructive/10" },
];

export default function InvestmentForm({ onAnalyze }: InvestmentFormProps) {
  const [investment, setInvestment] = useState("100000");
  const [years, setYears] = useState("7");
  const [discountRate, setDiscountRate] = useState("10");
  const [scenario, setScenario] = useState<Scenario>("base");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze({
      investment: Number(investment),
      years: Number(years),
      discountRate: Number(discountRate) / 100,
      scenario,
    });
  };

  const fields = [
    { label: "Initial Investment", value: investment, set: setInvestment, icon: DollarSign, placeholder: "100,000" },
    { label: "Timeline (Years)", value: years, set: setYears, icon: Calendar, placeholder: "7" },
    { label: "Discount Rate (%)", value: discountRate, set: setDiscountRate, icon: Percent, placeholder: "10" },
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
        <p className="text-sm text-muted-foreground mt-1">Enter your investment details and pick a scenario</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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

      {/* Scenario picker */}
      <div>
        <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-3 block">
          Growth Scenario
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {scenarios.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setScenario(s.value)}
              className={`rounded-xl border p-4 text-left transition-all ${
                scenario === s.value
                  ? s.color + " border-current"
                  : "border-border bg-secondary text-muted-foreground hover:border-muted-foreground/40"
              }`}
            >
              <span className="font-semibold text-sm block">{s.label}</span>
              <span className="text-xs opacity-75 mt-0.5 block">{s.description}</span>
            </button>
          ))}
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
