import { motion } from "framer-motion";
import { formatCurrency, formatPercent, type Currency, type DepreciationConfig } from "@/lib/finance";
import { useI18n } from "@/lib/i18n";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2 } from "lucide-react";

interface CalculationDetailsProps {
  investment: number;
  discountRate: number;
  taxRate: number;
  yearlyData: { income: number; expenses: number }[];
  cashFlows: number[];
  npv: number;
  irr: number | null;
  currency: Currency;
  depreciation?: DepreciationConfig;
}

export default function CalculationDetails({
  investment, discountRate, taxRate, yearlyData, cashFlows, npv, irr, currency, depreciation,
}: CalculationDetailsProps) {
  const { t } = useI18n();

  const depEnabled = depreciation?.enabled ?? false;
  const annualDep = depEnabled
    ? (depreciation!.depreciableValue - depreciation!.residualValue) / yearlyData.length
    : 0;
  const residualValue = depEnabled ? depreciation!.residualValue : 0;

  const rows = yearlyData.map((y, i) => {
    const preTaxProfit = y.income - y.expenses;
    const taxableIncome = preTaxProfit - annualDep;
    const tax = taxableIncome > 0 ? taxableIncome * taxRate : 0;
    const taxShield = depEnabled ? Math.max(0, Math.min(annualDep * taxRate, preTaxProfit > 0 ? preTaxProfit * taxRate : 0) > 0 ? annualDep * taxRate : 0) : 0;
    const netCashFlow = preTaxProfit - tax + (i === yearlyData.length - 1 ? residualValue : 0);
    const discountFactor = 1 / Math.pow(1 + discountRate, i + 1);
    const presentValue = netCashFlow * discountFactor;
    return { year: i + 1, income: y.income, expenses: y.expenses, preTaxProfit, depreciation: annualDep, tax, taxShield: depEnabled ? annualDep * taxRate : 0, netCashFlow, discountFactor, presentValue, hasResidual: i === yearlyData.length - 1 && residualValue > 0 };
  });

  const totals = rows.reduce(
    (acc, r) => ({
      income: acc.income + r.income,
      expenses: acc.expenses + r.expenses,
      preTaxProfit: acc.preTaxProfit + r.preTaxProfit,
      tax: acc.tax + r.tax,
      netCashFlow: acc.netCashFlow + r.netCashFlow,
      presentValue: acc.presentValue + r.presentValue,
    }),
    { income: 0, expenses: 0, preTaxProfit: 0, tax: 0, netCashFlow: 0, presentValue: 0 }
  );

  let cumulative = -investment;
  const cumulativeRows = rows.map((r) => {
    cumulative += r.netCashFlow;
    return { year: r.year, cumulative };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="rounded-2xl border border-border bg-card p-6 md:p-8"
    >
      <h2 className="text-xl font-semibold text-foreground mb-1">{t("calc.title")}</h2>
      <p className="text-sm text-muted-foreground mb-6">{t("calc.subtitle")}</p>

      <Tabs defaultValue="cashflows" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="cashflows">{t("calc.cashFlows")}</TabsTrigger>
          <TabsTrigger value="npv">{t("calc.npvBreakdown")}</TabsTrigger>
          <TabsTrigger value="formulas">{t("calc.formulas")}</TabsTrigger>
        </TabsList>

        <TabsContent value="cashflows">
          {depEnabled && (
            <div className="flex items-center gap-2 mb-4 rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm">
              <Building2 className="h-4 w-4 text-primary shrink-0" />
              <span className="text-muted-foreground">
                {t("calc.depreciation")}: <span className="font-mono font-semibold text-foreground">{formatCurrency(Math.round(annualDep), currency)}</span>/año
                {depreciation?.assetName && <> — {depreciation.assetName}</>}
                {residualValue > 0 && <> · {t("calc.residualValue")}: <span className="font-mono font-semibold text-foreground">{formatCurrency(residualValue, currency)}</span></>}
              </span>
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-mono text-xs">{t("form.year")}</TableHead>
                  <TableHead className="font-mono text-xs text-right">{t("form.income")}</TableHead>
                  <TableHead className="font-mono text-xs text-right">{t("form.expenses")}</TableHead>
                  <TableHead className="font-mono text-xs text-right">{t("calc.preTax")}</TableHead>
                  {depEnabled && <TableHead className="font-mono text-xs text-right">{t("calc.depreciation")}</TableHead>}
                  {depEnabled && <TableHead className="font-mono text-xs text-right">{t("calc.taxShield")}</TableHead>}
                  <TableHead className="font-mono text-xs text-right">{t("calc.tax")} ({(taxRate * 100).toFixed(0).replace('.', ',')}%)</TableHead>
                  <TableHead className="font-mono text-xs text-right">{t("calc.netCF")}</TableHead>
                  <TableHead className="font-mono text-xs text-right">{t("calc.cumulative")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-destructive/5">
                  <TableCell className="font-mono text-sm">0</TableCell>
                  <TableCell className="font-mono text-sm text-right">—</TableCell>
                  <TableCell className="font-mono text-sm text-right">—</TableCell>
                  <TableCell className="font-mono text-sm text-right">—</TableCell>
                  {depEnabled && <TableCell className="font-mono text-sm text-right">—</TableCell>}
                  {depEnabled && <TableCell className="font-mono text-sm text-right">—</TableCell>}
                  <TableCell className="font-mono text-sm text-right">—</TableCell>
                  <TableCell className="font-mono text-sm text-right text-destructive">{formatCurrency(-investment, currency)}</TableCell>
                  <TableCell className="font-mono text-sm text-right text-destructive">{formatCurrency(-investment, currency)}</TableCell>
                </TableRow>
                {rows.map((r, i) => (
                  <TableRow key={r.year}>
                    <TableCell className="font-mono text-sm">{r.year}</TableCell>
                    <TableCell className="font-mono text-sm text-right">{formatCurrency(r.income, currency)}</TableCell>
                    <TableCell className="font-mono text-sm text-right text-destructive">{formatCurrency(r.expenses, currency)}</TableCell>
                    <TableCell className={`font-mono text-sm text-right ${r.preTaxProfit >= 0 ? "text-primary" : "text-destructive"}`}>{formatCurrency(r.preTaxProfit, currency)}</TableCell>
                    {depEnabled && <TableCell className="font-mono text-sm text-right text-muted-foreground">{formatCurrency(Math.round(r.depreciation), currency)}</TableCell>}
                    {depEnabled && <TableCell className="font-mono text-sm text-right text-primary">{formatCurrency(Math.round(r.taxShield), currency)}</TableCell>}
                    <TableCell className="font-mono text-sm text-right text-muted-foreground">{formatCurrency(r.tax, currency)}</TableCell>
                    <TableCell className={`font-mono text-sm text-right ${r.netCashFlow >= 0 ? "text-primary" : "text-destructive"}`}>
                      {formatCurrency(r.netCashFlow, currency)}
                      {r.hasResidual && <span className="text-xs text-muted-foreground ml-1">*</span>}
                    </TableCell>
                    <TableCell className={`font-mono text-sm text-right ${cumulativeRows[i].cumulative >= 0 ? "text-primary" : "text-destructive"}`}>{formatCurrency(cumulativeRows[i].cumulative, currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-mono text-sm font-bold">{t("calc.total")}</TableCell>
                  <TableCell className="font-mono text-sm text-right font-bold">{formatCurrency(totals.income, currency)}</TableCell>
                  <TableCell className="font-mono text-sm text-right font-bold text-destructive">{formatCurrency(totals.expenses, currency)}</TableCell>
                  <TableCell className="font-mono text-sm text-right font-bold">{formatCurrency(totals.preTaxProfit, currency)}</TableCell>
                  {depEnabled && <TableCell className="font-mono text-sm text-right font-bold">{formatCurrency(Math.round(annualDep * yearlyData.length), currency)}</TableCell>}
                  {depEnabled && <TableCell className="font-mono text-sm text-right font-bold text-primary">{formatCurrency(Math.round(rows.reduce((s, r) => s + r.taxShield, 0)), currency)}</TableCell>}
                  <TableCell className="font-mono text-sm text-right font-bold">{formatCurrency(totals.tax, currency)}</TableCell>
                  <TableCell className="font-mono text-sm text-right font-bold">{formatCurrency(totals.netCashFlow, currency)}</TableCell>
                  <TableCell className="font-mono text-sm text-right font-bold">{formatCurrency(cumulative, currency)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
          {depEnabled && residualValue > 0 && (
            <p className="text-xs text-muted-foreground mt-2">* {t("form.residualValueHint")}</p>
          )}
        </TabsContent>

        <TabsContent value="npv">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-mono text-xs">{t("form.year")} (t)</TableHead>
                  <TableHead className="font-mono text-xs text-right">{t("chart.cashFlow")} (CF)</TableHead>
                  <TableHead className="font-mono text-xs text-right">{t("calc.discountFactor")} 1/(1+r)^t</TableHead>
                  <TableHead className="font-mono text-xs text-right">{t("calc.presentValue")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-destructive/5">
                  <TableCell className="font-mono text-sm">0</TableCell>
                  <TableCell className="font-mono text-sm text-right text-destructive">{formatCurrency(-investment, currency)}</TableCell>
                  <TableCell className="font-mono text-sm text-right">1.0000</TableCell>
                  <TableCell className="font-mono text-sm text-right text-destructive">{formatCurrency(-investment, currency)}</TableCell>
                </TableRow>
                {rows.map((r) => (
                  <TableRow key={r.year}>
                    <TableCell className="font-mono text-sm">{r.year}</TableCell>
                    <TableCell className={`font-mono text-sm text-right ${r.netCashFlow >= 0 ? "text-primary" : "text-destructive"}`}>{formatCurrency(r.netCashFlow, currency)}</TableCell>
                    <TableCell className="font-mono text-sm text-right">{r.discountFactor.toFixed(4).replace('.', ',')}</TableCell>
                    <TableCell className={`font-mono text-sm text-right ${r.presentValue >= 0 ? "text-primary" : "text-destructive"}`}>{formatCurrency(r.presentValue, currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="font-mono text-sm font-bold text-right">NPV = Σ PV =</TableCell>
                  <TableCell className={`font-mono text-sm text-right font-bold ${npv >= 0 ? "text-primary" : "text-destructive"}`}>{formatCurrency(npv, currency)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {t("calc.discountNote")} (r = {(discountRate * 100).toFixed(1).replace('.', ',')}%)
          </p>
        </TabsContent>

        <TabsContent value="formulas">
          <div className="space-y-6">
            <div className="rounded-xl bg-secondary p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">{t("calc.npvFormula")}</h3>
              <p className="font-mono text-sm text-muted-foreground">NPV = Σ (CF_t / (1 + r)^t) for t = 0 to n</p>
              <p className="text-xs text-muted-foreground">
                r = {(discountRate * 100).toFixed(1).replace('.', ',')}%, n = {yearlyData.length}. {t("calc.npvDesc")}
              </p>
              <p className="font-mono text-sm text-primary font-bold">{t("calc.result")}: {formatCurrency(npv, currency)}</p>
            </div>

            <div className="rounded-xl bg-secondary p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">{t("calc.irrFormula")}</h3>
              <p className="font-mono text-sm text-muted-foreground">Find r such that: Σ (CF_t / (1 + r)^t) = 0</p>
              <p className="text-xs text-muted-foreground">{t("calc.irrDesc")} {t("calc.irrAbove")}</p>
              <p className="font-mono text-sm text-primary font-bold">{t("calc.result")}: {irr !== null ? formatPercent(irr) : t("calc.couldNotConverge")}</p>
            </div>

            <div className="rounded-xl bg-secondary p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">{t("calc.netCFFormula")}</h3>
              <p className="font-mono text-sm text-muted-foreground">Net CF = (Income − Expenses) × (1 − Tax Rate)</p>
              <p className="text-xs text-muted-foreground">{t("calc.tax")}: {(taxRate * 100).toFixed(0).replace('.', ',')}%. {t("calc.netCFDesc")}</p>
            </div>

            <div className="rounded-xl bg-secondary p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">{t("calc.roiFormula")}</h3>
              <p className="font-mono text-sm text-muted-foreground">ROI = (Total Net Return − Investment) / Investment</p>
              <p className="text-xs text-muted-foreground">{t("calc.roiDesc")}</p>
            </div>

            {depEnabled && (
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-5 space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  {t("calc.depreciationFormula")}
                </h3>
                <p className="font-mono text-sm text-muted-foreground">
                  D = (Depreciable Value − Residual Value) / n = ({formatCurrency(depreciation!.depreciableValue, currency)} − {formatCurrency(residualValue, currency)}) / {yearlyData.length} = {formatCurrency(Math.round(annualDep), currency)}
                </p>
                <p className="font-mono text-sm text-muted-foreground">
                  Tax Shield = D × t = {formatCurrency(Math.round(annualDep), currency)} × {(taxRate * 100).toFixed(0).replace('.', ',')}% = {formatCurrency(Math.round(annualDep * taxRate), currency)}/año
                </p>
                <p className="text-xs text-muted-foreground">{t("calc.depreciationFormulaDesc")}</p>
                {residualValue > 0 && (
                  <p className="font-mono text-sm text-primary font-bold">
                    {t("calc.residualValue")} ({t("form.year")} {yearlyData.length}): +{formatCurrency(residualValue, currency)}
                  </p>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
