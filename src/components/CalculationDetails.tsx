import { motion } from "framer-motion";
import { formatCurrency, formatPercent } from "@/lib/finance";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CalculationDetailsProps {
  investment: number;
  discountRate: number;
  taxRate: number;
  yearlyData: { income: number; expenses: number }[];
  cashFlows: number[];
  npv: number;
  irr: number | null;
}

export default function CalculationDetails({
  investment,
  discountRate,
  taxRate,
  yearlyData,
  cashFlows,
  npv,
  irr,
}: CalculationDetailsProps) {
  // Build detailed rows
  const rows = yearlyData.map((y, i) => {
    const preTaxProfit = y.income - y.expenses;
    const tax = preTaxProfit > 0 ? preTaxProfit * taxRate : 0;
    const netCashFlow = preTaxProfit - tax;
    const discountFactor = 1 / Math.pow(1 + discountRate, i + 1);
    const presentValue = netCashFlow * discountFactor;
    return {
      year: i + 1,
      income: y.income,
      expenses: y.expenses,
      preTaxProfit,
      tax,
      netCashFlow,
      discountFactor,
      presentValue,
    };
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

  // Cumulative cash flow for payback
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
      <h2 className="text-xl font-semibold text-foreground mb-1">Calculation Details</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Step-by-step breakdown of how NPV and IRR are computed
      </p>

      <Tabs defaultValue="cashflows" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="cashflows">Cash Flows</TabsTrigger>
          <TabsTrigger value="npv">NPV Breakdown</TabsTrigger>
          <TabsTrigger value="formulas">Formulas</TabsTrigger>
        </TabsList>

        {/* Tab 1: Cash Flow Details */}
        <TabsContent value="cashflows">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-mono text-xs">Year</TableHead>
                  <TableHead className="font-mono text-xs text-right">Income</TableHead>
                  <TableHead className="font-mono text-xs text-right">Expenses</TableHead>
                  <TableHead className="font-mono text-xs text-right">Pre-Tax</TableHead>
                  <TableHead className="font-mono text-xs text-right">Tax ({(taxRate * 100).toFixed(0)}%)</TableHead>
                  <TableHead className="font-mono text-xs text-right">Net Cash Flow</TableHead>
                  <TableHead className="font-mono text-xs text-right">Cumulative</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-destructive/5">
                  <TableCell className="font-mono text-sm">0</TableCell>
                  <TableCell className="font-mono text-sm text-right">—</TableCell>
                  <TableCell className="font-mono text-sm text-right">—</TableCell>
                  <TableCell className="font-mono text-sm text-right">—</TableCell>
                  <TableCell className="font-mono text-sm text-right">—</TableCell>
                  <TableCell className="font-mono text-sm text-right text-destructive">
                    {formatCurrency(-investment)}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-right text-destructive">
                    {formatCurrency(-investment)}
                  </TableCell>
                </TableRow>
                {rows.map((r, i) => (
                  <TableRow key={r.year}>
                    <TableCell className="font-mono text-sm">{r.year}</TableCell>
                    <TableCell className="font-mono text-sm text-right">{formatCurrency(r.income)}</TableCell>
                    <TableCell className="font-mono text-sm text-right text-destructive">
                      {formatCurrency(r.expenses)}
                    </TableCell>
                    <TableCell className={`font-mono text-sm text-right ${r.preTaxProfit >= 0 ? "text-primary" : "text-destructive"}`}>
                      {formatCurrency(r.preTaxProfit)}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-right text-muted-foreground">
                      {formatCurrency(r.tax)}
                    </TableCell>
                    <TableCell className={`font-mono text-sm text-right ${r.netCashFlow >= 0 ? "text-primary" : "text-destructive"}`}>
                      {formatCurrency(r.netCashFlow)}
                    </TableCell>
                    <TableCell className={`font-mono text-sm text-right ${cumulativeRows[i].cumulative >= 0 ? "text-primary" : "text-destructive"}`}>
                      {formatCurrency(cumulativeRows[i].cumulative)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-mono text-sm font-bold">Total</TableCell>
                  <TableCell className="font-mono text-sm text-right font-bold">{formatCurrency(totals.income)}</TableCell>
                  <TableCell className="font-mono text-sm text-right font-bold text-destructive">{formatCurrency(totals.expenses)}</TableCell>
                  <TableCell className="font-mono text-sm text-right font-bold">{formatCurrency(totals.preTaxProfit)}</TableCell>
                  <TableCell className="font-mono text-sm text-right font-bold">{formatCurrency(totals.tax)}</TableCell>
                  <TableCell className="font-mono text-sm text-right font-bold">{formatCurrency(totals.netCashFlow)}</TableCell>
                  <TableCell className="font-mono text-sm text-right font-bold">{formatCurrency(cumulative)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </TabsContent>

        {/* Tab 2: NPV Breakdown */}
        <TabsContent value="npv">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-mono text-xs">Year (t)</TableHead>
                  <TableHead className="font-mono text-xs text-right">Cash Flow (CF)</TableHead>
                  <TableHead className="font-mono text-xs text-right">Discount Factor 1/(1+r)^t</TableHead>
                  <TableHead className="font-mono text-xs text-right">Present Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-destructive/5">
                  <TableCell className="font-mono text-sm">0</TableCell>
                  <TableCell className="font-mono text-sm text-right text-destructive">{formatCurrency(-investment)}</TableCell>
                  <TableCell className="font-mono text-sm text-right">1.0000</TableCell>
                  <TableCell className="font-mono text-sm text-right text-destructive">{formatCurrency(-investment)}</TableCell>
                </TableRow>
                {rows.map((r) => (
                  <TableRow key={r.year}>
                    <TableCell className="font-mono text-sm">{r.year}</TableCell>
                    <TableCell className={`font-mono text-sm text-right ${r.netCashFlow >= 0 ? "text-primary" : "text-destructive"}`}>
                      {formatCurrency(r.netCashFlow)}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-right">{r.discountFactor.toFixed(4)}</TableCell>
                    <TableCell className={`font-mono text-sm text-right ${r.presentValue >= 0 ? "text-primary" : "text-destructive"}`}>
                      {formatCurrency(r.presentValue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="font-mono text-sm font-bold text-right">
                    NPV = Σ PV =
                  </TableCell>
                  <TableCell className={`font-mono text-sm text-right font-bold ${npv >= 0 ? "text-primary" : "text-destructive"}`}>
                    {formatCurrency(npv)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Discount rate (r) = {(discountRate * 100).toFixed(1)}%. Each future cash flow is divided by (1 + r)^t to find its present value.
          </p>
        </TabsContent>

        {/* Tab 3: Formulas */}
        <TabsContent value="formulas">
          <div className="space-y-6">
            <div className="rounded-xl bg-secondary p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Net Present Value (NPV)</h3>
              <p className="font-mono text-sm text-muted-foreground">
                NPV = Σ (CF_t / (1 + r)^t) for t = 0 to n
              </p>
              <p className="text-xs text-muted-foreground">
                Where CF_t = cash flow at time t, r = discount rate ({(discountRate * 100).toFixed(1)}%), n = {yearlyData.length} years.
                A positive NPV means the project earns more than the discount rate.
              </p>
              <p className="font-mono text-sm text-primary font-bold">
                Result: {formatCurrency(npv)}
              </p>
            </div>

            <div className="rounded-xl bg-secondary p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Internal Rate of Return (IRR)</h3>
              <p className="font-mono text-sm text-muted-foreground">
                Find r such that: Σ (CF_t / (1 + r)^t) = 0
              </p>
              <p className="text-xs text-muted-foreground">
                IRR is the discount rate that makes NPV exactly zero. Solved iteratively using the Newton-Raphson method.
                If IRR {">"} discount rate, the project adds value.
              </p>
              <p className="font-mono text-sm text-primary font-bold">
                Result: {irr !== null ? formatPercent(irr) : "Could not converge"}
              </p>
            </div>

            <div className="rounded-xl bg-secondary p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Net Cash Flow per Year</h3>
              <p className="font-mono text-sm text-muted-foreground">
                Net CF = (Income − Expenses) × (1 − Tax Rate)
              </p>
              <p className="text-xs text-muted-foreground">
                Tax rate: {(taxRate * 100).toFixed(0)}%. Tax is only applied when pre-tax profit is positive (no tax on losses).
              </p>
            </div>

            <div className="rounded-xl bg-secondary p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Return on Investment (ROI)</h3>
              <p className="font-mono text-sm text-muted-foreground">
                ROI = (Total Net Return − Investment) / Investment
              </p>
              <p className="text-xs text-muted-foreground">
                Simple measure of profitability as a percentage of the initial investment. Does not account for the time value of money.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
