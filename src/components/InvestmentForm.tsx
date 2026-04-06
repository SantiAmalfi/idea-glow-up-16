import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Calendar, Percent, ChevronDown, Plus, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { type Currency, CURRENCY_CONFIG, formatCurrency } from "@/lib/finance";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type Scenario = "optimistic" | "base" | "pessimistic";

export interface LineItem {
  name: string;
  value: number;
}

export interface YearData {
  income: number;
  expenses: number;
}

interface YearFormData {
  income: string;
  expenses: string;
  incomeItems: { name: string; value: string }[];
  expenseItems: { name: string; value: string }[];
  showIncomeDetail: boolean;
  showExpenseDetail: boolean;
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

/** Format a number with dots as thousands separator */
function formatWithDots(num: number): string {
  return num.toLocaleString("de-DE", { maximumFractionDigits: 0 });
}

/** Parse a formatted string (with dots as thousand separators) back to a number */
function parseFormattedNumber(str: string): number {
  // Remove dots (thousand sep), replace comma with dot (decimal sep)
  const cleaned = str.replace(/\./g, "").replace(",", ".");
  return Number(cleaned) || 0;
}

/** Format input display value: raw number string → formatted with dots */
function toDisplayValue(rawValue: string): string {
  const num = Number(rawValue);
  if (rawValue === "" || isNaN(num)) return rawValue;
  return formatWithDots(num);
}

function generateEstimates(investment: number, years: number, scenario: Scenario): YearFormData[] {
  const s = scenarioConfig.find((sc) => sc.value === scenario)!;
  const data: YearFormData[] = [];
  for (let i = 1; i <= years; i++) {
    const rampUp = 0.5 + 0.5 * (i / years);
    const income = Math.round(investment * s.incomeMultiplier * rampUp);
    const expenses = Math.round(income * s.expenseRatio);
    data.push({
      income: String(income),
      expenses: String(expenses),
      incomeItems: [],
      expenseItems: [],
      showIncomeDetail: false,
      showExpenseDetail: false,
    });
  }
  return data;
}

/** A number input that displays with dot thousand separators */
function FormattedNumberInput({
  value,
  onChange,
  className,
  readOnly,
  ...props
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
      onChange={(e) => {
        if (readOnly) return;
        setLocalValue(e.target.value);
        onChange(e.target.value);
      }}
      onFocus={() => {
        if (!readOnly) {
          setFocused(true);
          setLocalValue(value);
        }
      }}
      onBlur={() => setFocused(false)}
      className={className}
    />
  );
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
  const [yearlyData, setYearlyData] = useState<YearFormData[]>([]);

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

  const toggleDetail = (index: number, type: "income" | "expense") => {
    setYearlyData((prev) => {
      const next = [...prev];
      const key = type === "income" ? "showIncomeDetail" : "showExpenseDetail";
      next[index] = { ...next[index], [key]: !next[index][key] };
      return next;
    });
  };

  const addItem = (yearIndex: number, type: "income" | "expense") => {
    setYearlyData((prev) => {
      const next = [...prev];
      const key = type === "income" ? "incomeItems" : "expenseItems";
      next[yearIndex] = {
        ...next[yearIndex],
        [key]: [...next[yearIndex][key], { name: "", value: "" }],
      };
      return next;
    });
  };

  const recalcTotal = (items: { name: string; value: string }[]) => {
    return String(items.reduce((sum, it) => sum + (Number(it.value) || 0), 0));
  };

  const updateItem = (yearIndex: number, type: "income" | "expense", itemIndex: number, field: "name" | "value", val: string) => {
    setYearlyData((prev) => {
      const next = [...prev];
      const key = type === "income" ? "incomeItems" : "expenseItems";
      const items = [...next[yearIndex][key]];
      items[itemIndex] = { ...items[itemIndex], [field]: val };
      next[yearIndex] = { ...next[yearIndex], [key]: items };
      // Always recalculate total from items
      const total = recalcTotal(items);
      const totalField = type === "income" ? "income" : "expenses";
      next[yearIndex] = { ...next[yearIndex], [totalField]: total };
      return next;
    });
  };

  const removeItem = (yearIndex: number, type: "income" | "expense", itemIndex: number) => {
    setYearlyData((prev) => {
      const next = [...prev];
      const key = type === "income" ? "incomeItems" : "expenseItems";
      const items = next[yearIndex][key].filter((_, i) => i !== itemIndex);
      next[yearIndex] = { ...next[yearIndex], [key]: items };
      if (items.length > 0) {
        const total = recalcTotal(items);
        const totalField = type === "income" ? "income" : "expenses";
        next[yearIndex] = { ...next[yearIndex], [totalField]: total };
      }
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

  const currencySymbol = CURRENCY_CONFIG[currency]?.symbol || "$";

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
          <CurrencySearchDropdown
                currency={currency}
                onChange={setCurrency}
                placeholder={t("form.selectCurrency")}
              />
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
        {[
          { label: t("form.investment"), value: investment, set: setInvestment, icon: DollarSign, placeholder: "100000", min: 0, formatted: true },
          { label: t("form.years"), value: years, set: setYears, icon: Calendar, placeholder: "5", min: 1, formatted: false },
          { label: t("form.discountRate"), value: discountRate, set: setDiscountRate, icon: Percent, placeholder: "10", min: 0, formatted: false },
          { label: t("form.taxRate"), value: taxRate, set: setTaxRate, icon: Percent, placeholder: "25", min: 0, formatted: false },
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
              {f.formatted ? (
                <FormattedNumberInput
                  value={f.value}
                  onChange={(v) => f.set(v)}
                  className="pl-10 bg-secondary border-border font-mono text-foreground h-12"
                  placeholder={f.placeholder}
                  required
                  min={f.min}
                />
              ) : (
                <Input
                  type="number"
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  className="pl-10 bg-secondary border-border font-mono text-foreground h-12"
                  placeholder={f.placeholder}
                  required
                  min={f.min}
                />
              )}
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
            const hasIncomeItems = y.incomeItems.length > 0;
            const hasExpenseItems = y.expenseItems.length > 0;
            return (
              <div key={i} className="space-y-1">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03 * i }}
                  className="grid grid-cols-[70px_1fr_1fr_120px] gap-3 items-center"
                >
                  <span className="text-sm font-mono text-muted-foreground pl-1">Yr {i + 1}</span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => toggleDetail(i, "income")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
                      title={t("form.incomeDetails")}
                    >
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${y.showIncomeDetail ? "rotate-180" : ""}`} />
                    </button>
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <FormattedNumberInput
                      value={y.income}
                      onChange={(v) => updateYear(i, "income", v)}
                      className={cn(
                        "pl-8 pr-8 bg-secondary border-border font-mono text-foreground h-10 text-sm",
                        hasIncomeItems && "opacity-70"
                      )}
                      readOnly={hasIncomeItems}
                      required
                      min={0}
                    />
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => toggleDetail(i, "expense")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
                      title={t("form.expenseDetails")}
                    >
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${y.showExpenseDetail ? "rotate-180" : ""}`} />
                    </button>
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <FormattedNumberInput
                      value={y.expenses}
                      onChange={(v) => updateYear(i, "expenses", v)}
                      className={cn(
                        "pl-8 pr-8 bg-secondary border-border font-mono text-foreground h-10 text-sm",
                        hasExpenseItems && "opacity-70"
                      )}
                      readOnly={hasExpenseItems}
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
                    {formatWithDots(net)}
                  </span>
                </motion.div>

                {/* Income detail */}
                <AnimatePresence>
                  {y.showIncomeDetail && (
                    <DetailItems
                      items={y.incomeItems}
                      type="income"
                      yearIndex={i}
                      symbol={currencySymbol}
                      onAdd={addItem}
                      onUpdate={updateItem}
                      onRemove={removeItem}
                      label={t("form.incomeDetails")}
                      t={t}
                    />
                  )}
                </AnimatePresence>

                {/* Expense detail */}
                <AnimatePresence>
                  {y.showExpenseDetail && (
                    <DetailItems
                      items={y.expenseItems}
                      type="expense"
                      yearIndex={i}
                      symbol={currencySymbol}
                      onAdd={addItem}
                      onUpdate={updateItem}
                      onRemove={removeItem}
                      label={t("form.expenseDetails")}
                      t={t}
                    />
                  )}
                </AnimatePresence>
              </div>
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

function DetailItems({
  items,
  type,
  yearIndex,
  symbol,
  onAdd,
  onUpdate,
  onRemove,
  label,
  t,
}: {
  items: { name: string; value: string }[];
  type: "income" | "expense";
  yearIndex: number;
  symbol: string;
  onAdd: (yearIndex: number, type: "income" | "expense") => void;
  onUpdate: (yearIndex: number, type: "income" | "expense", itemIndex: number, field: "name" | "value", val: string) => void;
  onRemove: (yearIndex: number, type: "income" | "expense", itemIndex: number) => void;
  label: string;
  t: (key: any) => string;
}) {
  const bgColor = type === "income" ? "bg-primary/5 border-primary/20" : "bg-destructive/5 border-destructive/20";

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className={`ml-[82px] mr-[132px] rounded-lg border ${bgColor} p-3 space-y-2 overflow-hidden`}
    >
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Input
            type="text"
            value={item.name}
            onChange={(e) => onUpdate(yearIndex, type, idx, "name", e.target.value)}
            placeholder={t("form.itemName")}
            className="bg-background border-border text-foreground h-8 text-xs flex-1"
          />
          <div className="relative w-28">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{symbol}</span>
            <FormattedNumberInput
              value={item.value}
              onChange={(v) => onUpdate(yearIndex, type, idx, "value", v)}
              placeholder="0"
              className="pl-7 bg-background border-border font-mono text-foreground h-8 text-xs"
              min={0}
            />
          </div>
          <button
            type="button"
            onClick={() => onRemove(yearIndex, type, idx)}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onAdd(yearIndex, type)}
        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
      >
        <Plus className="h-3 w-3" />
        {t("form.addItem")}
      </button>
    </motion.div>
  );
}
