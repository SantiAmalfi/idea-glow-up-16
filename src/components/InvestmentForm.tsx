import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DollarSign, Calendar, Percent } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { type Currency, CURRENCY_CONFIG } from "@/lib/finance";
import { useI18n } from "@/lib/i18n";

export type Scenario = "optimistic" | "base" | "pessimistic";

export interface YearData {
  income: number;
  expenses: number;
}

interface InvestmentFormProps {
  onAnalyze: (data: {
    projectName: string;
    projectDescription: string;
    currency: Currency;
    investment: number;
    years: number;
    discountRate: number;
    taxRate: number;
    yearlyData: YearData[];
    scenario: Scenario;
  }) => void;
}

const scenarioConfig = [
  { value: "optimistic" as Scenario, color: "text-primary border-primary bg-primary/10", incomeMultiplier: 0.45, expenseRatio: 0.25 },
  { value: "base" as Scenario, color: "text-chart-neutral border-chart-neutral bg-chart-neutral/10", incomeMultiplier: 0.25, expenseRatio: 0.40 },
  { value: "pessimistic" as Scenario, color: "text-destructive border-destructive bg-destructive/10", incomeMultiplier: 0.12, expenseRatio: 0.60 },
];

function generateEstimates(investment: number, years: number, scenario: Scenario): { income: string; expenses: string }[] {
  const s = scenarioConfig.find((sc) => sc.value === scenario)!;
  const data: { income: string; expenses: string }[] = [];
  for (let i = 1; i <= years; i++) {
    const rampUp = 0.5 + 0.5 * (i / years);
    const income = Math.round(investment * s.incomeMultiplier * rampUp);
    const expenses = Math.round(income * s.expenseRatio);
    data.push({ income: String(income), expenses: String(expenses) });
  }
  return data;
}

export default function InvestmentForm({ onAnalyze }: InvestmentFormProps) {
  const { t } = useI18n();
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [investment, setInvestment] = useState("100000");
  const [years, setYears] = useState("5");
  const [discountRate, setDiscountRate] = useState("10");
  const [taxRate, setTaxRate] = useState("25");
  const [scenario, setScenario] = useState<Scenario>("base");
  const [yearlyData, setYearlyData] = useState<{ income: string; expenses: string }[]>([]);

  const numYears = Math.max(1, Math.min(30, Number(years) || 1));

  useEffect(() => {
    const inv = Number(investment) || 100000;
    setYearlyData(generateEstimates(inv, numYears, scenario));
  }, [scenario, investment, numYears]);

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
      projectName,
      projectDescription,
      currency,
      investment: Number(investment),
      years: numYears,
      discountRate: Number(discountRate) / 100,
      taxRate: Number(taxRate) / 100,
      yearlyData: yearlyData.map((y) => ({
        income: Number(y.income),
        expenses: Number(y.expenses),
      })),
      scenario,
    });
  };

  const scenarioLabels: Record<Scenario, { label: string; desc: string }> = {
    optimistic: { label: t("form.optimistic"), desc: t("form.optimisticDesc") },
    base: { label: t("form.base"), desc: t("form.baseDesc") },
    pessimistic: { label: t("form.pessimistic"), desc: t("form.pessimisticDesc") },
  };

  const fields = [
    { label: t("form.investment"), value: investment, set: setInvestment, icon: DollarSign, placeholder: "100000", min: 0 },
    { label: t("form.years"), value: years, set: setYears, icon: Calendar, placeholder: "5", min: 1 },
    { label: t("form.discountRate"), value: discountRate, set: setDiscountRate, icon: Percent, placeholder: "10", min: 0 },
    { label: t("form.taxRate"), value: taxRate, set: setTaxRate, icon: Percent, placeholder: "25", min: 0 },
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
        <h2 className="text-xl font-semibold text-foreground">{t("form.title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("form.subtitle")}</p>
      </div>

      {/* Project Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">
            {t("form.projectName")}
          </Label>
          <Input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="bg-secondary border-border text-foreground h-12"
            placeholder={t("form.projectNamePlaceholder")}
          />
        </div>
        <div>
          <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">
            {t("form.currency")}
          </Label>
          <div className="grid grid-cols-5 gap-2">
            {(Object.keys(CURRENCY_CONFIG) as Currency[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`rounded-xl border p-2.5 text-center transition-all text-xs font-semibold ${
                  currency === c
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-secondary text-muted-foreground hover:border-muted-foreground/40"
                }`}
              >
                {CURRENCY_CONFIG[c].label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">
          {t("form.description")}
        </Label>
        <Textarea
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
          className="bg-secondary border-border text-foreground min-h-[60px]"
          placeholder={t("form.descriptionPlaceholder")}
          rows={2}
        />
      </div>

      {/* Top-level inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
                min={f.min}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Scenario picker */}
      <div>
        <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-3 block">
          {t("form.scenario")}
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {scenarioConfig.map((s) => (
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
              <span className="font-semibold text-sm block">{scenarioLabels[s.value].label}</span>
              <span className="text-xs opacity-75 mt-0.5 block">{scenarioLabels[s.value].desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Per-year income & expenses */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">
            {t("form.yearlyTitle")}
          </Label>
          <span className="text-xs text-muted-foreground italic">{t("form.yearlyHint")}</span>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-[70px_1fr_1fr_120px] gap-3 text-xs text-muted-foreground uppercase tracking-wider px-1">
            <span>{t("form.year")}</span>
            <span>{t("form.income")}</span>
            <span>{t("form.expenses")}</span>
            <span className="text-right">{t("form.netPreTax")}</span>
          </div>

          {yearlyData.map((y, i) => {
            const net = Number(y.income) - Number(y.expenses);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.03 * i }}
                className="grid grid-cols-[70px_1fr_1fr_120px] gap-3 items-center"
              >
                <span className="text-sm font-mono text-muted-foreground pl-1">Yr {i + 1}</span>
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
        {t("form.analyze")}
      </Button>
    </motion.form>
  );
}
