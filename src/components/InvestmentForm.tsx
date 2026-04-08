import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Percent, ChevronDown, Plus, Trash2, Search,
  Building2, Info, TrendingUp, TrendingDown, BarChart3,
  DollarSign, Package, Layers, RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { type Currency, type DepreciationConfig, CURRENCY_CONFIG, formatCurrency } from "@/lib/finance";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type Scenario = "optimistic" | "base" | "pessimistic";

export interface YearData {
  income: number;
  expenses: number;
}

export interface LineItem {
  name: string;
  value: number;
}

/* ── Year 1 detail types ── */
interface IncomeItem {
  name: string;
  description: string;
  amount: string;
}

interface FixedCostItem {
  name: string;
  description: string;
  amount: string;
}

interface VariableCostItem {
  name: string;
  description: string;
  unitCost: string;
  units: string;
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
    depreciation: DepreciationConfig;
    reinvestments: number[];
  }) => void;
}

/* ── Scenario growth rates ── */
const DEFAULT_SCENARIO_RATES = {
  optimistic: { incomeGrowth: 15, fixedCostGrowth: 3, variableUnitsGrowth: 10 },
  base:       { incomeGrowth: 5, fixedCostGrowth: 5, variableUnitsGrowth: 3 },
  pessimistic:{ incomeGrowth: -5, fixedCostGrowth: 8, variableUnitsGrowth: -5 },
};

/* ── Helpers ── */
function formatWithDots(num: number): string {
  return num.toLocaleString("de-DE", { maximumFractionDigits: 0 });
}

function toDisplayValue(rawValue: string): string {
  const num = Number(rawValue);
  if (rawValue === "" || isNaN(num)) return rawValue;
  return formatWithDots(num);
}

function FormattedNumberInput({
  value, onChange, className, readOnly, ...props
}: Omit<React.ComponentProps<"input">, "onChange" | "value"> & {
  value: string;
  onChange: (rawValue: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    if (!focused) setLocalValue(value);
  }, [value, focused]);

  const displayValue = focused ? localValue : toDisplayValue(value);

  return (
    <Input
      {...props}
      type={focused ? "number" : "text"}
      value={displayValue}
      readOnly={readOnly}
      onChange={(e) => { if (!readOnly) { setLocalValue(e.target.value); onChange(e.target.value); } }}
      onFocus={() => { if (!readOnly) { setFocused(true); setLocalValue(value); } }}
      onBlur={() => setFocused(false)}
      className={className}
    />
  );
}

/* ── Main component ── */
export default function InvestmentForm({ onAnalyze }: InvestmentFormProps) {
  const { t } = useI18n();

  // Project info
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");

  // Core params
  const [investment, setInvestment] = useState("100000");
  const [years, setYears] = useState("5");
  const [discountRate, setDiscountRate] = useState("10");
  const [taxRate, setTaxRate] = useState("25");

  // Reinvestment
  const [reinvestEnabled, setReinvestEnabled] = useState(false);
  const [reinvestAmounts, setReinvestAmounts] = useState<string[]>([]);

  // Depreciation
  const [depEnabled, setDepEnabled] = useState(false);
  const [depAssetName, setDepAssetName] = useState("");
  const [depValue, setDepValue] = useState("");
  const [depResidual, setDepResidual] = useState("0");

  // Year 1 income
  const [incomeItems, setIncomeItems] = useState<IncomeItem[]>([
    { name: "", description: "", amount: "" },
  ]);

  // Year 1 costs
  const [fixedCosts, setFixedCosts] = useState<FixedCostItem[]>([
    { name: "", description: "", amount: "" },
  ]);
  const [variableCosts, setVariableCosts] = useState<VariableCostItem[]>([
    { name: "", description: "", unitCost: "", units: "" },
  ]);

  // Scenario
  const [scenario, setScenario] = useState<Scenario>("base");

  // Editable growth rates (stored as percentages, e.g. 15 = 15%)
  const [customRates, setCustomRates] = useState({ ...DEFAULT_SCENARIO_RATES.base });

  // Inflation
  const [inflationEnabled, setInflationEnabled] = useState(false);
  const [inflationRates, setInflationRates] = useState<string[]>([]);

  // Projected data (editable override)
  const [projectedData, setProjectedData] = useState<{ income: string; expenses: string }[]>([]);

  const numYears = Math.max(1, Math.min(30, Number(years) || 1));

  // Keep inflationRates array in sync with numYears
  useEffect(() => {
    setInflationRates(prev => {
      const next = [...prev];
      while (next.length < numYears) next.push(next.length > 0 ? next[next.length - 1] : "5");
      return next.slice(0, numYears);
    });
  }, [numYears]);

  // Keep reinvestAmounts array in sync with numYears
  useEffect(() => {
    setReinvestAmounts(prev => {
      const next = [...prev];
      while (next.length < numYears) next.push("0");
      return next.slice(0, numYears);
    });
  }, [numYears]);
  const currencySymbol = CURRENCY_CONFIG[currency]?.symbol || "$";

  // Year 1 totals
  const year1Income = incomeItems.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const year1Fixed = fixedCosts.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const year1Variable = variableCosts.reduce((s, it) => s + (Number(it.unitCost) || 0) * (Number(it.units) || 0), 0);
  const year1Expenses = year1Fixed + year1Variable;

  // Sync custom rates when scenario changes
  useEffect(() => {
    setCustomRates({ ...DEFAULT_SCENARIO_RATES[scenario] });
  }, [scenario]);

  // Project years 2..N whenever rates, inflation, year1 data, or numYears change
  useEffect(() => {
    const incRate = customRates.incomeGrowth / 100;
    const fixedRate = customRates.fixedCostGrowth / 100;
    const varRate = customRates.variableUnitsGrowth / 100;

    const projected: { income: string; expenses: string }[] = [];
    projected.push({ income: String(year1Income), expenses: String(year1Expenses) });

    for (let yr = 2; yr <= numYears; yr++) {
      const incGrowth = Math.pow(1 + incRate, yr - 1);
      const fixedGrowth = Math.pow(1 + fixedRate, yr - 1);
      const varUnitsGrowth = Math.pow(1 + varRate, yr - 1);

      // Cumulative inflation factor from per-year rates
      let inflationFactor = 1;
      if (inflationEnabled) {
        for (let y = 1; y < yr; y++) {
          const yearRate = (Number(inflationRates[y]) || 0) / 100;
          inflationFactor *= (1 + yearRate);
        }
      }

      const projIncome = Math.round(year1Income * incGrowth);
      const projFixed = Math.round(year1Fixed * fixedGrowth * inflationFactor);
      const projVariable = Math.round(year1Variable * varUnitsGrowth * inflationFactor);

      projected.push({
        income: String(projIncome),
        expenses: String(projFixed + projVariable),
      });
    }
    setProjectedData(projected);
  }, [customRates, inflationEnabled, inflationRates, year1Income, year1Fixed, year1Variable, numYears]);

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
      yearlyData: projectedData.map((y) => ({
        income: Number(y.income),
        expenses: Number(y.expenses),
      })),
      scenario,
      depreciation: {
        enabled: depEnabled,
        assetName: depAssetName,
        depreciableValue: Number(depValue) || 0,
        residualValue: Number(depResidual) || 0,
      },
      reinvestments: reinvestEnabled ? reinvestAmounts.map(v => Number(v) || 0) : Array(numYears).fill(0),
    });
  };

  const scenarioLabels: Record<Scenario, { label: string; desc: string; detail: string; icon: typeof TrendingUp }> = {
    optimistic: { label: t("form.optimistic"), desc: t("form.optimisticDesc"), detail: t("form.optimisticDetail"), icon: TrendingUp },
    base: { label: t("form.base"), desc: t("form.baseDesc"), detail: t("form.baseDetail"), icon: BarChart3 },
    pessimistic: { label: t("form.pessimistic"), desc: t("form.pessimisticDesc"), detail: t("form.pessimisticDetail"), icon: TrendingDown },
  };

  const scenarioColors: Record<Scenario, string> = {
    optimistic: "text-primary border-primary bg-primary/10",
    base: "text-chart-neutral border-chart-neutral bg-chart-neutral/10",
    pessimistic: "text-destructive border-destructive bg-destructive/10",
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-8"
    >
      {/* ─── Section 1: Project Info ─── */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">{t("form.title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("form.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">{t("form.projectName")}</Label>
          <Input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)}
            className="bg-secondary border-border text-foreground h-12" placeholder={t("form.projectNamePlaceholder")} />
        </div>
        <div>
          <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">{t("form.currency")}</Label>
          <CurrencySearchDropdown currency={currency} onChange={setCurrency} placeholder={t("form.selectCurrency")} />
        </div>
      </div>
      <div>
        <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">{t("form.description")}</Label>
        <Textarea value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)}
          className="bg-secondary border-border text-foreground min-h-[60px]" placeholder={t("form.descriptionPlaceholder")} rows={2} />
      </div>

      {/* ─── Section 2: Core parameters ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: t("form.investment"), value: investment, set: setInvestment, icon: null as any, placeholder: "100000", formatted: true },
          { label: t("form.years"), value: years, set: setYears, icon: Calendar, placeholder: "5", formatted: false },
          { label: t("form.discountRate"), value: discountRate, set: setDiscountRate, icon: Percent, placeholder: "10", formatted: false },
          { label: t("form.taxRate"), value: taxRate, set: setTaxRate, icon: Percent, placeholder: "25", formatted: false },
        ].map((f, i) => (
          <motion.div key={f.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
            <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">{f.label}</Label>
            <div className="relative">
              {f.icon ? (
                <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              ) : (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">{currencySymbol}</span>
              )}
              {f.formatted ? (
                <FormattedNumberInput value={f.value} onChange={f.set}
                  className="pl-10 bg-secondary border-border font-mono text-foreground h-12" placeholder={f.placeholder} required min={0} />
              ) : (
                <Input type="number" value={f.value} onChange={(e) => f.set(e.target.value)}
                  className="pl-10 bg-secondary border-border font-mono text-foreground h-12" placeholder={f.placeholder} required min={0} />
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ─── Section 3: Depreciation ─── */}
      <div className="rounded-xl border border-border bg-secondary/30 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <Label className="text-sm font-semibold text-foreground block">{t("form.depreciationToggle")}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t("form.depreciationDesc")}</p>
            </div>
          </div>
          <Switch checked={depEnabled} onCheckedChange={setDepEnabled} />
        </div>
        <AnimatePresence>
          {depEnabled && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">{t("form.assetName")}</Label>
                <Input type="text" value={depAssetName} onChange={(e) => setDepAssetName(e.target.value)}
                  className="bg-secondary border-border text-foreground h-10" placeholder={t("form.assetNamePlaceholder")} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">{t("form.depreciableValue")}</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">{currencySymbol}</span>
                    <FormattedNumberInput value={depValue} onChange={setDepValue}
                      className="pl-10 bg-secondary border-border font-mono text-foreground h-10" placeholder="0" min={0} />
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">{t("form.residualValue")}</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">{currencySymbol}</span>
                    <FormattedNumberInput value={depResidual} onChange={setDepResidual}
                      className="pl-10 bg-secondary border-border font-mono text-foreground h-10" placeholder="0" min={0} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                    <Info className="h-3 w-3 mt-0.5 shrink-0" />{t("form.residualValueHint")}
                  </p>
                </div>
              </div>
              {Number(depValue) > 0 && (
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block">{t("form.annualDepreciation")}</span>
                    <span className="font-mono font-semibold text-foreground">
                      {formatCurrency(Math.round((Number(depValue) - Number(depResidual || 0)) / numYears), currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">{t("form.taxShield")}</span>
                    <span className="font-mono font-semibold text-primary">
                      {formatCurrency(Math.round(((Number(depValue) - Number(depResidual || 0)) / numYears) * (Number(taxRate) / 100)), currency)}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Section 4: Year 1 Income ─── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("form.year1Income")}</h3>
            <p className="text-xs text-muted-foreground">{t("form.year1IncomeDesc")}</p>
          </div>
        </div>

        <div className="space-y-2">
          {incomeItems.map((item, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className="grid grid-cols-[1fr_1fr_140px_32px] gap-2 items-start">
              <Input type="text" value={item.name} placeholder={t("form.itemName")}
                onChange={(e) => {
                  const next = [...incomeItems]; next[idx] = { ...next[idx], name: e.target.value }; setIncomeItems(next);
                }}
                className="bg-secondary border-border text-foreground h-10 text-sm" />
              <Input type="text" value={item.description} placeholder={t("form.itemDescription")}
                onChange={(e) => {
                  const next = [...incomeItems]; next[idx] = { ...next[idx], description: e.target.value }; setIncomeItems(next);
                }}
                className="bg-secondary border-border text-foreground h-10 text-sm" />
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-muted-foreground">{currencySymbol}</span>
                <FormattedNumberInput value={item.amount} placeholder="0"
                  onChange={(v) => {
                    const next = [...incomeItems]; next[idx] = { ...next[idx], amount: v }; setIncomeItems(next);
                  }}
                  className="pl-8 bg-secondary border-border font-mono text-foreground h-10 text-sm" min={0} />
              </div>
              <button type="button" onClick={() => setIncomeItems(incomeItems.filter((_, i) => i !== idx))}
                className="h-10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                disabled={incomeItems.length <= 1}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setIncomeItems([...incomeItems, { name: "", description: "", amount: "" }])}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium">
            <Plus className="h-3 w-3" />{t("form.addIncome")}
          </button>
          <div className="text-sm font-mono">
            <span className="text-xs text-muted-foreground mr-2">{t("form.totalIncome")}:</span>
            <span className="font-semibold text-primary">{formatCurrency(year1Income, currency)}</span>
          </div>
        </div>
      </div>

      {/* ─── Section 5: Year 1 Costs ─── */}
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
            <Layers className="h-4 w-4 text-destructive" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("form.year1Costs")}</h3>
            <p className="text-xs text-muted-foreground">{t("form.year1CostsDesc")}</p>
          </div>
        </div>

        {/* Fixed costs */}
        <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5" />{t("form.fixedCosts")}
          </span>
          <div className="space-y-2">
            {fixedCosts.map((item, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_1fr_140px_32px] gap-2 items-start">
                <Input type="text" value={item.name} placeholder={t("form.itemName")}
                  onChange={(e) => { const next = [...fixedCosts]; next[idx] = { ...next[idx], name: e.target.value }; setFixedCosts(next); }}
                  className="bg-background border-border text-foreground h-9 text-sm" />
                <Input type="text" value={item.description} placeholder={t("form.itemDescription")}
                  onChange={(e) => { const next = [...fixedCosts]; next[idx] = { ...next[idx], description: e.target.value }; setFixedCosts(next); }}
                  className="bg-background border-border text-foreground h-9 text-sm" />
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-muted-foreground">{currencySymbol}</span>
                  <FormattedNumberInput value={item.amount} placeholder="0"
                    onChange={(v) => { const next = [...fixedCosts]; next[idx] = { ...next[idx], amount: v }; setFixedCosts(next); }}
                    className="pl-8 bg-background border-border font-mono text-foreground h-9 text-sm" min={0} />
                </div>
                <button type="button" onClick={() => setFixedCosts(fixedCosts.filter((_, i) => i !== idx))}
                  className="h-9 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                  disabled={fixedCosts.length <= 1}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setFixedCosts([...fixedCosts, { name: "", description: "", amount: "" }])}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium">
              <Plus className="h-3 w-3" />{t("form.addFixedCost")}
            </button>
            <span className="text-xs font-mono text-muted-foreground">{t("form.subtotal")}: <span className="text-foreground font-semibold">{formatCurrency(year1Fixed, currency)}</span></span>
          </div>
        </div>

        {/* Variable costs */}
        <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5" />{t("form.variableCosts")}
          </span>
          <div className="space-y-2">
            {variableCosts.map((item, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_1fr_100px_80px_32px] gap-2 items-start">
                <Input type="text" value={item.name} placeholder={t("form.itemName")}
                  onChange={(e) => { const next = [...variableCosts]; next[idx] = { ...next[idx], name: e.target.value }; setVariableCosts(next); }}
                  className="bg-background border-border text-foreground h-9 text-sm" />
                <Input type="text" value={item.description} placeholder={t("form.itemDescription")}
                  onChange={(e) => { const next = [...variableCosts]; next[idx] = { ...next[idx], description: e.target.value }; setVariableCosts(next); }}
                  className="bg-background border-border text-foreground h-9 text-sm" />
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-muted-foreground">{currencySymbol}</span>
                  <FormattedNumberInput value={item.unitCost} placeholder={t("form.unitCost")}
                    onChange={(v) => { const next = [...variableCosts]; next[idx] = { ...next[idx], unitCost: v }; setVariableCosts(next); }}
                    className="pl-8 bg-background border-border font-mono text-foreground h-9 text-sm" min={0} />
                </div>
                <Input type="number" value={item.units} placeholder={t("form.units")}
                  onChange={(e) => { const next = [...variableCosts]; next[idx] = { ...next[idx], units: e.target.value }; setVariableCosts(next); }}
                  className="bg-background border-border font-mono text-foreground h-9 text-sm" min={0} />
                <button type="button" onClick={() => setVariableCosts(variableCosts.filter((_, i) => i !== idx))}
                  className="h-9 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                  disabled={variableCosts.length <= 1}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setVariableCosts([...variableCosts, { name: "", description: "", unitCost: "", units: "" }])}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium">
              <Plus className="h-3 w-3" />{t("form.addVariableCost")}
            </button>
            <span className="text-xs font-mono text-muted-foreground">{t("form.subtotal")}: <span className="text-foreground font-semibold">{formatCurrency(year1Variable, currency)}</span></span>
          </div>
        </div>

        {/* Year 1 total costs */}
        <div className="flex items-center justify-end gap-3 text-sm font-mono">
          <span className="text-muted-foreground">{t("form.totalCosts")}:</span>
          <span className="font-semibold text-destructive">{formatCurrency(year1Expenses, currency)}</span>
        </div>
      </div>

      {/* ─── Section 6: Scenario & Projection ─── */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t("form.scenarioProjection")}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("form.scenarioProjectionDesc", { years: String(numYears) })}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(["optimistic", "base", "pessimistic"] as Scenario[]).map((s) => {
            const cfg = scenarioLabels[s];
            const Icon = cfg.icon;
            return (
              <button key={s} type="button" onClick={() => setScenario(s)}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all",
                  scenario === s ? scenarioColors[s] + " border-current" : "border-border bg-secondary text-muted-foreground hover:border-muted-foreground/40"
                )}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4" />
                  <span className="font-semibold text-sm">{cfg.label}</span>
                </div>
                <span className="text-xs opacity-75 block">{cfg.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Editable growth rates */}
        <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-4">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">{t("form.customRates")}</span>
            <p className="text-xs text-muted-foreground">{t("form.customRatesDesc")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {([
              { label: t("form.incomeGrowth"), key: "incomeGrowth" as const },
              { label: t("form.fixedCostGrowth"), key: "fixedCostGrowth" as const },
              { label: t("form.variableUnitsGrowth"), key: "variableUnitsGrowth" as const },
            ]).map((field) => (
              <div key={field.key}>
                <Label className="text-muted-foreground text-xs mb-1.5 block">{field.label}</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="number"
                    value={customRates[field.key]}
                    onChange={(e) => setCustomRates(prev => ({ ...prev, [field.key]: Number(e.target.value) }))}
                    className="pl-9 bg-secondary border-border font-mono text-foreground h-9 text-sm"
                    step="0.5"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inflation toggle */}
        <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <Label className="text-sm font-semibold text-foreground block">{t("form.inflationToggle")}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">{t("form.inflationDesc")}</p>
              </div>
            </div>
            <Switch checked={inflationEnabled} onCheckedChange={setInflationEnabled} />
          </div>
          <AnimatePresence>
            {inflationEnabled && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-3">
                <p className="text-xs text-muted-foreground">{t("form.inflationPerYearDesc")}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {inflationRates.map((rate, i) => (
                    <div key={i}>
                      <Label className="text-muted-foreground text-xs mb-1 block">
                        {t("form.year")} {i + 1}
                      </Label>
                      <div className="relative">
                        <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          type="number"
                          value={rate}
                          onChange={(e) => {
                            const next = [...inflationRates];
                            next[i] = e.target.value;
                            setInflationRates(next);
                          }}
                          className="pl-8 bg-secondary border-border font-mono text-foreground h-9 text-sm"
                          step="0.5"
                          min={0}
                          readOnly={i === 0}
                        />
                      </div>
                      {i === 0 && <p className="text-[10px] text-muted-foreground mt-0.5">{t("form.inflationYear1Note")}</p>}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Projected summary table */}
        {projectedData.length > 0 && (
          <div className="rounded-xl border border-border bg-secondary/20 p-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">{t("form.projectedSummary")}</span>
            <div className="space-y-1">
              <div className="grid grid-cols-[60px_1fr_1fr_120px] gap-3 text-xs text-muted-foreground uppercase tracking-wider px-1 mb-1">
                <span>{t("form.year")}</span>
                <span>{t("form.income")}</span>
                <span>{t("form.expenses")}</span>
                <span className="text-right">{t("form.netPreTax")}</span>
              </div>
              {projectedData.map((y, i) => {
                const net = Number(y.income) - Number(y.expenses);
                return (
                  <div key={i} className={cn(
                    "grid grid-cols-[60px_1fr_1fr_120px] gap-3 items-center rounded-lg px-1 py-1.5",
                    i === 0 && "bg-primary/5 border border-primary/10"
                  )}>
                    <span className="text-sm font-mono text-muted-foreground">
                      {i === 0 ? <span className="text-primary font-semibold">Yr 1</span> : `Yr ${i + 1}`}
                    </span>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-muted-foreground">{currencySymbol}</span>
                      <FormattedNumberInput value={y.income}
                        onChange={(v) => { const next = [...projectedData]; next[i] = { ...next[i], income: v }; setProjectedData(next); }}
                        className={cn("pl-8 bg-secondary border-border font-mono text-foreground h-9 text-sm", i === 0 && "bg-primary/5")}
                        readOnly={i === 0} min={0} />
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-muted-foreground">{currencySymbol}</span>
                      <FormattedNumberInput value={y.expenses}
                        onChange={(v) => { const next = [...projectedData]; next[i] = { ...next[i], expenses: v }; setProjectedData(next); }}
                        className={cn("pl-8 bg-secondary border-border font-mono text-foreground h-9 text-sm", i === 0 && "bg-primary/5")}
                        readOnly={i === 0} min={0} />
                    </div>
                    <span className={cn("text-sm font-mono text-right pr-1", net >= 0 ? "text-primary" : "text-destructive")}>
                      {net >= 0 ? "+" : ""}{formatWithDots(net)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Button type="submit" className="w-full h-12 bg-primary text-primary-foreground font-semibold text-base hover:brightness-110 transition-all">
        {t("form.analyze")}
      </Button>
    </motion.form>
  );
}

/* ── Currency Dropdown ── */
function CurrencySearchDropdown({ currency, onChange, placeholder }: {
  currency: Currency; onChange: (c: Currency) => void; placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const currencies = Object.keys(CURRENCY_CONFIG) as Currency[];
  const filtered = currencies.filter((c) => {
    const label = CURRENCY_CONFIG[c].label.toLowerCase();
    const q = search.toLowerCase();
    return label.includes(q) || c.toLowerCase().includes(q);
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full h-12 bg-secondary border border-border text-foreground rounded-md px-3 flex items-center justify-between text-sm">
        <span className="truncate">{CURRENCY_CONFIG[currency].label}</span>
        <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
          <div className="flex items-center border-b border-border px-3">
            <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={placeholder}
              className="w-full py-2.5 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground" autoFocus />
          </div>
          <div className="max-h-[250px] overflow-y-auto p-1">
            {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">No results</p>}
            {filtered.map((c) => (
              <button key={c} type="button"
                onClick={() => { onChange(c); setOpen(false); setSearch(""); }}
                className={cn("w-full text-left px-3 py-2 rounded text-sm hover:bg-accent transition-colors flex items-center gap-2", currency === c && "bg-accent font-medium")}>
                {CURRENCY_CONFIG[c].label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
